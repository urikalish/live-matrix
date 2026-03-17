# ⚡ LiveMatrix

A browser-based YouTube live-stream dashboard that renders an auto-playing, muted grid of embeddable YouTube live streams from a curated list of channels.

---

## Features

- **Video grid** – Renders a configurable grid of embedded YouTube videos (up to 7 × 6 cells), each 16:9, filling the full viewport.
- **Grid layout switcher** – Buttons in the masthead let you instantly switch between preset grid sizes (1×1 up to 7×6). The chosen layout is persisted in `localStorage`.
- **Shuffle** – Randomises the order of all un-pinned videos and reloads the grid. Pinned cells stay stable.
- **Per-cell overlay** (appears on hover):
  | Button | Action |
  |--------|--------|
  | 📌 | Pin / unpin the video so it survives shuffles |
  | 📺 | Open the video on YouTube in a new tab |
  | ⏭ | Skip to a different random video |
- **Pin persistence** – Pinned video IDs are saved in `localStorage` and restored on the next visit. Stale IDs are reconciled automatically during data refresh.
- **Search** – Debounced search bar (250 ms) in the masthead queries channel IDs, handles, names, video IDs, and titles. Selecting a result places that video in the first un-pinned cell.
- **Responsive resize** – The grid re-renders automatically when the browser window is resized.
- **Scheduled automation** – Ships with a GitHub Actions workflow that can auto-refresh video data daily.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript |
| Bundler | Vite 7 |
| Linting | ESLint 10 + typescript-eslint + eslint-plugin-prettier |
| Formatting | Prettier |
| Font | Google Fonts – *Play* |
| Data update script | Node.js (ESM), cheerio, dotenv |

---

## Project Structure

```text
.
├── src/
│   ├── index.html              # App shell
│   ├── main.ts                 # Entry point – bootstraps modules in order
│   ├── vite-env.d.ts
│   ├── code/
│   │   ├── settings.ts         # Grid size state + localStorage persistence
│   │   ├── videos.ts           # Data loading, search, shuffle, pin state
│   │   ├── masthead.ts         # Top controls, search UI, layout buttons
│   │   └── ui.ts               # Matrix rendering, cell overlays, event wiring
│   ├── style/
│   │   └── style.css           # Full dark-theme stylesheet
│   └── public/
│       ├── favicon.svg
│       └── videos.json         # Generated channel/video payload consumed at runtime
├── update-videos/
│   ├── channel-ids.json        # Master list of YouTube channel IDs to track
│   ├── channels-no-videos.json # Channels with zero live videos (with first-seen date)
│   ├── update-videos.js        # Main scraper/updater script
│   └── wct/                    # Helper data/scripts for channel-ID derivation
└── .github/workflows/
    └── scheduled-videos-update.yml  # Daily scheduled video refresh
```

---

## Getting Started

### Prerequisites

- Node.js 22+ (GitHub Actions uses Node 22)
- Yarn (or npm)

### Install dependencies

```bash
yarn install
```

### Run the dev server

```bash
yarn dev
```

Vite serves the app from the `src/` directory. Open `http://localhost:5173` in your browser.

### Build for production

```bash
yarn build
```

The production bundle is written to `dist/`.

### Preview the production build

```bash
yarn preview
```

---

## Runtime Behavior

The app initialises in this order (`src/main.ts`):

1. `settings.init()` – loads persisted grid size from `localStorage`.
2. `videos.init()` – fetches and validates `/videos.json`, restores pinned state, and shuffles videos.
3. `masthead.init()` – builds layout buttons and attaches search handlers.
4. `ui.init()` – wires event handlers and renders the matrix grid.

### Search

Search matches against channel ID, channel handle, channel name, video ID, and video title.

### Pinning

Pinned video IDs are stored in `localStorage` under `live-matrix.pinned-video-ids`.
During data refresh, pinned IDs are reconciled so stale IDs are removed automatically.

---

## Data Format (`src/public/videos.json`)

Top-level JSON array of channels:

```json
[
  {
    "id": "UC...",
    "handle": "@channelHandle",
    "name": "Channel Name",
    "videos": [
      {
        "id": "videoId",
        "title": "Live stream title"
      }
    ]
  }
]
```

---

## Updating the Video List

The `update-videos` script scrapes the *Streams* tab of every YouTube channel listed in `update-videos/channel-ids.json`, filters out non-embeddable videos, and writes the result to `src/public/videos.json`.

### 1. Obtain a YouTube Data API browse key

The script uses the internal `youtubei/v1/browse` endpoint, which requires a browser API key (`AIza…`). You can copy it from any YouTube network request in DevTools.

### 2. Provide the key

**Option A – `.env` file (local development)**

Create a `.env` file in the project root:

```env
UPDATE_VIDEOS_YOUTUBEI_BROWSE_KEY=AIzaSy...
```

**Option B – environment variable (CI / GitHub Actions)**

```bash
export UPDATE_VIDEOS_YOUTUBEI_BROWSE_KEY=AIzaSy...
```

### 3. Run the update

```bash
yarn update
```

The script processes all channels with a concurrency of 10 and prints progress. On completion it updates:

- `src/public/videos.json` – the runtime data file
- `update-videos/channel-ids.json` – de-duplicated and sorted
- `update-videos/channels-no-videos.json` – channels that currently have no live streams, with their first-observed date

### Managing channels

Add or remove YouTube channel IDs (the `UCxxx…` format) in `update-videos/channel-ids.json`. The script de-duplicates and sorts the list on every run.

---

## Scheduled Automation

`.github/workflows/scheduled-videos-update.yml` runs daily at midnight UTC (and on manual dispatch):

1. Installs dependencies.
2. Runs `yarn update`.
3. Commits and pushes changed data files when needed.

The workflow reads the API key from the repository secret `UPDATE_VIDEOS_YOUTUBEI_BROWSE_KEY`.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Start Vite dev server |
| `yarn build` | Type-check + production build |
| `yarn preview` | Preview the production build locally |
| `yarn update` | Scrape YouTube and refresh `videos.json` |
| `yarn format` | Format all `src` TypeScript, CSS and HTML files with Prettier |
| `yarn lint` | Lint TypeScript sources with ESLint |
| `yarn full` | Format → lint → build |

---

## Notes

- Vite root is `src/` and build output is `dist/`.
- `dist/` and `.env` are git-ignored.
- The `update-videos/wct/` folder contains helper scripts and data used to derive channel IDs from known video IDs.

---

## License

[MIT](https://opensource.org/licenses/MIT)

