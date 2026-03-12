import * as settings from './settings';
import * as videos from './videos';
import * as masthead from './masthead';

function getCellWidth() {
  const matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
  return matrixContainerElm.clientWidth / settings.getCols();
}

function getCellHeight() {
  return (getCellWidth() * 9) / 16;
}

function setVideo(cellElm: HTMLDivElement, videoId: string) {
  if (videoId === '') {
    return;
  }
  const src = videos.getYouTubeVideoSrc(videoId);
  const frElm = document.createElement('iframe');
  frElm.setAttribute('src', src);
  frElm.setAttribute('width', '' + getCellWidth());
  frElm.setAttribute('height', '' + getCellHeight());
  frElm.setAttribute('frameborder', '0');
  frElm.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  );
  frElm.dataset.videoId = videoId;
  cellElm.appendChild(frElm);
}

function handleGridLayout() {
  const matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
  matrixContainerElm.innerHTML = '';
  matrixContainerElm.style.gridTemplateColumns = `repeat(${settings.getCols()}, auto)`;
  const matrixCellElm = document.createElement('div');
  matrixCellElm.classList.add('matrix-cell');
  matrixCellElm.style.width = `${getCellWidth()}px`;
  matrixCellElm.style.height = `${getCellHeight()}px`;
  for (let i: number = 0; i < settings.getCols() * settings.getRows(); i++) {
    const elm = matrixCellElm.cloneNode(true) as HTMLDivElement;
    elm.setAttribute('index', i.toString());
    setVideo(elm, videos.getVideoIdByIndex(i));
    matrixContainerElm.appendChild(elm);
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
