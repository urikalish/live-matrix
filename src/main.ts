class Main {
  cols = 0;
  rows = 0;
  cellWidth = 0;
  cellHeight = 0;
  videoIds: string[] = [];
  matrixContainerElm: HTMLDivElement = null!;

  async loadVideoIdsData() {
    const res = await fetch('/video-ids.json');
    this.videoIds = await res.json();
    let currentIndex = this.videoIds.length;
    let randomIndex;
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [this.videoIds[currentIndex], this.videoIds[randomIndex]] = [
        this.videoIds[randomIndex],
        this.videoIds[currentIndex],
      ];
    }
  }

  handleWindowResize() {
    this.setGridLayout(this.cols, this.rows);
  }

  setVideo(cellElm: HTMLDivElement, videoId: string) {
    const src = `https://www.youtube.com/embed/${videoId}?autohide=1&autoplay=1&controls=0&disablekb=1&iv_load_policy=3&modestbranding=1&mute=1&playsinline=1&rel=0&showinfo=0&vq=hd1080`;
    const frElm = document.createElement('iframe');
    frElm.setAttribute('src', src);
    frElm.setAttribute('width', '' + this.cellWidth);
    frElm.setAttribute('height', '' + this.cellHeight);
    frElm.setAttribute('title', videoId);
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
      const videoIndex = Math.trunc(Math.random() * this.videoIds.length);
      this.setVideo(elm, this.videoIds[videoIndex]);
      this.matrixContainerElm.appendChild(elm);
    }
  }

  handleGridLayout(event: MouseEvent) {
    const cols = (event.target as HTMLButtonElement).dataset.cols;
    const rows = (event.target as HTMLButtonElement).dataset.rows;
    this.setGridLayout(Number(cols), Number(rows));
  }

  async init() {
    await this.loadVideoIdsData();
    this.matrixContainerElm = document.getElementById('matrix-container') as HTMLDivElement;
    for (let i: number = 1; i <= 5; i++) {
      const mastheadLayoutBtnElms = document.querySelectorAll('.masthead--layout-btn');
      mastheadLayoutBtnElms.forEach((btnElm) => {
        (btnElm as HTMLButtonElement).addEventListener('click', this.handleGridLayout.bind(this));
      });
    }
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    this.handleWindowResize();
    this.setGridLayout(4, 3);
  }
}

const main = new Main();
main.init().then(null);
