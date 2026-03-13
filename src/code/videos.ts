export type Channel = {
  id: string;
  handle: string;
  name: string;
  videos: Video[];
};

export type Video = {
  id: string;
  title: string;
  pinned: boolean;
  channel: Channel;
};

type RawVideo = {
  id: string;
  title: string;
};

type RawChannel = {
  id: string;
  handle: string;
  name: string;
  videos: RawVideo[];
};

const _allChannels: Channel[] = [];
const _allVideos: Video[] = [];
const _STORAGE_PINNED_VIDEO_IDS_KEY = 'live-matrix.pinned-video-ids';

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getPinnedVideoIdsFromStorage(): Set<string> {
  const storage = getStorage();
  if (!storage) return new Set<string>();

  const rawValue = storage.getItem(_STORAGE_PINNED_VIDEO_IDS_KEY);
  if (!rawValue) return new Set<string>();

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return new Set<string>();
    const ids = parsed.filter((value): value is string => typeof value === 'string');
    return new Set<string>(ids);
  } catch {
    return new Set<string>();
  }
}

function savePinnedVideoIdsToStorage(): void {
  const storage = getStorage();
  if (!storage) return;
  const pinnedIds = _allVideos.filter((video) => video.pinned).map((video) => video.id);
  storage.setItem(_STORAGE_PINNED_VIDEO_IDS_KEY, JSON.stringify(pinnedIds));
}

function savePinnedVideoIdsToStorageByIds(ids: Set<string>): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(_STORAGE_PINNED_VIDEO_IDS_KEY, JSON.stringify(Array.from(ids)));
}

function reconcilePinnedVideoIds(data: RawChannel[], pinnedVideoIds: Set<string>): Set<string> {
  const validVideoIds = new Set<string>();
  data.forEach((channel) => {
    channel.videos.forEach((video) => {
      validVideoIds.add(video.id);
    });
  });

  const reconciledPinnedVideoIds = new Set<string>();
  pinnedVideoIds.forEach((videoId) => {
    if (validVideoIds.has(videoId)) {
      reconciledPinnedVideoIds.add(videoId);
    }
  });

  if (reconciledPinnedVideoIds.size !== pinnedVideoIds.size) {
    savePinnedVideoIdsToStorageByIds(reconciledPinnedVideoIds);
  }

  return reconciledPinnedVideoIds;
}

function isRawVideo(value: unknown): value is RawVideo {
  if (!value || typeof value !== 'object') return false;
  const maybeVideo = value as Partial<RawVideo>;
  return typeof maybeVideo.id === 'string' && typeof maybeVideo.title === 'string';
}

function isRawChannel(value: unknown): value is RawChannel {
  if (!value || typeof value !== 'object') return false;
  const maybeChannel = value as Partial<RawChannel>;
  return (
    typeof maybeChannel.id === 'string' &&
    typeof maybeChannel.handle === 'string' &&
    typeof maybeChannel.name === 'string' &&
    Array.isArray(maybeChannel.videos) &&
    maybeChannel.videos.every((video) => isRawVideo(video))
  );
}

function shuffleAllVideos() {
  const pinned = _allVideos.filter((v) => v.pinned);
  const unpinned = _allVideos.filter((v) => !v.pinned);
  let currentIndex = unpinned.length;
  while (currentIndex > 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [unpinned[currentIndex], unpinned[randomIndex]] = [
      unpinned[randomIndex],
      unpinned[currentIndex],
    ];
  }
  _allVideos.splice(0, _allVideos.length, ...pinned, ...unpinned);
}

async function loadChannelsAndVideos() {
  try {
    const res = await fetch('/videos.json');
    if (!res.ok) {
      throw new Error(`videos.json request failed with status ${res.status}`);
    }

    const payload: unknown = await res.json();
    if (!Array.isArray(payload) || !payload.every((channel) => isRawChannel(channel))) {
      throw new Error('videos.json has an invalid format.');
    }

    _allChannels.length = 0;
    _allVideos.length = 0;

    const data: RawChannel[] = payload;
    const pinnedVideoIds = reconcilePinnedVideoIds(data, getPinnedVideoIdsFromStorage());
    data.forEach((channelData) => {
      const channel: Channel = {
        id: channelData.id,
        handle: channelData.handle,
        name: channelData.name,
        videos: [],
      };
      _allChannels.push(channel);
      channelData.videos.forEach((videoData) => {
        const video: Video = {
          id: videoData.id,
          title: videoData.title,
          pinned: pinnedVideoIds.has(videoData.id),
          channel,
        };
        channel.videos.push(video);
        _allVideos.push(video);
      });
    });
    shuffleAllVideos();
  } catch (error) {
    console.error('Failed to load videos data:', error);
    return;
  }
}

export function getVideoByIndex(videoIndex: number) {
  if (!Number.isInteger(videoIndex) || videoIndex < 0 || videoIndex >= _allVideos.length) {
    return null;
  }
  return _allVideos[videoIndex];
}

export function getVideoById(videoId: string): Video | null {
  return _allVideos.find((video) => video.id === videoId) ?? null;
}

export function getVideoIdByIndex(videoIndex: number) {
  return videoIndex < _allVideos.length ? _allVideos[videoIndex].id : '';
}

export function getYouTubeVideoSrc(videoId: string) {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autohide=1&autoplay=1&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1&mute=1&playsinline=1&rel=0&showinfo=0&vq=hd1080`;
}

export function getYouTubeThumbnailSrc(videoId: string) {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

export function getRandomVideo(excludeVideoId?: string): Video | null {
  if (_allVideos.length === 0) return null;

  if (excludeVideoId && _allVideos.length > 1) {
    const candidates = _allVideos.filter((video) => video.id !== excludeVideoId);
    if (candidates.length > 0) {
      const candidateIndex = Math.trunc(Math.random() * candidates.length);
      return candidates[candidateIndex];
    }
  }

  const videoIndex = Math.trunc(Math.random() * _allVideos.length);
  return _allVideos[videoIndex];
}

export function shuffleVideos() {
  shuffleAllVideos();
}

export function getUnpinnedVideos(): Video[] {
  return _allVideos.filter((video) => !video.pinned);
}

export function setVideoPinned(videoId: string, pinned: boolean): boolean {
  const video = getVideoById(videoId);
  if (!video) return false;
  video.pinned = pinned;
  savePinnedVideoIdsToStorage();
  return true;
}

export async function init() {
  await loadChannelsAndVideos();
}
