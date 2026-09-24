# CLAUDE.md — @arraypress/waveform-playlist-react

React wrapper for `@arraypress/waveform-playlist`. Renders a declarative `tracks`
array into the `data-*` markup the playlist parses, and exposes a
`WaveformPlaylistHandle` via `ref` for imperative navigation.

## Commands
- `npm test` — vitest + jsdom (run before committing).
- `npm run build` — bundles to `dist/`. `prepublishOnly` runs it. `dist/` is gitignored.

## The rule that matters: two edits per option, both manual

`src/WaveformPlaylist.tsx`. **This follows the player-wrapper pattern, not the bar's
verbatim pass-through.** A new option needs:
1. `if (props.<key> !== undefined) opts.<key> = props.<key>;` in the options builder (~line 106+).
2. `props.<key>,` in the remount `useEffect` deps array (~line 220).

Skip (1) and it never reaches the playlist. Skip (2) and it works on mount but
ignores runtime changes.

## Conventions
- Types derive from **both** cores — `waveform-playlist` owns playlist options,
  `waveform-player` owns the visualisation options forwarded to embedded players.
  Both ship hand-authored `index.d.ts`, so the types can't drift; **the runtime
  forward list can.**
- Forward a new *player* option only if the playlist should pass it to its embedded
  players — usually yes (`preload`, `waveformStyle`, `height` all do) — never `audioMode`, which the playlist ignores since 1.8.0 (it always owns its audio).
- The playlist's JS is imported dynamically inside `useEffect` (SSR-safe).
- Add a test under `test/` + a `CHANGELOG.md` entry.

## History
`crossOrigin` shipped across the rest of the family in 2026-07 but was missed in
all four playlist wrappers — accepted by the types, silently dropped at runtime.
Fixed in 0.4.0. That miss is why this group is now steps 12–15 of the
`waveform-release` checklist rather than an afterthought.

## Cross-repo
One of 15 packages that must change together — load the `waveform-release` skill.
