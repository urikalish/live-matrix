import * as settings from './settings';

export const handlers = {
  onChangeGridLayout: null as (() => void) | null,
  onShuffle: null as (() => void) | null,
};

function handleActionButtonClick(event: MouseEvent) {
  const action = (event.currentTarget as HTMLButtonElement).dataset.action;
  if (action === 'layout') {
    settings.setCols(Number((event.target as HTMLButtonElement).dataset.cols));
    settings.setRows(Number((event.target as HTMLButtonElement).dataset.rows));
    handlers.onChangeGridLayout!();
  } else if (action === 'shuffle') {
    handlers.onShuffle!();
  }
}

function buildActionButtons() {
  const actionButtonsContainerElm = document.getElementById(
    'layout-actions-container',
  ) as HTMLDivElement;
  const layoutButtonTemplateElm = document.createElement('button');
  layoutButtonTemplateElm.dataset.action = 'layout';
  layoutButtonTemplateElm.classList.add('masthead-btn');
  for (let c = 1; c <= settings.getMaxCols(); c++) {
    const r = c === 1 ? 1 : c - 1;
    const layoutButtonElm = layoutButtonTemplateElm.cloneNode(true) as HTMLButtonElement;
    layoutButtonElm.dataset.cols = c.toString();
    layoutButtonElm.dataset.rows = r.toString();
    layoutButtonElm.textContent = `⊞ ${c}x${r}`;
    actionButtonsContainerElm.appendChild(layoutButtonElm);
  }
}

export async function init() {
  buildActionButtons();
  const actionButtonElements = document.querySelectorAll('button[data-action]');
  actionButtonElements.forEach((btnElm) => {
    (btnElm as HTMLButtonElement).addEventListener('click', handleActionButtonClick);
  });
}
