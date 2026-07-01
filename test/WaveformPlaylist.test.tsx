/**
 * test/WaveformPlaylist.test.tsx
 * ------------------------------
 *
 * Tests for the React wrapper. The core
 * `@arraypress/waveform-playlist` library is mocked at the module
 * boundary because its constructor builds a `WaveformPlayer` that
 * reaches for browser APIs (Web Audio, Canvas, Fetch) jsdom does not
 * implement. With the module mocked, tests verify the wrapper's
 * responsibilities — track-markup rendering, mount / unmount
 * lifecycle, option pass-through, ref forwarding, and re-mount on
 * identity-prop change — without a real audio runtime.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { WaveformPlaylist } from '../src/WaveformPlaylist';
import type {
	WaveformPlaylistHandle,
	WaveformPlaylistTrackInput,
} from '../src/types';

/**
 * Stub instance the mocked constructor returns. Each method records its
 * calls so tests can assert behaviour.
 */
const makeStub = () => {
	const stub = {
		destroy: vi.fn(),
		selectTrack: vi.fn(),
		seekToChapter: vi.fn(),
		nextTrack: vi.fn(),
		previousTrack: vi.fn(),
		getPlayer: vi.fn(() => ({ id: 'player' })),
		getCurrentTrackIndex: vi.fn(() => 2),
		getTracks: vi.fn(() => [
			{ index: 0, url: '/audio/a.mp3' },
			{ index: 1, url: '/audio/b.mp3' },
		]),
	};
	return stub;
};

/**
 * Module-level mock. Every test sees the same `WaveformPlaylistCtor`
 * spy so we can introspect what was constructed. The constructor records
 * the host element it was given and the options object, then returns the
 * latest `stub` so destroy() / nextTrack() etc. are observable.
 */
const ctorCalls: Array<{ el: HTMLElement; opts: Record<string, unknown>; stub: ReturnType<typeof makeStub> }> = [];

vi.mock('@arraypress/waveform-playlist', () => {
	const WaveformPlaylistCtor = vi.fn(function (this: unknown, el: HTMLElement, opts: Record<string, unknown>) {
		const stub = makeStub();
		ctorCalls.push({ el, opts, stub });
		// Mutate `this` so the `new` call sees the stub's methods.
		Object.assign(this as object, stub);
	}) as unknown as new (el: HTMLElement, opts: Record<string, unknown>) => unknown;

	return {
		default: WaveformPlaylistCtor,
		WaveformPlaylist: WaveformPlaylistCtor,
	};
});

beforeEach(() => {
	ctorCalls.length = 0;
	cleanup();
});

/** A couple of representative tracks reused across tests. */
const TWO_TRACKS: WaveformPlaylistTrackInput[] = [
	{ url: '/audio/a.mp3', title: 'Track A', artist: 'Artist A' },
	{ url: '/audio/b.mp3', title: 'Track B', artist: 'Artist B' },
];

/**
 * Wait for the component's dynamic `import('@arraypress/waveform-playlist')`
 * to resolve and the constructor mock to fire. The whole chain (effect
 * run → import → .then callback) is microtask-scheduled, so we poll with
 * testing-library's `waitFor`.
 */
async function waitForMount(expectedCount = 1): Promise<void> {
	await waitFor(() => expect(ctorCalls.length).toBeGreaterThanOrEqual(expectedCount));
}

// ─── Mount + host container ──────────────────────────────────────────────

describe('<WaveformPlaylist> — mount', () => {
	it('renders a host div with the wfp-host class', () => {
		const { container } = render(<WaveformPlaylist tracks={TWO_TRACKS} />);
		const host = container.querySelector('div');
		expect(host).not.toBeNull();
		expect(host!.className).toContain('wfp-host');
	});

	it('forwards className and id to the host div', () => {
		const { container } = render(
			<WaveformPlaylist tracks={TWO_TRACKS} id="my-playlist" className="extra-class" />
		);
		const host = container.querySelector('div')!;
		expect(host.id).toBe('my-playlist');
		expect(host.className).toContain('wfp-host');
		expect(host.className).toContain('extra-class');
	});

	it('forwards inline style to the host div', () => {
		const { container } = render(
			<WaveformPlaylist tracks={TWO_TRACKS} style={{ minHeight: 200 }} />
		);
		const host = container.querySelector('div')!;
		expect(host.style.minHeight).toBe('200px');
	});

	it('does NOT put data-waveform-playlist on the host (avoids double auto-init)', () => {
		const { container } = render(<WaveformPlaylist tracks={TWO_TRACKS} />);
		const host = container.querySelector('.wfp-host')!;
		expect(host.hasAttribute('data-waveform-playlist')).toBe(false);
	});

	it('constructs the library instance on mount with the host element + options', async () => {
		render(<WaveformPlaylist tracks={TWO_TRACKS} layout="minimal" continuous />);
		await waitForMount();

		expect(ctorCalls).toHaveLength(1);
		const { el, opts } = ctorCalls[0];
		expect(el).toBeInstanceOf(HTMLDivElement);
		expect(el.classList.contains('wfp-host')).toBe(true);
		expect(opts.layout).toBe('minimal');
		expect(opts.continuous).toBe(true);
		// Tracks come from the markup, NOT the options bag.
		expect('tracks' in opts).toBe(false);
	});
});

// ─── Track + chapter markup ──────────────────────────────────────────────

describe('<WaveformPlaylist> — track markup', () => {
	it('renders one [data-track] element per track with its data-* fields', () => {
		const { container } = render(
			<WaveformPlaylist
				tracks={[
					{
						url: '/audio/a.mp3',
						title: 'Track A',
						artist: 'Artist A',
						artwork: '/img/a.jpg',
						album: 'Album A',
						duration: '3:45',
					},
				]}
			/>
		);

		const tracks = container.querySelectorAll('[data-track]');
		expect(tracks).toHaveLength(1);
		const el = tracks[0] as HTMLElement;
		expect(el.dataset.url).toBe('/audio/a.mp3');
		expect(el.dataset.title).toBe('Track A');
		expect(el.dataset.artist).toBe('Artist A');
		expect(el.dataset.artwork).toBe('/img/a.jpg');
		expect(el.dataset.album).toBe('Album A');
		expect(el.dataset.duration).toBe('3:45');
	});

	it('omits data-* attributes for omitted track fields', () => {
		const { container } = render(
			<WaveformPlaylist tracks={[{ url: '/audio/a.mp3' }]} />
		);
		const el = container.querySelector('[data-track]') as HTMLElement;
		expect(el.dataset.url).toBe('/audio/a.mp3');
		expect(el.hasAttribute('data-title')).toBe(false);
		expect(el.hasAttribute('data-artwork')).toBe(false);
		expect(el.hasAttribute('data-markers')).toBe(false);
	});

	it('JSON-encodes per-track markers into data-markers', () => {
		const markers = [{ time: 0, label: 'Intro' }, { time: 30, label: 'Verse' }];
		const { container } = render(
			<WaveformPlaylist tracks={[{ url: '/audio/a.mp3', markers }]} />
		);
		const el = container.querySelector('[data-track]') as HTMLElement;
		expect(el.dataset.markers).toBe(JSON.stringify(markers));
	});

	it('renders [data-chapter] children with time, color, and label', () => {
		const { container } = render(
			<WaveformPlaylist
				tracks={[
					{
						url: '/audio/a.mp3',
						title: 'Episode',
						chapters: [
							{ time: 0, label: 'Intro' },
							{ time: '5:30', label: 'Main topic', color: '#a855f7' },
						],
					},
				]}
			/>
		);

		const chapters = container.querySelectorAll('[data-chapter]');
		expect(chapters).toHaveLength(2);

		const first = chapters[0] as HTMLElement;
		expect(first.dataset.time).toBe('0');
		expect(first.textContent).toBe('Intro');
		expect(first.hasAttribute('data-color')).toBe(false);

		const second = chapters[1] as HTMLElement;
		expect(second.dataset.time).toBe('5:30');
		expect(second.dataset.color).toBe('#a855f7');
		expect(second.textContent).toBe('Main topic');
	});

	it('renders a track with no chapters as an empty [data-track]', () => {
		const { container } = render(
			<WaveformPlaylist tracks={[{ url: '/audio/a.mp3', title: 'No chapters' }]} />
		);
		const el = container.querySelector('[data-track]') as HTMLElement;
		expect(el.querySelectorAll('[data-chapter]')).toHaveLength(0);
	});
});

// ─── Option pass-through ─────────────────────────────────────────────────

describe('<WaveformPlaylist> — option pass-through', () => {
	it('forwards playlist + player options into the options bag', async () => {
		render(
			<WaveformPlaylist
				tracks={TWO_TRACKS}
				layout="minimal"
				continuous
				expandChapters={false}
				showDuration={false}
				showChapterMarkers
				chapterMarkerColor="#abc"
				showPlayState={false}
				waveformStyle="bars"
				height={80}
				barWidth={3}
				colorPreset="dark"
				progressColor="#def"
				showPlaybackSpeed
				showBPM
			/>
		);
		await waitForMount();
		const { opts } = ctorCalls[0];

		expect(opts.layout).toBe('minimal');
		expect(opts.continuous).toBe(true);
		expect(opts.expandChapters).toBe(false);
		expect(opts.showDuration).toBe(false);
		expect(opts.showChapterMarkers).toBe(true);
		expect(opts.chapterMarkerColor).toBe('#abc');
		expect(opts.showPlayState).toBe(false);
		expect(opts.waveformStyle).toBe('bars');
		expect(opts.height).toBe(80);
		expect(opts.barWidth).toBe(3);
		expect(opts.colorPreset).toBe('dark');
		expect(opts.progressColor).toBe('#def');
		expect(opts.showPlaybackSpeed).toBe(true);
		expect(opts.showBPM).toBe(true);
	});

	it('does not pass options for props the consumer omitted', async () => {
		render(<WaveformPlaylist tracks={TWO_TRACKS} />);
		await waitForMount();
		const { opts } = ctorCalls[0];

		expect('layout' in opts).toBe(false);
		expect('continuous' in opts).toBe(false);
		expect('waveformStyle' in opts).toBe(false);
		expect('height' in opts).toBe(false);
		expect('showBPM' in opts).toBe(false);
	});

	it('forwards arrays as-is (playbackRates)', async () => {
		const rates = [0.5, 1, 2];
		render(<WaveformPlaylist tracks={TWO_TRACKS} playbackRates={rates} />);
		await waitForMount();
		expect(ctorCalls[0].opts.playbackRates).toEqual(rates);
	});
});

// ─── Lifecycle: unmount + re-mount on identity change ────────────────────

describe('<WaveformPlaylist> — lifecycle', () => {
	it('calls destroy() on unmount', async () => {
		const { unmount } = render(<WaveformPlaylist tracks={TWO_TRACKS} />);
		await waitForMount();
		const { stub } = ctorCalls[0];

		unmount();
		expect(stub.destroy).toHaveBeenCalledTimes(1);
	});

	it('re-mounts when the tracks array changes (destroys old, constructs new)', async () => {
		const { rerender } = render(<WaveformPlaylist tracks={TWO_TRACKS} />);
		await waitForMount();
		expect(ctorCalls).toHaveLength(1);

		rerender(
			<WaveformPlaylist
				tracks={[
					{ url: '/audio/c.mp3', title: 'Track C' },
					{ url: '/audio/d.mp3', title: 'Track D' },
					{ url: '/audio/e.mp3', title: 'Track E' },
				]}
			/>
		);
		await waitForMount(2);

		expect(ctorCalls).toHaveLength(2);
		// First instance got destroyed during the re-mount.
		expect(ctorCalls[0].stub.destroy).toHaveBeenCalled();
	});

	it('re-mounts when layout changes', async () => {
		const { rerender } = render(<WaveformPlaylist tracks={TWO_TRACKS} layout="list" />);
		await waitForMount();

		rerender(<WaveformPlaylist tracks={TWO_TRACKS} layout="minimal" />);
		await waitForMount(2);

		expect(ctorCalls).toHaveLength(2);
		expect(ctorCalls[1].opts.layout).toBe('minimal');
	});

	it('does NOT re-mount when only className changes', async () => {
		const { rerender } = render(<WaveformPlaylist tracks={TWO_TRACKS} className="a" />);
		await waitForMount();
		expect(ctorCalls).toHaveLength(1);

		rerender(<WaveformPlaylist tracks={TWO_TRACKS} className="b" />);
		await new Promise<void>((resolve) => setTimeout(resolve, 50));
		expect(ctorCalls).toHaveLength(1);
	});
});

// ─── forwardRef + imperative handle ──────────────────────────────────────

describe('<WaveformPlaylist> — imperative ref', () => {
	it('exposes selectTrack / nextTrack / previousTrack / seekToChapter', async () => {
		const ref = createRef<WaveformPlaylistHandle>();
		render(<WaveformPlaylist ref={ref} tracks={TWO_TRACKS} />);
		await waitForMount();
		const { stub } = ctorCalls[0];

		ref.current?.selectTrack(1);
		ref.current?.nextTrack();
		ref.current?.previousTrack();
		ref.current?.seekToChapter(0, 90);

		expect(stub.selectTrack).toHaveBeenCalledWith(1);
		expect(stub.nextTrack).toHaveBeenCalledTimes(1);
		expect(stub.previousTrack).toHaveBeenCalledTimes(1);
		expect(stub.seekToChapter).toHaveBeenCalledWith(0, 90);
	});

	it('forwards getPlayer / getCurrentTrackIndex / getTracks return values', async () => {
		const ref = createRef<WaveformPlaylistHandle>();
		render(<WaveformPlaylist ref={ref} tracks={TWO_TRACKS} />);
		await waitForMount();
		const { stub } = ctorCalls[0];

		expect(ref.current?.getPlayer()).toEqual({ id: 'player' });
		expect(ref.current?.getCurrentTrackIndex()).toBe(2);
		expect(ref.current?.getTracks()).toHaveLength(2);
		expect(stub.getPlayer).toHaveBeenCalled();
		expect(stub.getCurrentTrackIndex).toHaveBeenCalled();
		expect(stub.getTracks).toHaveBeenCalled();
	});

	it('exposes the raw instance on ref.current.instance', async () => {
		const ref = createRef<WaveformPlaylistHandle>();
		render(<WaveformPlaylist ref={ref} tracks={TWO_TRACKS} />);
		await waitForMount();

		expect(ref.current?.instance).toBeTruthy();
		// The instance carries the playlist's methods.
		expect(typeof (ref.current?.instance as { nextTrack?: unknown }).nextTrack).toBe('function');
	});

	it('handle methods are safe no-ops before the instance mounts', () => {
		const ref = createRef<WaveformPlaylistHandle>();
		render(<WaveformPlaylist ref={ref} tracks={TWO_TRACKS} />);

		// Synchronously after render the async import hasn't resolved yet, so
		// the instance is null — calls must not throw and getters return
		// sensible fallbacks.
		expect(() => ref.current?.nextTrack()).not.toThrow();
		expect(ref.current?.getCurrentTrackIndex()).toBe(0);
		expect(ref.current?.getTracks()).toEqual([]);
		expect(ref.current?.getPlayer()).toBeNull();
		expect(ref.current?.instance).toBeNull();
	});
});
