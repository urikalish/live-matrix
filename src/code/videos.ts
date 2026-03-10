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

let _allChannels: Channel[] = [];
let _allVideos: Video[] = [];

async function loadVideoIdsData() {
  try {
    const res = await fetch('/video-ids.json');
    const data = await res.json();
    const channel: Channel = {
      id: 'UCXXXXXXXXXXXXXXXXXXXXXX',
      handle: 'myChannel',
      name: 'My Channel',
      videos: []
    }
    _allChannels.push(channel);
    data.forEach((videoId: string) => {
      const video: Video = {
        id: videoId,
        title: 'My Video',
        channel
      }
      channel.videos.push(video);
      _allVideos.push(video);
    });
  } catch (error) {
    console.error('Failed to load videos data:', error);
    return;
  }
  helper.shuffleArray(_allVideos);
}

export function getRandomVideoId() {
  const videoIndex = Math.trunc(Math.random() * _allVideos.length);
  return _allVideos[videoIndex].id;
}

export function getYouTubeVideoSrc(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}?autohide=1&autoplay=1&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1&mute=1&playsinline=1&rel=0&showinfo=0&vq=hd1080`;
}

export async function init() {
  await loadVideoIdsData();
}
