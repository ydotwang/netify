import { createContext, useContext, useState, ReactNode } from 'react';

interface Track {
  name: string;
  artist: string;
  status: 'success' | 'failed';
  spotifyUrl?: string;
}

interface TransferResult {
  success: boolean;
  message: string;
  playlistUrl?: string;
  playlistName?: string;
  albumArt?: string;
  tracks?: Track[];
  totalFound?: number;
  totalTransferred?: number;
  batchDetails?: string;
}

interface PreviewData {
  title: string;
  coverUrl: string;
  tracks: Track[];
  totalTracksCount?: number;
}

interface TransferContextType {
  result: TransferResult | null;
  setResult: (result: TransferResult | null) => void;
  progress: number | null;
  setProgress: (value: number | null) => void;
  preview: PreviewData | null;
  setPreview: (value: PreviewData | null) => void;
  currentBatch: number;
  setCurrentBatch: (batch: number) => void;
  totalBatches: number;
  setTotalBatches: (batches: number) => void;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

export function TransferProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<TransferResult | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [totalBatches, setTotalBatches] = useState<number>(0);

  return (
    <TransferContext.Provider value={{ 
      result, 
      setResult, 
      progress, 
      setProgress, 
      preview, 
      setPreview,
      currentBatch,
      setCurrentBatch,
      totalBatches,
      setTotalBatches
    }}>
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  const context = useContext(TransferContext);
  if (context === undefined) {
    throw new Error('useTransfer must be used within a TransferProvider');
  }
  return context;
} 