'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { exchangeCodeForToken, getCurrentUser } from '@/utils/spotify';

interface SpotifyUser {
  id: string;
  display_name: string;
  images: { url: string }[];
}

interface SpotifyContextType {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  accessToken: string | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = async (code: string) => {
    try {
      console.log('Starting login process with code length:', code.length);
      
      const token = await exchangeCodeForToken(code);
      console.log('Successfully obtained access token');
      
      setAccessToken(token);
      setIsAuthenticated(true);

      // Fetch user profile
      const userData = await getCurrentUser(token);
      console.log('Successfully fetched user profile:', userData.display_name);
      
      setUser(userData);
    } catch (error) {
      console.error('Login process failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('code_verifier');
    localStorage.removeItem('code_verifier');
  };

  return (
    <SpotifyContext.Provider
      value={{
        isAuthenticated,
        user,
        accessToken,
        login,
        logout,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
} 