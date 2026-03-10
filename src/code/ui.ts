import * as videos from './videos';
import * as masthead from './masthead';

let cols = 1;
let rows = 1;

function getCellWidth() {
  const matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
  return matrixContainerElm.clientWidth / cols;
}

function getCellHeight() {
  return (getCellWidth() * 9) / 16;
}

function setVideo(cellElm: HTMLDivElement, videoId: string) {
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

function handleGridLayout(c: number, r: number) {
  cols = c;
  rows = r;
  const matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
  matrixContainerElm.innerHTML = '';
  matrixContainerElm.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  const matrixCellElm = document.createElement('div');
  matrixCellElm.classList.add('matrix-cell');
  matrixCellElm.style.width = `${getCellWidth()}px`;
  matrixCellElm.style.height = `${getCellHeight()}px`;
  for (let i: number = 0; i < cols * rows; i++) {
    const elm = matrixCellElm.cloneNode(true) as HTMLDivElement;
    elm.setAttribute('id', `cell-${i}`);
    setVideo(elm, videos.getRandomVideoId());
    matrixContainerElm.appendChild(elm);
  }
}

function handleWindowResize() {
  handleGridLayout(cols, rows);
}

export async function init() {
  masthead.handlers.onChangeGridLayout = handleGridLayout;
  window.addEventListener('resize', handleWindowResize);
  handleGridLayout(5, 4);
}
