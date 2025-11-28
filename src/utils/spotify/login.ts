import { getFromLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../localstorage';

// Since we're using Invidious instead of Spotify, we don't need actual authentication
// We'll simulate a successful login for demo purposes

const client_id = process.env.REACT_APP_SPOTIFY_CLIENT_ID as string;
const redirect_uri = process.env.REACT_APP_SPOTIFY_REDIRECT_URL as string;

// Simplified login for Invidious - no actual authentication needed
const logInWithSpotify = async (anonymous?: boolean) => {
  // In demo mode, we don't redirect to Spotify
  console.log('Invidious mode: Skipping Spotify authentication');
  return Promise.resolve();
};

// Since we're not using Spotify, we don't need to request tokens
const requestToken = async (code: string) => {
  // Return a dummy token for demo purposes
  return Promise.resolve('invidious_demo_token');
};

// Simplified token retrieval for Invidious
const getToken = async () => {
  // Check for existing token
  const token = getFromLocalStorageWithExpiry('access_token');
  if (token) return [token, true];

  // For Invidious, we don't need actual tokens
  // Return dummy values to indicate we're in demo mode
  return [null, false];
};

// Simplified refresh token for Invidious
export const getRefreshToken = async () => {
  // For Invidious, we don't need token refresh
  console.log('Invidious mode: Skipping token refresh');
  return Promise.resolve('invidious_demo_token');
};

export default { logInWithSpotify, getToken, getRefreshToken };