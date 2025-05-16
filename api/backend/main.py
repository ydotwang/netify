# FastAPI backend relocated for Vercel
# (this file mirrors previously developed backend/main.py)

import os, re, asyncio, logging, base64
from datetime import date
from typing import List, Dict, Optional

import requests
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rapidfuzz import fuzz
import unicodedata
import re as _re

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
        pid = _ALBUM_ID_RE.search(url.replace('#/', '')).group(1)
        pdata = await get_playlist_data(pid)
    except Exception as exc:
        raise HTTPException(502, detail=str(exc))

    pl = pdata.get("playlist") or pdata.get("result")
    tracks = [
        {"name": t.get("name"), "artist": t.get("ar", t.get("artists"))[0]["name"], "duration_ms": t.get("dt", t.get("duration"))}
        for t in pl.get("tracks", [])
    ]
    return {"playlist_title": pl.get("name"), "cover_url": pl.get("coverImgUrl"), "tracks": tracks}


@app.post("/api/transfer")
async def transfer_playlist(payload: TransferBody):
    try:
        pid = _ALBUM_ID_RE.search(payload.url.replace('#/', '')).group(1)
        pdata = await get_playlist_data(pid)
    except Exception as exc:
        raise HTTPException(502, detail=str(exc))

    root = pdata.get("playlist") or pdata.get("result")
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