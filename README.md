# Netify: Transfer NetEase Cloud Music playlists to Spotify 🎧
# 网易云音乐歌单迁移至Spotify工具

<div align="center">
  <img src="public/netify.jpg" alt="Netify logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br/>
  <p>
    <a href="https://netify-five.vercel.app/" target="_blank"><strong>🚀 Try it now</strong></a> •
  </p>
</div>

<hr/>

## 🌟 Features

- **Simple One-Click Process**: Just log in with Spotify, paste a NetEase playlist link, and click Transfer
- **Full Playlist Import**: Transfer entire playlists including tracks, name, and cover art
- **Smart Matching**: Advanced algorithm to find the best matches on Spotify
- **Large Playlist Support**: Can handle up to 10,000 tracks
- **Progress Tracking**: See detailed progress as your music transfers
- **Missing Tracks Report**: Get a detailed report of any songs that couldn't be found

<hr/>

## 📱 Demo

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="public/screenshot-home.jpg" width="400px" alt="Home Screen"/>
        <br/>
        <em>Home Screen</em>
      </td>
      <td align="center">
        <img src="public/screenshot-transfer.jpg" width="400px" alt="Transfer Process"/>
        <br/>
        <em>Transfer Process</em>
      </td>
    </tr>
  </table>
</div>

## 🔍 How to use (English)

1. Visit [Netify Web App](https://netify-five.vercel.app/) and click **Log in with Spotify**
2. Authorize the application (requires Spotify account)
3. Copy a NetEase Cloud Music playlist link, for example:
   ```
   https://y.music.163.com/m/playlist?id=123456
   ```
4. Paste the link into the input box and click **Transfer to Spotify**
5. Wait for the process to complete - you'll see a progress bar
6. When finished, click "Open playlist in Spotify" to view your new playlist

## 🔍 使用指南 (中文)

1. 访问 [Netify 网页应用](https://netify-five.vercel.app/)，点击 **Log in with Spotify** 按钮
2. 授权应用程序（需要 Spotify 账号）
3. 复制网易云音乐歌单分享链接，例如：
   ```
   https://y.music.163.com/m/playlist?id=123456
   ```
4. 将链接粘贴到输入框中，点击 **Transfer to Spotify** 按钮
5. 等待处理完成 - 您将看到进度条
6. 完成后，点击"Open playlist in Spotify"查看您的新歌单

<hr/>

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, Tailwind CSS, React
- **Backend**: FastAPI (Python), hosted on Fly.io
- **APIs**: Spotify Web API, NetEase Cloud Music API
- **Deployment**: Vercel (frontend), Fly.io (backend)

## 💻 Development

### Prerequisites

1. Node.js 18+ for the frontend
2. Python 3.9+ for the backend API
3. A Spotify Developer account and registered application

### Environment Setup

Create a `.env.local` file in the root directory:
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

Frontend:
```bash
# Install frontend dependencies
npm install

# Run the frontend
npm run dev
```

Backend:
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Frontend (Vercel)

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Add the necessary environment variables:
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

## 📝 License

This project is [MIT licensed](LICENSE).
