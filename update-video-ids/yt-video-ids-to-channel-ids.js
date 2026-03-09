import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const videoIds = JSON.parse(
  readFileSync(resolve(__dirname, 'yt-video-ids.json'), 'utf-8'),
);

const BATCH_SIZE = 10;
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getChannelId(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch video ${videoId}: ${res.status}`);
  }

  const html = await res.text();

  // Extract channelId directly from the page HTML
  const match = html.match(/"channelId"\s*:\s*"(UC[^"]+)"/);
  if (!match) {
    throw new Error(`Could not find channelId for video ${videoId}`);
  }

  return match[1];
}

const channelIds = new Set();
let processed = 0;

for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
  const batch = videoIds.slice(i, i + BATCH_SIZE);

  await Promise.all(
    batch.map(async (videoId) => {
      try {
        const channelId = await getChannelId(videoId);
        channelIds.add(channelId);
        processed++;
        console.log(`[${processed}/${videoIds.length}] ${videoId} → ${channelId}`);
      } catch (err) {
        console.error(`[${processed}/${videoIds.length}] Skipping ${videoId}: ${err.message}`);
        processed++;
      }
    }),
  );

  if (i + BATCH_SIZE < videoIds.length) {
    await sleep(DELAY_MS);
  }
}

const result = Array.from(channelIds).sort();

writeFileSync(resolve(__dirname, 'yt-channel-ids-from-video-ids.json'), JSON.stringify(result, null, 2));
console.log(`\nDone. Saved ${result.length} unique channel IDs to yt-channel-ids.json`);

