import { FaSpotify, FaExclamationTriangle } from 'react-icons/fa';
import { useTransfer } from '@/contexts/TransferContext';

const Results = () => {
  const { result } = useTransfer();

  if (!result) {
    return null;
  }

  const successCount = result.tracks?.filter((t) => t.status === 'success').length ?? 0;
  const failedCount = result.tracks?.filter((t) => t.status === 'failed').length ?? 0;

  return (
    <div className="mt-6">
      <div
        className={`p-4 rounded-md ${
          result.success
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            {result.success ? (
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{result.message}</p>
            {result.playlistUrl && (
              <div className="mt-2">
                <a
                  href={result.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <FaSpotify />
                  Open playlist in Spotify →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {result.tracks && result.tracks.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900">
            {result.playlistName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {successCount} tracks transferred successfully
            {failedCount > 0 && ` (${failedCount} failed)`}
          </p>
          <ul className="mt-4 space-y-2">
            {result.tracks.map((track, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 rounded-md"
                style={{ backgroundColor: track.status === 'failed' ? 'rgb(254 242 242)' : 'transparent' }}
              >
                <div>
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-gray-600">
                    {track.artist}
                  </p>
                </div>
                {track.status === 'success' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Added
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <FaExclamationTriangle size={12} />
                    Not Found
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Results; 