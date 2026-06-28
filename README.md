# @arraypress/waveform-playlist-react

React component wrapper around [`@arraypress/waveform-playlist`](https://github.com/arraypress/waveform-playlist). `forwardRef`-friendly, `useEffect` lifecycle, a declarative `tracks` array, typed props, and an imperative handle for `selectTrack() / nextTrack() / previousTrack()` that mirrors the underlying instance.

The core libraries stay zero-dependency vanilla-JS packages that work anywhere a `<script>` tag does. This package adds the framework-native ergonomics React developers expect — pass tracks as data, not markup.

```tsx
import { WaveformPlaylist } from '@arraypress/waveform-playlist-react';

function App() {
  return (
    <WaveformPlaylist
      tracks={[
        { url: '/audio/a.mp3', title: 'Track A' },
        { url: '/audio/b.mp3', title: 'Track B' },
      ]}
    />
  );
}
```

## Installation

```bash
npm install @arraypress/waveform-playlist-react @arraypress/waveform-playlist @arraypress/waveform-player react
```

`react` (^18 or ^19), `@arraypress/waveform-playlist` (^1.3), and `@arraypress/waveform-player` (^1.8) are peer dependencies — you bring them so you control the versions.

## Setup

Import both cores' CSS **once** in your app entry (Vite `main.tsx`, Next.js `app/layout.tsx`, Remix `root.tsx`, etc.):

```ts
import '@arraypress/waveform-player/dist/waveform-player.css';
import '@arraypress/waveform-playlist/dist/waveform-playlist.css';
```

The playlist constructs a `WaveformPlayer` for the active track, so the **player core must be available as `window.WaveformPlayer`** before the playlist mounts. The simplest way is to import the player package for its global side effect once at your entry:

```ts
import '@arraypress/waveform-player'; // registers window.WaveformPlayer
```

The wrapper does **not** import CSS or the player global for you — your bundler should own those decisions. The playlist's JS is loaded dynamically inside `useEffect`, so SSR / RSC environments don't trip over the browser-only audio APIs.

## How it works

The vanilla `WaveformPlaylist` constructor reads its tracks from `[data-track]` child markup, then auto-initialises. This wrapper renders that markup declaratively from your `tracks` prop into a host `<div>`, then constructs a `WaveformPlaylist` over it inside `useEffect`. The host deliberately does **not** carry `data-waveform-playlist` — that attribute drives the library's global auto-init and would double-mount.

## Usage

### Music playlist with artwork

```tsx
<WaveformPlaylist
  tracks={[
    { url: '/audio/song-1.mp3', title: 'Summer Vibes', subtitle: 'Beach Sounds', artwork: '/img/1.jpg', duration: '3:45' },
    { url: '/audio/song-2.mp3', title: 'Night Drive', subtitle: 'Synthwave Mix', artwork: '/img/2.jpg', duration: '4:12' },
  ]}
  continuous
  showPlayState
/>
```

### Podcast with clickable chapters

A single track with chapters shows the chapter list **and** renders the chapters as waveform markers (smart default).

```tsx
<WaveformPlaylist
  tracks={[
    {
      url: '/audio/episode-42.mp3',
      title: 'Episode 42: AI Revolution',
      subtitle: 'with Dr. Sarah Chen',
      chapters: [
        { time: 0, label: 'Introduction' },
        { time: '5:30', label: 'Main Topic', color: '#a855f7' },
        { time: '45:00', label: 'Q&A Session' },
      ],
    },
  ]}
  height={80}
/>
```

Chapter `time` accepts a number of seconds (`90`) or a timestamp string (`'1:30'`).

### Minimal button layout

```tsx
<WaveformPlaylist
  tracks={[
    { url: '/audio/beat-1.mp3', title: 'Trap Beat' },
    { url: '/audio/beat-2.mp3', title: 'Lo-Fi' },
  ]}
  layout="minimal"
/>
```

### Imperative navigation via ref

For "next / previous / play track N" flows where wiring through props is awkward:

```tsx
import { useRef } from 'react';
import { WaveformPlaylist, type WaveformPlaylistHandle } from '@arraypress/waveform-playlist-react';

function Controlled() {
  const ref = useRef<WaveformPlaylistHandle>(null);

  return (
    <>
      <WaveformPlaylist ref={ref} tracks={tracks} continuous />
      <button onClick={() => ref.current?.previousTrack()}>Previous</button>
      <button onClick={() => ref.current?.nextTrack()}>Next</button>
      <button onClick={() => ref.current?.selectTrack(2)}>Jump to track 3</button>
    </>
  );
}
```

The handle methods (`selectTrack()`, `seekToChapter()`, `nextTrack()`, `previousTrack()`, `getPlayer()`, `getCurrentTrackIndex()`, `getTracks()`) pass straight through to the underlying instance. `ref.current?.getPlayer()` exposes the embedded `WaveformPlayer` (for `play()` / `pause()` / `seekTo()`), and `ref.current?.instance` exposes the raw playlist instance for anything the handle doesn't surface.

## How prop changes are handled

When **any** prop the cores use at construction time changes — `tracks` (serialised), `layout`, `continuous`, colours, sizing, etc. — the wrapper destroys the existing instance and creates a new one against the freshly-rendered markup. That's simpler and more correct than diffing every option and calling the right granular updater.

DOM-only props (`className`, `style`, `id`) do **not** trigger a re-mount.

## Props

### Tracks (required)

| Prop     | Type                          |
| -------- | ----------------------------- |
| `tracks` | `WaveformPlaylistTrackInput[]` |

Each `WaveformPlaylistTrackInput`:

| Field      | Type                              | Notes                                          |
| ---------- | --------------------------------- | ---------------------------------------------- |
| `url`      | `string` (required)               | Audio file URL                                 |
| `title`    | `string`                          | Falls back to the filename if omitted          |
| `subtitle` | `string`                          | Artist / description                           |
| `artwork`  | `string`                          | Album / episode artwork URL                    |
| `album`    | `string`                          | Forwarded to the Media Session API             |
| `duration` | `string`                          | Display duration, e.g. `'3:45'`                |
| `markers`  | `WaveformPlaylistMarker[]`        | Explicit waveform markers (separate from chapters) |
| `chapters` | `WaveformPlaylistChapterInput[]`  | `{ time, label, color? }`; `time` is seconds or `'M:SS'` |

### Playlist options

| Prop                 | Type                  | Default  |
| -------------------- | --------------------- | -------- |
| `layout`             | `'list' \| 'minimal'` | `'list'` |
| `continuous`         | `boolean`             | `false`  |
| `expandChapters`     | `boolean`             | `true`   |
| `showDuration`       | `boolean`             | `true`   |
| `showChapterMarkers` | `boolean \| null`     | `null`   |
| `chapterMarkerColor` | `string`              | —        |
| `showPlayState`      | `boolean`             | `true`   |

### Pass-through player options

Every visualisation / colour / playback / behaviour option from the core player surfaces as a typed prop and is forwarded to the embedded player: `waveformStyle`, `height`, `samples`, `barWidth`, `barSpacing`, `barRadius`, `colorPreset`, `waveformColor`, `progressColor`, `buttonColor`, `buttonHoverColor`, `textColor`, `textSecondaryColor`, `backgroundColor`, `borderColor`, `playbackRate`, `showPlaybackSpeed`, `playbackRates`, `showControls`, `showInfo`, `showTime`, `showHoverTime`, `showBPM`, `bpm`, `buttonAlign`, `buttonStyle`, `accessibleSeek`, `seekLabel`, `errorText`, `showMarkers`, `autoplay`, `singlePlay`, `playOnSeek`, `enableMediaSession`, `playIcon`, `pauseIcon`, `audioMode`, `preload`.

Per-track content (`url`, `title`, `subtitle`, `artwork`, `album`, `markers`) is **not** here — it comes from the `tracks` array.

### React-specific

| Prop        | Type                          |
| ----------- | ----------------------------- |
| `id`        | `string`                      |
| `className` | `string`                      |
| `style`     | `React.CSSProperties`         |
| `ref`       | `Ref<WaveformPlaylistHandle>` |

## TypeScript

```ts
import type {
  WaveformPlaylistProps,
  WaveformPlaylistHandle,
  WaveformPlaylistTrackInput,
  WaveformPlaylistChapterInput,
  WaveformPlaylistOptions,
  WaveformPlaylistTrack,
  WaveformPlaylistChapter,
  WaveformPlaylistMarker,
  WaveformStyle,
  ColorPreset,
  AudioMode,
  AudioPreload,
  ButtonAlign,
} from '@arraypress/waveform-playlist-react';
```

The package ships `.d.ts` for both ESM and CJS consumers.

## Testing

```bash
npm test          # one-shot
npm run test:watch
npm run typecheck
npm run build     # emit dist/index.js, dist/index.cjs, dist/index.d.ts
```

The core library is mocked at the module boundary (jsdom has no Web Audio API). Tests cover track-markup rendering, mount / unmount, option pass-through, ref forwarding, and identity-prop re-mount.

## License

MIT © ArrayPress
