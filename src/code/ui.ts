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

function replaceVideo(cellElm: HTMLDivElement) {
  const newVideo = videos.getRandomVideo();
  if (!newVideo) return;
  const iframe = cellElm.querySelector('iframe');
  if (iframe) iframe.remove();
  setVideo(cellElm, newVideo);
}

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.classList.add('cell-overlay');

  const pinBtn = document.createElement('button');
  pinBtn.classList.add('cell-overlay-btn');
  pinBtn.textContent = '📌';
  pinBtn.title = 'Pin / Unpin';
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cellElm = (e.currentTarget as HTMLElement).closest('.matrix-cell') as HTMLDivElement;
    const videoId = cellElm.dataset.videoId;
    if (!videoId) return;
    const video = videos.getVideoByIndex(Number(cellElm.getAttribute('index')));
    if (video && video.id === videoId) {
      video.pinned = !video.pinned;
      cellElm.classList.toggle('pinned', video.pinned);
    }
  });

  const refreshBtn = document.createElement('button');
  refreshBtn.classList.add('cell-overlay-btn');
  refreshBtn.textContent = '🔄';
  refreshBtn.title = 'Replace video';
  refreshBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cellElm = (e.currentTarget as HTMLElement).closest('.matrix-cell') as HTMLDivElement;
    const videoId = cellElm.dataset.videoId;
    if (!videoId) return;
    // Unpin current video
    const idx = Number(cellElm.getAttribute('index'));
    const video = videos.getVideoByIndex(idx);
    if (video && video.id === videoId) {
      video.pinned = false;
    }
    cellElm.classList.remove('pinned');
    replaceVideo(cellElm);
  });

  const navBtn = document.createElement('button');
  navBtn.classList.add('cell-overlay-btn');
  navBtn.textContent = '🔗';
  navBtn.title = 'Open on YouTube';
  navBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cellElm = (e.currentTarget as HTMLElement).closest('.matrix-cell') as HTMLDivElement;
    const videoId = cellElm.dataset.videoId;
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }
  });

  overlay.appendChild(pinBtn);
  overlay.appendChild(refreshBtn);
  overlay.appendChild(navBtn);
  return overlay;
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
    matrixCellElm.appendChild(createOverlay());
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
