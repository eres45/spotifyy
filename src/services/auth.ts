// Auth service for Invidious - simplified since we don't need Spotify authentication
import type { User } from '../interfaces/user';

// Since we're using Invidious and not Spotify, we don't need to fetch user data from an API
// We'll just return the demo user data that's already defined in the auth slice
const fetchUser = async () => {
  // This will be handled by the auth slice demo mode
  return Promise.resolve({
    data: {
      id: 'demo_user',
      display_name: 'Demo User',
      email: 'demo@example.com',
      images: [
        {
          url: '',
          height: 0,
          width: 0,
        },
        {
          url: '',
          height: 0,
          width: 0,
        },
      ],
      country: 'US',
      product: 'premium',
      followers: {
        href: null,
        total: 0,
      },
      type: 'user',
      uri: 'spotify:user:demo_user',
      external_urls: {
        spotify: 'https://music.youtube.com/user/demo_user',
      },
      href: 'https://music.youtube.com/user/demo_user',
    }
  });
};

export const authService = {
  fetchUser,
};