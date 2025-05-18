import { useTransfer } from '@/contexts/TransferContext';

const PlaylistPreview = () => {
  const { preview } = useTransfer();
  if (!preview) return null;

  // Format track count with commas
  const formattedTrackCount = preview.tracks.length.toLocaleString();
  
  // ALWAYS use totalTracksCount if available, not just when it's larger
  const totalTracksCount = preview.totalTracksCount || preview.tracks.length;
  const formattedTotalCount = totalTracksCount.toLocaleString();
  
  // Show special message when total tracks > displayed tracks
  const isLargePlaylist = totalTracksCount > 1000;

  return (
    <div className="flex items-center gap-4 mb-4">
      {preview.coverUrl && (
        <img src={preview.coverUrl} alt={preview.title} className="w-24 h-24 rounded shadow-md" />
      )}
      <div>
        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          {preview.title}
        </h3>
        <p className="text-sm text-gray-400">
          Processing {formattedTotalCount} tracks
          {isLargePlaylist && (
            <span className="ml-1 text-xs bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded">Large playlist</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default PlaylistPreview; 