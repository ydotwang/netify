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
      <main className="min-h-screen flex flex-col items-center bg-gray-900 px-4 justify-start pt-12 sm:justify-center sm:pt-0 pb-24 sm:pb-0">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 flex flex-col items-center">
            <img src="/netify.jpg" alt="Netify Logo" className="h-24 w-auto mb-4 rounded-lg shadow" />
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-2 max-w-[90vw]">
              <img src="/netease.png" alt="NetEase" className="h-14 w-14 sm:h-14 sm:w-14 object-contain flex-shrink-0" />
              <h1 className="text-xl sm:text-4xl font-bold font-serif text-white whitespace-nowrap">
                NetEase → Spotify
              </h1>
              <FaSpotify className="text-green-500 text-6xl sm:text-[100px] flex-shrink-0" />
            </div>
            <p className="text-lg text-gray-200">Transfer your favorite playlists from NetEase Cloud Music</p>
          </div>

          {/* Login */}
          <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="cursor-pointer text-gray-900"><SpotifyLoginButton /></div>

          </div>


        </div>
      </main>
    </TransferProvider>
  );
}
