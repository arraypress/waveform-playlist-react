# Changelog

All notable changes to `@arraypress/waveform-playlist-react` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added

- The hero and grid layouts: `layout` now accepts `'hero'` and `'grid'`
  alongside `'list'` / `'minimal'` (it was typed `'list' | 'minimal'`
  although both ship in the core), and their options are typed props,
  forwarded to the playlist and in the remount dependency array:
  `showArtist`, `coverSize`, `thumbnailSize`, `density`
  (`'comfortable' | 'compact'`), `coverPosition` (`'left' | 'top'`) and
  `barPosition` (`'top' | 'bottom'`). Exported as
  `WaveformPlaylistLayoutProps`. Types come from the playlist core's
  `index.d.ts` (1.8.0 declares them all); against an older core they fall
  back to the same 1.8.0 shapes instead of degrading to `unknown`.
- Player callback props — `onLoad`, `onPlay`, `onPause`, `onEnd`,
  `onTimeUpdate`, `onError`, `onNextTrack`, `onPreviousTrack` — forwarded
  to the embedded player. Playlist 1.8.0 runs them after its own handling
  (before, it overwrote them, which is why the wrapper didn't offer them;
  `onNextTrack` / `onPreviousTrack` were even accepted by the props type
  and silently dropped). Handed over as stable trampolines that read the latest prop, so a new
  handler never re-mounts the playlist.
- Per-track `waveform` peaks on `WaveformPlaylistTrackInput`
  (`number[] | string`), rendered as the track's `data-waveform`: an array
  is JSON-encoded, a string (e.g. a `.json` peaks URL) passed through.
  With peaks the player skips decoding that track's audio. Playlist 1.8.0
  is the first version that reads `data-waveform`.

### Fixed

- `waveformGradient`, `seekHandle`, `buttonSize`, `buttonRadius` and
  `artworkPosition` reach the embedded player. All five are core player
  options the props type inherited, but the options builder never
  forwarded them — they typechecked and were silently dropped. They are
  now forwarded and in the remount dependency array.

### Changed

- **Requires `@arraypress/waveform-playlist@^1.8.0`** (was `^1.7.2`) —
  the upcoming release that makes these props work. Before it, the
  playlist ignored the constructor options this wrapper passes
  (`expandChapters`, `showDuration`, `showPlayState`, `showChapterMarkers`,
  `chapterMarkerColor`), leaked `layout` into the embedded player (fixed
  in 1.7.4), overwrote the forwarded callbacks, never read
  `data-waveform`, and its `destroy()` wiped the rendered tracks, so any
  prop change re-mounted an empty playlist. With 1.8.0 a re-mount keeps
  the tracks (now covered by a test).
- **Requires `@arraypress/waveform-player@^1.24.5`** (was `^1.23.0`), the
  playlist core's own floor.

### Removed

- The `audioMode` prop. The playlist always owns its audio, and an
  `'external'` embedded player dispatches request-play events nobody
  answers — a playlist that never plays. It was forwarded to the
  constructor; `@arraypress/waveform-playlist@1.8.0` ignores it, and the
  wrapper no longer accepts or forwards it.

## [0.4.0] — 2026-08-07

### Added

- Forward the core player's `crossOrigin` option to the embedded player.
  Forwarded in the constructor options builder and added to the
  remount `useEffect` dependency array.
  This option shipped across the rest of the waveform family in
  `@arraypress/waveform-player@1.23.0` but was missed in the playlist
  wrappers, so it was previously accepted by the types and silently
  dropped at runtime. Requires `@arraypress/waveform-player@^1.23.0`
  and `@arraypress/waveform-playlist@^1.7.2` (the version that began
  forwarding it to each track's player).

## [0.3.0] — 2026-07-05

### Added

- Forward the core player's new localizable UI-string options —
  `seekValueText`, `playPauseLabel`, `speedLabel`, `artworkAlt`, and
  `unknownTrackText` — through to the underlying player. Requires
  `@arraypress/waveform-player@^1.20.0`.

## [0.1.0] — Unreleased

Initial release.

### Added

- `<WaveformPlaylist>` React component wrapping
  `@arraypress/waveform-playlist`:
  - A declarative, required `tracks` array
    (`WaveformPlaylistTrackInput[]`) rendered into the `[data-track]` /
    `[data-chapter]` child markup the playlist constructor parses on
    mount. Each track accepts `url`, `title`, `artist`, `artwork`,
    `album`, `duration`, `markers`, and `chapters`
    (`{ time, label, color? }`, where `time` is a seconds number or a
    `'M:SS'` string).
  - Playlist options as typed props: `layout` (`'list' | 'minimal'`),
    `continuous`, `expandChapters`, `showDuration`,
    `showChapterMarkers`, `chapterMarkerColor`, `showPlayState`.
  - Pass-through player options forwarded to the embedded player
    (`waveformStyle`, `height`, `samples`, `barWidth`, `barSpacing`,
    `barRadius`, colours, `playbackRate`, `showPlaybackSpeed`,
    `playbackRates`, UI toggles, `accessibleSeek`, `seekLabel`,
    `errorText`, behaviour flags, icons, `audioMode`, `preload`).
  - React-specific extras: `id`, `className`, `style`, and `ref`
    forwarding via `WaveformPlaylistHandle`.
- `WaveformPlaylistHandle` imperative API on the forwarded ref —
  `selectTrack()`, `seekToChapter()`, `nextTrack()`, `previousTrack()`,
  `getPlayer()`, `getCurrentTrackIndex()`, `getTracks()`, plus the raw
  `instance` escape hatch.
- SSR / RSC safe: the playlist library is loaded via dynamic
  `import('@arraypress/waveform-playlist')` inside the effect so the
  browser-only audio surface never runs server-side.
- Identity-prop re-mount: when any construction prop changes — the
  serialised `tracks`, `layout`, `continuous`, colours, sizing, etc. —
  the wrapper destroys the existing instance and creates a new one
  against the freshly-rendered markup. DOM-only props (`className`,
  `style`, `id`) do not trigger a re-mount.
- The host container deliberately omits `data-waveform-playlist` so the
  library's global auto-init never double-mounts on top of the instance
  the wrapper creates explicitly.
- Public TypeScript types: `WaveformPlaylistProps`,
  `WaveformPlaylistHandle`, `WaveformPlaylistTrackInput`,
  `WaveformPlaylistChapterInput`, plus the re-exported core types
  (`WaveformPlaylistOptions`, `WaveformPlaylistTrack`,
  `WaveformPlaylistChapter`, `WaveformPlaylistMarker`, `WaveformStyle`,
  `WaveformMarker`, `WaveformPeaks`, `ColorPreset`, `AudioMode`,
  `AudioPreload`, `ButtonAlign`).
- Vitest test suite (jsdom + `@testing-library/react`) covering
  track / chapter markup rendering, mount, unmount destroy, option
  pass-through, identity-prop re-mount, ref forwarding, and the full
  imperative handle surface. The core library is mocked at the module
  boundary because jsdom has no Web Audio API.
- Dual ESM (`dist/index.js`) + CJS (`dist/index.cjs`) build via `tsup`,
  with `.d.ts` for both. React and both `@arraypress/waveform-*` cores
  are externalised so they resolve to the consumer's copies.
- README with full prop reference and usage patterns, and
  `examples/basic.tsx` with seven copy-paste-ready snippets.

### Peer dependencies

- `@arraypress/waveform-playlist` `^1.3.0`
- `@arraypress/waveform-player` `^1.8.0`
- `react` `^18.0.0 || ^19.0.0`
