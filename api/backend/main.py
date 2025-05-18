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
        logger.info(f"Transfer: Falling back to fetch_tracks_by_ids for playlist {pid}")
        track_ids = root.get("trackIds", [])
        full_tracks = fetch_tracks_by_ids(track_ids)
        
        if full_tracks:
            root["tracks"] = full_tracks
            logger.info(f"Transfer: Fetched {len(full_tracks)} tracks by IDs for playlist {pid}")
    
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
    
    # Limit to maximum playlist size supported by Spotify
    if len(songs) > MAX_PLAYLIST_SIZE:
        logger.warning(f"Playlist exceeds Spotify limit of {MAX_PLAYLIST_SIZE} tracks, truncating")
        songs = songs[:MAX_PLAYLIST_SIZE]
    
    # For large playlists, split into smaller batches to avoid timeouts
    BATCH_SIZE = 300  # Process smaller batches
    total_songs = len(songs)
    total_batches = (total_songs + BATCH_SIZE - 1) // BATCH_SIZE  # Ceiling division
    
    all_uris = []
    all_missing = []
    all_batch_results = []  # Store individual batch results for reporting
    
    logger.info(f"Processing {total_songs} songs in {total_batches} batches of {BATCH_SIZE}")
    
    # Process all batches
    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, total_songs)
        
        batch_songs = songs[start_idx:end_idx]
        logger.info(f"*** STARTING BATCH {batch_num+1}/{total_batches} with {len(batch_songs)} songs (indices {start_idx}-{end_idx-1}) ***")
        
        # Force small delay between batches for API rate limiting
        if batch_num > 0:
            logger.info(f"Pausing for 5 seconds before starting batch {batch_num+1} to avoid rate limits")
            await asyncio.sleep(5)
        
        try:
            # Process this batch
            batch_uris = []
            batch_missing = []
            
            for i, song in enumerate(batch_songs):
                try:
                    if not song:
                        logger.warning(f"Skipping invalid song at index {start_idx + i}")
                        continue
                        
                    song_name = song.get("name", "")
                    all_artists = get_all_artists(song)
                    duration_ms = song.get("dt") or song.get("duration", 0)
                    
                    if not song_name or not all_artists:
                        logger.warning(f"Skipping song with missing data: name='{song_name}', artists='{all_artists}'")
                        batch_missing.append(song_name or "Unknown track")
                        continue
                    
                    logger.info(f"Batch {batch_num+1}: Searching for track: '{song_name}' by '{', '.join(all_artists)}'")
                    uri = await search_track_on_spotify(song_name, all_artists, duration_ms, payload.spotify_token)
                    
                    if uri:
                        batch_uris.append(uri)
                        logger.info(f"Found match: {uri}")
                    else:
                        batch_missing.append(song_name)
                        logger.info(f"No match found for: '{song_name}' by '{', '.join(all_artists)}'")
                        
                    # Add a small delay to avoid rate limiting - more aggressive for larger batches
                    if i % 10 == 0 and i > 0:
                        await asyncio.sleep(0.5)
                        
                except Exception as e:
                    logger.error(f"Error searching for track {song.get('name', 'Unknown')}: {str(e)}")
                    batch_missing.append(song.get('name', 'Unknown track'))
            
            # Add this batch's tracks to the playlist immediately
            if batch_uris:
                logger.info(f"Adding batch {batch_num+1} with {len(batch_uris)} tracks to playlist")
                
                # Split into chunks of MAX_TRACKS_PER_REQUEST
                batch_chunks = [batch_uris[i:i+MAX_TRACKS_PER_REQUEST] for i in range(0, len(batch_uris), MAX_TRACKS_PER_REQUEST)]
                
                chunk_failures = 0  # Track failures
                for i, chunk in enumerate(batch_chunks):
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
                                logger.info(f"Added chunk {i+1}/{len(batch_chunks)} of batch {batch_num+1} ({len(chunk)} tracks)")
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
                        if i < len(batch_chunks) - 1:
                            await asyncio.sleep(2)
                            
                    except Exception as e:
                        logger.error(f"Error adding chunk {i+1} of batch {batch_num+1}: {str(e)}")
                        chunk_failures += 1
                
                # Add a warning if some chunks failed
                if chunk_failures > 0:
                    logger.warning(f"Batch {batch_num+1}: {chunk_failures}/{len(batch_chunks)} chunks failed to add to playlist")
            
            # Save batch results - include more details for debugging
            all_batch_results.append({
                "batch_number": batch_num + 1,
                "total_tracks": len(batch_songs),
                "matched_tracks": len(batch_uris),
                "success_rate": round(len(batch_uris) / len(batch_songs) * 100) if batch_songs else 0,
                "start_index": start_idx,
                "end_index": end_idx - 1
            })
            
            # Extend our tracking lists
            all_uris.extend(batch_uris)
            all_missing.extend(batch_missing)
            
            logger.info(f"*** COMPLETED BATCH {batch_num+1}/{total_batches}: {len(batch_uris)}/{len(batch_songs)} tracks matched ***")
            
            # Add a longer delay between batches to avoid rate limiting and timeouts
            if batch_num < total_batches - 1:
                logger.info(f"Waiting 5 seconds before starting next batch...")
                await asyncio.sleep(5)
                
        except Exception as batch_error:
            logger.error(f"Error processing batch {batch_num+1}: {str(batch_error)}")
            logger.error(traceback.format_exc())
            
            # Still save the batch result with error information
            all_batch_results.append({
                "batch_number": batch_num + 1,
                "total_tracks": len(batch_songs),
                "matched_tracks": 0,
                "success_rate": 0,
                "error": str(batch_error),
                "start_index": start_idx,
                "end_index": end_idx - 1
            })
            
            # Add a longer delay before trying the next batch
            logger.info(f"Waiting 10 seconds before attempting next batch after error...")
            await asyncio.sleep(10)
    
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
    
    for batch_result in all_batch_results:
        logger.info(f"Batch {batch_result['batch_number']}: {batch_result['matched_tracks']}/{batch_result['total_tracks']} tracks ({batch_result['success_rate']}%)")
    
    return {
        "playlist_url": f"https://open.spotify.com/playlist/{sp_pl_id}",
        "missing": all_missing,
        "total_transferred": len(all_uris),
        "total_tracks": true_total_count,  # Use the true total count here
        "processed_batches": total_batches,
        "batch_results": all_batch_results,  # Include batch-specific results
        "completed_batches": len(all_batch_results)  # How many batches were actually processed
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
        offset = 0
        max_retries = 3
        
        while True:
            logger.info(f"Fetching tracks with offset {offset}")
            retry_count = 0
            success = False
            
            # Add retry logic for each request
            while not success and retry_count < max_retries:
                try:
                    resp = requests.get(
                        "https://music.163.com/api/v3/playlist/track/all",
                        params={"id": pl_id, "limit": 1000, "offset": offset},
                        headers={"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"},
                        timeout=60  # Increase timeout for large playlists
                    )
                    resp.raise_for_status()
                    success = True
                except Exception as e:
                    retry_count += 1
                    logger.warning(f"Error fetching tracks at offset {offset}, retry {retry_count}/{max_retries}: {e}")
                    if retry_count < max_retries:
                        # Exponential backoff
                        backoff_time = (2 ** retry_count) + random.uniform(0, 1)
                        logger.info(f"Retrying in {backoff_time:.2f} seconds...")
                        time.sleep(backoff_time)
                    else:
                        logger.error(f"Max retries reached for offset {offset}")
                        raise
            
            data = resp.json()
            songs = data.get("songs", [])
            
            if not songs:
                # No more songs returned
                break
                
            all_songs.extend(songs)
            logger.info(f"Fetched {len(songs)} tracks at offset {offset}, total so far: {len(all_songs)}")
            
            # If we received fewer songs than requested, we're at the end
            if len(songs) < 1000:
                break
                
            # Increment offset for next batch
            offset += 1000
            
            # Small delay to avoid rate limiting
            time.sleep(1)
        
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
        ids = [tid["id"] if isinstance(tid, dict) else tid for tid in track_ids]
        headers = {"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"}
        tracks = []
        max_retries = 3
        
        # Increase chunk size for better performance but stay safe
        CHUNK = 500  
        logger.info(f"Fetching {len(ids)} tracks in chunks of {CHUNK}")
        
        for i in range(0, len(ids), CHUNK):
            slice_ids = ids[i:i+CHUNK]
            # Safe string construction
            ids_param = "[" + ",".join(map(str, slice_ids)) + "]"
            logger.info(f"Fetching chunk {i//CHUNK + 1}/{(len(ids) + CHUNK - 1)//CHUNK} ({len(slice_ids)} tracks)")
            
            retry_count = 0
            success = False
            chunk_tracks = []
            
            # Add retry logic
            while not success and retry_count < max_retries:
                try:
                    resp = requests.get(
                        "https://music.163.com/api/song/detail", 
                        params={"ids": ids_param}, 
                        headers=headers,
                        timeout=60  # Increase timeout for large playlists
                    )
                    resp.raise_for_status()
                    chunk_data = resp.json()
                    chunk_tracks = chunk_data.get("songs", [])
                    success = True
                except Exception as e:
                    retry_count += 1
                    logger.warning(f"Error fetching chunk {i//CHUNK + 1}, retry {retry_count}/{max_retries}: {e}")
                    if retry_count < max_retries:
                        # Exponential backoff
                        backoff_time = (2 ** retry_count) + random.uniform(0, 1)
                        logger.info(f"Retrying in {backoff_time:.2f} seconds...")
                        time.sleep(backoff_time)
                    else:
                        logger.error(f"Max retries reached for chunk {i//CHUNK + 1}")
                        # Continue to the next chunk instead of raising
                        break
            
            tracks.extend(chunk_tracks)
            logger.info(f"Fetched {len(chunk_tracks)} tracks in this chunk")
            
            # Add a small delay to avoid rate limiting
            if i + CHUNK < len(ids):
                time.sleep(1)
        
        logger.info(f"Total tracks fetched by IDs: {len(tracks)}")
        return tracks
    except Exception as e:
        logger.error(f"Error in fetch_tracks_by_ids: {e}")
        traceback.print_exc()
        return []

# ------------------------------------------------------------- 