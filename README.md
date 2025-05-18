# Netify – Transfer NetEase Cloud Music playlists to Spotify 🎧 
# 网易云音乐歌单迁移至Spotify软件


<p align="center">
  <img src="public/netify.jpg" alt="Netify logo" width="200" />
</p>

Netify is a Next.js 14 + Tailwind + FastAPI application that lets you log in with Spotify and import any public NetEase Cloud Music playlist—tracks, name and cover art—with a single click.  
Simply paste the NetEase share-link, hit **Transfer to Spotify**, and Netify creates a new private playlist in your account (up to 10 000 tracks) while showing progress and missing songs.

Netify 是一个基于 Next.js 14、Tailwind 和 FastAPI 的应用程序，支持使用 Spotify 登录，并可一键导入任意公开的网易云音乐歌单——包括歌曲、名称和封面。
你在这里可以将你的网易云歌单转到Spotify
你只需粘贴网易云的分享链接，点击 Transfer to Spotify（转移到 Spotify），Netify 就会在你的账号中创建一个新的私人歌单（最多支持 10,000 首歌曲），并显示导入进度及缺失的歌曲。
---

## Live demo

👉 https://netify-five.vercel.app/

### How to use (English)
1. Open the live demo link above and click **Log in with Spotify**.
2. Authorise Netify – the callback will return you to the site.
3. Copy a NetEase playlist link, e.g. `https://y.music.163.com/m/playlist?id=123456`.
4. Paste it into the input box and press **Transfer to Spotify**.
5. Wait until the progress bar reaches 100 %; a link to the new playlist will appear.

### 使用指南 (中文)
1. 访问上面的演示地址，点击 **Log in with Spotify** 并授权。
2. 授权成功后返回网站。
3. 复制网易云歌单分享链接，例如 `https://y.music.163.com/m/playlist?id=123456`。
4. 粘贴到输入框，点击 **Transfer to Spotify**（转到 Spotify）。
5. 等待进度条完成，页面会显示新的 Spotify 歌单链接。

## Development

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Prerequisites

1. Node.js 18+ for the frontend
2. Python 3.9+ for the backend API
3. A Spotify Developer account and registered application

### Environment Setup

Create a `.env.local` file in the root directory with the following content:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

For the backend, create a `.env` file in the `api` directory:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```

### Running Locally

First, run the development server:

```bash
# Install frontend dependencies
npm install

# Run the frontend
npm run dev
```

For the backend:
```bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install backend dependencies
cd api
pip install -r requirements.txt

# Run the backend
uvicorn backend.main:app --reload --port 8080
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Frontend (Vercel)

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add the following environment variables:
   - `NEXT_PUBLIC_BACKEND_URL`: URL of your deployed backend API
   - `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`: Your Spotify app's client ID
   - `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI`: Your deployed app's callback URL

### Backend (Fly.io)

1. Install the [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/)
2. Log in to Fly.io: `flyctl auth login`
3. Deploy the API:
   ```bash
   flyctl deploy
   ```
4. Set environment secrets:
   ```bash
   flyctl secrets set SPOTIFY_CLIENT_ID=your_client_id
   flyctl secrets set SPOTIFY_CLIENT_SECRET=your_client_secret
   flyctl secrets set SPOTIFY_REDIRECT_URI=https://your-deployed-frontend.com/callback
   ```

## Batch Processing

For large playlists (over 300 tracks), Netify uses a batch processing system:

1. Tracks are processed in batches of 300 to avoid timeouts
2. Each batch is fetched, matched with Spotify, and added to the playlist
3. The UI shows which batch is currently being processed
4. Error handling between batches ensures maximum reliability

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
