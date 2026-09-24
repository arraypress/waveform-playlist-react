/**
 * test/forwarding-drift.test.tsx
 * ------------------------------
 *
 * Forwarding-drift guard. The props type inherits every option from the
 * two cores, but the runtime forward list (`buildPlaylistOptions` + the
 * remount deps) is hand-written — so an option a core adds typechecks here
 * and is silently dropped unless someone wires it. That is exactly how
 * `crossOrigin`, `waveformGradient`, `seekHandle`, `buttonSize`,
 * `buttonRadius` and `artworkPosition` went missing.
 *
 * Every key of `WaveformPlaylistOptions` and `WaveformPlayerOptions` (read
 * from the installed cores' `index.d.ts`, see `option-surface.ts`) must
 * either be forwarded — and re-mount the playlist when it changes — or be
 * listed in `NOT_FORWARDED` with the reason. Adding an option to a core
 * without deciding which fails this file.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { WaveformPlaylist } from '../src/WaveformPlaylist';
import type { WaveformPlaylistProps } from '../src/types';
import { ALL_OPTIONS, PLAYER_OPTIONS, PLAYLIST_OPTIONS, isCallback } from './option-surface';

/**
 * Options deliberately NOT forwarded to the playlist constructor.
 * `layout` is absent on purpose: it exists on both surfaces, and the
 * wrapper forwards the playlist's (which the playlist keeps from its
 * embedded player).
 */
const NOT_FORWARDED: Record<string, string> = {
	// Per-track content — rendered on each [data-track] from `tracks`.
	url: 'per-track: the track element\'s data-url',
	src: 'alias of url; per-track',
	title: 'per-track: data-title',
	artist: 'per-track: data-artist',
	artwork: 'per-track: data-artwork',
	album: 'per-track: data-album',
	markers: 'per-track: data-markers',
	waveform: 'per-track: data-waveform',
	// Aliases / collisions.
	style: 'alias of waveformStyle; `style` is the host div\'s inline CSS here',
	// Owned by the playlist.
	audioMode: 'the playlist always owns its audio (1.8.0 ignores the option)',
};

const FORWARDED = ALL_OPTIONS.filter((key) => !(key in NOT_FORWARDED));
const VALUES = FORWARDED.filter((key) => !isCallback(key));
const CALLBACKS = FORWARDED.filter(isCallback);

const ctorCalls: Array<Record<string, unknown>> = [];

vi.mock('@arraypress/waveform-playlist', () => {
	const Ctor = vi.fn(function (this: { destroy: () => void }, el: HTMLElement, opts: Record<string, unknown>) {
		ctorCalls.push(opts);
		this.destroy = () => {};
		// A DOM mutation wakes testing-library's waitFor immediately.
		el.setAttribute('data-mounts', String(ctorCalls.length));
	});
	return { default: Ctor, WaveformPlaylist: Ctor };
});

beforeEach(() => {
	cleanup();
	ctorCalls.length = 0;
});

const TRACKS = [{ url: '/a.mp3' }];

/** Render with arbitrary (untyped) option props. */
const el = (extra: Record<string, unknown>) => (
	<WaveformPlaylist tracks={TRACKS} {...(extra as Partial<WaveformPlaylistProps>)} />
);

describe('forwarding drift', () => {
	it('reads a plausible option surface from both cores', () => {
		expect(PLAYER_OPTIONS.length).toBeGreaterThan(40);
		expect(PLAYER_OPTIONS).toContain('crossOrigin');
		expect(PLAYER_OPTIONS).toContain('onTimeUpdate');
		expect(PLAYLIST_OPTIONS).toContain('continuous');
		expect(PLAYLIST_OPTIONS).toContain('barPosition');
	});

	it('NOT_FORWARDED lists only real options (no stale entries)', () => {
		expect(Object.keys(NOT_FORWARDED).filter((key) => !ALL_OPTIONS.includes(key))).toEqual([]);
	});

	it('forwards every other option into the constructor options', async () => {
		const props = Object.fromEntries(VALUES.map((key) => [key, `__${key}__`]));
		render(el(props));
		await waitFor(() => expect(ctorCalls).toHaveLength(1));

		const dropped = VALUES.filter((key) => ctorCalls[0][key] !== `__${key}__`);
		expect(dropped, 'options neither forwarded nor in NOT_FORWARDED').toEqual([]);
	});

	it('re-mounts when any forwarded option changes', { timeout: 30_000 }, async () => {
		const props: Record<string, unknown> = Object.fromEntries(VALUES.map((key) => [key, `__${key}__`]));
		const { rerender } = render(el(props));
		await waitFor(() => expect(ctorCalls).toHaveLength(1));

		const stale: string[] = [];
		for (const key of VALUES) {
			const before = ctorCalls.length;
			props[key] = `__${key}__changed`;
			rerender(el({ ...props }));
			try {
				await waitFor(() => expect(ctorCalls.length).toBeGreaterThan(before), { timeout: 250 });
			} catch {
				stale.push(key);
			}
		}
		expect(stale, 'forwarded options missing from the remount deps').toEqual([]);
	});

	it('forwards every callback option, reaching the prop handler', async () => {
		const handlers = Object.fromEntries(CALLBACKS.map((key) => [key, vi.fn()]));
		render(el(handlers));
		await waitFor(() => expect(ctorCalls).toHaveLength(1));

		const dropped = CALLBACKS.filter((key) => {
			const fn = ctorCalls[0][key];
			if (typeof fn !== 'function') return true;
			fn('x');
			return !handlers[key].mock.calls.length;
		});
		expect(dropped, 'callbacks neither forwarded nor in NOT_FORWARDED').toEqual([]);
	});
});
