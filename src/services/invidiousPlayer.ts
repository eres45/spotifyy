// Invidious Player Service - Handles audio playback using YouTube audio streams

import invidiousAxios from '../invidiousAxios';

// Define interfaces for Invidious responses
interface InvidiousVideo {
    title: string;
    videoId: string;
    lengthSeconds: number;
    adaptiveFormats: Array<{
        bitrate: string;
        mimeType: string;
        container: string;
        encoding: string;
        qualityLabel?: string;
        resolution?: string;
        size?: string;
        fps?: number;
        url: string;
        type: string;
        clen: string;
        lmt: string;
        projectionType: string;
        init: string;
        index: string;
        itag: string;
        audioQuality?: string;
        audioSampleRate?: string;
        audioChannels?: string;
    }>;
    formatStreams: Array<{
        url: string;
        itag: string;
        type: string;
        quality: string;
        bitrate?: string;
        container: string;
        encoding: string;
        qualityLabel: string;
        resolution: string;
        size: string;
    }>;
    author: string;
    authorId: string;
}

// Current playback state
let currentPlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
    shuffle: false,
    repeat: 'off' as 'off' | 'context' | 'track',
    currentTrack: null as any,
    playlist: [] as any[],
    playlistIndex: 0,
};

// Audio element for playback
let audioElement: HTMLAudioElement | null = null;

// Initialize audio element
const initializeAudioElement = () => {
    if (!audioElement) {
        audioElement = new Audio();
        audioElement.volume = currentPlayerState.volume / 100;

        // Event listeners
        audioElement.addEventListener('play', () => {
            currentPlayerState.isPlaying = true;
        });

        audioElement.addEventListener('pause', () => {
            currentPlayerState.isPlaying = false;
        });

        audioElement.addEventListener('timeupdate', () => {
            currentPlayerState.currentTime = audioElement!.currentTime;
        });

        audioElement.addEventListener('loadedmetadata', () => {
            currentPlayerState.duration = audioElement!.duration;
        });

        audioElement.addEventListener('ended', () => {
            currentPlayerState.isPlaying = false;
            // Handle next track logic
            if (currentPlayerState.repeat === 'track') {
                audioElement!.currentTime = 0;
                audioElement!.play();
            } else if (currentPlayerState.playlist.length > 0) {
                nextTrack();
            }
        });
    }
};

/**
 * @description Get information about the current playback state
 */
const fetchPlaybackState = async () => {
    return {
        is_playing: currentPlayerState.isPlaying,
        progress_ms: Math.floor(currentPlayerState.currentTime * 1000),
        item: currentPlayerState.currentTrack,
        currently_playing_type: 'track',
        actions: {
            interrupting_playback: true,
            pausing: true,
            resuming: true,
            seeking: true,
            skipping_next: true,
            skipping_prev: true,
            toggling_repeat_context: true,
            toggling_shuffle: true,
            toggling_repeat_track: true,
            transferring_playback: true,
        },
        shuffle_state: currentPlayerState.shuffle,
        repeat_state: currentPlayerState.repeat,
    };
};

/**
 * @description Transfer playback to a new device (simulated)
 */
const transferPlayback = async (deviceId: string) => {
    // In our case, we're just simulating device transfer
    console.log(`Transferring playback to device: ${deviceId}`);
    return Promise.resolve();
};

/**
 * @description Get information about available devices
 */
const getAvailableDevices = async () => {
    return {
        devices: [
            {
                id: 'web_player',
                is_active: true,
                is_private_session: false,
                is_restricted: false,
                name: 'Invidious Web Player',
                type: 'Computer' as const,
                volume_percent: currentPlayerState.volume,
                supports_volume: true,
            },
        ],
    };
};

/**
 * @description Start playback of a track, playlist, or album
 */
const startPlayback = async (body: {
    context_uri?: string;
    uris?: string[];
    offset?: { position: number }
} = {}) => {
    initializeAudioElement();

    try {
        let videoId = '';
        let playlist: any[] = [];

        if (body.uris && body.uris.length > 0) {
            // Case 1: Specific track(s) requested
            const parts = body.uris[0].split(':');
            videoId = parts[parts.length - 1];
        } else if (body.context_uri) {
            // Case 2: Context requested (Playlist or Artist/Channel)
            const parts = body.context_uri.split(':');
            const type = parts[parts.length - 2];
            const id = parts[parts.length - 1];

            if (type === 'playlist') {
                // Fetch playlist videos
                const response = await invidiousAxios.get<any>(`/api/v1/playlists/${id}`);
                playlist = response.data.videos.map((v: any) => ({
                    uri: `spotify:track:${v.videoId}`,
                    name: v.title,
                    id: v.videoId
                }));
                if (playlist.length > 0) {
                    videoId = playlist[0].id;
                    currentPlayerState.playlist = playlist;
                    currentPlayerState.playlistIndex = 0;
                }
            } else if (type === 'artist') {
                // Fetch channel videos (latest)
                const response = await invidiousAxios.get<any>(`/api/v1/channels/${id}/videos`);
                playlist = response.data.videos.map((v: any) => ({
                    uri: `spotify:track:${v.videoId}`,
                    name: v.title,
                    id: v.videoId
                }));
                if (playlist.length > 0) {
                    videoId = playlist[0].id;
                    currentPlayerState.playlist = playlist;
                    currentPlayerState.playlistIndex = 0;
                }
            } else if (type === 'album') {
                // Treat album as playlist (Invidious doesn't strictly distinguish)
                // If we have an album ID that is actually a playlist ID (which we do in mapping), use playlist endpoint
                // If it's a video ID (single track album), just play the video
                if (id.startsWith('PL')) {
                    const response = await invidiousAxios.get<any>(`/api/v1/playlists/${id}`);
                    playlist = response.data.videos.map((v: any) => ({
                        uri: `spotify:track:${v.videoId}`,
                        name: v.title,
                        id: v.videoId
                    }));
                    if (playlist.length > 0) {
                        videoId = playlist[0].id;
                        currentPlayerState.playlist = playlist;
                        currentPlayerState.playlistIndex = 0;
                    }
                } else {
                    // Assume it's a single video album
                    videoId = id.replace('-album', '');
                }
            }
        }

        if (videoId) {
            // Fetch video details from Invidious
            const response = await invidiousAxios.get<InvidiousVideo>(`/api/v1/videos/${videoId}`);
            const video = response.data;

            // Find the best audio stream (prefer audio/webm or audio/mp4)
        } catch (error) {
            console.error('Error starting playback:', error);
            return Promise.reject(error);
        }
    };

    /**
     * @description Pause playback
     */
    const pausePlayback = async () => {
        initializeAudioElement();
        audioElement!.pause();
        currentPlayerState.isPlaying = false;
        return Promise.resolve();
    };

    /**
     * @description Skip to the next track
     */
    const nextTrack = async () => {
        initializeAudioElement();

        // If we have a playlist and we're not at the end
        if (currentPlayerState.playlist.length > 0 &&
            currentPlayerState.playlistIndex < currentPlayerState.playlist.length - 1) {
            currentPlayerState.playlistIndex++;
            const nextTrackItem = currentPlayerState.playlist[currentPlayerState.playlistIndex];

            // Extract video ID and start playback
            const parts = nextTrackItem.uri.split(':');
            const videoId = parts[parts.length - 1];

            await startPlayback({ uris: [nextTrackItem.uri] });
        } else if (currentPlayerState.repeat === 'context' && currentPlayerState.playlist.length > 0) {
            // Repeat the playlist
            currentPlayerState.playlistIndex = 0;
            const firstTrack = currentPlayerState.playlist[0];
            await startPlayback({ uris: [firstTrack.uri] });
        }

        return Promise.resolve();
    };

    /**
     * @description Skip to the previous track
     */
    const previousTrack = async () => {
        initializeAudioElement();

        // If we're more than 3 seconds into the track, restart it
        if (currentPlayerState.currentTime > 3) {
            audioElement!.currentTime = 0;
            return Promise.resolve();
        }

        // Otherwise go to the previous track
        if (currentPlayerState.playlist.length > 0 && currentPlayerState.playlistIndex > 0) {
            currentPlayerState.playlistIndex--;
            const prevTrackItem = currentPlayerState.playlist[currentPlayerState.playlistIndex];

            // Extract video ID and start playback
            const parts = prevTrackItem.uri.split(':');
            const videoId = parts[parts.length - 1];

            await startPlayback({ uris: [prevTrackItem.uri] });
        }

        return Promise.resolve();
    };

    /**
     * @description Seek to a position in the current track
     */
    const seekToPosition = async (position_ms: number) => {
        initializeAudioElement();
        audioElement!.currentTime = position_ms / 1000;
        currentPlayerState.currentTime = position_ms / 1000;
        return Promise.resolve();
    };

    /**
     * @description Set repeat mode
     */
    const setRepeatMode = async (state: 'track' | 'context' | 'off') => {
        currentPlayerState.repeat = state;
        return Promise.resolve();
    };

    /**
     * @description Set volume
     */
    const setVolume = async (volume_percent: number) => {
        initializeAudioElement();
        audioElement!.volume = volume_percent / 100;
        currentPlayerState.volume = volume_percent;
        return Promise.resolve();
    };

    /**
     * @description Toggle shuffle
     */
    const toggleShuffle = async (state: boolean) => {
        currentPlayerState.shuffle = state;
        return Promise.resolve();
    };

    /**
     * @description Add a track to the playback queue
     */
    const addToQueue = async (uri: string) => {
        // Extract video ID from URI
        const parts = uri.split(':');
        const videoId = parts[parts.length - 1];

        // For simplicity, we'll just log this - in a real implementation,
        // we'd fetch the track details and add it to a queue
        console.log(`Adding track ${videoId} to queue`);

        return Promise.resolve();
    };

    /**
     * @description Get recently played tracks
     */
    const getRecentlyPlayed = async (params: { limit?: number; after?: number; before?: number }) => {
        // Return empty for now - in a real implementation we'd track recently played
        return {
            href: '',
            items: [],
            limit: params.limit || 20,
            next: '',
            offset: 0,
            previous: '',
            total: 0,
        };
    };

    export const invidiousPlayerService = {
        addToQueue,
        fetchPlaybackState,
        transferPlayback,
        startPlayback,
        pausePlayback,
        nextTrack,
        previousTrack,
        setRepeatMode,
        setVolume,
        toggleShuffle,
        seekToPosition,
        getRecentlyPlayed,
        getAvailableDevices,
    };