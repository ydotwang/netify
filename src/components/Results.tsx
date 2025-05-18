import { FaSpotify, FaExclamationTriangle, FaCheck, FaMusic, FaLayerGroup } from 'react-icons/fa';
import { useTransfer } from '@/contexts/TransferContext';
import { useState } from 'react';

// Update the TransferResult type to include the new fields
type TransferResult = {
  success: boolean;
  message: string;
  playlistUrl?: string;
  playlistName?: string;
  albumArt?: string;
  tracks?: {
    name: string;
    artist: string;
    status: 'success' | 'failed';
  }[];
  totalFound?: number;
  totalTransferred?: number;
  batchDetails?: string;
};

const Results = () => {
  const { result } = useTransfer();
  const [showBatchDetails, setShowBatchDetails] = useState(false);

  if (!result) {
    return null;
  }

  const successCount = result.tracks?.filter((t) => t.status === 'success').length ?? 0;
  const failedCount = result.tracks?.filter((t) => t.status === 'failed').length ?? 0;
  
  // Use the new fields if available
  const totalTransferred = result.totalTransferred || successCount;
  const totalFound = result.totalFound || (result.tracks?.length || 0);
  
  // Calculate if we're showing partial results (for large playlists)
  const isPartialDisplay = (result.tracks?.length || 0) < totalFound;

  return (
    <div className="mt-6 relative">
      <div
        className={`p-5 rounded-xl ${
          result.success
            ? 'bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-700'
            : 'bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-700'
        }`}
      >
        {/* Add decorative sparkles for success */}
        {result.success && (
          <>
            <div className="sparkle absolute -top-2 -right-2 text-sm">✨</div>
            <div className="sparkle absolute -bottom-1 -left-1 text-sm" style={{ animationDelay: '0.4s' }}>✨</div>
          </>
        )}
        
        <div className="flex">
          <div className="flex-shrink-0">
            {result.success ? (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <FaCheck className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <FaExclamationTriangle className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-base font-medium text-white">{result.message}</p>
            
            {/* Display detailed counts for large playlists */}
            {isPartialDisplay && (
              <p className="text-sm text-green-300 mt-1">
                {totalTransferred} of {totalFound} total tracks were transferred to Spotify
                {totalFound > 1000 && (
                  <span className="ml-1 text-xs bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">
                    Showing preview of first {result.tracks?.length} tracks
                  </span>
                )}
              </p>
            )}
            
            {result.playlistUrl && (
              <div className="mt-3">
                <a
                  href={result.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-colors duration-200 rounded-lg text-white font-medium shine"
                >
                  <FaSpotify className="text-xl" />
                  Open playlist in Spotify →
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Batch details toggle */}
        {result.batchDetails && (
          <div className="mt-3 pt-3 border-t border-green-700/50">
            <button 
              onClick={() => setShowBatchDetails(!showBatchDetails)}
              className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors"
            >
              <FaLayerGroup size={12} />
              {showBatchDetails ? 'Hide' : 'Show'} processing details
            </button>
            
            {showBatchDetails && (
              <div className="mt-2 text-xs text-green-300 bg-green-900/30 p-2 rounded-lg">
                {result.batchDetails}
                {totalFound > 1000 && (
                  <p className="mt-1 text-yellow-300">
                    Note: NetEase API only returns a preview of tracks in the UI, but all {totalFound} tracks were processed.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {result.tracks && result.tracks.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center mb-3">
            <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              {result.playlistName}
            </h3>
            <div className="ml-3 flex items-center">
              <FaMusic className="text-indigo-400 float" />
            </div>
          </div>
          
          <p className="text-sm text-gray-400 mt-1 mb-3">
            {isPartialDisplay ? (
              <span>
                Showing {successCount + failedCount} of {totalFound} total tracks - 
                <span className="text-green-400 font-medium">{totalTransferred}</span> transferred
                {failedCount > 0 && <span> (<span className="text-red-400 font-medium">{failedCount}</span> not found)</span>}
              </span>
            ) : (
              <span>
                <span className="text-green-400 font-medium">{totalTransferred}</span> of {totalFound} tracks transferred successfully
                {failedCount > 0 && (
                  <span> (<span className="text-red-400 font-medium">{failedCount}</span> not found on Spotify)</span>
                )}
              </span>
            )}
          </p>
          
          <img 
            src="/divider1.png" 
            alt="" 
            className="h-2 w-full object-contain opacity-40 mx-auto mb-3"
          />
          
          <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            <ul className="space-y-2">
              {result.tracks.map((track, index) => (
                <li
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg backdrop-blur-sm ${
                    track.status === 'failed' 
                      ? 'bg-red-900/20 border border-red-800/50' 
                      : 'bg-gray-800/40 border border-gray-700/50 hover:bg-gray-700/40 transition-colors'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-200">{track.name}</p>
                    <p className="text-sm text-gray-400">
                      {track.artist}
                    </p>
                  </div>
                  {track.status === 'success' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 border border-green-800 text-green-300">
                      <FaCheck className="mr-1" size={10} />
                      Added
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 border border-red-800 text-red-300">
                      <FaExclamationTriangle size={10} />
                      Not Found
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
};

export default Results; 