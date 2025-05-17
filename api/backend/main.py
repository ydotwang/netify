# FastAPI backend relocated for Vercel
# (this file mirrors previously developed backend/main.py)

import os, re, asyncio, logging, base64, time, random
from datetime import date
from typing import List, Dict, Optional, Any, Tuple
from urllib.parse import urlparse, parse_qs
import traceback

import requests
from fastapi import FastAPI, HTTPException, Query, Body, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rapidfuzz import fuzz, process
import unicodedata
import re as _re
import httpx
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Netify Backend API", version="1.0.0")

# Configure CORS - explicitly allow the frontend domain
allowed_origins = [
    "https://netify-five.vercel.app",  # Your production frontend
    "https://netify-mjkk0dig8-ydotwangs-projects.vercel.app", # Your Vercel deployment
    "https://netify-o7as616yi-ydotwangs-projects.vercel.app", # Latest deployment
    "https://netify-mxmb4f1jy-ydotwangs-projects.vercel.app", # Latest deployment
    "http://localhost:3000",  # For local development
    "*"  # Temporary fallback for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_ALBUM_ID_RE = re.compile(r"id=(\d+)")
MAX_TRACKS_PER_REQUEST = 100  # Spotify API limit for adding tracks in one request
MAX_PLAYLIST_SIZE = 10000     # Spotify's maximum playlist size
MAX_RETRIES = 5               # Maximum number of retries for API requests
MAX_NETEASE_FETCH = 10000    # Maximum tracks to fetch from NetEase in one request


def normalize_text(s: str) -> str:
    """Normalize text for better matching between NetEase and Spotify tracks."""
    if not s:
        return ""
    _PAREN_RE = _re.compile(r"[\[\(（【].*?[\]）】\)]")
    _FEAT_RE = _re.compile(r"\s+(ft\.|feat\.|featuring)\s+.*", _re.IGNORECASE)
    # Remove version markers
    _VERSION_RE = _re.compile(r"\s+(- )?((Album|Single|Live|Acoustic|Remix|Remaster(ed)?|Version|Edit|Radio Edit|Extended|Original|Official Audio|MV)\s*).*$", _re.IGNORECASE)
    
    s = unicodedata.normalize("NFKD", s)
    s = _PAREN_RE.sub("", s)
    s = _FEAT_RE.sub("", s)
    s = _VERSION_RE.sub("", s)
    s = _re.sub(r"[^\w\s]", "", s)  # Remove punctuation
    return _re.sub(r"\s+", " ", s).strip().lower()


def clean_artist_name(name: str) -> str:
    """Clean artist name for better matching."""
    if not name:
        return ""
    name = unicodedata.normalize("NFKD", name)
    name = _re.sub(r"[^\w\s]", "", name)  # Remove punctuation
    return _re.sub(r"\s+", " ", name).strip().lower()


def spotify_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def fetch_playlist(pl_id: str):
    url = f"https://music.163.com/api/v6/playlist/detail?id={pl_id}"
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"})
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != 200:
        raise ValueError("playlist api error")
    return data


async def get_playlist_data(pid: str):
    return await asyncio.to_thread(fetch_playlist, pid)


class TransferBody(BaseModel):
    url: str
    spotify_token: str
    description: Optional[str] = None
    custom_name: Optional[str] = None
    cover_url: Optional[str] = None


@app.get("/api/playlist-info")
async def playlist_info(url: str = Query(...)):
    try:
        pid = extract_playlist_id(url)
        pdata = await get_playlist_data(pid)
    except Exception as exc:
        logger.error(f"Error fetching playlist info: {exc}")
        traceback.print_exc()
        raise HTTPException(502, detail=str(exc))

    pl = pdata.get("playlist") or pdata.get("result")
    
    # Check if we have all tracks
    track_ids_count = len(pl.get("trackIds", []))
    tracks_count = len(pl.get("tracks", []))
    
    logger.info(f"Playlist {pid} has {track_ids_count} trackIds and {tracks_count} tracks")
    
    # If we don't have all tracks, try to fetch them
    if tracks_count < track_ids_count:
        logger.info(f"Fetching all tracks for playlist {pid}")
        full_tracks = fetch_full_tracks(pid)
        if not full_tracks or len(full_tracks) < track_ids_count:
            logger.info(f"Falling back to fetch_tracks_by_ids for playlist {pid}")
            track_ids = pl.get("trackIds", [])
            full_tracks = fetch_tracks_by_ids(track_ids)
        
        if full_tracks:
            pl["tracks"] = full_tracks
            logger.info(f"Fetched {len(full_tracks)} tracks for playlist {pid}")
    
    tracks = [
        {
            "name": t.get("name", ""),
            "artist": t.get("ar", t.get("artists", [{}]))[0].get("name", "") if t.get("ar") or t.get("artists") else "",
            "duration_ms": t.get("dt", t.get("duration", 0))
        }
        for t in pl.get("tracks", [])
        if t.get("name") and (t.get("ar") or t.get("artists"))
    ]
    
    logger.info(f"Returning {len(tracks)} tracks for playlist {pid}")
    return {
        "playlist_title": pl.get("name", "Unknown Playlist"),
        "cover_url": pl.get("coverImgUrl", ""),
        "tracks": tracks
    }


def retry_request(func, *args, **kwargs):
    """Retry a request function with exponential backoff."""
    retries = 0
    while retries < MAX_RETRIES:
        try:
            return func(*args, **kwargs)
        except requests.exceptions.RequestException as e:
            retries += 1
            if retries == MAX_RETRIES:
                logger.error(f"Max retries reached for request: {e}")
                raise e
            
            # Calculate backoff time: 2^retries + random jitter
            backoff_time = (2 ** retries) + random.uniform(0, 1)
            logger.info(f"Request failed, retrying in {backoff_time:.2f} seconds...")
            time.sleep(backoff_time)


async def search_track_on_spotify(track_name: str, artist_name: str, token: str) -> Optional[str]:
    """
    Search for a track on Spotify using multiple strategies.
    
    Returns the Spotify URI if found, None otherwise.
    """
    # Strategy 1: Exact search with track: and artist:
    query = f'track:"{track_name}" artist:"{artist_name}"'
    s_resp = retry_request(
        requests.get, 
        "https://api.spotify.com/v1/search", 
        params={"q": query, "type": "track", "limit": 5}, 
        headers=spotify_headers(token)
    )
    
    items = s_resp.json().get("tracks", {}).get("items", [])
    if items:
        return items[0]["uri"]
    
    # Strategy 2: Normalized search
    normalized_track = normalize_text(track_name)
    normalized_artist = clean_artist_name(artist_name)
    
    if normalized_track and normalized_artist:
        query = f'track:"{normalized_track}" artist:"{normalized_artist}"'
        s_resp = retry_request(
            requests.get, 
            "https://api.spotify.com/v1/search", 
            params={"q": query, "type": "track", "limit": 5}, 
            headers=spotify_headers(token)
        )
        
        items = s_resp.json().get("tracks", {}).get("items", [])
        if items:
            return items[0]["uri"]
    
    # Strategy 3: Just search for track name and artist as a general query
    query = f'{track_name} {artist_name}'
    s_resp = retry_request(
        requests.get, 
        "https://api.spotify.com/v1/search", 
        params={"q": query, "type": "track", "limit": 10}, 
        headers=spotify_headers(token)
    )
    
    items = s_resp.json().get("tracks", {}).get("items", [])
    if not items:
        return None
    
    # Use fuzzy matching to find the best match
    best_match = None
    best_score = 0
    
    for item in items:
        item_name = item.get("name", "")
        item_artist = item.get("artists", [{}])[0].get("name", "") if item.get("artists") else ""
        
        # Skip if either name is missing
        if not item_name or not item_artist:
            continue
        
        # Calculate match scores
        name_score = fuzz.ratio(normalize_text(track_name), normalize_text(item_name))
        artist_score = fuzz.ratio(clean_artist_name(artist_name), clean_artist_name(item_artist))
        
        # Combined score with higher weight on artist matching
        combined_score = (name_score * 0.6) + (artist_score * 0.4)
        
        if combined_score > best_score and combined_score > 75:  # Threshold for a good match
            best_score = combined_score
            best_match = item
    
    return best_match["uri"] if best_match else None


@app.post("/api/transfer")
async def transfer_playlist(payload: TransferBody):
    try:
        pid = extract_playlist_id(payload.url)
        pdata = await get_playlist_data(pid)
    except Exception as exc:
        logger.error(f"Error starting transfer: {exc}")
        traceback.print_exc()
        raise HTTPException(502, detail=str(exc))

    root = pdata.get("playlist") or pdata.get("result")
    
    # Ensure we have the full track list
    track_ids_count = len(root.get("trackIds", []))
    tracks_count = len(root.get("tracks", []))
    
    logger.info(f"Transfer: Playlist {pid} has {track_ids_count} trackIds and {tracks_count} tracks")
    
    if tracks_count < track_ids_count:
        logger.info(f"Transfer: Fetching all tracks for playlist {pid}")
        full_tracks = fetch_full_tracks(pid)
        if not full_tracks or len(full_tracks) < track_ids_count:
            logger.info(f"Transfer: Falling back to fetch_tracks_by_ids for playlist {pid}")
            track_ids = root.get("trackIds", [])
            full_tracks = fetch_tracks_by_ids(track_ids)
        
        if full_tracks:
            root["tracks"] = full_tracks
            logger.info(f"Transfer: Fetched {len(full_tracks)} tracks for playlist {pid}")
    
    playlist_name = payload.custom_name or f"{root.get('name', 'NetEase Playlist')} (NetEase)"

    # Get Spotify user profile
    try:
        user_resp = retry_request(
            requests.get, 
            "https://api.spotify.com/v1/me", 
            headers=spotify_headers(payload.spotify_token)
        )
        if user_resp.status_code != 200:
            raise HTTPException(401, detail="Spotify token invalid")
        user_id = user_resp.json()["id"]
    except Exception as e:
        logger.error(f"Error getting Spotify user profile: {e}")
        raise HTTPException(401, detail="Failed to authenticate with Spotify")

    # Create Spotify playlist
    try:
        create_resp = retry_request(
            requests.post,
            f"https://api.spotify.com/v1/users/{user_id}/playlists",
            json={"name": playlist_name, "public": False, "description": payload.description or f"Imported on {date.today()}", "collaborative": False},
            headers=spotify_headers(payload.spotify_token)
        )
        if create_resp.status_code not in (200, 201):
            logger.error(f"Failed to create playlist: {create_resp.status_code} - {create_resp.text}")
            raise HTTPException(400, detail="Failed to create playlist")
        sp_pl_id = create_resp.json()["id"]
        logger.info(f"Created Spotify playlist: {sp_pl_id}")
    except Exception as e:
        logger.error(f"Error creating Spotify playlist: {e}")
        raise HTTPException(400, detail="Failed to create Spotify playlist")

    songs = root.get("tracks", [])
    
    # Limit to maximum playlist size supported by Spotify
    if len(songs) > MAX_PLAYLIST_SIZE:
        logger.warning(f"Playlist exceeds Spotify limit of {MAX_PLAYLIST_SIZE} tracks, truncating")
        songs = songs[:MAX_PLAYLIST_SIZE]
        
    uris, missing = [], []
    
    # Search for each song on Spotify
    for i, song in enumerate(songs):
        try:
            if not song:
                logger.warning(f"Skipping invalid song at index {i}")
                continue
                
            song_name = song.get("name", "")
            artist_obj = song.get("ar") or song.get("artists", [{}])
            artist_name = artist_obj[0].get("name", "") if artist_obj else ""
            
            if not song_name or not artist_name:
                logger.warning(f"Skipping song with missing data: name='{song_name}', artist='{artist_name}'")
                missing.append(song_name or "Unknown track")
                continue
            
            logger.info(f"Searching for track: '{song_name}' by '{artist_name}'")
            uri = await search_track_on_spotify(song_name, artist_name, payload.spotify_token)
            
            if uri:
                uris.append(uri)
                logger.info(f"Found match: {uri}")
            else:
                missing.append(song_name)
                logger.info(f"No match found for: '{song_name}' by '{artist_name}'")
                
            # Add a small delay to avoid rate limiting
            if i % 25 == 0 and i > 0:
                await asyncio.sleep(1)
                
        except Exception as e:
            # If we get an error for a single track, log it and continue
            logger.error(f"Error searching for track {song.get('name', 'Unknown')}: {str(e)}")
            missing.append(song.get('name', 'Unknown track'))

    # Add tracks to playlist in chunks
    chunks_added = 0
    if uris:
        for i, chunk in enumerate([uris[i:i+MAX_TRACKS_PER_REQUEST] for i in range(0, len(uris), MAX_TRACKS_PER_REQUEST)]):
            try:
                # Add delay between chunks to avoid rate limiting
                if i > 0:
                    await asyncio.sleep(1)
                
                retry_request(
                    requests.post,
                    f"https://api.spotify.com/v1/playlists/{sp_pl_id}/tracks",
                    json={"uris": chunk},
                    headers=spotify_headers(payload.spotify_token)
                )
                chunks_added += 1
                logger.info(f"Added chunk {i+1}/{(len(uris) + MAX_TRACKS_PER_REQUEST - 1) // MAX_TRACKS_PER_REQUEST} ({len(chunk)} tracks)")
            except Exception as e:
                logger.error(f"Error adding tracks chunk {i}: {str(e)}")

    # Add cover image
    cover_url = payload.cover_url or root.get("coverImgUrl")
    if cover_url:
        try:
            if cover_url.startswith("data:"):
                encoded = cover_url.split(",",1)[1]
            else:
                img_resp = retry_request(requests.get, cover_url)
                img_bytes = img_resp.content
                encoded = base64.b64encode(img_bytes).decode()
                
            retry_request(
                requests.put,
                f"https://api.spotify.com/v1/playlists/{sp_pl_id}/images",
                data=encoded,
                headers={**spotify_headers(payload.spotify_token), "Content-Type":"image/jpeg"}
            )
            logger.info("Cover image set successfully")
        except Exception as e:
            logger.error(f"Error setting cover image: {str(e)}")

    logger.info(f"Transfer complete: {len(uris)}/{len(songs)} tracks transferred")
    return {
        "playlist_url": f"https://open.spotify.com/playlist/{sp_pl_id}",
        "missing": missing,
        "total_transferred": len(uris),
        "total_tracks": len(songs)
    }


@app.get("/")
async def read_root():
    return {"message": "Netify API is running"}

@app.post("/spotify/token")
async def get_spotify_token(code: str):
    """Exchange Spotify authorization code for an access token (used by the frontend)."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://accounts.spotify.com/api/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": os.getenv("SPOTIFY_REDIRECT_URI"),
                    "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
                    "client_secret": os.getenv("SPOTIFY_CLIENT_SECRET"),
                },
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error exchanging code for token: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/spotify/refresh")
async def refresh_spotify_token(refresh_token: str):
    """Refresh an expired Spotify access token."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://accounts.spotify.com/api/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
                    "client_secret": os.getenv("SPOTIFY_CLIENT_SECRET"),
                },
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# --- Helper ---------------------------------------------------

def extract_playlist_id(url: str) -> str:
    """Return the numeric playlist id from a NetEase Cloud Music URL.

    Supports URLs such as:
    • https://music.163.com/#/playlist?id=123456
    • https://y.music.163.com/m/playlist?id=123456&userid=…
    • https://music.163.com/playlist/123456
    """
    parsed = urlparse(url)

    # 1️⃣ Query-string ?id=123456
    qs_id = parse_qs(parsed.query).get("id")
    if qs_id and qs_id[0].isdigit():
        return qs_id[0]

    # 2️⃣ Regex fallback ( /playlist/123456 or id=123456 anywhere )
    m = re.search(r"(?:/playlist/|id=)(\d+)", url)
    if m:
        return m.group(1)

    raise ValueError("No playlist id found in URL")


# ---- extra helper to fetch full track list when necessary ------------------

def fetch_full_tracks(pl_id: str):
    """Return full track objects list from NetEase even for large playlists."""
    try:
        logger.info(f"Fetching full tracks for playlist {pl_id} with limit {MAX_NETEASE_FETCH}")
        resp = requests.get(
            "https://music.163.com/api/v3/playlist/track/all",
            params={"id": pl_id, "limit": MAX_NETEASE_FETCH, "offset": 0},
            headers={"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"},
            timeout=30  # Increase timeout for large playlists
        )
        resp.raise_for_status()
        data = resp.json()
        songs = data.get("songs", [])
        logger.info(f"Fetched {len(songs)} tracks from NetEase API")
        return songs
    except Exception as e:
        logger.error(f"Error fetching full tracks: {e}")
        traceback.print_exc()
        return []


# ---- fallback helper: fetch by song ids -----------------------------------

def fetch_tracks_by_ids(track_ids):
    """Fetch full track objects list given trackIds array from playlist api."""
    if not track_ids:
        logger.warning("No track IDs provided to fetch_tracks_by_ids")
        return []
        
    try:
        # Convert all IDs to consistent format
        ids = [tid["id"] if isinstance(tid, dict) else tid for tid in track_ids]
        headers = {"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"}
        tracks = []
        
        # Increase chunk size for better performance but stay safe
        CHUNK = 500  
        logger.info(f"Fetching {len(ids)} tracks in chunks of {CHUNK}")
        
        for i in range(0, len(ids), CHUNK):
            slice_ids = ids[i:i+CHUNK]
            # Safe string construction
            ids_param = "[" + ",".join(map(str, slice_ids)) + "]"
            logger.info(f"Fetching chunk {i//CHUNK + 1}/{(len(ids) + CHUNK - 1)//CHUNK} ({len(slice_ids)} tracks)")
            
            try:
                resp = requests.get(
                    "https://music.163.com/api/song/detail", 
                    params={"ids": ids_param}, 
                    headers=headers,
                    timeout=30  # Increase timeout for large playlists
                )
                resp.raise_for_status()
                chunk_data = resp.json()
                chunk_tracks = chunk_data.get("songs", [])
                tracks.extend(chunk_tracks)
                logger.info(f"Fetched {len(chunk_tracks)} tracks in this chunk")
                
                # Add a small delay to avoid rate limiting
                if i + CHUNK < len(ids):
                    time.sleep(1)
            except Exception as e:
                logger.error(f"Error fetching chunk {i//CHUNK + 1}: {e}")
                # Continue with the next chunk despite errors
        
        logger.info(f"Total tracks fetched by IDs: {len(tracks)}")
        return tracks
    except Exception as e:
        logger.error(f"Error in fetch_tracks_by_ids: {e}")
        traceback.print_exc()
        return []

# ------------------------------------------------------------- 