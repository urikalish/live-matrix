import * as settings from './settings';

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

const _allChannels: Channel[] = [];
const _allVideos: Video[] = [];

function shuffleAllVideos() {
  let currentIndex = _allVideos.length;
  let randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [_allVideos[currentIndex], _allVideos[randomIndex]] = [
      _allVideos[randomIndex],
      _allVideos[currentIndex],
    ];
  }
}

async function loadChannelsAndVideos() {
  try {
    const res = await fetch('/videos.json');
    const data: {
      id: string;
      handle: string;
      name: string;
      videos: { id: string; title: string }[];
    }[] = await res.json();
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
          pinned: false,
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

export function getVideoIdByIndex(videoIndex: number) {
  return videoIndex < _allVideos.length ? _allVideos[videoIndex].id : '';
}

export function getRandomVideoId() {
  const videoIndex = Math.trunc(Math.random() * _allVideos.length);
  return _allVideos[videoIndex].id;
}

export function getYouTubeVideoSrc(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}?autohide=1&autoplay=1&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1&mute=1&playsinline=1&rel=0&showinfo=0&vq=hd1080`;
}

export function refreshVideos() {
  alert(`refreshing ${settings.getCols() * settings.getRows()} videos`);
}

export async function init() {
  await loadChannelsAndVideos();
}
