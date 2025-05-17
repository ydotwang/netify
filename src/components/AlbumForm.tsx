import { useState } from 'react';
import { useSpotify } from '@/contexts/SpotifyContext';
import { useTransfer } from '@/contexts/TransferContext';

// Base path to the FastAPI serverless function (same-origin).
const BACKEND_PREFIX = '/api/app/api';

const AlbumForm = () => {
  const [albumUrl, setAlbumUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { isAuthenticated, accessToken, logout } = useSpotify();
  const { setResult, setProgress, setPreview } = useTransfer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !accessToken) {
      return;
    }

    setIsLoading(true);
    setResult(null);
    setProgress(0);

    try {
      // 1️⃣ Get playlist details from backend
      const infoRes = await fetch(
        `${BACKEND_PREFIX}/playlist-info?url=${encodeURIComponent(albumUrl)}`
      );
      if (!infoRes.ok) {
        throw new Error('Failed to fetch playlist info');
      }
      const infoData = await infoRes.json();

      setPreview({
        title: infoData.playlist_title,
        coverUrl: infoData.cover_url,
        tracks: infoData.tracks,
      });
      setProgress(20);

      // 2️⃣ Trigger transfer on backend
      let coverPayload: string | undefined = undefined;
      if (coverFile) {
        // convert to base64 data URL
        const data = await coverFile.arrayBuffer();
        coverPayload = `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(data)))}`;
      } else if (coverUrl) {
        coverPayload = coverUrl;
      }

      const transferRes = await fetch(`${BACKEND_PREFIX}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: albumUrl, spotify_token: accessToken, custom_name: customName || undefined, cover_url: coverPayload }),
      });

      if (!transferRes.ok) {
        // If the backend says Spotify token invalid, ask user to log in again
        if (transferRes.status === 401) {
          logout();
          throw new Error('Spotify session expired. Please log in again.');
        }
        throw new Error('Transfer failed');
      }

      const transferData = await transferRes.json();

      // 3️⃣ Build track status list using missing array
      const missingSet = new Set<string>(transferData.missing ?? []);
      const tracks = (infoData.tracks as { name: string; artist: string }[]).map((t) => ({
        name: t.name,
        artist: t.artist,
        status: missingSet.has(t.name) ? ('failed' as const) : ('success' as const),
      }));

      setResult({
        success: true,
        message: 'Playlist transferred successfully!',
        playlistUrl: transferData.playlist_url,
        playlistName: infoData.playlist_title,
        albumArt: infoData.cover_url,
        tracks,
      });
      setProgress(100);
    } catch (error) {
      console.error('Failed to transfer playlist:', error);
      const err = (error as Error).message || '';
      setResult({
        success: false,
        message: err.includes('Spotify session expired') ? err : 'Failed to transfer playlist. Please try again.',
      });
      setProgress(null);
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
          className="block text-sm font-medium text-gray-800"
        >
          NetEase Cloud Music Playlist URL 
          <br />
          <div className="text-sm text-gray-500">(copy from share link of your playlist)</div>
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
            className="block w-full rounded-md border-gray-900 text-gray-900 placeholder-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="custom-name" className="block text-sm font-medium text-gray-800 mb-1">Custom playlist name (optional)</label>
        <input id="custom-name" type="text" value={customName} onChange={e=>setCustomName(e.target.value)} className="block w-full rounded-md border-gray-900 text-gray-900 placeholder-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"/>
      </div>

      {/* <div>
        <label htmlFor="cover-url" className="block text-sm font-medium text-gray-800 mb-1">Custom cover image URL (optional)</label>
        <input id="cover-url" type="url" value={coverUrl} onChange={e=>setCoverUrl(e.target.value)} className="block w-full rounded-md border-gray-400 text-gray-900 placeholder-gray-700 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"/>
      </div> */}

      {/* <div>
        <label htmlFor="cover-file" className="block text-sm font-medium text-gray-800 mb-1"> Upload a cover image (optional, JPEG ≤256KB)</label>
        <input id="cover-file" type="file" accept="image/jpeg" onChange={e=>setCoverFile(e.target.files?.[0]||null)} className="block w-full text-sm bg-white border border-gray-900 rounded-md cursor-pointer file:bg-indigo-600 file:text-white file:py-2 file:px-4 file:border-0 hover:file:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" />
      </div> */}

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