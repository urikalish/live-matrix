import * as settings from './settings';

export const handlers = {
  onChangeGridLayout: null as ((cols: number, rows: number) => void) | null,
};

export const init = async () => {
  const mastheadLayoutBtnElms = document.querySelectorAll('.masthead--layout-btn');
  mastheadLayoutBtnElms.forEach((btnElm) => {
    (btnElm as HTMLButtonElement).addEventListener('click', (event) => {
      const cols = (event.target as HTMLButtonElement).dataset.cols;
      const rows = (event.target as HTMLButtonElement).dataset.rows;
      settings.setCols(Number(cols));
      settings.setRows(Number(rows));
      handlers.onChangeGridLayout!(Number(cols), Number(rows));
    });
  });
};
