/**
 * examples/basic.tsx
 * ------------------
 *
 * Reference React components demonstrating every <WaveformPlaylist>
 * usage pattern this package supports. Copy/paste into your own React
 * app (Vite, Next.js, Remix, anywhere) to see the wrapper in action.
 *
 * Library setup (do this ONCE in your app entry — typically `main.tsx`
 * or your root layout):
 *
 *   // Stylesheets for both cores
 *   import '@arraypress/waveform-player/dist/waveform-player.css';
 *   import '@arraypress/waveform-playlist/dist/waveform-playlist.css';
 *
 *   // The playlist constructs a `new window.WaveformPlayer(...)`, so the
 *   // player core must be registered as a global first. Importing it for
 *   // its side effect registers `window.WaveformPlayer`:
 *   import '@arraypress/waveform-player';
 *
 * The wrapper does NOT auto-import CSS or the player global for you — you
 * might prefer a CDN, a self-hosted asset, or a different bundling
 * strategy.
 */
import { useRef, useState } from 'react';
import {
	WaveformPlaylist,
	type WaveformPlaylistHandle,
	type WaveformPlaylistTrackInput,
} from '@arraypress/waveform-playlist-react';

/* Example 1 — Minimal music playlist */
export function MinimalExample() {
	const tracks: WaveformPlaylistTrackInput[] = [
		{ url: '/audio/track-1.mp3', title: 'Summer Vibes', artist: 'Beach Sounds' },
		{ url: '/audio/track-2.mp3', title: 'Night Drive', artist: 'Synthwave Mix' },
		{ url: '/audio/track-3.mp3', title: 'Morning Coffee', artist: 'Lo-Fi' },
	];

	return <WaveformPlaylist tracks={tracks} />;
}

/* Example 2 — Music playlist with artwork, durations, and auto-advance */
export function MusicPlaylistExample() {
	const tracks: WaveformPlaylistTrackInput[] = [
		{
			url: '/audio/song-1.mp3',
			title: 'Summer Vibes',
			artist: 'Beach Sounds',
			artwork: '/img/cover-1.jpg',
			album: 'Sunset Sessions',
			duration: '3:45',
		},
		{
			url: '/audio/song-2.mp3',
			title: 'Night Drive',
			artist: 'Synthwave Mix',
			artwork: '/img/cover-2.jpg',
			album: 'Sunset Sessions',
			duration: '4:12',
		},
	];

	return (
		<WaveformPlaylist
			tracks={tracks}
			continuous
			showPlayState
			waveformStyle="bars"
			height={72}
		/>
	);
}

/* Example 3 — Podcast episode with clickable chapters */
export function PodcastChaptersExample() {
	const tracks: WaveformPlaylistTrackInput[] = [
		{
			url: '/audio/episode-42.mp3',
			title: 'Episode 42: AI Revolution',
			artist: 'with Dr. Sarah Chen',
			artwork: '/img/episode-42.jpg',
			chapters: [
				{ time: 0, label: 'Introduction' },
				{ time: '5:30', label: 'Main Topic', color: '#a855f7' },
				{ time: '45:00', label: 'Q&A Session' },
			],
		},
	];

	// A single track with chapters shows the chapter list AND renders the
	// chapters as markers on the waveform (smart default).
	return <WaveformPlaylist tracks={tracks} height={80} />;
}

/* Example 4 — Course modules, each broken into chapters */
export function CourseModulesExample() {
	const tracks: WaveformPlaylistTrackInput[] = [
		{
			url: '/audio/lesson-1.mp3',
			title: 'Module 1: Introduction',
			artist: 'Getting Started',
			chapters: [
				{ time: '0:00', label: 'Welcome' },
				{ time: '10:00', label: 'Setup' },
			],
		},
		{
			url: '/audio/lesson-2.mp3',
			title: 'Module 2: Core Concepts',
			chapters: [
				{ time: '0:00', label: 'Theory' },
				{ time: '15:00', label: 'Practice' },
			],
		},
	];

	return <WaveformPlaylist tracks={tracks} continuous expandChapters />;
}

/* Example 5 — Minimal button layout (compact switcher) */
export function MinimalLayoutExample() {
	const tracks: WaveformPlaylistTrackInput[] = [
		{ url: '/audio/beat-1.mp3', title: 'Trap Beat' },
		{ url: '/audio/beat-2.mp3', title: 'Lo-Fi' },
		{ url: '/audio/beat-3.mp3', title: 'Boom Bap' },
	];

	return <WaveformPlaylist tracks={tracks} layout="minimal" />;
}

/* Example 6 — Imperative navigation via ref */
export function ImperativeRefExample() {
	const playlistRef = useRef<WaveformPlaylistHandle>(null);

	const tracks: WaveformPlaylistTrackInput[] = [
		{ url: '/audio/track-1.mp3', title: 'Track 1' },
		{ url: '/audio/track-2.mp3', title: 'Track 2' },
		{ url: '/audio/track-3.mp3', title: 'Track 3' },
	];

	return (
		<div>
			<WaveformPlaylist ref={playlistRef} tracks={tracks} continuous />
			<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
				<button onClick={() => playlistRef.current?.previousTrack()}>Previous</button>
				<button onClick={() => playlistRef.current?.nextTrack()}>Next</button>
				<button onClick={() => playlistRef.current?.selectTrack(2)}>Jump to Track 3</button>
				<button onClick={() => console.log('Now on', playlistRef.current?.getCurrentTrackIndex())}>
					Log current index
				</button>
			</div>
		</div>
	);
}

/* Example 7 — Swapping the entire track list at runtime */
export function DynamicTracksExample() {
	const [playlist, setPlaylist] = useState<'chill' | 'focus'>('chill');

	const chill: WaveformPlaylistTrackInput[] = [
		{ url: '/audio/chill-1.mp3', title: 'Chill 1' },
		{ url: '/audio/chill-2.mp3', title: 'Chill 2' },
	];
	const focus: WaveformPlaylistTrackInput[] = [
		{ url: '/audio/focus-1.mp3', title: 'Focus 1' },
		{ url: '/audio/focus-2.mp3', title: 'Focus 2' },
		{ url: '/audio/focus-3.mp3', title: 'Focus 3' },
	];

	// Changing the `tracks` array tears down and rebuilds the playlist so
	// the constructor re-parses the new markup. No `key` needed — the
	// wrapper keys its effect on the serialised tracks.
	return (
		<div>
			<WaveformPlaylist tracks={playlist === 'chill' ? chill : focus} />
			<select value={playlist} onChange={(e) => setPlaylist(e.target.value as 'chill' | 'focus')}>
				<option value="chill">Chill</option>
				<option value="focus">Focus</option>
			</select>
		</div>
	);
}
