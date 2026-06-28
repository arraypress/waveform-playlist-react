# Changelog

All notable changes to `@arraypress/waveform-playlist-react` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — Unreleased

Initial release.

### Added

- `<WaveformPlaylist>` React component wrapping
  `@arraypress/waveform-playlist`:
  - A declarative, required `tracks` array
    (`WaveformPlaylistTrackInput[]`) rendered into the `[data-track]` /
    `[data-chapter]` child markup the playlist constructor parses on
    mount. Each track accepts `url`, `title`, `subtitle`, `artwork`,
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
