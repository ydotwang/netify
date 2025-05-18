import { useState, useEffect, useRef } from 'react';
import { useSpotify } from '@/contexts/SpotifyContext';
import { useTransfer } from '@/contexts/TransferContext';

// Update this to use the Fly.io API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
const TRANSFER_TIMEOUT = 1800000; // 30 minutes timeout for large playlists

interface BatchResult {
  batch_number: number;
  total_tracks: number;
  matched_tracks: number;
  success_rate: number;
}

const AlbumForm = () => {
  const [albumUrl, setAlbumUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const { isAuthenticated, accessToken, logout } = useSpotify();
  const { 
    setResult, 
    setProgress, 
    setPreview, 
    setCurrentBatch, 
    setTotalBatches 
  } = useTransfer();
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Clean up any running timers when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !accessToken) {
      return;
    }

    setIsLoading(true);
    setResult(null);
    setProgress(0);
    setTransferMessage(null);
    setCurrentBatch(0);
    setTotalBatches(0);
    setShowRecoveryPrompt(false);

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
      const totalTracksCount = infoData.total_tracks_count || trackCount;
      
      console.log(`Playlist info received: ${trackCount} tracks displayed, ${totalTracksCount} total tracks`);
      
      // Estimate number of batches
      const estimatedBatches = Math.ceil(totalTracksCount / 300);
      setTotalBatches(estimatedBatches);
      
      if (totalTracksCount > trackCount) {
        setTransferMessage(`This playlist has ${totalTracksCount.toLocaleString()} tracks and will be processed in ${estimatedBatches} batches. This may take 15-30 minutes. Please keep this page open.`);
      } else if (trackCount > 2000) {
        setTransferMessage(`This is a very large playlist with ${trackCount.toLocaleString()} tracks. Transfer may take 5-10 minutes. Please keep this page open.`);
      } else if (trackCount > 1000) {
        setTransferMessage(`This is a large playlist with ${trackCount.toLocaleString()} tracks. Transfer may take 3-5 minutes. Please keep this page open.`);
      } else {
        setTransferMessage(`Found ${trackCount.toLocaleString()} tracks in playlist. Starting transfer...`);
      }

      setPreview({
        title: infoData.playlist_title,
        coverUrl: infoData.cover_url,
        tracks: infoData.tracks,
        totalTracksCount: totalTracksCount
      });
      setProgress(5);

      // 2️⃣ Trigger transfer on backend
      setTransferMessage("Finding and matching tracks with Spotify catalog...");
      let coverPayload: string | undefined = undefined;
      if (coverFile) {
        // convert to base64 data URL
        const data = await coverFile.arrayBuffer();
        coverPayload = `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(data)))}`;
      } else if (coverUrl) {
        coverPayload = coverUrl;
      }

      setProgress(10);

      // Set a longer timeout for the fetch request for large playlists
      abortControllerRef.current = new AbortController();
      
      // Set timeout with recovery prompt
      timeoutIdRef.current = window.setTimeout(() => {
        setTransferMessage("The operation is taking longer than expected. The server may still be processing your request in the background.");
        setShowRecoveryPrompt(true);
        // Don't abort automatically - let the user decide
      }, TRANSFER_TIMEOUT);

      try {
        setTransferMessage("Processing all tracks. This may take several minutes for large playlists...");
        setCurrentBatch(1);
        
        // For large playlists, update progress periodically to show it's still working
        // Calculate progress increment per batch 
        // Allow 75% of progress bar for batches (10% to 85%)
        const progressPerBatch = estimatedBatches > 0 ? 75 / estimatedBatches : 75;
        let batchStartProgress = 10;
        
        if (totalTracksCount > 500) {
          let currentBatchNumber = 1;
          let batchProgress = 0;
          const maxBatchProgress = 100; // Progress within a batch goes from 0-100%
          
          progressIntervalRef.current = window.setInterval(() => {
            // Update the batch progress
            batchProgress += 5; // Increment by 5% within current batch
            if (batchProgress > maxBatchProgress) {
              // Move to next batch
              batchProgress = 0;
              currentBatchNumber++;
              setCurrentBatch(currentBatchNumber);
              batchStartProgress += progressPerBatch;
              
              // Update the message for the new batch
              if (currentBatchNumber <= estimatedBatches) {
                setTransferMessage(`Processing batch ${currentBatchNumber} of ${estimatedBatches}... (${Math.floor(batchStartProgress)}% overall)`);
              }
            }
            
            // Calculate overall progress
            const overallProgress = Math.min(
              Math.floor(batchStartProgress + (progressPerBatch * batchProgress / maxBatchProgress)), 
              85
            );
            setProgress(overallProgress);
            
          }, totalTracksCount > 1500 ? 5000 : 3000); // Update interval based on playlist size
        }

        const transferRes = await fetch(`${BACKEND_URL}/api/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanUrl, spotify_token: accessToken, custom_name: customName || undefined, cover_url: coverPayload }),
          signal: abortControllerRef.current.signal
        });

        // Clear the timeout and interval
        if (timeoutIdRef.current !== null) {
          window.clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
        if (progressIntervalRef.current !== null) {
          window.clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }

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

        // Progress to 90% - waiting for cover image upload
        setProgress(90);
        setTransferMessage("Finalizing and setting cover image...");

        // Calculate success rate
        const totalTransferred = transferData.total_transferred || 0;
        const totalTracks = transferData.total_tracks || 0;
        const successRate = totalTracks > 0 ? Math.round((totalTransferred / totalTracks) * 100) : 0;
        
        // Process batch results
        const batchResults = transferData.batch_results || [];
        const completedBatches = transferData.completed_batches || 0;
        const totalBatches = transferData.processed_batches || 1;
        
        let batchesInfo = `Processed in ${completedBatches} of ${totalBatches} batches`;
        if (completedBatches < totalBatches) {
          batchesInfo += ` (${totalBatches - completedBatches} batches were not fully processed)`;
        }
        
        // Generate batch details
        const batchDetails = batchResults.map((batch: BatchResult) => 
          `Batch ${batch.batch_number}: ${batch.matched_tracks}/${batch.total_tracks} tracks (${batch.success_rate}%)`
        ).join(', ');
        
        // Build track status list using missing array
        // Note: For large playlists, the frontend only has a subset of the tracks, but the backend processed all of them
        // So we need to only map the tracks we have locally, while using the full counts from the backend
        const missingSet = new Set<string>(transferData.missing ?? []);
        let tracksWithStatus: { name: string; artist: string; status: 'success' | 'failed' }[] = [];
        
        // Only map the tracks we have, which may be a subset for large playlists
        if (infoData.tracks && infoData.tracks.length > 0) {
          tracksWithStatus = (infoData.tracks as { name: string; artist: string }[]).map((t) => ({
            name: t.name,
            artist: t.artist,
            status: missingSet.has(t.name) ? ('failed' as const) : ('success' as const),
          }));
        }
        
        setResult({
          success: true,
          message: `Playlist transferred successfully! (${successRate}% success rate) ${batchesInfo}`,
          playlistUrl: transferData.playlist_url,
          playlistName: infoData.playlist_title,
          albumArt: infoData.cover_url,
          tracks: tracksWithStatus,
          totalFound: totalTracks,
          totalTransferred,
          batchDetails: batchDetails
        });
        setProgress(100);
        setTransferMessage(null);
      } catch (abortError: any) {
        if (abortError.name === 'AbortError') {
          throw new Error('The transfer request timed out. Your playlist may be too large or the server might be under high load. You can try again with a smaller playlist or at a different time.');
        }
        throw abortError;
      }
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
      setCurrentBatch(0); // Reset current batch
      // Make sure to clean up any lingering timers
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  // Function to handle aborting the request
  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setTransferMessage("Operation canceled by user.");
    setIsLoading(false);
    setShowRecoveryPrompt(false);
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
          {isLoading && !showRecoveryPrompt && (
            <div className="equalizer mt-2 mx-auto">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          )}
          
          {/* Recovery prompt for timeouts */}
          {showRecoveryPrompt && (
            <div className="mt-3">
              <p className="text-yellow-300 mb-2">
                Your transfer request has been running for a long time. You can:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAbort}
                  className="px-3 py-1 text-xs bg-red-700 hover:bg-red-800 text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecoveryPrompt(false)}
                  className="px-3 py-1 text-xs bg-indigo-700 hover:bg-indigo-800 text-white rounded-md"
                >
                  Keep waiting
                </button>
              </div>
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