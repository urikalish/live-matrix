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
  if (video === null) return;

  const w = getCellWidth();
  const h = getCellHeight();

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
  thumbnailElm.width = w;
  thumbnailElm.height = h;
  cellElm.classList.add('video-loading');
  cellElm.appendChild(thumbnailElm);

  const frElm = document.createElement('iframe');
  frElm.classList.add('matrix-cell-iframe');
  frElm.src = videos.getYouTubeVideoSrc(video.id);
  frElm.width = `${w}`;
  frElm.height = `${h}`;
  frElm.setAttribute('frameborder', '0');
  frElm.title = video.title;
  frElm.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  );
  frElm.addEventListener('load', () => {
    cellElm.querySelector('.matrix-cell-thumbnail')?.remove();
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
  return (event.currentTarget as HTMLElement)?.closest<HTMLDivElement>('.matrix-cell') ?? null;
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
  pinBtn.addEventListener('click', e => {
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
  navBtn.addEventListener('click', e => {
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
  skipBtn.addEventListener('click', e => {
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

  for (let i = 0; i < settings.getCols() * settings.getRows(); i++) {
    const matrixCellElm = matrixCellTemplateElm.cloneNode(true) as HTMLDivElement;
    matrixCellElm.appendChild(createOverlay());
    setVideo(matrixCellElm, videos.getVideoByIndex(i));
    matrixContainerElm.appendChild(matrixCellElm);
  }
}

function handleShuffle() {
  videos.shuffleVideos();

  const matrixContainerElm = getMatrixContainer();
  if (!matrixContainerElm) {
    renderGrid();
    return;
  }

  const unpinnedVideos = videos.getUnpinnedVideos();
  let unpinnedVideoIndex = 0;
  matrixContainerElm.querySelectorAll<HTMLDivElement>('.matrix-cell').forEach(cellElm => {
    if (cellElm.classList.contains('pinned')) return;
    const nextVideo = unpinnedVideos[unpinnedVideoIndex++];
    if (!nextVideo) return;
    clearVideoElements(cellElm);
    setVideo(cellElm, nextVideo);
  });
}

function handleLayoutChange() {
  videos.shuffleVideos();
  renderGrid();
}

function handleSelectSearchVideo(videoId: string) {
  const video = videos.getVideoById(videoId);
  if (!video) return;

  const matrixContainerElm = getMatrixContainer();
  if (!matrixContainerElm) return;

  const cells = Array.from(matrixContainerElm.querySelectorAll<HTMLDivElement>('.matrix-cell'));
  const cell = cells.find(c => !c.classList.contains('pinned')) ?? cells[0];
  if (!cell) return;

  clearVideoElements(cell);
  setVideo(cell, video);
}

export async function init() {
  masthead.handlers.onShuffle = handleShuffle;
  masthead.handlers.onChangeGridLayout = handleLayoutChange;
  masthead.handlers.onSelectSearchVideo = handleSelectSearchVideo;
  window.addEventListener('resize', renderGrid);
  videos.shuffleVideos();
  renderGrid();
}
