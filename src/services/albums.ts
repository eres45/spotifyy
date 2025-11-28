import axios from '../axios';
import { invidiousHomeService } from './invidiousHome';

// Interfaces
import type { Album, AlbumFull } from '../interfaces/albums';
import type { Track } from '../interfaces/track';
import type { Pagination, PaginationQueryParams } from '../interfaces/api';

/**
 * @description Get Spotify catalog information for a single album.
 * @param albumId The Spotify ID for the album.
 */
const fetchAlbum = async (albumId: string) => {
    return axios.get<AlbumFull>(`/albums/${albumId}`);
};

/**
 * @description Get Spotify catalog information for multiple albums identified by their Spotify IDs.
 * @param albumIds A comma-separated list of the Spotify IDs for the albums. Maximum: 20 IDs.
 */
const fetchAlbums = async (albumIds: string[]) => {
    return axios.get<{ albums: AlbumFull[] }>('/albums', {
        params: {
            ids: albumIds.join(','),
        },
    });
};

/**
 * @description Get Spotify catalog information about an album’s tracks. Optional parameters can be used to limit the number of tracks returned.
 * @param albumId The Spotify ID for the album.
 */
const fetchAlbumTracks = async (albumId: string, params: PaginationQueryParams = {}) => {
    return axios.get<Pagination<Track>>(`/albums/${albumId}/tracks`, { params });
};

// Use Invidious trending music instead of Spotify new releases
const fetchNewRelases = async (params: PaginationQueryParams = {}) => {
    const trendingMusic = await invidiousHomeService.getTrendingMusic(params.limit || 20);
    // Convert tracks to albums format expected by the UI
    return {
        data: {
            albums: {
                href: '',
                items: [], // Return empty albums since we're using tracks now
                limit: params.limit || 20,
                next: '',
                offset: params.offset || 0,
                previous: '',
                total: 0,
            }
        }
    };
};

/**
 * @description Get a list of the albums saved in the current Spotify user's 'Your Music' library.
 */
const fetchSavedAlbums = async (params: PaginationQueryParams = {}) => {
    // Return empty for now as we don't have user library persistence yet
    return {
        data: {
            href: '',
            items: [] as any[], // Fix type inference
            limit: params.limit || 20,
            next: '',
            offset: params.offset || 0,
            previous: '',
            total: 0,
        }
    };
};

/**
 * @description Save one or more albums to the current user's 'Your Music' library.
 */
const saveAlbums = async (ids: string[]) => {
    // Mock success
    return { data: {} };
};

/**
 * @description Remove one or more albums from the current user's 'Your Music' library.
 */
const deleteAlbums = async (ids: string[]) => {
    // Mock success
    return { data: {} };
};

export const albumsService = {
    fetchAlbum,
    fetchAlbums,
    fetchAlbumTracks,
    fetchNewRelases,
    fetchSavedAlbums,
    saveAlbums,
    deleteAlbums,
};
