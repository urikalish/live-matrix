import * as helper from './helper';

export type Channel = {
  id: string;
  handle: string;
  name: string;
  videos: Video[];
};

export type Video = {
  id: string;
  title: string;
  channel: Channel;
};

let _allVideoIds: string[] = [];

async function loadVideoIdsData() {
  try {
    const res = await fetch('/video-ids.json');
    _allVideoIds = await res.json();
  } catch (error) {
    console.error('Failed to load video IDs data:', error);
    return;
  }
  helper.shuffleArray(_allVideoIds);
}

export function getRandomVideoId() {
  const videoIndex = Math.trunc(Math.random() * _allVideoIds.length);
  return _allVideoIds[videoIndex];
}

export function getYouTubeVideoSrc(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}?autohide=1&autoplay=1&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1&mute=1&playsinline=1&rel=0&showinfo=0&vq=hd1080`;
}

export async function init() {
  await loadVideoIdsData();
}
