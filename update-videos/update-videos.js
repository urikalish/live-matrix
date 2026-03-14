import * as cheerio from 'cheerio';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import channelIds from './channel-ids.json' with { type: 'json' };
const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '../.env');
const envLoadResult = loadEnv({ path: ENV_PATH });

if (envLoadResult.error) {
  throw new Error(
    `[config] Failed to load .env file at ${ENV_PATH}: ${envLoadResult.error.message}`,
  );
}

const parsedEnv = envLoadResult.parsed ?? {};
const ENV = {
  YOUTUBEI_BROWSE_KEY: 'UPDATE_VIDEOS_YOUTUBEI_BROWSE_KEY',
};

function getYoutubeiBrowseKey() {
  const configuredKey = parsedEnv[ENV.YOUTUBEI_BROWSE_KEY];
  if (configuredKey === undefined) {
    throw new Error(`[config] Missing ${ENV.YOUTUBEI_BROWSE_KEY} in .env (${ENV_PATH}).`);
  }

  const trimmedKey = configuredKey.trim();
  if (!trimmedKey) {
    throw new Error(`[config] ${ENV.YOUTUBEI_BROWSE_KEY} is empty in .env (${ENV_PATH}).`);
  }

  if (!/^AIza[\w-]{20,}$/.test(trimmedKey)) {
    throw new Error(
      `[config] ${ENV.YOUTUBEI_BROWSE_KEY} does not look like a valid YouTube key (expected to start with "AIza").`,
    );
  }

  return trimmedKey;
}

const YOUTUBEI_BROWSE_KEY = getYoutubeiBrowseKey();
const _EMBED_OEMBED_CACHE = new Map();

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

async function isVideoEmbeddableByOEmbed(videoId) {
  if (!videoId) return false;

  if (_EMBED_OEMBED_CACHE.has(videoId)) {
    return _EMBED_OEMBED_CACHE.get(videoId);
  }

  const checkPromise = (async () => {
    try {
      const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (res.ok) return true;
      if (res.status === 401 || res.status === 403 || res.status === 404) return false;

      console.warn(
        `[embed-check] Unexpected oEmbed status ${res.status} for ${videoId}; keeping video.`,
      );
      return true;
    } catch (error) {
      console.warn(`[embed-check] oEmbed check failed for ${videoId}; keeping video.`, error);
      return true;
    }
  })();

  _EMBED_OEMBED_CACHE.set(videoId, checkPromise);
  return checkPromise;
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

async function extractLiveVideosInfo(html) {
  console.log(`Extracting live videos info...`);
  const videosInfo = [];

  function isEmbeddableVideo(videoRenderer) {
    const playabilityStatus = videoRenderer?.playabilityStatus;
    if (playabilityStatus?.playableInEmbed === false) {
      return false;
    }

    // Keep this as a fallback for payloads that omit playableInEmbed but expose an unplayable reason.
    if (playabilityStatus?.status === 'UNPLAYABLE') {
      const reason = `${playabilityStatus?.reason ?? ''}`;
      if (/playback on other websites has been disabled/i.test(reason)) {
        return false;
      }
    }

    return true;
  }

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

    let allItems = streamsTab.tabRenderer?.content?.richGridRenderer?.contents ?? [];

    // Follow continuation tokens to fetch all pages
    let continuationToken = allItems
      .map(
        (item) => item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token,
      )
      .find(Boolean);
    while (continuationToken) {
      const contUrl = `https://www.youtube.com/youtubei/v1/browse?key=${YOUTUBEI_BROWSE_KEY}`;
      const res = await fetch(contUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20240101.00.00',
              hl: 'en',
              gl: 'US',
            },
          },
          continuation: continuationToken,
        }),
      });
      if (!res.ok) break;
      const data = await res.json();
      const newItems =
        data?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems ??
        [];
      allItems = [...allItems, ...newItems];
      continuationToken = newItems
        .map(
          (item) => item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token,
        )
        .find(Boolean);
    }

    const liveCandidates = allItems
      .map((item) => item.richItemRenderer?.content?.videoRenderer)
      .filter((videoRenderer) => {
        const overlays = videoRenderer?.thumbnailOverlays ?? [];
        return overlays.some((o) => o.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE');
      });

    const checkedVideos = await Promise.all(
      liveCandidates.map(async (videoRenderer) => {
        const videoId = videoRenderer?.videoId;
        if (!videoId) return null;
        if (!isEmbeddableVideo(videoRenderer)) return null;

        // Renderer signals are sometimes stale/inaccurate for active streams; validate all candidates.
        const isEmbeddable = await isVideoEmbeddableByOEmbed(videoId);
        if (!isEmbeddable) return null;

        const title = (
          videoRenderer?.title?.runs?.map((r) => r.text).join('') ??
          videoRenderer?.title?.simpleText ??
          ''
        )
          .replaceAll('\u00A0', ' ')
          .replaceAll('\u200B', '');
        return { id: videoId, title };
      }),
    );

    const videos = checkedVideos.filter(Boolean);
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

function readDataObjectFromFile(dirPath, fileName) {
  const fullFilePath = `${dirPath}/${fileName}`;
  try {
    const outDir = resolve(__dirname, dirPath);
    const raw = readFileSync(resolve(outDir, fileName), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Missing/invalid file is expected on first run; start with empty history.
    console.log(`No existing ${fullFilePath}; starting fresh.`);
    return [];
  }
}

function getChannelTrackingKey(channel) {
  if (channel?.id) return `id:${channel.id}`;
  if (channel?.handle) return `handle:${channel.handle}`;
  return `name:${channel?.name ?? ''}`;
}

/* ------------------------------------------------------------------------------------------------------------------ */

async function processChannel(channelId, index, total) {
  const percent = (((index + 1) / total) * 100).toFixed(1);
  console.log(`[${index + 1}/${total} - ${percent}%] Processing channel ${channelId}...`);
  const url = `https://www.youtube.com/channel/${channelId}/streams`;
  try {
    const html = await fetchPage(url);
    const channelData = extractChannelInfo(html);
    channelData.videos = await extractLiveVideosInfo(html);
    console.log(channelData);
    return { ok: true, index, channelData };
  } catch (error) {
    console.error(`Error processing channel ${channelId}`, error);
    return {
      ok: false,
      index,
      channelId,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* ------------------------------------------------------------------------------------------------------------------ */

async function go() {
  const startedAt = Date.now();
  try {
    const allChannelIds = [...new Set([...channelIds])].sort();
    const CONCURRENCY = 10;
    console.log(`Processing ${allChannelIds.length} channels with concurrency ${CONCURRENCY}...`);

    const results = new Array(allChannelIds.length);
    let queueIndex = 0;

    async function worker() {
      while (true) {
        const currentIndex = queueIndex;
        queueIndex++;
        if (currentIndex >= allChannelIds.length) {
          return;
        }
        results[currentIndex] = await processChannel(
          allChannelIds[currentIndex],
          currentIndex,
          allChannelIds.length,
        );
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    console.error(`Organizing results...`);

    const dataObj = results
      .filter((result) => result?.ok)
      .sort((a, b) => a.index - b.index)
      .map((result) => result.channelData);

    const failures = results.filter((result) => result && !result.ok);
    if (failures.length > 0) {
      console.error(`Failed channels: ${failures.length}`);
      failures.slice(0, 10).forEach((failure) => {
        console.error(`- ${failure.channelId}: ${failure.error}`);
      });
      if (failures.length > 10) {
        console.error(`...and ${failures.length - 10} more`);
      }
    }

    writeDataObjectToFile(dataObj, '../src/public', 'videos.json');

    // Rebuild from current run so channels with videos are automatically removed.
    // Keep the first date a channel was observed with zero live videos.
    const previousNoVideos = readDataObjectFromFile('.', 'channels-no-videos.json');
    const firstSeenDateByKey = new Map(
      previousNoVideos
        .filter((channel) => channel && typeof channel.date === 'string' && channel.date)
        .map((channel) => [getChannelTrackingKey(channel), channel.date]),
    );

    const today = new Date().toISOString().slice(0, 10);
    const channelsNoVideos = dataObj
      .filter((channel) => (channel.videos?.length ?? 0) === 0)
      .map((channel) => {
        const id = channel.id ?? '';
        const handle = channel.handle ?? '';
        const name = channel.name ?? '';
        const key = getChannelTrackingKey({ id, handle, name });
        const firstSeenDate = firstSeenDateByKey.get(key) ?? today;
        return { id, handle, name, date: firstSeenDate };
      })
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.id.localeCompare(b.id) ||
          a.handle.localeCompare(b.handle) ||
          a.name.localeCompare(b.name),
      );

    writeDataObjectToFile(channelsNoVideos, '.', 'channels-no-videos.json');

    const totalVideos = dataObj.reduce((sum, channel) => sum + (channel.videos?.length ?? 0), 0);
    const elapsedMs = Date.now() - startedAt;
    const elapsedSeconds = (elapsedMs / 1000).toFixed(1);
    console.log(
      `DONE. Took ${elapsedSeconds}s | channels: ${allChannelIds.length} | videos: ${totalVideos}`,
    );
  } catch (error) {
    console.error(error);
  }
}

/* ------------------------------------------------------------------------------------------------------------------ */

go().then(null);
