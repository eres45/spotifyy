import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Services
import { querySearch } from '../../services/search';

// Interfaces
import type { Pagination } from '../../interfaces/api';
import type { Track, TrackWithSave } from '../../interfaces/track';
import type { Artist } from '../../interfaces/artist';
import type { Album } from '../../interfaces/albums';
import type { Playlist } from '../../interfaces/playlists';

const initialState: {
  top: any | null;
  loading: boolean;
  section: 'ALL' | 'ARTISTS' | 'TRACKS' | 'ALBUMS' | 'PLAYLISTS';

  songs: TrackWithSave[];
  songsTotal: number;
  songsOffset: number;

  artists: Artist[];
  artistsTotal: number;
  artistsOffset: number;

  albums: Album[];
  albumsTotal: number;
  albumsOffset: number;

  playlists: Playlist[];
  playlistsTotal: number;
  playlistsOffset: number;
} = {
  top: null,
  loading: false,
  section: 'ALL',

  songs: [],
  songsTotal: 0,
  songsOffset: 0,

  artists: [],
  artistsTotal: 0,
  artistsOffset: 0,

  albums: [],
  albumsTotal: 0,
  albumsOffset: 0,

  playlists: [],
  playlistsTotal: 0,
  playlistsOffset: 0,
};

// Search for all types of content
export const fetchSearch = createAsyncThunk(
  'search/fetchSearch',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await querySearch({
        q: query,
        type: 'video,playlist,channel',
        limit: 20,
      });
      
      // For now, we'll just take the first song as top result
      const topResult = response.tracks.items[0] || null;
      
      return {
        top: topResult,
        songs: response.tracks.items,
        artists: response.artists.items,
        albums: response.albums.items,
        playlists: response.playlists.items,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Search for songs (videos)
export const fetchSongs = createAsyncThunk(
  'search/fetchSongs',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await querySearch({
        q: query,
        type: 'video',
        limit: 20,
      });
      
      return {
        songs: response.tracks.items,
        total: response.tracks.total,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Search for more songs (pagination)
export const fetchMoreSongs = createAsyncThunk(
  'search/fetchMoreSongs',
  async (params: { query: string; offset: number }, { getState, rejectWithValue }: any) => {
    try {
      const { query, offset } = params;
      const response = await querySearch({
        q: query,
        type: 'video',
        limit: 20,
        offset: offset,
      });
      
      return {
        songs: response.tracks.items,
        offset,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Search for artists (channels)
export const fetchArtists = createAsyncThunk(
  'search/fetchArtists',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await querySearch({
        q: query,
        type: 'channel',
        limit: 20,
      });
      
      return {
        artists: response.artists.items,
        total: response.artists.total,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Search for albums (we'll use playlists as a substitute)
export const fetchAlbums = createAsyncThunk(
  'search/fetchAlbums',
  async (query: string, { rejectWithValue }) => {
    try {
      // We'll search for playlists that might represent albums
      const response = await querySearch({
        q: query + ' album',
        type: 'playlist',
        limit: 20,
      });
      
      return {
        albums: response.albums.items,
        total: response.albums.total,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Search for playlists
export const fetchPlaylists = createAsyncThunk(
  'search/fetchPlaylists',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await querySearch({
        q: query,
        type: 'playlist',
        limit: 20,
      });
      
      return {
        playlists: response.playlists.items,
        total: response.playlists.total,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSection(
      state,
      action: {
        payload: { section: 'ALL' | 'ARTISTS' | 'TRACKS' | 'ALBUMS' | 'PLAYLISTS' };
      }
    ) {
      state.section = action.payload.section;
    },
    setSavedStateForTrack(
      state,
      action: {
        payload: { id: string; saved: boolean };
      }
    ) {
      // Update the saved state for a specific track
      const { id, saved } = action.payload;
      state.songs = state.songs.map(song => 
        song.id === id ? { ...song, saved } : song
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch search
    builder.addCase(fetchSearch.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchSearch.fulfilled, (state, action) => {
      state.loading = false;
      state.top = action.payload.top;
      state.songs = action.payload.songs;
      state.artists = action.payload.artists;
      state.albums = action.payload.albums;
      state.playlists = action.payload.playlists;
      state.songsTotal = action.payload.songs.length;
      state.artistsTotal = action.payload.artists.length;
      state.albumsTotal = action.payload.albums.length;
      state.playlistsTotal = action.payload.playlists.length;
    });
    builder.addCase(fetchSearch.rejected, (state) => {
      state.loading = false;
    });

    // Fetch songs
    builder.addCase(fetchSongs.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchSongs.fulfilled, (state, action) => {
      state.loading = false;
      state.songs = action.payload.songs;
      state.songsTotal = action.payload.total;
      state.songsOffset = 0;
    });
    builder.addCase(fetchSongs.rejected, (state) => {
      state.loading = false;
    });

    // Fetch more songs
    builder.addCase(fetchMoreSongs.fulfilled, (state, action) => {
      state.songs = [...state.songs, ...action.payload.songs];
      state.songsOffset = action.payload.offset;
    });

    // Fetch artists
    builder.addCase(fetchArtists.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchArtists.fulfilled, (state, action) => {
      state.loading = false;
      state.artists = action.payload.artists;
      state.artistsTotal = action.payload.total;
      state.artistsOffset = 0;
    });
    builder.addCase(fetchArtists.rejected, (state) => {
      state.loading = false;
    });

    // Fetch albums
    builder.addCase(fetchAlbums.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAlbums.fulfilled, (state, action) => {
      state.loading = false;
      state.albums = action.payload.albums;
      state.albumsTotal = action.payload.total;
      state.albumsOffset = 0;
    });
    builder.addCase(fetchAlbums.rejected, (state) => {
      state.loading = false;
    });

    // Fetch playlists
    builder.addCase(fetchPlaylists.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchPlaylists.fulfilled, (state, action) => {
      state.loading = false;
      state.playlists = action.payload.playlists;
      state.playlistsTotal = action.payload.total;
      state.playlistsOffset = 0;
    });
    builder.addCase(fetchPlaylists.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const searchActions = {
  ...searchSlice.actions,
  fetchSearch,
  fetchSongs,
  fetchMoreSongs,
  fetchArtists,
  fetchAlbums,
  fetchPlaylists,
};

export default searchSlice.reducer;