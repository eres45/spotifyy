import { useEffect, useRef, FC, memo, useCallback } from 'react';
import { useAppDispatch } from '../../store/store';
import { spotifyActions } from '../../store/slices/spotify';
import { authActions } from '../../store/slices/auth';
import { invidiousPlayerService } from '../../services/player';

export interface InvidiousWebPlaybackProps {
    children?: any;
}

const InvidiousWebPlayback: FC<InvidiousWebPlaybackProps> = memo(({ children }) => {
    const dispatch = useAppDispatch();
    const statePollingInterval = useRef<NodeJS.Timeout | null>(null);

    const handleState = useCallback((playerState: any) => {
        if (!playerState) return;

        // Map Invidious state to Spotify PlaybackState
        const spotifyState: any = {
            context: {
                uri: playerState.item?.album?.uri || '',
                metadata: {},
            },
            disallows: {
                pausing: false,
                peeking_next: false,
                peeking_prev: false,
                resuming: false,
                seeking: false,
                skipping_next: false,
                skipping_prev: false,
            },
            paused: !playerState.is_playing,
            position: playerState.progress_ms,
            repeat_mode: playerState.repeat_state === 'off' ? 0 : playerState.repeat_state === 'context' ? 1 : 2,
            shuffle: playerState.shuffle_state,
            track_window: {
                current_track: playerState.item,
                next_tracks: [],
                previous_tracks: [],
            },
            duration: playerState.item?.duration_ms || 0,
        };

        dispatch(spotifyActions.setState({ state: spotifyState }));
    }, [dispatch]);

    const startStatePolling = useCallback(() => {
        statePollingInterval.current = setInterval(async () => {
            const state = await invidiousPlayerService.fetchPlaybackState();
            handleState(state);
        }, 1000);
    }, [handleState]);

    const clearStatePolling = useCallback(() => {
        if (statePollingInterval.current) clearInterval(statePollingInterval.current);
    }, []);

    useEffect(() => {
        // Initialize player
        dispatch(authActions.setPlayerLoaded({ playerLoaded: true }));
        dispatch(spotifyActions.setDeviceId({ deviceId: 'invidious_web_player' }));
        dispatch(spotifyActions.setActiveDevice({ activeDevice: 'invidious_web_player' }));

        startStatePolling();

        return () => {
            clearStatePolling();
        };
    }, [dispatch, startStatePolling, clearStatePolling]);

    return <>{children}</>;
});

export default InvidiousWebPlayback;
