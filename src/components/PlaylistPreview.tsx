import { useTransfer } from '@/contexts/TransferContext';

const PlaylistPreview = () => {
  const { preview } = useTransfer();
  if (!preview) return null;

  return (
    <div className="flex items-center gap-4 mb-4">
      {preview.coverUrl && (
        <img src={preview.coverUrl} alt={preview.title} className="w-24 h-24 rounded" />
      )}
      <div>
        <h3 className="text-lg font-semibold">{preview.title}</h3>
        <p className="text-sm text-gray-500">{preview.tracks.length} tracks</p>
      </div>
    </div>
  );
};

export default PlaylistPreview; 