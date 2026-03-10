import { VideosManager } from './videos-manager';

export class UIManager {
  videosManager: VideosManager;
  cols = 0;
  rows = 0;
  cellWidth = 0;
  cellHeight = 0;
  matrixContainerElm: HTMLDivElement = null!;

  constructor(videosManager: VideosManager) {
    this.videosManager = videosManager;
  }

  handleWindowResize() {
    this.setGridLayout(this.cols, this.rows);
  }

  setVideo(cellElm: HTMLDivElement, videoId: string) {
    const src = this.videosManager.getYouTubeVideoSrc(videoId);
    const frElm = document.createElement('iframe');
    frElm.setAttribute('src', src);
    frElm.setAttribute('width', '' + this.cellWidth);
    frElm.setAttribute('height', '' + this.cellHeight);
    frElm.setAttribute('videoId', videoId);
    frElm.setAttribute('frameborder', '0');
    frElm.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    );
    frElm.setAttribute('allowfullscreen', 'true');
    cellElm.appendChild(frElm);
  }

  setGridLayout(cols: number, rows: number) {
    this.cols = Number(cols);
    this.rows = Number(rows);
    this.cellWidth = this.matrixContainerElm.clientWidth / this.cols;
    this.cellHeight = (this.cellWidth * 9) / 16;
    this.matrixContainerElm.innerHTML = '';
    this.matrixContainerElm.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    const matrixCellElm = document.createElement('div');
    matrixCellElm.classList.add('matrix-cell');
    matrixCellElm.style.width = `${this.cellWidth}px`;
    matrixCellElm.style.height = `${this.cellHeight}px`;
    for (let i: number = 0; i < this.cols * this.rows; i++) {
      const elm = matrixCellElm.cloneNode(true) as HTMLDivElement;
      elm.setAttribute('id', `cell-${i}`);
      const videoIndex = Math.trunc(Math.random() * this.videosManager.videoIds.length);
      this.setVideo(elm, this.videosManager.videoIds[videoIndex]);
      this.matrixContainerElm.appendChild(elm);
    }
  }

  handleGridLayout(event: MouseEvent) {
    const cols = (event.target as HTMLButtonElement).dataset.cols;
    const rows = (event.target as HTMLButtonElement).dataset.rows;
    this.setGridLayout(Number(cols), Number(rows));
  }

  async init() {
    this.matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
    for (let i: number = 1; i <= 5; i++) {
      const mastheadLayoutBtnElms = document.querySelectorAll('.masthead--layout-btn');
      mastheadLayoutBtnElms.forEach((btnElm) => {
        (btnElm as HTMLButtonElement).addEventListener('click', this.handleGridLayout.bind(this));
      });
    }
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    this.handleWindowResize();
    this.setGridLayout(5, 4);
  }

}
