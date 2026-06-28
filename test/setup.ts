/**
 * test/setup.ts
 * -------------
 *
 * Per-suite setup imported by Vitest. Brings in
 * `@testing-library/jest-dom`'s expect matchers so tests can use
 * `expect(el).toBeInTheDocument()` and friends without re-adding the
 * import in every file.
 *
 * It also installs a stub `window.WaveformPlayer`. The real
 * `WaveformPlaylist` constructor throws if `window.WaveformPlayer` is
 * absent — we mock the whole playlist module at the boundary so the
 * guard never actually runs, but stubbing it here keeps the environment
 * honest for any test (or future code) that touches the global directly.
 */
import '@testing-library/jest-dom/vitest';

// Minimal stand-in for the core player global the playlist depends on.
// jsdom has no Web Audio / Canvas, so this is intentionally inert.
(globalThis as unknown as { window?: Record<string, unknown> }).window ??= globalThis as never;
const w = globalThis as unknown as { WaveformPlayer?: unknown };
if (typeof w.WaveformPlayer === 'undefined') {
	const Stub = function () {} as unknown as { new (): unknown; init?: () => void };
	Stub.init = () => {};
	w.WaveformPlayer = Stub;
}
