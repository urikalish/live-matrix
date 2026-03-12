import * as settings from './settings';
import * as videos from './videos';
import type { Video } from './videos';
import * as masthead from './masthead';

function getCellWidth() {
  const matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
  return matrixContainerElm.clientWidth / settings.getCols();
}

function getCellHeight() {
  return (getCellWidth() * 9) / 16;
}

function setVideo(cellElm: HTMLDivElement, video: Video | null) {
  if (video === null) {
    return;
  }
  cellElm.dataset.videoId = video.id;
  cellElm.dataset.videoTitle = video.title;
  cellElm.dataset.channelId = video.channel.id;
  cellElm.dataset.channelHandle = video.channel.handle;
  cellElm.dataset.channelName = video.channel.name;
  cellElm.classList.toggle('pinned', video.pinned);
  const src = videos.getYouTubeVideoSrc(video.id);
  const frElm = document.createElement('iframe');
  frElm.setAttribute('src', src);
  frElm.setAttribute('width', '' + getCellWidth());
  frElm.setAttribute('height', '' + getCellHeight());
  frElm.setAttribute('frameborder', '0');
  frElm.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  );
  cellElm.appendChild(frElm);
}

function handleGridLayout() {
  const matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
  matrixContainerElm.innerHTML = '';
  matrixContainerElm.style.gridTemplateColumns = `repeat(${settings.getCols()}, auto)`;
  const matrixCellTemplateElm = document.createElement('div');
  matrixCellTemplateElm.classList.add('matrix-cell');
  matrixCellTemplateElm.style.width = `${getCellWidth()}px`;
  matrixCellTemplateElm.style.height = `${getCellHeight()}px`;
  for (let i: number = 0; i < settings.getCols() * settings.getRows(); i++) {
    const matrixCellElm = matrixCellTemplateElm.cloneNode(true) as HTMLDivElement;
    matrixCellElm.setAttribute('index', i.toString());
    const video = videos.getVideoByIndex(i);
    setVideo(matrixCellElm, video);
    matrixContainerElm.appendChild(matrixCellElm);
  }
}

function handleWindowResize() {
  handleGridLayout();
}

function handleRefresh() {
  videos.refreshVideos();
  handleGridLayout();
}

export async function init() {
  masthead.handlers.onChangeGridLayout = handleGridLayout;
  masthead.handlers.onRefresh = handleRefresh;
  window.addEventListener('resize', handleWindowResize);
  handleGridLayout();
}
