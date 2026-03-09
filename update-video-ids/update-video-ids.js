import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import channelIds1 from './wct-channel-ids.json' with { type: 'json' };
import channelIds2 from './wct-channel-ids-from-video-ids.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));

async function getLiveVideoIds(channelId) {
  console.log(`Processing channel ${channelId}...`);
  try {
    const url = `https://www.youtube.com/channel/${channelId}/streams`;
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
    let ytInitialData = null;
    $('script').each((_, el) => {
      const content = $(el).html();
      if (content && content.includes('var ytInitialData =')) {
        const startIndex = content.indexOf('var ytInitialData =') + 'var ytInitialData ='.length;
        const jsonStart = content.indexOf('{', startIndex);
        if (jsonStart === -1) return;
        let depth = 0;
        let inString = false;
        let escape = false;
        let jsonEnd = -1;
        for (let i = jsonStart; i < content.length; i++) {
          const ch = content[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (ch === '\\' && inString) {
            escape = true;
            continue;
          }
          if (ch === '"') {
            inString = !inString;
            continue;
          }
          if (inString) continue;
          if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) {
              jsonEnd = i;
              break;
            }
          }
        }
        if (jsonEnd !== -1) {
          try {
            ytInitialData = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
          } catch {
            // ignore parse errors for this script tag
          }
        }
      }
    });
    if (!ytInitialData) {
      throw new Error('Could not find ytInitialData in page');
    }
    const tabs = ytInitialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
    const streamsTab = tabs.find((tab) =>
      tab.tabRenderer?.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes('/streams'),
    );
    if (!streamsTab) {
      throw new Error('Could not find streams tab');
    }
    const items = streamsTab.tabRenderer?.content?.richGridRenderer?.contents ?? [];
    const videoIds = items
      .filter((item) => {
        const overlays = item.richItemRenderer?.content?.videoRenderer?.thumbnailOverlays ?? [];
        return overlays.some((o) => o.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE');
      })
      .map((item) => item.richItemRenderer?.content?.videoRenderer?.videoId)
      .filter(Boolean);
    console.log(`Found ${videoIds.length} video ids`);
    console.log(videoIds);
    return videoIds;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getAllVideoIds() {
  const allVideoIds = [];
  const allChannelIds = [...new Set([...channelIds1, ...channelIds2])].sort();
  console.log(`Processing ${allChannelIds.length} channel IDs...`);
  for (let i = 0; i < allChannelIds.length; i++) {
    const channelId = allChannelIds[i];
    const channelVideoIds = await getLiveVideoIds(channelId);
    allVideoIds.push(...channelVideoIds);
    const percent = Math.round(((i + 1) / allChannelIds.length) * 100);
    console.log(`${percent}% done (${i + 1}/${allChannelIds.length})`);
  }
  allVideoIds.sort();
  console.log(`Found ${allVideoIds.length} video IDs`);
  return allVideoIds;
}

function writeVideoIdsFile(allVideoIds) {
  const outDir = resolve(__dirname, '../src/public');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'video-ids.json'), JSON.stringify(allVideoIds, null, 2));
  console.log(`Saved ${allVideoIds.length} video IDs to src/public/video-ids.json`);
}

async function go() {
  const allVideoIds = await getAllVideoIds();
  writeVideoIdsFile(allVideoIds);
}

go().then(null);
