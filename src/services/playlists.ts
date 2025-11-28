import axios from '../axios';
import { invidiousHomeService } from './invidiousHome';

// Interfaces
import type { Track } from '../interfaces/track';
import type { Playlist, PlaylistItem } from '../interfaces/playlists';
import type { Pagination, PaginationQueryParams } from '../interfaces/api';

/**
 * @description Get a playlist owned by a Spotify user.
 * @param playlistId The Spotify ID for the playlist.
 */
const getPlaylist = async (playlistId: string) => {
    return axios.get<Playlist>(`/playlists/${playlistId}`);
};

interface GetPlaylistItemsParams extends PaginationQueryParams {
    fields?: string;
}

/**
 * @description Get full details of the items of a playlist owned by a Spotify user.
 */
const getPlaylistItems = async (
    playlistId: string,
    params: GetPlaylistItemsParams = { limit: 50 }
) => {
    return axios.get<Pagination<PlaylistItem>>(`/playlists/${playlistId}/tracks`, { params });
};

/**
 * @description Get a list of the playlists owned or followed by the current Spotify user.
 */
const getMyPlaylists = async (params: PaginationQueryParams = {}) => {
    // Return empty for now - would need localStorage implementation
    return {
        data: {
            href: '',
            items: [],
            limit: params.limit || 20,
            next: '',
            offset: params.offset || 0,
            previous: '',
            total: 0,
        }
    };
};

interface GetFeaturedPlaylistsParams extends PaginationQueryParams {
    locale?: string;
}

/**
 * @description Get a list of featured playlists using Invidious
 */
const getFeaturedPlaylists = async (params: GetFeaturedPlaylistsParams = {}) => {
    // Use Invidious to get popular playlists instead  
    const playlists = await invidiousHomeService.getPopularPlaylists(params.limit || 10);
    return {
        data: {
            playlists
        }
    };
};

/**
 * @description Add one or more items to a user's playlist.
 */
const addPlaylistItems = async (playlistId: string, uris: string[], snapshot_id: string) => {
    return axios.post(`/playlists/${playlistId}/tracks`, {
        uris,
        snapshot_id,
    });
};

/**
 * @description Remove one or more items from a user's playlist.
 */
const removePlaylistItems = async (playlistId: string, uris: string[], snapshot_id: string) => {
    return axios.delete(`/playlists/${playlistId}/tracks`, {
        data: {
            tracks: uris.map((uri) => ({ uri })),
            snapshot_id,
        },
    });
};

/**
 * @description Either reorder or replace items in a playlist depending on the request's parameters.
 */
const reorderPlaylistItems = async (
    playlistId: string,
    uris: string[],
    rangeStart: number,
    insertBefore: number,
    rangeLength: number,
    snapshotId: string
) => {
    return axios.put(
        `/playlists/${playlistId}/tracks`,
        {
            range_start: rangeStart,
            insert_before: insertBefore,
            range_length: rangeLength,
            snapshot_id: snapshotId,
        },
        { params: { uris } }
    );
};

/**
 * @description Change a playlist's name and public/private state.
 */
const changePlaylistDetails = async (
    playlistId: string,
    data: {
        name?: string;
        public?: boolean;
        collaborative?: boolean;
        description?: string;
    }
) => {
    return axios.put(`/playlists/${playlistId}`, data);
};

/**
 * @description Replace the image used to represent a specific playlist.
 */
const changePlaylistImage = async (playlistId: string, image: string, content: string) => {
    return axios.put(`/playlists/${playlistId}/images`, image, {
        headers: { 'Content-Type': content },
    });
};

/**
 * @description Create a playlist for a Spotify user.
 */
const createPlaylist = async (
    userId: string,
    data: {
        name: string;
        public?: boolean;
        collaborative?: boolean;
        description?: string;
    }
) => {
    return axios.post<Playlist>(`/users/${userId}/playlists`, data);
};

/**
 * @description Recommendations are generated based on the available information for a given seed entity.
 */
const getRecommendations = async (params: {
    seed_artists?: string;
    seed_genres?: string;
    limit?: number;
    seed_tracks?: string;
}) => {
    return axios.get<{ tracks: Track[] }>('/recommendations', { params });
};

/**
 * @description Get a list of the playlists owned or followed by a Spotify user.
 */
const getPlaylists = async (
    userId: string,
    params: {
        limit?: number;
        offset?: number;
    }
) => {
    return axios.get<Pagination<Playlist>>(`/users/${userId}/playlists`, { params });
};

export const playlistService = {
    getPlaylist,
    getPlaylists,
    getMyPlaylists,
    createPlaylist,
    getPlaylistItems,
    addPlaylistItems,
    getRecommendations,
    changePlaylistImage,
    removePlaylistItems,
    getFeaturedPlaylists,
    reorderPlaylistItems,
    changePlaylistDetails,
};
