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
MAX_NETEASE_FETCH = 10000     # Maximum tracks to fetch from NetEase in one request
MATCH_THRESHOLD = 65          # Threshold for fuzzy matching percentage


def normalize_text(s: str) -> str:
    """Normalize text for better matching between NetEase and Spotify tracks."""
    if not s:
        return ""
    # Regex for patterns to remove
    _PAREN_RE = _re.compile(r"[\[\(（【].*?[\]）】\)]")
    _FEAT_RE = _re.compile(r"\s+(ft\.|feat\.|featuring|with|和|與)\s+.*", _re.IGNORECASE)
    # Remove version markers with expanded patterns
    _VERSION_RE = _re.compile(r"\s+(- )?((Album|Single|Live|Acoustic|Remix|Remaster(ed)?|Version|Edit|Radio Edit|Extended|Original|Official Audio|MV|Cover|翻唱|混音|重制|现场|直播|纯音乐|纯音|伴奏)\s*).*$", _re.IGNORECASE)
    
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


def get_all_artists(song: Dict) -> List[str]:
    """Extract all artist names from a NetEase song object."""
    artists = []
    # Try to get the artists from ar field
    if song.get("ar"):
        artists = [artist.get("name", "") for artist in song.get("ar", []) if artist.get("name")]
    # Fallback to artists field
    elif song.get("artists"):
        artists = [artist.get("name", "") for artist in song.get("artists", []) if artist.get("name")]
    
    return [a for a in artists if a]  # Remove any empty strings


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
    
    # ALWAYS fetch full tracks for consistent behavior
    logger.info(f"Fetching all tracks for playlist {pid}")
    full_tracks = fetch_full_tracks(pid)
    
    if full_tracks:
        logger.info(f"Fetched {len(full_tracks)} tracks for playlist {pid}")
        pl["tracks"] = full_tracks
    else:
        # Fallback to fetching by IDs if main method fails
        logger.info(f"Falling back to fetch_tracks_by_ids for playlist {pid}")
        track_ids = pl.get("trackIds", [])
        full_tracks = fetch_tracks_by_ids(track_ids)
        
        if full_tracks:
            pl["tracks"] = full_tracks
            logger.info(f"Fetched {len(full_tracks)} tracks by IDs for playlist {pid}")
    
    tracks = [
        {
            "name": t.get("name", ""),
            "artist": t.get("ar", t.get("artists", [{}]))[0].get("name", "") if t.get("ar") or t.get("artists") else "",
            "duration_ms": t.get("dt", t.get("duration", 0))
        }
        for t in pl.get("tracks", [])
        if t.get("name") and (t.get("ar") or t.get("artists"))
    ]
    
    # Make sure we report the correct count to the frontend
    total_track_count = len(tracks)
    
    # If the number of tracks doesn't match trackIds count, log a warning and use trackIds count
    if total_track_count < track_ids_count and track_ids_count > 0:
        logger.warning(f"Mismatch: Got {total_track_count} tracks but playlist has {track_ids_count} trackIds")
        total_track_count = track_ids_count
    
    # Only send a subset of tracks to the frontend to avoid large responses, but make sure to keep the original tracks for processing
    logger.info(f"Returning a subset of tracks (max 1000) for playlist {pid} with total count {total_track_count}")
    preview_tracks = tracks[:1000]  # Limited preview for UI
    
    # Return a limited number of tracks to avoid timeout, but pass the CORRECT total count
    return {
        "playlist_title": pl.get("name", "Unknown Playlist"),
        "cover_url": pl.get("coverImgUrl", ""),
        "tracks": preview_tracks,  # Send a limited set to avoid response size issues 
        "total_tracks_count": total_track_count  # Send the ACTUAL total count
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


async def search_track_on_spotify(track_name: str, artists: List[str], duration_ms: int, token: str) -> Optional[str]:
    """
    Enhanced search for a track on Spotify using multiple strategies and all artist names.
    
    Args:
        track_name: The name of the track
        artists: List of all artist names associated with the track
        duration_ms: Track duration in milliseconds (for filtering)
        token: Spotify API token
        
    Returns:
        Spotify URI if found, None otherwise
    """
    if not track_name or not artists:
        return None
        
    primary_artist = artists[0]
    
    # Try all strategies with the primary artist first
    
    # Strategy 1: Exact search with track: and artist:
    query = f'track:"{track_name}" artist:"{primary_artist}"'
    s_resp = retry_request(
        requests.get, 
        "https://api.spotify.com/v1/search", 
        params={"q": query, "type": "track", "limit": 5}, 
        headers=spotify_headers(token)
    )
    
    items = s_resp.json().get("tracks", {}).get("items", [])
    if items:
        # Sort results by most similar duration and confidence
        best_match = find_best_match_by_duration(items, duration_ms)
        if best_match:
            return best_match["uri"]
    
    # Strategy 2: Normalized search with primary artist
    normalized_track = normalize_text(track_name)
    normalized_artist = clean_artist_name(primary_artist)
    
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
            best_match = find_best_match_by_duration(items, duration_ms)
            if best_match:
                return best_match["uri"]
    
    # Strategy 3: Track name search only (ignoring artist)
    query = f'track:"{track_name}"'
    s_resp = retry_request(
        requests.get, 
        "https://api.spotify.com/v1/search", 
        params={"q": query, "type": "track", "limit": 20}, 
        headers=spotify_headers(token)
    )
    
    items = s_resp.json().get("tracks", {}).get("items", [])
    if items:
        # Find the track with most similar artist name
        best_match = find_best_artist_match(items, artists, track_name)
        if best_match:
            return best_match["uri"]
    
    # Strategy 4: Try with each artist in the list (if multiple artists)
    if len(artists) > 1:
        for artist in artists[1:]:
            query = f'track:"{track_name}" artist:"{artist}"'
            s_resp = retry_request(
                requests.get, 
                "https://api.spotify.com/v1/search", 
                params={"q": query, "type": "track", "limit": 5}, 
                headers=spotify_headers(token)
            )
            
            items = s_resp.json().get("tracks", {}).get("items", [])
            if items:
                best_match = find_best_match_by_duration(items, duration_ms)
                if best_match:
                    return best_match["uri"]
                    
    # Strategy 5: General query with exact track name and primary artist
    query = f'{track_name} {primary_artist}'
    s_resp = retry_request(
        requests.get, 
        "https://api.spotify.com/v1/search", 
        params={"q": query, "type": "track", "limit": 20}, 
        headers=spotify_headers(token)
    )
    
    items = s_resp.json().get("tracks", {}).get("items", [])
    if not items:
        return None
    
    # Use advanced fuzzy matching to find the best match
    best_match = find_best_match(items, track_name, artists)
    return best_match["uri"] if best_match else None


def find_best_match_by_duration(items, target_duration):
    """Find the best match from items based on duration similarity."""
    best_item = None
    best_diff = float('inf')
    
    for item in items:
        if item.get("duration_ms"):
            diff = abs(item["duration_ms"] - target_duration)
            if diff < best_diff:
                best_diff = diff
                best_item = item
    
    # If the best match has duration difference less than 10 seconds
    if best_item and best_diff < 10000:
        return best_item
    
    # Otherwise return the first item
    return items[0] if items else None


def find_best_artist_match(items, artists, track_name):
    """Find the item with the best artist match for given artists."""
    best_score = 0
    best_match = None
    
    normalized_track = normalize_text(track_name)
    artists_lower = [clean_artist_name(a) for a in artists]
    
    for item in items:
        # Skip if track name doesn't match closely
        item_name = item.get("name", "")
        normalized_item_name = normalize_text(item_name)
        name_score = fuzz.ratio(normalized_track, normalized_item_name)
        
        # Only consider if track name is reasonably similar
        if name_score < 80:
            continue
            
        # Get all artists from the track
        spotify_artists = [a.get("name", "") for a in item.get("artists", [])]
        spotify_artists_lower = [clean_artist_name(a) for a in spotify_artists]
        
        # Find the best matching artist pair
        artist_score = 0
        for a1 in artists_lower:
            for a2 in spotify_artists_lower:
                current_score = fuzz.ratio(a1, a2)
                if current_score > artist_score:
                    artist_score = current_score
        
        # Calculate combined score, heavily favoring track name match
        combined_score = (name_score * 0.8) + (artist_score * 0.2)
        
        if combined_score > best_score and combined_score > MATCH_THRESHOLD:
            best_score = combined_score
            best_match = item
    
    return best_match


def find_best_match(items, track_name, artists):
    """Find the best match using fuzzy matching on both track name and artists."""
    best_score = 0
    best_match = None
    
    normalized_track = normalize_text(track_name)
    artists_lower = [clean_artist_name(a) for a in artists]
    
    for item in items:
        item_name = item.get("name", "")
        if not item_name:
            continue
            
        normalized_item_name = normalize_text(item_name)
        
        # Get Spotify artists
        spotify_artists = [a.get("name", "") for a in item.get("artists", [])]
        spotify_artists_lower = [clean_artist_name(a) for a in spotify_artists]
        
        # Calculate name similarity
        name_score = fuzz.ratio(normalized_track, normalized_item_name)
        
        # Find the best artist match score
        best_artist_score = 0
        for a1 in artists_lower:
            for a2 in spotify_artists_lower:
                current_score = fuzz.ratio(a1, a2)
                if current_score > best_artist_score:
                    best_artist_score = current_score
        
        # Weight name more heavily than artist for matching
        combined_score = (name_score * 0.7) + (best_artist_score * 0.3)
        
        if combined_score > best_score and combined_score > MATCH_THRESHOLD:
            best_score = combined_score
            best_match = item
    
    return best_match


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
    
    # Get trackIds count for accurate reporting
    track_ids_count = len(root.get("trackIds", []))
    logger.info(f"Playlist {pid} has {track_ids_count} trackIds according to API")
    
    # ALWAYS fetch all tracks directly - don't rely on previous API call
    logger.info(f"Transfer: Fetching all tracks for playlist {pid}")
    full_tracks = fetch_full_tracks(pid)
    
    if full_tracks:
        root["tracks"] = full_tracks
        logger.info(f"Transfer: Fetched {len(full_tracks)} tracks for playlist {pid}")
    else:
        # Fallback to fetching by IDs
        logger.info(f"Transfer: No tracks fetched, falling back to fetch_tracks_by_ids for playlist {pid}")
        track_ids = root.get("trackIds", [])
        full_tracks = fetch_tracks_by_ids(track_ids)
        
        if full_tracks:
            root["tracks"] = full_tracks
            logger.info(f"Transfer: Fetched {len(full_tracks)} tracks by IDs for playlist {pid}")
        else:
            # If we still have no tracks, use what we got from the initial playlist data
            logger.warning("Transfer: All track fetching methods failed. Using tracks from initial playlist data.")
            if not root.get("tracks"):
                logger.error("Transfer: No tracks available in the playlist")
                raise HTTPException(404, detail="No tracks found in the playlist")
    
    playlist_name = payload.custom_name or f"{root.get('name', 'NetEase Playlist')} (NetEase)"
    
    # Verify we have the expected number of tracks
    final_track_count = len(root.get("tracks", []))
    logger.info(f"Transfer: Final track count: {final_track_count}")
    
    # If we still don't have all tracks, use the trackIds count as the true count
    if final_track_count < track_ids_count and track_ids_count > 0:
        logger.warning(f"Transfer: Could not fetch all tracks. Expected {track_ids_count}, got {final_track_count}")
        true_total_count = track_ids_count
    else:
        true_total_count = final_track_count
        
    logger.info(f"Transfer: Using true total count of {true_total_count} tracks")
    
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
    
    # Get all songs
    songs = root.get("tracks", [])
    logger.info(f"Processing {len(songs)} total songs from NetEase")
    
    # Limit to maximum playlist size supported by Spotify
    if len(songs) > MAX_PLAYLIST_SIZE:
        logger.warning(f"Playlist exceeds Spotify limit of {MAX_PLAYLIST_SIZE} tracks, truncating")
        songs = songs[:MAX_PLAYLIST_SIZE]
    
    # Process all tracks
    all_uris = []
    all_missing = []
    
    # Extract URIs for all tracks
    logger.info(f"Beginning to search for {len(songs)} tracks on Spotify")
    
    # Use a smaller batch size for search to avoid overloading
    search_batch_size = 50
    song_batches = [songs[i:i+search_batch_size] for i in range(0, len(songs), search_batch_size)]
    
    for batch_idx, song_batch in enumerate(song_batches):
        logger.info(f"Processing search batch {batch_idx+1}/{len(song_batches)} ({len(song_batch)} tracks)")
        
        for i, song in enumerate(song_batch):
            try:
                if not song:
                    logger.warning(f"Skipping invalid song in batch {batch_idx+1}, index {i}")
                    continue
                    
                song_name = song.get("name", "")
                all_artists = get_all_artists(song)
                duration_ms = song.get("dt") or song.get("duration", 0)
                
                if not song_name or not all_artists:
                    logger.warning(f"Skipping song with missing data: name='{song_name}', artists='{all_artists}'")
                    all_missing.append(song_name or "Unknown track")
                    continue
                
                # Only log every 10th track to reduce log spam
                if i % 10 == 0:
                    logger.info(f"Searching for track: '{song_name}' by '{', '.join(all_artists)}'")
                
                uri = await search_track_on_spotify(song_name, all_artists, duration_ms, payload.spotify_token)
                
                if uri:
                    all_uris.append(uri)
                    if i % 20 == 0:  # Log less frequently
                        logger.info(f"Found match {batch_idx*search_batch_size+i+1}/{len(songs)}: {uri}")
                else:
                    all_missing.append(song_name)
                    if i % 20 == 0:  # Log less frequently
                        logger.info(f"No match found for: '{song_name}' by '{', '.join(all_artists)}'")
                    
            except Exception as e:
                logger.error(f"Error searching for track {song.get('name', 'Unknown')}: {str(e)}")
                all_missing.append(song.get('name', 'Unknown track'))
        
        # Add a delay between batches to avoid rate limiting
        if batch_idx < len(song_batches) - 1:
            await asyncio.sleep(1)
    
    logger.info(f"Found {len(all_uris)} matches for {len(songs)} tracks")
    
    # Add all tracks to the playlist in chunks to avoid Spotify API limits
    if all_uris:
        logger.info(f"Adding {len(all_uris)} tracks to Spotify playlist in chunks of {MAX_TRACKS_PER_REQUEST}")
        
        # Split into chunks of MAX_TRACKS_PER_REQUEST (100 tracks per request - Spotify limit)
        chunks = [all_uris[i:i+MAX_TRACKS_PER_REQUEST] for i in range(0, len(all_uris), MAX_TRACKS_PER_REQUEST)]
        
        chunk_failures = 0  # Track failures
        for i, chunk in enumerate(chunks):
            try:
                # Add more retries for chunk addition with exponential backoff
                max_chunk_retries = 3
                chunk_retry = 0
                chunk_added = False
                
                while not chunk_added and chunk_retry < max_chunk_retries:
                    try:
                        retry_request(
                            requests.post,
                            f"https://api.spotify.com/v1/playlists/{sp_pl_id}/tracks",
                            json={"uris": chunk},
                            headers=spotify_headers(payload.spotify_token)
                        )
                        logger.info(f"Added chunk {i+1}/{len(chunks)} ({len(chunk)} tracks)")
                        chunk_added = True
                    except Exception as chunk_error:
                        chunk_retry += 1
                        logger.warning(f"Error adding chunk {i+1}, retry {chunk_retry}/{max_chunk_retries}: {chunk_error}")
                        # Backoff delay
                        await asyncio.sleep(2 ** chunk_retry)
                        
                if not chunk_added:
                    logger.error(f"Failed to add chunk {i+1} after {max_chunk_retries} retries")
                    chunk_failures += 1
                    
                # Add a longer delay between chunks
                if i < len(chunks) - 1:
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Error adding chunk {i+1}: {str(e)}")
                chunk_failures += 1
        
        # Add a warning if some chunks failed
        if chunk_failures > 0:
            logger.warning(f"{chunk_failures}/{len(chunks)} chunks failed to add to playlist")
    
    # Create a single batch result for reporting
    batch_result = {
        "batch_number": 1,
        "total_tracks": len(songs),
        "matched_tracks": len(all_uris),
        "success_rate": round(len(all_uris) / len(songs) * 100) if songs else 0
    }
    
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
            
            # Try multiple times to set the cover image
            max_cover_retries = 3
            cover_retry = 0
            cover_set = False
            
            while not cover_set and cover_retry < max_cover_retries:
                try:
                    retry_request(
                        requests.put,
                        f"https://api.spotify.com/v1/playlists/{sp_pl_id}/images",
                        data=encoded,
                        headers={**spotify_headers(payload.spotify_token), "Content-Type":"image/jpeg"}
                    )
                    logger.info("Cover image set successfully")
                    cover_set = True
                except Exception as cover_error:
                    cover_retry += 1
                    logger.warning(f"Error setting cover image, retry {cover_retry}/{max_cover_retries}: {cover_error}")
                    # Backoff delay
                    await asyncio.sleep(2 ** cover_retry)
            
            if not cover_set:
                logger.error(f"Failed to set cover image after {max_cover_retries} retries")
                
        except Exception as e:
            logger.error(f"Error setting cover image: {str(e)}")

    # Calculate success rate and log final statistics
    success_rate = round((len(all_uris) / true_total_count) * 100) if true_total_count > 0 else 0
    logger.info(f"Transfer complete: {len(all_uris)}/{true_total_count} tracks transferred ({success_rate}% success rate)")
    
    return {
        "playlist_url": f"https://open.spotify.com/playlist/{sp_pl_id}",
        "missing": all_missing,
        "total_transferred": len(all_uris),
        "total_tracks": true_total_count,  # Use the true total count here
        "processed_batches": 1,  # Single batch processing approach
        "batch_results": [batch_result],
        "completed_batches": 1
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
    """Return full track objects list from NetEase even for large playlists.
    Handles pagination to ensure all tracks are retrieved."""
    try:
        logger.info(f"Fetching full tracks for playlist {pl_id}")
        all_songs = []
        
        # STEP 1: First get the trackIds to understand the true playlist size
        logger.info("Step 1: Getting all trackIds for the playlist")
        try:
            playlist_resp = requests.get(
                "https://music.163.com/api/v6/playlist/detail",
                params={"id": pl_id, "n": 10000},
                headers={"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"},
                timeout=60
            )
            playlist_resp.raise_for_status()
            playlist_data = playlist_resp.json()
            
            playlist = playlist_data.get("playlist") or playlist_data.get("result", {})
            track_ids = playlist.get("trackIds", [])
            
            if track_ids:
                logger.info(f"Found {len(track_ids)} trackIds in the playlist")
            else:
                logger.warning("No trackIds found in playlist detail response")
                # Try alternative endpoint for trackIds
                alt_resp = requests.get(
                    "https://music.163.com/api/v3/playlist/detail",
                    params={"id": pl_id, "n": 10000},
                    headers={"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"},
                    timeout=60
                )
                alt_data = alt_resp.json()
                playlist = alt_data.get("playlist") or alt_data.get("result", {})
                track_ids = playlist.get("trackIds", [])
                logger.info(f"Alternative endpoint found {len(track_ids)} trackIds")
        except Exception as e:
            logger.warning(f"Error getting trackIds: {e}")
            track_ids = []
        
        # STEP 2: Fetch tracks in batches using track/all endpoint with pagination
        logger.info("Step 2: Fetching tracks with pagination using track/all endpoint")
        offset = 0
        limit = 1000  # NetEase API generally accepts up to 1000 per request
        
        while True:
            try:
                logger.info(f"Fetching tracks batch with offset={offset}, limit={limit}")
                
                # Use the track/all endpoint which is specifically designed for paginated access
                resp = requests.get(
                    "https://music.163.com/api/v3/playlist/track/all",
                    params={
                        "id": pl_id,
                        "limit": limit, 
                        "offset": offset
                    },
                    headers={
                        "User-Agent": "Mozilla/5.0",
                        "Referer": "https://music.163.com/"
                    },
                    timeout=60
                )
                resp.raise_for_status()
                data = resp.json()
                
                songs = data.get("songs", [])
                
                if songs:
                    logger.info(f"Fetched {len(songs)} tracks at offset {offset}")
                    all_songs.extend(songs)
                    
                    # If we have exactly 804 tracks and we know there are more (from trackIds),
                    # this is likely the NetEase API limitation
                    if len(all_songs) == 804 and track_ids and len(track_ids) > 804:
                        logger.warning("Hit the 804 track limit in NetEase API - switching to trackIds approach")
                        break
                else:
                    logger.warning(f"No songs returned at offset {offset}")
                    break
                
                # Break the loop if:
                # 1. We got fewer songs than requested (reached the end)
                # 2. We've fetched all tracks according to trackIds count
                if len(songs) < limit or (track_ids and len(all_songs) >= len(track_ids)):
                    break
                
                # Move to next batch
                offset += limit
                time.sleep(0.5)  # Small delay to avoid rate limiting
                
            except Exception as batch_error:
                logger.error(f"Error fetching batch at offset {offset}: {batch_error}")
                break
        
        logger.info(f"After pagination: fetched {len(all_songs)} tracks")
        
        # STEP 3: If we got exactly 804 tracks or didn't get all tracks according to trackIds,
        # use fetch_tracks_by_ids as a fallback to get the remaining tracks
        if track_ids and ((len(all_songs) == 804 and len(track_ids) > 804) or len(all_songs) < len(track_ids)):
            logger.info(f"Need to fetch additional tracks: have {len(all_songs)}, need {len(track_ids)}")
            
            # Create a set of IDs we already have to avoid duplicates
            existing_ids = set()
            for song in all_songs:
                song_id = song.get("id")
                if song_id:
                    existing_ids.add(str(song_id))
            
            # Find missing track IDs
            missing_ids = []
            for tid in track_ids:
                id_val = str(tid.get("id") if isinstance(tid, dict) else tid)
                if id_val not in existing_ids:
                    missing_ids.append(tid)
            
            logger.info(f"Fetching {len(missing_ids)} missing tracks by IDs")
            missing_tracks = fetch_tracks_by_ids(missing_ids)
            
            if missing_tracks:
                logger.info(f"Successfully fetched {len(missing_tracks)} additional tracks")
                all_songs.extend(missing_tracks)
            else:
                logger.warning(f"Failed to fetch missing tracks by IDs")
                
                # If we have exactly 804 tracks, try an alternative approach:
                # Use the song/detail endpoint to get remaining tracks in batches
                if len(all_songs) == 804 and track_ids and len(track_ids) > 804:
                    logger.info("Trying direct song/detail approach for remaining tracks")
                    
                    # Get track IDs from 804 onwards
                    remaining_ids = track_ids[804:]
                    remaining_tracks = []
                    
                    # Fetch remaining tracks in smaller batches
                    batch_size = 200
                    for i in range(0, len(remaining_ids), batch_size):
                        batch_ids = remaining_ids[i:i+batch_size]
                        logger.info(f"Fetching batch {i//batch_size + 1}/{(len(remaining_ids) + batch_size - 1)//batch_size} ({len(batch_ids)} tracks)")
                        
                        try:
                            ids_str = ",".join([str(tid.get("id") if isinstance(tid, dict) else tid) for tid in batch_ids])
                            detail_resp = requests.get(
                                "https://music.163.com/api/song/detail",
                                params={"ids": f"[{ids_str}]"},
                                headers={"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"},
                                timeout=60
                            )
                            detail_data = detail_resp.json()
                            batch_tracks = detail_data.get("songs", [])
                            
                            if batch_tracks:
                                logger.info(f"Got {len(batch_tracks)} tracks from song/detail")
                                remaining_tracks.extend(batch_tracks)
                            
                            time.sleep(0.5)  # Small delay between batches
                        except Exception as e:
                            logger.error(f"Error fetching tracks batch using song/detail: {e}")
                    
                    if remaining_tracks:
                        logger.info(f"Successfully fetched {len(remaining_tracks)} remaining tracks using song/detail")
                        all_songs.extend(remaining_tracks)
        
        # Final log
        logger.info(f"Total tracks fetched from NetEase API: {len(all_songs)}")
        return all_songs
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
        ids = [tid.get("id", tid) if isinstance(tid, dict) else tid for tid in track_ids]
        headers = {
            "User-Agent": "Mozilla/5.0", 
            "Referer": "https://music.163.com/",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        tracks = []
        max_retries = 3
        
        # Smaller chunk size for more reliable requests
        chunk_size = 200  
        logger.info(f"Fetching {len(ids)} tracks in chunks of {chunk_size}")
        
        for i in range(0, len(ids), chunk_size):
            chunk_ids = ids[i:i+chunk_size]
            logger.info(f"Fetching chunk {i//chunk_size + 1}/{(len(ids) + chunk_size - 1)//chunk_size} ({len(chunk_ids)} tracks)")
            
            retry_count = 0
            success = False
            
            # Try multiple API endpoints with retries
            while not success and retry_count < max_retries:
                try:
                    # First try the standard song/detail endpoint
                    ids_param = "[" + ",".join([str(id) for id in chunk_ids]) + "]"
                    
                    resp = requests.get(
                        "https://music.163.com/api/song/detail", 
                        params={"ids": ids_param}, 
                        headers=headers,
                        timeout=60
                    )
                    resp.raise_for_status()
                    chunk_data = resp.json()
                    chunk_tracks = chunk_data.get("songs", [])
                    
                    # Verify we got a reasonable number of tracks back
                    if chunk_tracks and len(chunk_tracks) > 0:
                        success = True
                        tracks.extend(chunk_tracks)
                        logger.info(f"Successfully fetched {len(chunk_tracks)} tracks from chunk {i//chunk_size + 1}")
                    else:
                        # If no tracks returned, try alternative endpoint
                        logger.warning(f"No tracks returned from song/detail endpoint, trying v2 endpoint")
                        
                        # Try alternative endpoint (v2)
                        alt_resp = requests.post(
                            "https://music.163.com/weapi/v2/song/detail",
                            data={
                                "ids": ids_param,
                                "csrf_token": ""
                            },
                            headers=headers,
                            timeout=60
                        )
                        alt_data = alt_resp.json()
                        alt_tracks = alt_data.get("songs", [])
                        
                        if alt_tracks and len(alt_tracks) > 0:
                            success = True
                            tracks.extend(alt_tracks)
                            logger.info(f"Successfully fetched {len(alt_tracks)} tracks from v2 endpoint")
                        else:
                            retry_count += 1
                            logger.warning(f"Both endpoints failed, retry {retry_count}/{max_retries}")
                            if retry_count < max_retries:
                                # Exponential backoff
                                backoff_time = (2 ** retry_count) + random.uniform(0, 1)
                                logger.info(f"Retrying in {backoff_time:.2f} seconds...")
                                time.sleep(backoff_time)
                
                except Exception as e:
                    retry_count += 1
                    logger.warning(f"Error fetching chunk {i//chunk_size + 1}, retry {retry_count}/{max_retries}: {e}")
                    if retry_count < max_retries:
                        # Exponential backoff
                        backoff_time = (2 ** retry_count) + random.uniform(0, 1)
                        logger.info(f"Retrying in {backoff_time:.2f} seconds...")
                        time.sleep(backoff_time)
            
            if not success:
                logger.error(f"Failed to fetch chunk {i//chunk_size + 1} after {max_retries} retries")
            
            # Add a small delay between chunks to avoid rate limiting
            if i + chunk_size < len(ids):
                time.sleep(1)
        
        logger.info(f"Total tracks fetched by IDs: {len(tracks)}")
        return tracks
    
    except Exception as e:
        logger.error(f"Error in fetch_tracks_by_ids: {e}")
        traceback.print_exc()
        return []

# ------------------------------------------------------------- 