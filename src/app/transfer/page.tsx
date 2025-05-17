'use client';

import { TransferProvider } from '@/contexts/TransferContext';
import AlbumForm from '@/components/AlbumForm';
import ProgressBar from '@/components/ProgressBar';
import Results from '@/components/Results';
import PlaylistPreview from '@/components/PlaylistPreview';
import SocialLinks from '@/components/SocialLinks';
import { FaCompactDisc, FaHeadphones } from 'react-icons/fa';

export default function TransferPage() {
  return (
    <TransferProvider>
      <main className="min-h-screen overflow-hidden relative flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 justify-start pt-12 sm:justify-center sm:pt-0 pb-28 sm:pb-10">
        {/* Decorative stickers */}
        <img 
          src="/sticker3.png" 
          alt="Music Sticker" 
          className="absolute top-20 right-5 sm:right-20 w-24 h-24 md:w-32 md:h-32 opacity-70 rotate-[10deg] animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <img 
          src="/sticker1.png" 
          alt="Music Sticker" 
          className="absolute bottom-5 sm:bottom-20 left-5 sm:left-20 w-24 h-24 md:w-32 md:h-32 opacity-70 rotate-[-10deg] animate-pulse"
          style={{ animationDuration: '7s' }}
        />
        <img 
          src="/stickers.png" 
          alt="Music Sticker" 
          className="absolute top-1/3 left-10 transform w-16 h-16 opacity-50 rotate-[5deg] hidden lg:block animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        
        <div className="w-full max-w-lg z-10 relative">
          <div className="relative flex flex-col items-center">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 opacity-70 blur-xl"></div>
            <img src="/netify.jpg" alt="Netify Logo" className="h-20 w-auto mb-4 mx-auto rounded-full shadow-xl border-4 border-indigo-600 z-10" />
          </div>
          
          <div className="text-center mb-6 relative">
            <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              Transfer Your Playlist
            </h1>
            <div className="flex items-center justify-center gap-3 mb-2">
              <FaHeadphones className="text-indigo-400 text-xl animate-pulse" />
              <p className="text-sm text-gray-300">Paste a NetEase playlist link below</p>
              <FaCompactDisc className="text-purple-400 text-xl animate-spin" style={{ animationDuration: '7s' }} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-gray-700 shadow-2xl rounded-2xl p-6 flex flex-col gap-6">
            <div className="rounded-xl bg-gradient-to-r from-indigo-800/30 to-purple-800/30 p-4 border border-gray-700">
              <SocialLinks />
            </div>
            
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-30"></div>
              <div className="relative bg-gray-800 rounded-lg p-4 border border-gray-700">
                <AlbumForm />
              </div>
            </div>
            
            <div className="rounded-lg bg-gray-800/60 p-4 border border-gray-700">
              <PlaylistPreview />
              <ProgressBar />
              <Results />
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              Made with ❤️ by Oliver Wang | {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </main>
    </TransferProvider>
  );
} 