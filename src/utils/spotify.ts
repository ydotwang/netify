// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
// Prefer runtime origin (works in browser during client-side execution) to avoid host mismatch issues like
// localhost vs 127.0.0.1. Fallback to env var when `window` is not defined (SSR) or env explicitly set.
const getRedirectUri = () => {
  const envUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
  if (envUri && envUri.length > 0) {
    return envUri.replace(/\/$/, ''); // remove trailing slash for consistency
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  throw new Error('No redirect URI configured');
};
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_ENDPOINT = 'https://api.spotify.com/v1';

// Generate a random string for PKCE challenge
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Generate code verifier and challenge for PKCE
export async function generateCodeChallenge(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateRandomString(128);
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { verifier, challenge };
}

// Generate Spotify authorization URL
export function generateAuthUrl(challenge: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${getRedirectUri()}/callback`,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: 'user-read-private user-read-email playlist-modify-public playlist-modify-private ugc-image-upload',
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

// Exchange authorization code for access token
import { getBackendUrl } from './backend';

export async function exchangeCodeForToken(code: string): Promise<string> {
  // Pass the code to our backend – backend holds the client secret and does
  // the /api/token call server-side. This avoids CORS issues and works on
  // any device (desktop, mobile, embedded web-view).

  const verifier = localStorage.getItem('code_verifier') || sessionStorage.getItem('code_verifier');
  if (!verifier) {
    console.error('No code verifier found in storage');
  }

  const backendUrl = `${getBackendUrl()}/spotify/token`;

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Backend token exchange error', { status: response.status, data });
    throw new Error(data.detail || 'Failed to exchange code');
  }

  // The backend returns the full token payload. Store refresh_token for later.
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token);
  }

  // Clear verifier once code has been used (good housekeeping)
  localStorage.removeItem('code_verifier');
  sessionStorage.removeItem('code_verifier');

  return data.access_token as string;
}

// Get current user's profile
export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${SPOTIFY_API_ENDPOINT}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
}

// Create a new playlist
export async function createPlaylist(accessToken: string, userId: string, name: string, description: string) {
  const response = await fetch(`${SPOTIFY_API_ENDPOINT}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create playlist');
  }

  return response.json();
}

// Add tracks to a playlist
export async function addTracksToPlaylist(accessToken: string, playlistId: string, trackUris: string[]) {
  const response = await fetch(`${SPOTIFY_API_ENDPOINT}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: trackUris,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to add tracks to playlist');
  }

  return response.json();
} 