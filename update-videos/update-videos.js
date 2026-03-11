import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import channelIds from './yt-channel-ids.json' with { type: 'json' };
const __dirname = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------------------------------------------------------ */

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/* ------------------------------------------------------------------------------------------------------------------ */

function extractChannelInfo(html) {
  console.log(`Extracting channel info...`);
  let channelName = '';
  let channelHandle = '';
  let channelId = '';

  // --- Extract channel name ---

  // Method 1: og:title meta tag (most reliable)
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
  if (ogTitleMatch) {
    channelName = ogTitleMatch[1];
  }

  // Method 2: <title> tag fallback — typically "ChannelName - YouTube"
  if (!channelName) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      channelName = titleMatch[1].replace(/\s*-\s*YouTube\s*$/, '').trim();
    }
  }

  // Method 3: channelMetadataRenderer in the initial data JSON
  if (!channelName) {
    const metaMatch = html.match(/"channelMetadataRenderer":\s*\{[^}]*"title"\s*:\s*"([^"]+)"/);
    if (metaMatch) {
      channelName = metaMatch[1];
    }
  }

  // --- Extract channel handle ---

  // Method 1: canonical URL contains the handle
  const canonicalMatch = html.match(
    /<link\s+rel="canonical"\s+href="https?:\/\/www\.youtube\.com\/(@[^"/]+)"/,
  );
  if (canonicalMatch) {
    channelHandle = decodeURIComponent(canonicalMatch[1]);
  }

  // Method 2: og:url meta tag
  if (!channelHandle) {
    const ogUrlMatch = html.match(
      /<meta\s+property="og:url"\s+content="https?:\/\/www\.youtube\.com\/(@[^"/]+)"/,
    );
    if (ogUrlMatch) {
      channelHandle = decodeURIComponent(ogUrlMatch[1]);
    }
  }

  // Method 3: vanityChannelUrl in the JSON data
  if (!channelHandle) {
    const vanityMatch = html.match(
      /"vanityChannelUrl"\s*:\s*"https?:\/\/www\.youtube\.com\/(@[^"]+)"/,
    );
    if (vanityMatch) {
      channelHandle = decodeURIComponent(vanityMatch[1]);
    }
  }

  // Method 4: fall back to any @handle pattern in URLs
  if (!channelHandle) {
    const urlHandleMatch = html.match(/https?:\/\/www\.youtube\.com\/(@[\w.-]+)/);
    if (urlHandleMatch) {
      channelHandle = decodeURIComponent(urlHandleMatch[1]);
    }
  }

  // --- Extract channel ID ---

  // Method 1: meta tag with itemprop="identifier" or channelId
  const metaIdMatch = html.match(/<meta\s+itemprop="identifier"\s+content="([^"]+)"/);
  if (metaIdMatch) {
    channelId = metaIdMatch[1];
  }

  // Method 2: externalId in channelMetadataRenderer JSON
  if (!channelId) {
    const externalIdMatch = html.match(
      /"channelMetadataRenderer":\s*\{[^}]*"externalId"\s*:\s*"([^"]+)"/,
    );
    if (externalIdMatch) {
      channelId = externalIdMatch[1];
    }
  }

  // Method 3: browseId in the JSON data
  if (!channelId) {
    const browseIdMatch = html.match(/"browseId"\s*:\s*"(UC[^"]+)"/);
    if (browseIdMatch) {
      channelId = browseIdMatch[1];
    }
  }

  // Method 4: channel URL pattern /channel/UC...
  if (!channelId) {
    const channelUrlMatch = html.match(/https?:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (channelUrlMatch) {
      channelId = channelUrlMatch[1];
    }
  }

  return { id: channelId, handle: channelHandle, name: channelName };
}

/* ------------------------------------------------------------------------------------------------------------------ */

function extractLiveVideosInfo(html) {
  console.log(`Extracting live videos info...`);
  const videosInfo = [];
  try {
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
      console.error(`Could not find ytInitialData`);
      return [];
    }
    const tabs = ytInitialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
    const streamsTab = tabs.find((tab) =>
      tab.tabRenderer?.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes('/streams'),
    );
    if (!streamsTab) {
      console.error(`Could not find streams tab`);
      return [];
    }
    const items = streamsTab.tabRenderer?.content?.richGridRenderer?.contents ?? [];
    const videos = items
      .filter((item) => {
        const videoRenderer = item.richItemRenderer?.content?.videoRenderer;
        const overlays = videoRenderer?.thumbnailOverlays ?? [];
        const isLive = overlays.some((o) => o.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE');
        const isEmbeddable = videoRenderer?.playabilityStatus?.playableInEmbed !== false;
        return isLive && isEmbeddable;
      })
      .map((item) => {
        const videoRenderer = item.richItemRenderer?.content?.videoRenderer;
        const videoId = videoRenderer?.videoId;
        const title =
          videoRenderer?.title?.runs?.map((r) => r.text).join('') ??
          videoRenderer?.title?.simpleText ??
          '';
        return videoId ? { id: videoId, title } : null;
      })
      .filter(Boolean);
    console.log(`Found ${videos.length} live video(s)`);
    videos.forEach((video) => {
      videosInfo.push(video);
    });
  } catch (error) {
    console.error(error);
  }
  return videosInfo;
}

/* ------------------------------------------------------------------------------------------------------------------ */

function writeDataObjectToFile(dataObject, dirPath, fileName) {
  const fullFilePath = `${dirPath}/${fileName}`;
  console.log(`Writing to ${fullFilePath}...`);
  try {
    const outDir = resolve(__dirname, dirPath);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, fileName), JSON.stringify(dataObject, null, 2));
    console.log(`File ${fullFilePath} updated.`);
  } catch (error) {
    console.error(`Error while trying to write to ${fullFilePath}`, error);
  }
}

/* ------------------------------------------------------------------------------------------------------------------ */

async function go() {
  try {
    const allChannelIds = [...new Set([...channelIds])].sort();
    console.log(`Processing ${allChannelIds.length} channels...`);
    const dataObj = [];
    for (let i = 0; i < allChannelIds.length; i++) {
      const channelId = allChannelIds[i];
      const percent = (((i + 1) / allChannelIds.length) * 100).toFixed(1);
      console.log(
        `[${i + 1}/${allChannelIds.length} - ${percent}%] Processing channel ${channelId}...`,
      );
      const url = `https://www.youtube.com/channel/${channelId}/streams`;
      try {
        const html = await fetchPage(url);
        const channelData = extractChannelInfo(html);
        channelData.videos = extractLiveVideosInfo(html);
        console.log(channelData);
        dataObj.push(channelData);
      } catch (error) {
        console.error(`Error processing channel ${channelId}`, error);
      }
    }
    writeDataObjectToFile(dataObj, '../src/public', 'videos.json');
    console.log(`DONE.`);
  } catch (error) {
    console.error(error);
  }
}

/* ------------------------------------------------------------------------------------------------------------------ */

go().then(null);
