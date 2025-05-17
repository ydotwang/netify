import { useState } from 'react';
import { useSpotify } from '@/contexts/SpotifyContext';
import { useTransfer } from '@/contexts/TransferContext';

// Update this to use the Fly.io API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const AlbumForm = () => {
  const [albumUrl, setAlbumUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { isAuthenticated, accessToken, logout } = useSpotify();
  const { setResult, setProgress, setPreview } = useTransfer();
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !accessToken) {
      return;
    }

    setIsLoading(true);
    setResult(null);
    setProgress(0);
    setTransferMessage(null);

    try {
      // Clean the URL - extract the id parameter if present
      let cleanUrl = albumUrl.trim();
      // Use URL API to properly parse and extract id if possible
      try {
        const urlObj = new URL(cleanUrl);
        const id = urlObj.searchParams.get('id');
        if (id) {
          // Just use the ID directly to avoid encoding issues
          cleanUrl = `https://y.music.163.com/m/playlist?id=${id}`;
        }
      } catch (e) {
        // If URL parsing fails, just use the original URL
        console.warn("Could not parse URL, using as-is");
      }

      console.log("Using playlist URL:", cleanUrl);
      
      // 1️⃣ Get playlist details from backend
      setTransferMessage("Fetching playlist information...");
      const infoRes = await fetch(
        `${BACKEND_URL}/api/playlist-info?url=${encodeURIComponent(cleanUrl)}`
      );
      if (!infoRes.ok) {
        throw new Error('Failed to fetch playlist info');
      }
      const infoData = await infoRes.json();

      // Display a warning for very large playlists
      const trackCount = infoData.tracks?.length || 0;
      if (trackCount > 1000) {
        setTransferMessage(`This is a large playlist with ${trackCount.toLocaleString()} tracks. Transfer may take several minutes.`);
      } else {
        setTransferMessage(`Found ${trackCount.toLocaleString()} tracks in playlist. Starting transfer...`);
      }

      setPreview({
        title: infoData.playlist_title,
        coverUrl: infoData.cover_url,
        tracks: infoData.tracks,
      });
      setProgress(10);

      // 2️⃣ Trigger transfer on backend
      setTransferMessage("Finding and adding tracks to Spotify...");
      let coverPayload: string | undefined = undefined;
      if (coverFile) {
        // convert to base64 data URL
        const data = await coverFile.arrayBuffer();
        coverPayload = `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(data)))}`;
      } else if (coverUrl) {
        coverPayload = coverUrl;
      }

      setProgress(20);

      const transferRes = await fetch(`${BACKEND_URL}/api/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl, spotify_token: accessToken, custom_name: customName || undefined, cover_url: coverPayload }),
      });

      if (!transferRes.ok) {
        // If the backend says Spotify token invalid, ask user to log in again
        if (transferRes.status === 401) {
          logout();
          throw new Error('Spotify session expired. Please log in again.');
        }
        throw new Error(
          transferRes.status === 502 
            ? 'Server error while processing your request. The playlist might be too large or the server is under high load.'
            : 'Transfer failed'
        );
      }

      const transferData = await transferRes.json();

      // Progress to 80% - waiting for cover image upload
      setProgress(80);
      setTransferMessage("Finalizing and setting cover image...");

      // 3️⃣ Build track status list using missing array
      const missingSet = new Set<string>(transferData.missing ?? []);
      const tracks = (infoData.tracks as { name: string; artist: string }[]).map((t) => ({
        name: t.name,
        artist: t.artist,
        status: missingSet.has(t.name) ? ('failed' as const) : ('success' as const),
      }));

      // Calculate success rate
      const totalTransferred = transferData.total_transferred || (tracks.length - missingSet.size);
      const totalTracks = transferData.total_tracks || tracks.length;
      const successRate = totalTracks > 0 ? Math.round((totalTransferred / totalTracks) * 100) : 0;
      
      setResult({
        success: true,
        message: `Playlist transferred successfully! (${successRate}% success rate)`,
        playlistUrl: transferData.playlist_url,
        playlistName: infoData.playlist_title,
        albumArt: infoData.cover_url,
        tracks,
        totalFound: totalTracks,
        totalTransferred,
      });
      setProgress(100);
      setTransferMessage(null);
    } catch (error) {
      console.error('Failed to transfer playlist:', error);
      const err = (error as Error).message || '';
      setResult({
        success: false,
        message: err.includes('Spotify session expired') ? err : `Failed to transfer playlist: ${err}`,
      });
      setProgress(null);
      setTransferMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="album-url"
          className="block text-sm font-medium text-gray-200"
        >
          NetEase Cloud Music Playlist URL 
          <br />
          <div className="text-sm text-gray-400">(copy from share link of your playlist)</div>
        </label>
        <div className="mt-1">
          <input
            type="url"
            name="album-url"
            id="album-url"
            value={albumUrl}
            onChange={(e) => setAlbumUrl(e.target.value)}
            placeholder="https://y.music.163.com/m/playlist?id=..."
            required
            className="block w-full rounded-md border-gray-700 bg-gray-700/50 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="custom-name" className="block text-sm font-medium text-gray-200 mb-1">
          Custom playlist name (optional)
        </label>
        <input 
          id="custom-name" 
          type="text" 
          value={customName} 
          onChange={e=>setCustomName(e.target.value)} 
          className="block w-full rounded-md border-gray-700 bg-gray-700/50 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Enter custom name for your playlist"
        />
      </div>

      {/* <div>
        <label htmlFor="cover-url" className="block text-sm font-medium text-gray-800 mb-1">Custom cover image URL (optional)</label>
        <input id="cover-url" type="url" value={coverUrl} onChange={e=>setCoverUrl(e.target.value)} className="block w-full rounded-md border-gray-400 text-gray-900 placeholder-gray-700 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"/>
      </div> */}

      {/* <div>
        <label htmlFor="cover-file" className="block text-sm font-medium text-gray-800 mb-1"> Upload a cover image (optional, JPEG ≤256KB)</label>
        <input id="cover-file" type="file" accept="image/jpeg" onChange={e=>setCoverFile(e.target.files?.[0]||null)} className="block w-full text-sm bg-white border border-gray-900 rounded-md cursor-pointer file:bg-indigo-600 file:text-white file:py-2 file:px-4 file:border-0 hover:file:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" />
      </div> */}

      {transferMessage && (
        <div className="text-sm py-3 px-4 bg-indigo-900/50 border border-indigo-800 rounded-lg text-indigo-300">
          {transferMessage}
          {isLoading && (
            <div className="equalizer mt-2 mx-auto">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? 'Transferring...' : 'Transfer to Spotify'}
      </button>
    </form>
  );
};

export default AlbumForm; 