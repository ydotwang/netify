import { FaSpotify, FaSignOutAlt } from 'react-icons/fa';
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
      <div className="space-y-4 flex flex-col items-center w-full">
        <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700 w-full">
          {user.images[0] && (
            <img
              src={user.images[0].url}
              alt={user.display_name}
              className="w-12 h-12 rounded-full border-2 border-green-500"
            />
          )}
          <div className="flex-1">
            <p className="text-gray-300 font-medium">
              Logged in as
            </p>
            <p className="text-white font-bold">
              {user.display_name}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-base font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
        >
          <FaSignOutAlt className="text-white" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col items-center w-full">
      <p className="text-center text-gray-300 px-3 py-2 bg-gray-800/50 rounded-xl border border-gray-700 w-full">
        Please log in with Spotify to transfer your music
      </p>
      <button
        onClick={handleLogin}
        className="flex justify-center items-center gap-2 py-3 px-6 w-full rounded-xl text-base font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
      >
        <FaSpotify className="text-xl" />
        Log in with Spotify
      </button>
    </div>
  );
};

export default SpotifyLoginButton; 