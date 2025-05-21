# Netify for Linux

<div align="center">
  <img src="netify.jpg" alt="Netify logo" width="200" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br/>
  <p>
    <a href="https://netify-five.vercel.app/" target="_blank"><strong>🚀 Try it now on Linux</strong></a>
  </p>
</div>

## Linux-Specific Instructions

This version is optimized for Linux distributions.

### Installation on Linux

```bash
# Install dependencies
npm install

# Run the application
npm run dev
```

### Linux Terminal Integration

You can create an alias in your shell configuration (.bashrc, .zshrc, etc.) for quick access:

```bash
echo 'alias netify="cd /path/to/netify && npm run dev"' >> ~/.bashrc
source ~/.bashrc
```

### System Requirements

- Node.js 18+ (install via your distribution's package manager)
- Modern browser like Firefox or Chrome
- Python 3.9+ for the backend API

## Standard Features



- **Simple One-Click Process**: Just log in with Spotify, paste a NetEase playlist link, and click Transfer
- **Full Playlist Import**: Transfer entire playlists including tracks, name, and cover art
- **Smart Matching**: Advanced algorithm to find the best matches on Spotify
- **Large Playlist Support**: Can handle up to 10,000 tracks
- **Progress Tracking**: See detailed progress as your music transfers
- **Missing Tracks Report**: Get a detailed report of any songs that couldn't be found



For more information, visit our [website](https://netify-five.vercel.app/).
