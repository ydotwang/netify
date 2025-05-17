# FastAPI backend relocated for Vercel
# (this file mirrors previously developed backend/main.py)

import os, re, asyncio, logging, base64
from datetime import date
from typing import List, Dict, Optional
from urllib.parse import urlparse, parse_qs

import requests
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rapidfuzz import fuzz
import unicodedata
import re as _re
import httpx

app = FastAPI(title="Netify Backend API", version="1.0.0")

allowed_origins = ["*"]  # not needed on Vercel same-origin but kept for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_ALBUM_ID_RE = re.compile(r"id=(\d+)")


def normalize_text(s: str) -> str:
    _PAREN_RE = _re.compile(r"[\[\(（【].*?[\]）】\)]")
    _FEAT_RE = _re.compile(r"\s+(ft\.|feat\.|featuring)\s+.*", _re.IGNORECASE)
    s = unicodedata.normalize("NFKD", s)
    s = _PAREN_RE.sub("", s)
    s = _FEAT_RE.sub("", s)
    s = _re.sub(r"[^\w\s]", "", s)
    return _re.sub(r"\s+", " ", s).strip().lower()


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
        raise HTTPException(502, detail=str(exc))

    pl = pdata.get("playlist") or pdata.get("result")
    if len(pl.get("tracks", [])) < len(pl.get("trackIds", [])):
        full_tracks = fetch_full_tracks(pid)
        if not full_tracks:
            full_tracks = fetch_tracks_by_ids(pl.get("trackIds", []))
        if full_tracks:
            pl["tracks"] = full_tracks
    tracks = [
        {"name": t.get("name"), "artist": t.get("ar", t.get("artists"))[0]["name"], "duration_ms": t.get("dt", t.get("duration"))}
        for t in pl.get("tracks", [])
    ]
    return {"playlist_title": pl.get("name"), "cover_url": pl.get("coverImgUrl"), "tracks": tracks}


@app.post("/api/transfer")
async def transfer_playlist(payload: TransferBody):
    try:
        pid = extract_playlist_id(payload.url)
        pdata = await get_playlist_data(pid)
    except Exception as exc:
        raise HTTPException(502, detail=str(exc))

    root = pdata.get("playlist") or pdata.get("result")
    if len(root.get("tracks", [])) < len(root.get("trackIds", [])):
        full_tracks = fetch_full_tracks(pid)
        if not full_tracks:
            full_tracks = fetch_tracks_by_ids(root.get("trackIds", []))
        if full_tracks:
            root["tracks"] = full_tracks
    playlist_name = payload.custom_name or f"{root.get('name')} (NetEase)"

    user_resp = requests.get("https://api.spotify.com/v1/me", headers=spotify_headers(payload.spotify_token))
    if user_resp.status_code != 200:
        raise HTTPException(401, detail="Spotify token invalid")
    user_id = user_resp.json()["id"]

    create_resp = requests.post(
        f"https://api.spotify.com/v1/users/{user_id}/playlists",
        json={"name": playlist_name, "public": False, "description": payload.description or f"Imported on {date.today()}"},
        headers=spotify_headers(payload.spotify_token),
    )
    if create_resp.status_code not in (200, 201):
        raise HTTPException(400, detail="Failed to create playlist")
    sp_pl_id = create_resp.json()["id"]

    songs = root.get("tracks", [])
    uris, missing = [], []
    for song in songs:
        q = f'track:"{song["name"]}" artist:"{song.get("ar", song.get("artists"))[0]["name"]}"'
        s_resp = requests.get("https://api.spotify.com/v1/search", params={"q": q, "type": "track", "limit": 5}, headers=spotify_headers(payload.spotify_token))
        items = s_resp.json().get("tracks", {}).get("items", [])
        if items:
            uris.append(items[0]["uri"])
        else:
            missing.append(song["name"])

    if uris:
        for chunk in [uris[i:i+100] for i in range(0, len(uris), 100)]:
            requests.post(f"https://api.spotify.com/v1/playlists/{sp_pl_id}/tracks", json={"uris": chunk}, headers=spotify_headers(payload.spotify_token))

    cover_url = payload.cover_url or root.get("coverImgUrl")
    if cover_url:
        try:
            if cover_url.startswith("data:"):
                encoded = cover_url.split(",",1)[1]
            else:
                img_bytes = requests.get(cover_url).content
                encoded = base64.b64encode(img_bytes).decode()
            requests.put(f"https://api.spotify.com/v1/playlists/{sp_pl_id}/images", data=encoded, headers={**spotify_headers(payload.spotify_token), "Content-Type":"image/jpeg"})
        except Exception:
            pass

    return {"playlist_url": f"https://open.spotify.com/playlist/{sp_pl_id}", "missing": missing} 


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
    resp = requests.get(
        "https://music.163.com/api/v3/playlist/track/all",
        params={"id": pl_id, "limit": 10000, "offset": 0},
        headers={"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"},
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("songs", [])


# ---- fallback helper: fetch by song ids -----------------------------------

def fetch_tracks_by_ids(track_ids):
    """Fetch full track objects list given trackIds array from playlist api."""
    ids = [tid["id"] if isinstance(tid, dict) else tid for tid in track_ids]
    headers = {"User-Agent": "Mozilla/5.0", "Referer": "https://music.163.com/"}
    tracks = []
    CHUNK = 300  # API seems to handle ~500 but stay safe
    for i in range(0, len(ids), CHUNK):
        slice_ids = ids[i:i+CHUNK]
        ids_param = "[" + ",".join(map(str, slice_ids)) + "]"
        resp = requests.get("https://music.163.com/api/song/detail", params={"ids": ids_param}, headers=headers)
        resp.raise_for_status()
        tracks.extend(resp.json().get("songs", []))
    return tracks

# ------------------------------------------------------------- 