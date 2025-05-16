'use client';

import { TransferProvider } from '@/contexts/TransferContext';
import AlbumForm from '@/components/AlbumForm';
import ProgressBar from '@/components/ProgressBar';
import Results from '@/components/Results';
import PlaylistPreview from '@/components/PlaylistPreview';
import SocialLinks from '@/components/SocialLinks';

export default function TransferPage() {
  return (
    <TransferProvider>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <img src="/netify.jpg" alt="Netify Logo" className="h-24 w-auto mb-4 mx-auto rounded-lg shadow" />
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold font-serif mb-2">Transfer Your Playlist</h1>
            <p className="text-sm text-gray-600">Paste a NetEase playlist link below and watch the magic ✨</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6 flex flex-col gap-4">
            <SocialLinks />
            <AlbumForm />
            <PlaylistPreview />
            <ProgressBar />
            <Results />
          </div>
        </div>
      </main>
    </TransferProvider>
  );
} 