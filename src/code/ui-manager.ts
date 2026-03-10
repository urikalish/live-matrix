import { VideosManager } from './videos-manager';
import { MastheadManager, ChangeGridLayoutHandler } from './masthead-manager';

export class UIManager {
  videosManager: VideosManager = null!;
  mastheadManager: MastheadManager = null!;
  cols = 0;
  rows = 0;

  getCellWidth() {
    const matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
    return matrixContainerElm.clientWidth / this.cols;
  }

  getCellHeight() {
    return (this.getCellWidth() * 9) / 16;
  }

  handleWindowResize() {
    this.handleGridLayout(this.cols, this.rows);
  }

  setVideo(cellElm: HTMLDivElement, videoId: string) {
    const src = this.videosManager.getYouTubeVideoSrc(videoId);
    const frElm = document.createElement('iframe');
    frElm.setAttribute('src', src);
    frElm.setAttribute('width', '' + this.getCellWidth());
    frElm.setAttribute('height', '' + this.getCellHeight());
    frElm.setAttribute('videoId', videoId);
    frElm.setAttribute('frameborder', '0');
    frElm.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    );
    frElm.setAttribute('allowfullscreen', 'true');
    cellElm.appendChild(frElm);
  }

  handleGridLayout(cols: number, rows: number) {
    this.cols = Number(cols);
    this.rows = Number(rows);
    const matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
    matrixContainerElm.innerHTML = '';
    matrixContainerElm.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    const matrixCellElm = document.createElement('div');
    matrixCellElm.classList.add('matrix-cell');
    matrixCellElm.style.width = `${this.getCellWidth()}px`;
    matrixCellElm.style.height = `${this.getCellHeight()}px`;
    for (let i: number = 0; i < this.cols * this.rows; i++) {
      const elm = matrixCellElm.cloneNode(true) as HTMLDivElement;
      elm.setAttribute('id', `cell-${i}`);
      const videoIndex = Math.trunc(Math.random() * this.videosManager.videoIds.length);
      this.setVideo(elm, this.videosManager.videoIds[videoIndex]);
      matrixContainerElm.appendChild(elm);
    }
  }

  async init(videosManager: VideosManager, mastheadManager: MastheadManager) {
    this.videosManager = videosManager;
    this.mastheadManager = mastheadManager;
    this.mastheadManager.onChangeGridLayout = this.handleGridLayout.bind(
      this,
    ) as ChangeGridLayoutHandler;
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    this.handleGridLayout(5, 4);
  }
}
