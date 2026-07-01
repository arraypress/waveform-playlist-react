/**
 * WaveformPlaylist.tsx
 * --------------------
 *
 * React wrapper around `@arraypress/waveform-playlist`. Renders a host
 * `<div>` containing the playlist's tracks as `[data-track]` /
 * `[data-chapter]` child markup, then — on mount — constructs a
 * `WaveformPlaylist` over that host. The library's constructor parses the
 * track markup, hides it, and renders the interactive playlist + embedded
 * player into the host. On unmount (or identity-prop change) the instance
 * is destroyed and rebuilt.
 *
 * ## Why child markup instead of an options array?
 *
 * The `WaveformPlaylist` constructor reads its tracks from `[data-track]`
 * child elements (the same contract the vanilla library uses), then
 * auto-initialises. So this wrapper renders that markup declaratively from
 * the `tracks` prop and lets the constructor consume it. The host
 * deliberately does **not** carry `data-waveform-playlist` — that
 * attribute drives the library's *global* auto-init, which would
 * double-mount on top of the instance we create explicitly.
 *
 * ## Identity-prop re-mount
 *
 * Like the `@arraypress/waveform-player-react` template, this component
 * re-creates the instance when any construction-time prop changes rather
 * than diffing options against the live instance. `tracks` (serialised)
 * and `layout` are the primary identity inputs; the full pass-through
 * option set is listed exhaustively in the effect's dep array.
 *
 * For imperative navigation — `selectTrack()`, `nextTrack()`,
 * `previousTrack()`, etc. — grab the instance through a `ref`:
 *
 * ```tsx
 * import { useRef } from 'react';
 * import {
 *   WaveformPlaylist,
 *   type WaveformPlaylistHandle,
 * } from '@arraypress/waveform-playlist-react';
 *
 * function MyPlaylist() {
 *   const ref = useRef<WaveformPlaylistHandle>(null);
 *   return (
 *     <>
 *       <WaveformPlaylist ref={ref} tracks={tracks} />
 *       <button onClick={() => ref.current?.nextTrack()}>Next</button>
 *     </>
 *   );
 * }
 * ```
 *
 * ## Library setup
 *
 * This component does **not** load CSS for you. Import both cores' stylesheets
 * once at your app entry:
 *
 * ```ts
 * import '@arraypress/waveform-player/dist/waveform-player.css';
 * import '@arraypress/waveform-playlist/dist/waveform-playlist.css';
 * ```
 *
 * The playlist depends on the **core player** being present as
 * `window.WaveformPlayer` at construction time (it instantiates a
 * `new window.WaveformPlayer(...)` for the active track). Load the player
 * core's script — or import it for its global side effect — before the
 * playlist mounts:
 *
 * ```ts
 * import '@arraypress/waveform-player'; // registers window.WaveformPlayer
 * ```
 *
 * The playlist's JS is imported dynamically inside `useEffect` so it only
 * loads on the client (SSR / RSC safe).
 *
 * @module WaveformPlaylist
 */
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	type ForwardedRef,
} from 'react';
// Aliased to avoid colliding with this file's own `WaveformPlaylist`
// component export. This is the core library's playlist class type.
import type { WaveformPlaylist as WaveformPlaylistInstance } from '@arraypress/waveform-playlist';
import type {
	WaveformPlaylistHandle,
	WaveformPlaylistProps,
	WaveformPlaylistTrack,
} from './types';

/**
 * Convert a `WaveformPlaylistProps` object into the options shape the
 * `WaveformPlaylist` constructor accepts. Tracks are intentionally
 * excluded — the constructor reads them from the `[data-track]` child
 * markup this component renders, not from options.
 *
 * @param props - The component's resolved props.
 * @returns An options object to pass into `new WaveformPlaylist(el, …)`.
 */
function buildPlaylistOptions(props: WaveformPlaylistProps): Record<string, unknown> {
	const opts: Record<string, unknown> = {};

	/* Playlist-level options */
	if (props.layout !== undefined) opts.layout = props.layout;
	if (props.continuous !== undefined) opts.continuous = props.continuous;
	if (props.expandChapters !== undefined) opts.expandChapters = props.expandChapters;
	if (props.showDuration !== undefined) opts.showDuration = props.showDuration;
	if (props.showChapterMarkers !== undefined) opts.showChapterMarkers = props.showChapterMarkers;
	if (props.chapterMarkerColor !== undefined) opts.chapterMarkerColor = props.chapterMarkerColor;
	if (props.showPlayState !== undefined) opts.showPlayState = props.showPlayState;

	/* Pass-through player options — forwarded to the embedded player the
	 * playlist drives. Per-track content (url/title/artist/artwork/album/
	 * markers/waveform) is NOT here; it comes from the rendered markup. */
	if (props.audioMode !== undefined) opts.audioMode = props.audioMode;
	if (props.preload !== undefined) opts.preload = props.preload;

	/* Waveform visualisation */
	if (props.waveformStyle !== undefined) opts.waveformStyle = props.waveformStyle;
	if (props.height !== undefined) opts.height = props.height;
	if (props.samples !== undefined) opts.samples = props.samples;
	if (props.barWidth !== undefined) opts.barWidth = props.barWidth;
	if (props.barSpacing !== undefined) opts.barSpacing = props.barSpacing;
	if (props.barRadius !== undefined) opts.barRadius = props.barRadius;

	/* Colours */
	if (props.colorPreset !== undefined) opts.colorPreset = props.colorPreset;
	if (props.waveformColor !== undefined) opts.waveformColor = props.waveformColor;
	if (props.progressColor !== undefined) opts.progressColor = props.progressColor;
	if (props.buttonColor !== undefined) opts.buttonColor = props.buttonColor;
	if (props.buttonHoverColor !== undefined) opts.buttonHoverColor = props.buttonHoverColor;
	if (props.textColor !== undefined) opts.textColor = props.textColor;
	if (props.textSecondaryColor !== undefined) opts.textSecondaryColor = props.textSecondaryColor;
	if (props.backgroundColor !== undefined) opts.backgroundColor = props.backgroundColor;
	if (props.borderColor !== undefined) opts.borderColor = props.borderColor;

	/* Playback controls */
	if (props.playbackRate !== undefined) opts.playbackRate = props.playbackRate;
	if (props.showPlaybackSpeed !== undefined) opts.showPlaybackSpeed = props.showPlaybackSpeed;
	if (props.playbackRates !== undefined) opts.playbackRates = props.playbackRates;

	/* UI toggles */
	if (props.showControls !== undefined) opts.showControls = props.showControls;
	if (props.showInfo !== undefined) opts.showInfo = props.showInfo;
	if (props.showTime !== undefined) opts.showTime = props.showTime;
	if (props.showHoverTime !== undefined) opts.showHoverTime = props.showHoverTime;
	if (props.showBPM !== undefined) opts.showBPM = props.showBPM;
	if (props.bpm !== undefined) opts.bpm = props.bpm;
	if (props.buttonAlign !== undefined) opts.buttonAlign = props.buttonAlign;
	if (props.buttonStyle !== undefined) opts.buttonStyle = props.buttonStyle;

	/* Accessibility */
	if (props.accessibleSeek !== undefined) opts.accessibleSeek = props.accessibleSeek;
	if (props.seekLabel !== undefined) opts.seekLabel = props.seekLabel;

	/* Error UI */
	if (props.errorText !== undefined) opts.errorText = props.errorText;

	/* Markers (the per-player render toggle; per-track marker data comes
	 * from each track's `markers`, rendered into `data-markers`). */
	if (props.showMarkers !== undefined) opts.showMarkers = props.showMarkers;

	/* Behaviour */
	if (props.autoplay !== undefined) opts.autoplay = props.autoplay;
	if (props.singlePlay !== undefined) opts.singlePlay = props.singlePlay;
	if (props.playOnSeek !== undefined) opts.playOnSeek = props.playOnSeek;
	if (props.enableMediaSession !== undefined) opts.enableMediaSession = props.enableMediaSession;

	/* Icons */
	if (props.playIcon !== undefined) opts.playIcon = props.playIcon;
	if (props.pauseIcon !== undefined) opts.pauseIcon = props.pauseIcon;

	return opts;
}

/**
 * `WaveformPlaylist` — React component wrapping
 * `@arraypress/waveform-playlist`.
 *
 * Render at the spot you want a playlist (with optional chapter
 * navigation) to appear. The host `<div>` — and the track markup it
 * contains — is rendered immediately for layout / parsing; the
 * interactive UI hydrates once the library loads client-side.
 *
 * @example Basic
 *   <WaveformPlaylist
 *     tracks={[
 *       { url: '/audio/a.mp3', title: 'Track A' },
 *       { url: '/audio/b.mp3', title: 'Track B' },
 *     ]}
 *   />
 *
 * @example With ref for imperative navigation
 *   const ref = useRef<WaveformPlaylistHandle>(null);
 *   <WaveformPlaylist ref={ref} tracks={tracks} continuous />
 *   <button onClick={() => ref.current?.nextTrack()}>Next</button>
 */
export const WaveformPlaylist = forwardRef<WaveformPlaylistHandle, WaveformPlaylistProps>(
	function WaveformPlaylist(props, ref: ForwardedRef<WaveformPlaylistHandle>) {
		const hostRef = useRef<HTMLDivElement | null>(null);
		const instanceRef = useRef<unknown>(null);

		const { tracks } = props;

		/* Stable serialisation of the tracks used as an identity key in the
		 * effect deps below — a changed track set tears down and rebuilds the
		 * playlist so the constructor re-parses the (updated) child markup. */
		const tracksKey = JSON.stringify(tracks);

		/**
		 * Mount / re-mount lifecycle.
		 *
		 * The dep array contains EVERY prop the library reads at construction
		 * time (plus `tracksKey`). When any change, this effect tears the old
		 * instance down and builds a new one against the freshly-rendered
		 * markup. Simpler and more correct than partial-updating a live
		 * playlist.
		 */
		useEffect(() => {
			let cancelled = false;
			let localInstance: { destroy?: () => void } | null = null;

			/* The library is browser-only (it constructs a WaveformPlayer that
			 * touches Web Audio / Canvas). Defer the import until we're actually
			 * mounting client-side so SSR / RSC don't evaluate it on the server. */
			void import('@arraypress/waveform-playlist')
				.then((mod) => {
					if (cancelled) return;
					const host = hostRef.current;
					if (!host) return;

					const WaveformPlaylistClass = (mod.default ??
						(mod as { WaveformPlaylist?: unknown }).WaveformPlaylist) as {
						new (el: HTMLElement, opts: Record<string, unknown>): { destroy?: () => void };
					};

					if (typeof WaveformPlaylistClass !== 'function') {
						console.error(
							'[WaveformPlaylistReact] Failed to resolve WaveformPlaylist constructor from module.'
						);
						return;
					}

					try {
						localInstance = new WaveformPlaylistClass(host, buildPlaylistOptions(props));
						instanceRef.current = localInstance;
					} catch (err) {
						/* The most common cause is a missing core player —
						 * `window.WaveformPlayer` must be present before the
						 * playlist constructs. Surface it clearly. */
						console.error('[WaveformPlaylistReact] Failed to construct playlist:', err);
					}
				})
				.catch((err) => {
					console.error('[WaveformPlaylistReact] Failed to load library:', err);
				});

			return () => {
				cancelled = true;
				const current = localInstance ?? (instanceRef.current as { destroy?: () => void } | null);
				if (current && typeof current.destroy === 'function') {
					try {
						current.destroy();
					} catch (err) {
						console.warn('[WaveformPlaylistReact] destroy() threw:', err);
					}
				}
				instanceRef.current = null;
			};
			/* Re-mount on any construction-prop change. Listed exhaustively
			 * (rather than spread) to make intent explicit and satisfy the lint
			 * rule. `tracksKey` stands in for the `tracks` array. */
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [
			tracksKey,
			props.layout,
			props.continuous,
			props.expandChapters,
			props.showDuration,
			props.showChapterMarkers,
			props.chapterMarkerColor,
			props.showPlayState,
			props.audioMode,
			props.preload,
			props.waveformStyle,
			props.height,
			props.samples,
			props.barWidth,
			props.barSpacing,
			props.barRadius,
			props.colorPreset,
			props.waveformColor,
			props.progressColor,
			props.buttonColor,
			props.buttonHoverColor,
			props.textColor,
			props.textSecondaryColor,
			props.backgroundColor,
			props.borderColor,
			props.playbackRate,
			props.showPlaybackSpeed,
			props.playbackRates,
			props.showControls,
			props.showInfo,
			props.showTime,
			props.showHoverTime,
			props.showBPM,
			props.bpm,
			props.buttonAlign,
			props.buttonStyle,
			props.accessibleSeek,
			props.seekLabel,
			props.errorText,
			props.showMarkers,
			props.autoplay,
			props.singlePlay,
			props.playOnSeek,
			props.enableMediaSession,
			props.playIcon,
			props.pauseIcon,
		]);

		/**
		 * Expose an imperative handle on the forwarded ref. Each method is a
		 * thin pass-through to the live instance — calls before the instance
		 * has mounted (still loading async) are no-ops.
		 */
		useImperativeHandle(
			ref,
			() => ({
				selectTrack(index) {
					const inst = instanceRef.current as { selectTrack?: (i: number) => void } | null;
					inst?.selectTrack?.(index);
				},
				seekToChapter(trackIndex, time) {
					const inst = instanceRef.current as {
						seekToChapter?: (t: number, s: number) => void;
					} | null;
					inst?.seekToChapter?.(trackIndex, time);
				},
				nextTrack() {
					const inst = instanceRef.current as { nextTrack?: () => void } | null;
					inst?.nextTrack?.();
				},
				previousTrack() {
					const inst = instanceRef.current as { previousTrack?: () => void } | null;
					inst?.previousTrack?.();
				},
				getPlayer() {
					const inst = instanceRef.current as { getPlayer?: () => unknown } | null;
					return inst?.getPlayer?.() ?? null;
				},
				getCurrentTrackIndex() {
					const inst = instanceRef.current as { getCurrentTrackIndex?: () => number } | null;
					return inst?.getCurrentTrackIndex?.() ?? 0;
				},
				getTracks() {
					const inst = instanceRef.current as {
						getTracks?: () => WaveformPlaylistTrack[];
					} | null;
					return inst?.getTracks?.() ?? [];
				},
				get instance() {
					return instanceRef.current as WaveformPlaylistInstance | null;
				},
			}),
			[]
		);

		return (
			<div
				ref={hostRef}
				id={props.id}
				className={['wfp-host', props.className].filter(Boolean).join(' ')}
				style={props.style}
			>
				{tracks.map((track, i) => (
					<div
						key={i}
						data-track=""
						data-url={track.url}
						data-title={track.title}
						data-artist={track.artist}
						data-artwork={track.artwork}
						data-album={track.album}
						data-duration={track.duration}
						data-markers={track.markers ? JSON.stringify(track.markers) : undefined}
					>
						{(track.chapters ?? []).map((chapter, ci) => (
							<div
								key={ci}
								data-chapter=""
								data-time={String(chapter.time)}
								data-color={chapter.color}
							>
								{chapter.label}
							</div>
						))}
					</div>
				))}
			</div>
		);
	}
);
