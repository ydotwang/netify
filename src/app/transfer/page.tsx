'use client';

import { TransferProvider } from '@/contexts/TransferContext';
import AlbumForm from '@/components/AlbumForm';
import ProgressBar from '@/components/ProgressBar';
import Results from '@/components/Results';
import PlaylistPreview from '@/components/PlaylistPreview';
import SocialLinks from '@/components/SocialLinks';
import { FaCompactDisc, FaHeadphones, FaMusic } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export default function TransferPage() {
  const [showSparkle, setShowSparkle] = useState(false);

  useEffect(() => {
    setShowSparkle(true);
  }, []);

  return (
    <TransferProvider>
      <main className="min-h-screen overflow-hidden relative flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 justify-start pt-12 sm:justify-center sm:pt-0 pb-28 sm:pb-10">
        {/* Background accents */}
        <img 
          src="/backgroundAccent2.png" 
          alt="" 
          className="absolute top-0 left-0 w-full h-full object-cover opacity-15 mix-blend-overlay"
        />
        <img 
          src="/backgroundAccent1.png" 
          alt="" 
          className="absolute top-0 left-0 w-full h-full object-cover opacity-10 mix-blend-overlay rotate-180 wave"
        />
        
        {/* Decorative stickers */}
        <img 
          src="/sticker3.png" 
          alt="Music Sticker" 
          className="absolute top-20 right-5 sm:right-20 w-24 h-24 md:w-32 md:h-32 opacity-70 rotate-[10deg] float"
          style={{ animationDelay: '0.5s' }}
        />
        <img 
          src="/sticker2.png" 
          alt="Music Sticker" 
          className="absolute bottom-10 right-10 w-28 h-28 md:w-40 md:h-40 opacity-70 rotate-[10deg] hidden sm:block float"
          style={{ animationDelay: '1s' }}
        />
        <img 
          src="/sticker1.png" 
          alt="Music Sticker" 
          className="absolute bottom-5 sm:bottom-20 left-5 sm:left-20 w-24 h-24 md:w-32 md:h-32 opacity-70 rotate-[-10deg] float"
          style={{ animationDelay: '0.8s' }}
        />
        <img 
          src="/stickers.png" 
          alt="Music Sticker" 
          className="absolute top-1/3 left-10 transform w-16 h-16 opacity-50 rotate-[5deg] hidden lg:block float"
          style={{ animationDelay: '1.2s' }}
        />
        
        
        <div className="w-full max-w-lg z-10 relative">
          <div className="relative flex flex-col items-center">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 opacity-70 blur-xl"></div>
            <img src="/netify.jpg" alt="Netify Logo" className="h-20 w-auto mb-4 mx-auto rounded-full shadow-xl border-4 border-indigo-600 z-10 shine" />

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
            <img 
              src="/divider1.png" 
              alt="" 
              className="h-3 w-64 object-contain opacity-60 mx-auto mt-2"
            />
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-gray-700 shadow-2xl rounded-2xl p-6 flex flex-col gap-6 relative">
            {/* Music equalizer animation */}
            <div className="equalizer absolute -top-4 right-4">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
            
            <div className="rounded-xl bg-gradient-to-r from-indigo-800/30 to-purple-800/30 p-4 border border-gray-700 relative">

              <SocialLinks />
            </div>
            
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-30"></div>
              <div className="relative bg-gray-800 rounded-lg p-4 border border-gray-700">
                <AlbumForm />
              </div>
            </div>
            
            <div className="rounded-lg bg-gray-800/60 p-4 border border-gray-700 relative">
              <img 
                src="/divider2.png" 
                alt="" 
                className="h-3 w-full object-contain opacity-40 mx-auto mb-3"
              />
              <PlaylistPreview />
              <ProgressBar />
              <Results />
            </div>
            
            <div className="music-note-animation w-full relative h-8">
              <FaMusic className="text-indigo-400 text-xl absolute transfer-note-1" />
              <FaMusic className="text-green-400 text-sm absolute transfer-note-2" />
              <FaMusic className="text-purple-400 text-lg absolute transfer-note-3" />
            </div>
          </div>
          
          <div className="text-center mt-6">
            <img 
              src="/divider2.png" 
              alt="" 
              className="h-3 w-32 object-contain opacity-50 mx-auto mb-2"
            />
            <p className="text-sm text-gray-400">
              Made with ❤️ by Oliver Wang | {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </main>
      
      <style jsx global>{`
        .transfer-note-1 {
          bottom: 0;
          left: 20%;
          animation: float 3s ease-in-out infinite;
        }
        .transfer-note-2 {
          bottom: 0;
          left: 50%;
          animation: float 2.5s ease-in-out infinite 0.5s;
        }
        .transfer-note-3 {
          bottom: 0;
          right: 20%;
          animation: float 3.5s ease-in-out infinite 1s;
        }
      `}</style>
    </TransferProvider>
  );
} 