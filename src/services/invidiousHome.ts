import invidiousAxios from '../invidiousAxios';
import type { TrackWithSave } from '../interfaces/track';
import type { Playlist } from '../interfaces/playlists';
import type { Artist } from '../interfaces/artist';
import type { Pagination } from '../interfaces/api';

// Interfaces for Invidious trending data
interface InvidiousTrendingVideo {
    type: 'video';
    title: string;
    videoId: string;
    author: string;
    authorId: string;
    videoThumbnails: Array<{
        quality: string;
        url: string;
        width: number;
        height: number;
    }>;
    lengthSeconds: number;
    viewCount: number;
    published: number;
}

/**
 * Convert Invidious video to track format
 */
const convertVideoToTrack = (video: InvidiousTrendingVideo): TrackWithSave => {
    return {
        id: video.videoId,
        name: video.title,
        artists: [{
            id: video.authorId,
            name: video.author,
            type: 'artist',
            uri: `spotify:artist:${video.authorId}`,
            external_urls: {
                spotify: `https://music.youtube.com/channel/${video.authorId}`
            },
            href: `https://music.youtube.com/channel/${video.authorId}`,
        }],
        album: {
            album_type: 'album',
            artists: [{
                id: video.authorId,
                name: video.author,
                type: 'artist',
                uri: `spotify:artist:${video.authorId}`,
                external_urls: {
                    spotify: `https://music.youtube.com/channel/${video.authorId}`
                },
                href: `https://music.youtube.com/channel/${video.authorId}`,
            }],
            available_markets: [],
            external_urls: {
                spotify: `https://music.youtube.com/watch?v=${video.videoId}`
            },
            href: `https://music.youtube.com/watch?v=${video.videoId}`,
            id: `${video.videoId}-album`,
            images: video.videoThumbnails.map(thumb => ({
                url: thumb.url,
                height: thumb.height || 0,
                width: thumb.width || 0,
            })),
            name: video.title,
            release_date: new Date().toISOString().split('T')[0],
            release_date_precision: 'day',
            total_tracks: 1,
            type: 'album',
            uri: `spotify:album:${video.videoId}-album`,
        },
        duration_ms: video.lengthSeconds * 1000,
        popularity: Math.min(100, Math.floor(video.viewCount / 1000000)),
        preview_url: `https://yewtu.be/latest_version?id=${video.videoId}&itag=140`,
        track_number: 1,
        type: 'track',
        uri: `spotify:track:${video.videoId}`,
        external_urls: {
            spotify: `https://music.youtube.com/watch?v=${video.videoId}`
        },
        href: `https://music.youtube.com/watch?v=${video.videoId}`,
        explicit: false,
        available_markets: [],
        disc_number: 1,
        is_local: false,
        external_ids: {
            isrc: ''
        },
        is_playable: true,
        saved: false,
    };
};

/**
 * Get trending music content for home page
 * Uses YouTube Music category trending
 */
const getTrendingMusic = async (limit: number = 20): Promise<Pagination<TrackWithSave>> => {
    try {
        const response = await invidiousAxios.get<any[]>('/api/v1/search', {
            params: {
                q: 'music 2024',
                type: 'video',
                limit,
                sort_by: 'view_count',
            },
        });

        const tracks = response.data
            .filter((item: any) => item.type === 'video')
            .map((video: any) => convertVideoToTrack(video));

        return {
            href: '',
            items: tracks,
            limit,
            next: '',
            offset: 0,
            previous: '',
            total: tracks.length,
        };
    } catch (error) {
        console.error('Error fetching trending music:', error);
        return {
            href: '',
            items: [],
            limit,
            next: '',
            offset: 0,
            previous: '',
            total: 0,
        };
    }
};

/**
 * Get popular music playlists
 */
const getPopularPlaylists = async (limit: number = 10): Promise<Pagination<Playlist>> => {
    try {
        const response = await invidiousAxios.get<any[]>('/api/v1/search', {
            params: {
                q: 'music playlist',
                type: 'playlist',
                limit,
            },
        });

        // Type-cast to satisfy Playlist interface requirements
        const playlists = response.data
            .filter((item: any) => item.type === 'playlist')
            .map((playlist: any) => ({
                collaborative: false,
                description: '',
                external_urls: {
                    spotify: `https://music.youtube.com/playlist?list=${playlist.playlistId}`
                },
                href: `https://music.youtube.com/playlist?list=${playlist.playlistId}`,
                id: playlist.playlistId,
                images: playlist.playlistThumbnail ? [{
                    url: playlist.playlistThumbnail,
                    height: 300,
                    width: 300,
                }] : [],
                followers: {
                    href: '',
                    total: 0,
                },
                name: playlist.title,
                owner: {
                    id: playlist.authorId,
                    display_name: playlist.author,
                    type: 'user' as const,
                    uri: `spotify:user:${playlist.authorId}`,
                    external_urls: {
                        spotify: `https://music.youtube.com/channel/${playlist.authorId}`
                    },
                    href: `https://music.youtube.com/channel/${playlist.authorId}`,
                    images: [
                        { url: '', height: 0, width: 0 },
                        { url: '', height: 0, width: 0 }
                    ],
                    followers: {
                        href: null,
                        total: 0,
                    },
                },
                public: true,
                snapshot_id: playlist.playlistId,
                tracks: {
                    href: `https://music.youtube.com/playlist?list=${playlist.playlistId}`,
                    total: playlist.videoCount || 0,
                },
                type: 'playlist' as const,
                uri: `spotify:playlist:${playlist.playlistId}`,
            } as Playlist));

        return {
            href: '',
            items: playlists,
            limit,
            next: '',
            offset: 0,
            previous: '',
            total: playlists.length,
        };
    } catch (error) {
        console.error('Error fetching playlists:', error);
        return {
            href: '',
            items: [],
            limit,
            next: '',
            offset: 0,
            previous: '',
            total: 0,
        };
    }
};

/**
 * Get popular artists/channels
 */
const getPopularArtists = async (limit: number = 10): Promise<Pagination<Artist>> => {
    try {
        const response = await invidiousAxios.get<any[]>('/api/v1/search', {
            params: {
                q: 'music artist',
                type: 'channel',
                limit,
            },
        });

        const artists = response.data
            .filter((item: any) => item.type === 'channel')
            .map((channel: any) => ({
                id: channel.authorId,
                name: channel.author,
                genres: ['music'],
                images: channel.authorThumbnails?.map((thumb: any) => ({
                    url: thumb.url,
                    height: thumb.height || 0,
                    width: thumb.width || 0,
                })) || [],
                popularity: Math.min(100, Math.floor((channel.subCount || 0) / 10000)),
                type: 'artist' as const,
                uri: `spotify:artist:${channel.authorId}`,
                external_urls: {
                    spotify: `https://music.youtube.com/channel/${channel.authorId}`
                },
                href: `https://music.youtube.com/channel/${channel.authorId}`,
                followers: {
                    href: '',
                    total: channel.subCount || 0,
                },
            }));

        return {
            href: '',
            items: artists,
            limit,
            next: '',
            offset: 0,
            previous: '',
            total: artists.length,
        };
    } catch (error) {
        console.error('Error fetching artists:', error);
        return {
            href: '',
            items: [],
            limit,
            next: '',
            offset: 0,
            previous: '',
            total: 0,
        };
    }
};

export const invidiousHomeService = {
    getTrendingMusic,
    getPopularPlaylists,
    getPopularArtists,
};
