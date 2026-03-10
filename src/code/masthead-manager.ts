export type ChangeGridLayoutHandler = (rows: number, cols: number) => void;

export class MastheadManager {
  onChangeGridLayout: ChangeGridLayoutHandler = null!;

  async init() {
    for (let i: number = 1; i <= 5; i++) {
      const mastheadLayoutBtnElms = document.querySelectorAll('.masthead--layout-btn');
      mastheadLayoutBtnElms.forEach((btnElm) => {
        (btnElm as HTMLButtonElement).addEventListener('click', (event) => {
          const cols = (event.target as HTMLButtonElement).dataset.cols;
          const rows = (event.target as HTMLButtonElement).dataset.rows;
          this.onChangeGridLayout(Number(cols), Number(rows));
        });
      });
    }
  }
}
