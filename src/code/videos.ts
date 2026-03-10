import * as helper from './helper';

let allVideoIds: string[] = [];

async function loadVideoIdsData() {
  try {
    const res = await fetch('/video-ids.json');
    allVideoIds = await res.json();
  } catch (error) {
    console.error('Failed to load video IDs data:', error);
    return;
  }
  helper.shuffleArray(allVideoIds);
}

export function getRandomVideoId() {
  const videoIndex = Math.trunc(Math.random() * allVideoIds.length);
  return allVideoIds[videoIndex];
}

export function getYouTubeVideoSrc(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}?autohide=1&autoplay=1&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1&mute=1&playsinline=1&rel=0&showinfo=0&vq=hd1080`;
}

export async function init() {
  await loadVideoIdsData();
}
