'use client';

import { TransferProvider } from '@/contexts/TransferContext';
import { FaSpotify } from 'react-icons/fa';
import AlbumForm from '@/components/AlbumForm';
import ProgressBar from '@/components/ProgressBar';
import Results from '@/components/Results';
import SpotifyLoginButton from '@/components/SpotifyLoginButton';
import PlaylistPreview from '@/components/PlaylistPreview';
import SocialLinks from '@/components/SocialLinks';

export default function Home() {
  return (
    <TransferProvider>
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 flex flex-col items-center">
            <img src="/netify.jpg" alt="Netify Logo" className="h-24 w-auto mb-4 rounded-lg shadow" />
            <div className="flex items-center justify-center gap-4 mb-2">
              <img src="/netease.png" alt="NetEase" className="h-14 w-14 object-contain" />
              <h1 className="text-4xl font-bold font-serif whitespace-nowrap">NetEase → Spotify</h1>
              <FaSpotify size={100} className="text-green-500" />
            </div>
            <p className="text-lg">Transfer your favorite playlists from NetEase Cloud Music</p>
          </div>

          {/* Login */}
          <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="cursor-pointer"><SpotifyLoginButton /></div>

          </div>


        </div>
      </main>
    </TransferProvider>
  );
}
