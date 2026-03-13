import * as settings from './settings';

export const handlers = {
  onChangeGridLayout: null as (() => void) | null,
  onShuffle: null as (() => void) | null,
};

function syncLayoutButtonsDisabledState() {
  const activeCols = settings.getCols().toString();
  const activeRows = settings.getRows().toString();
  const layoutButtons = document.querySelectorAll('button[data-action="layout"]');

  layoutButtons.forEach((btnElm) => {
    if (!(btnElm instanceof HTMLButtonElement)) return;
    const isCurrentLayout = btnElm.dataset.cols === activeCols && btnElm.dataset.rows === activeRows;
    btnElm.disabled = isCurrentLayout;
  });
}

function handleActionButtonClick(event: MouseEvent) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) return;

  const action = button.dataset.action;
  if (action === 'layout') {
    settings.setCols(Number(button.dataset.cols));
    settings.setRows(Number(button.dataset.rows));
    syncLayoutButtonsDisabledState();
    handlers.onChangeGridLayout?.();
  } else if (action === 'shuffle') {
    handlers.onShuffle?.();
  }
}

function buildActionButtons() {
  const actionButtonsContainerElm = document.getElementById('layout-actions-container');
  if (!(actionButtonsContainerElm instanceof HTMLDivElement)) return;

  const layoutButtonTemplateElm = document.createElement('button');
  layoutButtonTemplateElm.dataset.action = 'layout';
  layoutButtonTemplateElm.classList.add('masthead-btn');
  for (let c = 1; c <= settings.getMaxCols(); c++) {
    const r = c === 1 ? 1 : c - 1;
    const layoutButtonElm = layoutButtonTemplateElm.cloneNode(true) as HTMLButtonElement;
    layoutButtonElm.dataset.cols = c.toString();
    layoutButtonElm.dataset.rows = r.toString();
    layoutButtonElm.textContent = `${c}x${r}`;
    actionButtonsContainerElm.appendChild(layoutButtonElm);
  }
}

export async function init() {
  buildActionButtons();
  syncLayoutButtonsDisabledState();
  const actionButtonElements = document.querySelectorAll('button[data-action]');
  actionButtonElements.forEach((btnElm) => {
    if (btnElm instanceof HTMLButtonElement) {
      btnElm.addEventListener('click', handleActionButtonClick);
    }
  });
}
