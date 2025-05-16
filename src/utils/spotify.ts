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
    // In dev people often open the site via 127.0.0.1 even though only
    // http://localhost:3000/callback is whitelisted in the Spotify Dashboard.
    // Unify both forms so the redirect_uri always matches the allowed value.
    const origin = window.location.origin.replace('127.0.0.1', 'localhost');
    return origin;
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
export async function exchangeCodeForToken(code: string): Promise<string> {
  const verifier = localStorage.getItem('code_verifier') || sessionStorage.getItem('code_verifier');
  if (!verifier) {
    console.error('No code verifier found in localStorage or sessionStorage');
    throw new Error('No code verifier found');
  }

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID!,
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${getRedirectUri()}/callback`,
    code_verifier: verifier,
  });

  console.log('Exchanging code for token with params:', {
    client_id: SPOTIFY_CLIENT_ID,
    redirect_uri: `${getRedirectUri()}/callback`,
    code_length: code.length,
    verifier_length: verifier.length
  });

  try {
    const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Token exchange error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(`Failed to exchange code for token: ${data.error_description || data.error || 'Unknown error'}`);
    }

    // Clear the code verifier after successful exchange
    localStorage.removeItem('code_verifier');
    sessionStorage.removeItem('code_verifier');
    
    return data.access_token;
  } catch (error) {
    console.error('Token exchange request failed:', error);
    throw error;
  }
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