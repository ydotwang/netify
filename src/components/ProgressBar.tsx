import { useTransfer } from '@/contexts/TransferContext';

const ProgressBar = () => {
  const { progress } = useTransfer();

  if (progress === null) return null;

  return (
    <div className="mt-6">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              Progress
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-indigo-400">
              {progress}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-700/50 backdrop-blur-sm">
          <div
            style={{ width: `${progress}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap justify-center rounded-full ${
              progress < 30 
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' 
                : progress < 60 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 shine'
            } transition-all duration-500`}
          />
        </div>
        
        {/* Animated equalizer for active progress */}
        {progress > 0 && progress < 100 && (
          <div className="equalizer absolute -bottom-2 right-0" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}>
            <div className="bar bg-indigo-400"></div>
            <div className="bar bg-purple-400"></div>
            <div className="bar bg-indigo-400"></div>
          </div>
        )}
        
        {/* Success sparkles when complete */}
        {progress === 100 && (
          <div className="flex justify-center gap-2 mt-1">
            <div className="sparkle text-xs">✨</div>
            <div className="sparkle text-xs" style={{ animationDelay: '0.3s' }}>✨</div>
            <div className="sparkle text-xs" style={{ animationDelay: '0.6s' }}>✨</div>
          </div>
        )}
      </div>
      
      {/* Add a small spinner animation */}
      <style jsx>{`
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(99, 102, 241, 0.3);
          border-radius: 50%;
          border-top-color: rgba(99, 102, 241, 1);
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar; 