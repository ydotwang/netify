import { FaSpotify } from 'react-icons/fa';
import { useSpotify } from '@/contexts/SpotifyContext';
import { generateCodeChallenge, generateAuthUrl } from '@/utils/spotify';

const SpotifyLoginButton = () => {
  const { isAuthenticated, user, login, logout } = useSpotify();

  const handleLogin = async () => {
    try {
      // Generate PKCE challenge
      const { verifier, challenge } = await generateCodeChallenge();
      
      // Store verifier in localStorage for later use (persists across full page navigations)
      localStorage.setItem('code_verifier', verifier);
      
      // Generate and navigate to Spotify authorization URL
      const authUrl = generateAuthUrl(challenge);
      
      // Double check that the verifier was stored
      const storedVerifier = localStorage.getItem('code_verifier');
      if (!storedVerifier) {
        throw new Error('Failed to store code verifier');
      }
      
      // Navigate to Spotify auth page
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to start Spotify login:', error);
      alert('Failed to start Spotify login. Please try again.');
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="space-y-4 flex flex-col items-center">
        <div className="flex items-center justify-center gap-4">
          {user.images[0] && (
            <img
              src={user.images[0].url}
              alt={user.display_name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <p className="text-center text-gray-600">
              Logged in as {user.display_name}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col items-center">
      <p className="text-center text-gray-600">
        Please log in with Spotify to transfer your music
      </p>
      <button
        onClick={handleLogin}
        className="flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-md shadow-md text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
      >
        <FaSpotify />
        Log in with Spotify
      </button>
    </div>
  );
};

export default SpotifyLoginButton; 