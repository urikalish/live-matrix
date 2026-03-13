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

function clearVideoElements(cellElm: HTMLDivElement) {
  const iframe = cellElm.querySelector('iframe');
  if (iframe) iframe.remove();

  const thumbnailElm = cellElm.querySelector('.matrix-cell-thumbnail');
  if (thumbnailElm) thumbnailElm.remove();

  cellElm.classList.remove('video-loading');
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

  const thumbnailElm = document.createElement('img');
  thumbnailElm.classList.add('matrix-cell-thumbnail');
  thumbnailElm.src = videos.getYouTubeThumbnailSrc(video.id);
  thumbnailElm.alt = video.title;
  thumbnailElm.width = getCellWidth();
  thumbnailElm.height = getCellHeight();
  cellElm.classList.add('video-loading');
  cellElm.appendChild(thumbnailElm);

  const src = videos.getYouTubeVideoSrc(video.id);
  const frElm = document.createElement('iframe');
  frElm.classList.add('matrix-cell-iframe');
  frElm.src = src;
  frElm.width = `${getCellWidth()}`;
  frElm.height = `${getCellHeight()}`;
  frElm.setAttribute('frameborder', '0');
  frElm.title = video.title;
  frElm.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  );
  frElm.addEventListener('load', () => {
    const currentThumbnailElm = cellElm.querySelector('.matrix-cell-thumbnail');
    if (currentThumbnailElm) currentThumbnailElm.remove();
    cellElm.classList.remove('video-loading');
  });
  cellElm.appendChild(frElm);
  updateOverlayDetails(cellElm);
}

function replaceVideo(cellElm: HTMLDivElement) {
  const currentVideoId = cellElm.dataset.videoId;
  const newVideo = videos.getRandomVideo(currentVideoId);
  if (!newVideo) return;
  clearVideoElements(cellElm);
  setVideo(cellElm, newVideo);
}

function getCellFromEvent(event: Event): HTMLDivElement | null {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return null;
  const cellElm = target.closest('.matrix-cell');
  return cellElm instanceof HTMLDivElement ? cellElm : null;
}

function updateOverlayDetails(cellElm: HTMLDivElement) {
  const overlay = cellElm.querySelector('.cell-overlay');
  if (!(overlay instanceof HTMLDivElement)) return;

  const channelNameElm = overlay.querySelector('.cell-overlay-channel');
  const videoTitleElm = overlay.querySelector('.cell-overlay-title');
  if (!(channelNameElm instanceof HTMLDivElement) || !(videoTitleElm instanceof HTMLDivElement)) {
    return;
  }

  const channelName = cellElm.dataset.channelName ?? '';
  const videoTitle = cellElm.dataset.videoTitle ?? '';
  channelNameElm.textContent = channelName;
  videoTitleElm.textContent = videoTitle;
  channelNameElm.title = channelName;
  videoTitleElm.title = videoTitle;
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
    if (!video) return;

    const nextPinnedState = !video.pinned;
    videos.setVideoPinned(videoId, nextPinnedState);
    cellElm.classList.toggle('pinned', nextPinnedState);
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
      window.open(
        `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1`,
        '_blank',
        'noopener',
      );
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
    videos.setVideoPinned(videoId, false);
    cellElm.classList.remove('pinned');
    replaceVideo(cellElm);
  });

  overlay.appendChild(pinBtn);
  overlay.appendChild(navBtn);
  overlay.appendChild(skipBtn);

  const detailsElm = document.createElement('div');
  detailsElm.classList.add('cell-overlay-details');

  const channelNameElm = document.createElement('div');
  channelNameElm.classList.add('cell-overlay-channel');

  const videoTitleElm = document.createElement('div');
  videoTitleElm.classList.add('cell-overlay-title');

  detailsElm.appendChild(channelNameElm);
  detailsElm.appendChild(videoTitleElm);
  overlay.appendChild(detailsElm);
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
    updateOverlayDetails(matrixCellElm);
    matrixContainerElm.appendChild(matrixCellElm);
  }
}

function handleWindowResize() {
  renderGrid();
}

function shuffleUnpinnedCellsOnly() {
  const matrixContainerElm = getMatrixContainer();
  if (!matrixContainerElm) {
    renderGrid();
    return;
  }

  const unpinnedVideos = videos.getUnpinnedVideos();
  let unpinnedVideoIndex = 0;
  const matrixCellElements = matrixContainerElm.querySelectorAll('.matrix-cell');

  matrixCellElements.forEach((cellElm) => {
    if (!(cellElm instanceof HTMLDivElement)) return;
    if (cellElm.classList.contains('pinned')) return;

    const nextVideo = unpinnedVideos[unpinnedVideoIndex++];
    if (!nextVideo) return;

    clearVideoElements(cellElm);
    setVideo(cellElm, nextVideo);
  });
}

function handleShuffle() {
  videos.shuffleVideos();
  shuffleUnpinnedCellsOnly();
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
