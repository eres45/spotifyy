import { invidiousPlayerService } from './invidiousPlayer';
import type { Pagination } from '../interfaces/api';
import { Device } from '../interfaces/devices';
import type { PlayHistoryObject } from '../interfaces/player';

export { invidiousPlayerService };

/**
 * @description Get information about the user's current playback state, including track or episode, progress, and active device.
 */
const fetchPlaybackState = invidiousPlayerService.fetchPlaybackState;

/**
 * @description Transfer playback to a new device and optionally begin playback.
 * @param deviceId The ID of the device this command is targeting. If not supplied, the user's currently active device is the target.
 */
const transferPlayback = invidiousPlayerService.transferPlayback;

/**
 * @description Get information about a user's available devices.
 */
const getAvailableDevices = invidiousPlayerService.getAvailableDevices;

/**
 * @description Start a new context or resume current playback on the user's active device.
 */
const startPlayback = invidiousPlayerService.startPlayback;

/**
 * @description Pause playback on the user's account.
 */
const pausePlayback = invidiousPlayerService.pausePlayback;

/**
 * @description Skip to the next track in the user's queue.
 */
const nextTrack = invidiousPlayerService.nextTrack;

/**
 * @description Skip to the previous track in the user's queue.
 */
const previousTrack = invidiousPlayerService.previousTrack;

/**
 * @description Seeks to the given position in the user's currently playing track.
 * @param position_ms The position in milliseconds to seek to.
 */
const seekToPosition = invidiousPlayerService.seekToPosition;

/**
 * @description Set the repeat mode for the user's playback.
 * @param state track, context, or off. track will repeat the current track. context will repeat the current context. off will turn repeat off.
 */
const setRepeatMode = invidiousPlayerService.setRepeatMode;

/**
 * @description Set the volume for the user's current playback device.
 * @param volume_percent The volume to set. Must be a value from 0 to 100 inclusive.
 */
const setVolume = invidiousPlayerService.setVolume;

/**
 * @description Toggle shuffle on or off for user's playback.
 */
const toggleShuffle = invidiousPlayerService.toggleShuffle;

/**
 * @description Add an item to the end of the user's current playback queue.
 */
const addToQueue = invidiousPlayerService.addToQueue;

/**
 * @description Get tracks from the current user's recently played tracks.
 */
const getRecentlyPlayed = invidiousPlayerService.getRecentlyPlayed;

export const playerService = {
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