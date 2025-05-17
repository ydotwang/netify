'use client';

import { TransferProvider } from '@/contexts/TransferContext';
import { FaSpotify, FaMusic, FaArrowRight } from 'react-icons/fa';
import SpotifyLoginButton from '@/components/SpotifyLoginButton';
import SocialLinks from '@/components/SocialLinks';
import { useEffect, useState } from 'react';

export default function Home() {
  const [showSparkle, setShowSparkle] = useState(false);

  // Create random sparkles effect
  useEffect(() => {
    setShowSparkle(true);
  }, []);

  return (
    <TransferProvider>
      <main className="min-h-screen overflow-hidden relative flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 justify-start pt-12 sm:justify-center sm:pt-0 pb-15 sm:pb-0">
        {/* Background accents */}
        <img 
          src="/backgroundAccent1.png" 
          alt="" 
          className="absolute top-0 left-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <img 
          src="/backgroundAccent2.png" 
          alt="" 
          className="absolute top-0 left-0 w-full h-full object-cover opacity-10 mix-blend-overlay wave"
        />
        
        {/* Decorative stickers */}
        <img 
          src="/sticker1.png" 
          alt="Music Sticker" 
          className="absolute top-10 left-10 w-28 h-28 md:w-40 md:h-40 opacity-70 rotate-[-15deg] hidden sm:block float"
        />
        <img 
          src="/sticker2.png" 
          alt="Music Sticker" 
          className="absolute bottom-10 right-10 w-28 h-28 md:w-40 md:h-40 opacity-70 rotate-[10deg] hidden sm:block float"
          style={{ animationDelay: '1s' }}
        />
        <img 
          src="/sticker3.png" 
          alt="Music Sticker" 
          className="absolute top-1/2 left-5 transform -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 opacity-60 rotate-[5deg] hidden lg:block float"
          style={{ animationDelay: '0.5s' }}
        />
        <img 
          src="/stickers.png" 
          alt="Music Sticker" 
          className="absolute top-1/4 right-5 w-16 h-16 md:w-24 md:h-24 opacity-60 rotate-[-8deg] hidden lg:block float"
          style={{ animationDelay: '1.5s' }}
        />
        


        <div className="w-full max-w-md z-10 relative">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="relative">
              <img src="/netify.jpg" alt="Netify Logo" className="h-24 w-auto mb-6 shadow-lg border-4 border-indigo-600 shine" />
              {/* <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 shadow-lg border-2 border-white">
                <FaSpotify className="text-white text-lg" />
              </div> */}
            </div>
            
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1 rounded-lg mb-4">
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-4 p-2 bg-gray-900 rounded-md">
                <img src="/netease.png" alt="NetEase" className="h-12 w-12 sm:h-14 sm:w-14 object-contain flex-shrink-0" />
                <FaArrowRight className="text-green-500 text-xl sm:text-2xl flex-shrink-0" />
                <FaSpotify className="text-green-500 text-3xl sm:text-5xl flex-shrink-0" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              NetEase to Spotify
            </h1>
            
            <div className="relative py-4">
              <img 
                src="/divider1.png" 
                alt="" 
                className="h-4 w-64 object-contain opacity-70 mx-auto"
              />
              <p className="text-lg text-gray-300 max-w-sm mt-2">Transfer your favorite playlists from NetEase Cloud Music with a single click ✨</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-lg border border-gray-700 shadow-xl rounded-2xl p-8 flex flex-col items-center gap-6 relative">

            
            <div className="music-note-animation w-full relative h-12 mb-2">
              <FaMusic className="text-indigo-400 text-xl absolute music-note-1" />
              <FaMusic className="text-green-400 text-sm absolute music-note-2" />
              <FaMusic className="text-purple-400 text-lg absolute music-note-3" />
            </div>
            
            <div className="cursor-pointer text-gray-200 w-full">
              <SpotifyLoginButton />
            </div>
            
            <div className="equalizer mx-auto mt-2">
              <div className="bar h-3"></div>
              <div className="bar h-5"></div>
              <div className="bar h-7"></div>
              <div className="bar h-4"></div>
            </div>
            
            <div className="text-center mt-2 bg-gray-800/70 border border-gray-700 text-gray-300 text-sm sm:text-base px-4 py-3 rounded-xl shadow-inner space-y-2">
              <span className="font-semibold text-indigo-400 block">Access required</span>
              <p className="text-sm">This app requires permission from the developer.</p>
              <a href="mailto:oliverdotwang@gmail.com" className="inline-block mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors duration-200 shine">
                Request Access
              </a>
              <span className="block text-xs sm:text-sm text-gray-400 mt-1 select-all">oliverdotwang@gmail.com</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="relative py-4">
              <img 
                src="/divider2.png" 
                alt="" 
                className="h-4 w-48 object-contain opacity-70 mx-auto"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Made with ❤️ by Oliver Wang | {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .music-note-1 {
          top: 30%;
          left: 20%;
          animation: float 3s ease-in-out infinite;
        }
        .music-note-2 {
          top: 50%;
          left: 50%;
          animation: float 2.5s ease-in-out infinite 0.5s;
        }
        .music-note-3 {
          top: 20%;
          left: 70%;
          animation: float 3.5s ease-in-out infinite 1s;
        }
      `}</style>
    </TransferProvider>
  );
}
