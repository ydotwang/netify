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
      <main className="min-h-screen flex flex-col items-center bg-gray-900 px-4 justify-start pt-12 sm:justify-center sm:pt-0 pb-15 sm:pb-0">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 flex flex-col items-center">
            <img src="/netify.jpg" alt="Netify Logo" className="h-24 w-auto mb-4 rounded-lg shadow" />
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-4 mb-2 max-w-[90vw]">
              <img src="/netease.png" alt="NetEase" className="h-14 w-14 sm:h-14 sm:w-14 object-contain flex-shrink-0" />
              <h1 className="text-xl sm:text-4xl font-bold font-serif text-white whitespace-nowrap">
                NetEase → Spotify
              </h1>
              <FaSpotify className="text-green-500 text-4xl sm:text-5xl flex-shrink-0" />
            </div>
            <p className="text-lg text-gray-200">Transfer your favorite playlists from NetEase Cloud Music ✨✨✨</p>
          </div>

          {/* Login */}
          <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="cursor-pointer text-gray-900"><SpotifyLoginButton /></div>
            <p className="text-center mt-4 bg-yellow-50 border shadow-md border-yellow-50 text-yellow-400 text-sm sm:text-base px-3 py-2 rounded-md shadow space-y-1">
              <span className="font-semibold">Access required:</span>
              &nbsp;this app can be used only after Oliver grants permission after you provide your Spotify email account.<br/>
              <a href="mailto:oliverdotwang@gmail.com" className="underline font-medium text-yellow-500 hover:text-black-900">Request access</a>
              <span className="block text-xs sm:text-sm text-yellow-500 select-all">&nbsp;oliverdotwang@gmail.com</span>
            </p>
          </div>
        </div>
      </main>
    </TransferProvider>
  );
}
