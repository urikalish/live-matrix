import * as settings from './settings';

export const handlers = {
  onChangeGridLayout: null as (() => void) | null,
  onRefresh: null as (() => void) | null,
};

function handleActionButtonClick(event: MouseEvent) {
  const action = (event.currentTarget as HTMLButtonElement).dataset.action;
  if (action === 'layout') {
    const cols = (event.target as HTMLButtonElement).dataset.cols;
    const rows = (event.target as HTMLButtonElement).dataset.rows;
    settings.setCols(Number(cols));
    settings.setRows(Number(rows));
    handlers.onChangeGridLayout!();
  }
  if (action === 'refresh') {
    handlers.onRefresh!();
  }
}

export async function init() {
  const actionButtonElements = document.querySelectorAll('button[data-action]');
  actionButtonElements.forEach((btnElm) => {
    (btnElm as HTMLButtonElement).addEventListener('click', handleActionButtonClick);
  });
}
