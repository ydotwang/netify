# Netify Backend (FastAPI)

This Python service handles:

1. Fetching album metadata from **NetEase Cloud Music** (using `pyncm`).
2. Creating Spotify playlists and adding matched tracks (with the user-provided access token).

## Endpoints

| Method | Path             | Purpose                              |
|--------|------------------|--------------------------------------|
| GET    | `/api/album-info?url=<netease_url>` | Return album title, cover and track list.
| POST   | `/api/transfer`  | Body: `{ "url": "<netease_url>", "spotify_token": "<oauth_token>" }`<br>Creates a playlist and returns `{ playlist_url, added, missing }`.

## Local development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload  # http://127.0.0.1:8000
```

Allow CORS for your front-end:

```bash
export CORS_ORIGINS=http://127.0.0.1:3000
```

## Deployment

Any platform that supports FastAPI (Render, Fly.io, Railway, Vercel's Python
Runtime).  Set the `CORS_ORIGINS` env var to your production front-end origin.  

---
**Note**: The service uses the *user's* Spotify access token; make sure the
front-end sends a valid token obtained via the PKCE flow and with the scopes:
`playlist-modify-public playlist-modify-private user-read-email user-read-private`. 