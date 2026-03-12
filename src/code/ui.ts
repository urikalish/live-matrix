import * as settings from './settings';
import * as videos from './videos';
import type { Video } from './videos';
import * as masthead from './masthead';

function getMatrixContainer(): HTMLDivElement | null {
  const matrixContainerElm = document.getElementById('matrix-container');
  return matrixContainerElm instanceof HTMLDivElement ? matrixContainerElm : null;
}

function getCellWidth() {
  const matrixContainerElm = getMatrixContainer();
  if (!matrixContainerElm) return 0;
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
  frElm.src = src;
  frElm.width = `${getCellWidth()}`;
  frElm.height = `${getCellHeight()}`;
  frElm.setAttribute('frameborder', '0');
  frElm.title = video.title;
  frElm.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  );
  cellElm.appendChild(frElm);
}

function replaceVideo(cellElm: HTMLDivElement) {
  const currentVideoId = cellElm.dataset.videoId;
  const newVideo = videos.getRandomVideo(currentVideoId);
  if (!newVideo) return;
  const iframe = cellElm.querySelector('iframe');
  if (iframe) iframe.remove();
  setVideo(cellElm, newVideo);
}

function getCellFromEvent(event: Event): HTMLDivElement | null {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return null;
  const cellElm = target.closest('.matrix-cell');
  return cellElm instanceof HTMLDivElement ? cellElm : null;
}

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.classList.add('cell-overlay');

  const pinBtn = document.createElement('button');
  pinBtn.classList.add('cell-overlay-btn', 'cell-overlay-btn--pin');
  pinBtn.textContent = '📌';
  pinBtn.title = 'Pin / Unpin';
  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cellElm = getCellFromEvent(e);
    if (!cellElm) return;
    const videoId = cellElm.dataset.videoId;
    if (!videoId) return;

    const video = videos.getVideoById(videoId);
    if (video) {
      video.pinned = !video.pinned;
      cellElm.classList.toggle('pinned', video.pinned);
    }
  });

  const navBtn = document.createElement('button');
  navBtn.classList.add('cell-overlay-btn', 'cell-overlay-btn--navigate');
  navBtn.textContent = '📺';
  navBtn.title = 'Open on YouTube';
  navBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cellElm = getCellFromEvent(e);
    if (!cellElm) return;
    const videoId = cellElm.dataset.videoId;
    if (videoId) {
      window.open(`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1`, '_blank', 'noopener');
    }
  });

  const skipBtn = document.createElement('button');
  skipBtn.classList.add('cell-overlay-btn', 'cell-overlay-btn--skip');
  skipBtn.textContent = '⏭';
  skipBtn.title = 'Skip video';
  skipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cellElm = getCellFromEvent(e);
    if (!cellElm) return;
    const videoId = cellElm.dataset.videoId;
    if (!videoId) return;

    // Unpin current video
    const video = videos.getVideoById(videoId);
    if (video) {
      video.pinned = false;
    }
    cellElm.classList.remove('pinned');
    replaceVideo(cellElm);
  });

  overlay.appendChild(pinBtn);
  overlay.appendChild(navBtn);
  overlay.appendChild(skipBtn);
  return overlay;
}

function renderGrid() {
  const matrixContainerElm = getMatrixContainer();
  if (!matrixContainerElm) return;

  matrixContainerElm.innerHTML = '';
  matrixContainerElm.style.gridTemplateColumns = `repeat(${settings.getCols()}, auto)`;
  const matrixCellTemplateElm = document.createElement('div');
  matrixCellTemplateElm.classList.add('matrix-cell');
  matrixCellTemplateElm.style.width = `${getCellWidth()}px`;
  matrixCellTemplateElm.style.height = `${getCellHeight()}px`;

  for (let i: number = 0; i < settings.getCols() * settings.getRows(); i++) {
    const matrixCellElm = matrixCellTemplateElm.cloneNode(true) as HTMLDivElement;
    const video = videos.getVideoByIndex(i);
    setVideo(matrixCellElm, video);
    matrixCellElm.appendChild(createOverlay());
    matrixContainerElm.appendChild(matrixCellElm);
  }
}

function handleWindowResize() {
  renderGrid();
}

function handleShuffle() {
  videos.shuffleVideos();
  renderGrid();
}

function handleLayoutChange() {
  videos.shuffleVideos();
  renderGrid();
}

export async function init() {
  masthead.handlers.onShuffle = handleShuffle;
  masthead.handlers.onChangeGridLayout = handleLayoutChange;
  window.addEventListener('resize', handleWindowResize);
  videos.shuffleVideos();
  renderGrid();
}
