'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSpotify } from '@/contexts/SpotifyContext';

export default function Callback() {
  const router = useRouter();
  const { login } = useSpotify();
  const hasHandledRef = useRef(false);

  useEffect(() => {
    // Prevent running twice in React Strict Mode or due to re-renders
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;

    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        console.log('Callback received:', { code, error, state });

        if (error) {
          console.error('Authorization error:', error);
          router.push('/?error=' + encodeURIComponent(error));
          return;
        }

        if (!code) {
          console.error('No authorization code found in URL:', window.location.href);
          router.push('/?error=no_code');
          return;
        }

        console.log('LocalStorage code_verifier on callback:', localStorage.getItem('code_verifier'));

        // Exchange the code for an access token
        await login(code);
        
        // Redirect back to the home page
        router.push('/transfer');
      } catch (error) {
        console.error('Failed to handle callback:', error);
        router.push('/?error=callback_failed');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Completing login...
        </h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    </div>
  );
} 