/**
 * @module @arraypress/waveform-playlist-react
 * @description
 * Public entry point for the React wrapper around
 * `@arraypress/waveform-playlist`.
 *
 * ```tsx
 * import { WaveformPlaylist } from '@arraypress/waveform-playlist-react';
 *
 * function App() {
 *   return (
 *     <WaveformPlaylist
 *       tracks={[
 *         { url: '/audio/a.mp3', title: 'Track A' },
 *         { url: '/audio/b.mp3', title: 'Track B' },
 *       ]}
 *     />
 *   );
 * }
 * ```
 *
 * ## Types
 *
 * ```ts
 * import type {
 *   WaveformPlaylistProps,
 *   WaveformPlaylistHandle,
 *   WaveformPlaylistTrackInput,
 *   WaveformPlaylistChapterInput,
 *   WaveformPlaylistOptions,
 *   WaveformPlaylistTrack,
 *   WaveformPlaylistChapter,
 *   WaveformPlaylistMarker,
 *   WaveformStyle,
 *   ColorPreset,
 *   AudioMode,
 *   AudioPreload,
 *   ButtonAlign,
 * } from '@arraypress/waveform-playlist-react';
 * ```
 */

export { WaveformPlaylist } from './WaveformPlaylist';
export { WaveformPlaylist as default } from './WaveformPlaylist';

export type {
	WaveformPlaylistProps,
	WaveformPlaylistHandle,
	WaveformPlaylistTrackInput,
	WaveformPlaylistChapterInput,
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
	WaveformStyle,
	WaveformMarker,
	WaveformPeaks,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
} from './types';
