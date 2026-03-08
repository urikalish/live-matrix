import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import channels from './channels.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));

async function getLiveStreamVideoIds(channelName) {
  const url = `https://www.youtube.com/@${channelName}/streams`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Find the script tag containing ytInitialData
  let ytInitialData = null;

  $('script').each((_, el) => {
    const content = $(el).html();
    if (content && content.includes('var ytInitialData =')) {
      // Extract the JSON between "var ytInitialData = " and the closing semicolon
      const match = content.match(/var ytInitialData\s*=\s*(\{.*?);/s);
      if (match) {
        ytInitialData = JSON.parse(match[1]);
      }
    }
  });

  if (!ytInitialData) {
    throw new Error('Could not find ytInitialData in page');
  }

  // Navigate the nested structure to find video renderers
  const tabs = ytInitialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];

  const streamsTab = tabs.find((tab) =>
    tab.tabRenderer?.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes('/streams'),
  );

  if (!streamsTab) {
    throw new Error('Could not find streams tab');
  }

  const items = streamsTab.tabRenderer?.content?.richGridRenderer?.contents ?? [];

  return items
    .map((item) => {
      const videoId = item.richItemRenderer?.content?.videoRenderer?.videoId;
      return videoId ?? null;
    })
    .filter(Boolean);
}

const allVideoIds = [];
for (let channelName of channels) {
  const channelIds = await getLiveStreamVideoIds(channelName);
  allVideoIds.push(...channelIds);
}

const outDir = resolve(__dirname, '../src/public');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'video-ids.json'), JSON.stringify(allVideoIds, null, 2));
console.log(`Saved ${allVideoIds.length} video IDs to src/public/video-ids.json`);
