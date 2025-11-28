import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Utils
import axios from '../../axios';
import login from '../../utils/spotify/login';

// Services
import { authService } from '../../services/auth';

// Interfaces
import type { User } from '../../interfaces/user';
import { getFromLocalStorageWithExpiry } from '../../utils/localstorage';

// Demo user data for when we want to bypass authentication
const demoUser: User = {
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
};

const initialState: { token?: string; playerLoaded: boolean; user?: User; requesting: boolean } = {
  user: undefined,
  requesting: true,
  playerLoaded: false,
  token: getFromLocalStorageWithExpiry('access_token') || undefined,
};

export const loginToSpotify = createAsyncThunk<{ token?: string; loaded: boolean }, boolean>(
  'auth/loginToSpotify',
  async (anonymous, api) => {
    // Check if we're in demo mode (no client ID set)
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    if (!clientId || clientId === 'your_spotify_client_id_here') {
      // Simulate successful login with demo data
      return { token: 'demo_token', loaded: true };
    }

    const userToken: string | undefined = getFromLocalStorageWithExpiry('access_token') as string;
    const anonymousToken: string | undefined = getFromLocalStorageWithExpiry('public_access_token');

    let token = userToken || anonymousToken;

    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      if (userToken) api.dispatch(fetchUser());
      return { token, loaded: false };
    }

    let [requestedToken, requestUser] = await login.getToken();
    if (requestUser) api.dispatch(fetchUser());

    if (!requestedToken) {
      login.logInWithSpotify(anonymous);
    } else {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + requestedToken;
    }

    return { token: requestedToken, loaded: true };
  }
);

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { rejectWithValue }) => {
  // Check if we're in demo mode
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  if (!clientId || clientId === 'your_spotify_client_id_here') {
    // Return demo user data
    return demoUser;
  }

  try {
    const response = await authService.fetchUser();
    return response.data;
  } catch (error) {
    // If there's an error fetching user data, return demo user in demo mode
    if (!clientId || clientId === 'your_spotify_client_id_here') {
      return demoUser;
    }
    return rejectWithValue(error);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRequesting(state, action: PayloadAction<{ requesting: boolean }>) {
      state.requesting = action.payload.requesting;
    },
    setToken(state, action: PayloadAction<{ token?: string }>) {
      state.token = action.payload.token;
    },
    setPlayerLoaded(state, action: PayloadAction<{ playerLoaded: boolean }>) {
      state.playerLoaded = action.payload.playerLoaded;
    },
    // Action to set demo mode
    setDemoMode(state) {
      state.user = demoUser;
      state.token = 'demo_token';
      state.requesting = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginToSpotify.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.requesting = !action.payload.loaded;
      
      // If in demo mode, set the demo user
      const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
      if (!clientId || clientId === 'your_spotify_client_id_here') {
        state.user = demoUser;
      }
    });
    builder.addCase(fetchUser.fulfilled, (state, action) => {
      // Cast action.payload to User type to fix TypeScript error
      state.user = action.payload as User;
      state.requesting = false;
    });
    builder.addCase(fetchUser.rejected, (state, action) => {
      // In demo mode, still show the UI even if user fetch fails
      const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
      if (!clientId || clientId === 'your_spotify_client_id_here') {
        state.user = demoUser;
        state.requesting = false;
      } else {
        state.requesting = false;
      }
    });
  },
});

export const authActions = { ...authSlice.actions, loginToSpotify, fetchUser };

export default authSlice.reducer;