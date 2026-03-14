import * as settings from './settings';
import * as videos from './videos';
import type { Video } from './videos';

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_MAX_RESULTS = 100;

let searchDebounceTimer: number | null = null;

type MastheadHandlers = {
  onChangeGridLayout: (() => void) | null;
  onShuffle: (() => void) | null;
  onSelectSearchVideo: ((videoId: string) => void) | null;
};

export const handlers: MastheadHandlers = {
  onChangeGridLayout: null as (() => void) | null,
  onShuffle: null as (() => void) | null,
  onSelectSearchVideo: null as ((videoId: string) => void) | null,
};

type SearchUiElements = {
  container: HTMLDivElement;
  input: HTMLInputElement;
  results: HTMLDivElement;
};

function getSearchUiElements(): SearchUiElements | null {
  const container = document.getElementById('masthead-search');
  const input = document.getElementById('masthead-search-input');
  const results = document.getElementById('masthead-search-results');

  if (
    !(container instanceof HTMLDivElement) ||
    !(input instanceof HTMLInputElement) ||
    !(results instanceof HTMLDivElement)
  ) {
    return null;
  }

  return { container, input, results };
}

function clearSearchResults(resultsElm: HTMLDivElement) {
  resultsElm.innerHTML = '';
  resultsElm.classList.remove('is-visible');
}

function createSearchResultButton(video: Video): HTMLButtonElement {
  const resultElm = document.createElement('button');
  resultElm.type = 'button';
  resultElm.classList.add('masthead-search-result');
  resultElm.setAttribute('role', 'option');
  resultElm.dataset.videoId = video.id;

  const titleElm = document.createElement('div');
  titleElm.classList.add('masthead-search-result-channel-name');
  titleElm.textContent = video.channel.name;

  const metaElm = document.createElement('div');
  metaElm.classList.add('masthead-search-result-video-title');
  metaElm.textContent = video.title;

  resultElm.appendChild(titleElm);
  resultElm.appendChild(metaElm);
  return resultElm;
}

function renderSearchResults(resultsElm: HTMLDivElement, matches: Video[]) {
  resultsElm.innerHTML = '';

  if (matches.length === 0) {
    const emptyElm = document.createElement('div');
    emptyElm.classList.add('masthead-search-empty');
    emptyElm.textContent = 'No matching videos';
    resultsElm.appendChild(emptyElm);
    resultsElm.classList.add('is-visible');
    return;
  }

  matches.forEach(video => {
    resultsElm.appendChild(createSearchResultButton(video));
  });
  resultsElm.classList.add('is-visible');
}

function runSearch(inputElm: HTMLInputElement, resultsElm: HTMLDivElement) {
  const query = inputElm.value.trim();
  if (!query) {
    clearSearchResults(resultsElm);
    return;
  }

  const matches = videos.searchVideos(query, SEARCH_MAX_RESULTS);
  renderSearchResults(resultsElm, matches);
}

function handleSearchInput(inputElm: HTMLInputElement, resultsElm: HTMLDivElement) {
  if (searchDebounceTimer !== null) {
    window.clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = window.setTimeout(() => {
    runSearch(inputElm, resultsElm);
  }, SEARCH_DEBOUNCE_MS);
}

function attachSearchHandlers() {
  const searchUi = getSearchUiElements();
  if (!searchUi) return;

  const { container, input, results } = searchUi;

  input.addEventListener('input', () => {
    handleSearchInput(input, results);
  });

  input.addEventListener('focus', () => {
    runSearch(input, results);
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      clearSearchResults(results);
      input.blur();
      return;
    }

    if (event.key === 'Enter') {
      const firstResult = results.querySelector('.masthead-search-result');
      if (!(firstResult instanceof HTMLButtonElement)) return;
      event.preventDefault();
      firstResult.click();
    }
  });

  results.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const buttonElm = target.closest('.masthead-search-result');
    if (!(buttonElm instanceof HTMLButtonElement)) return;

    const videoId = buttonElm.dataset.videoId;
    if (!videoId) return;

    handlers.onSelectSearchVideo?.(videoId);
    clearSearchResults(results);
    input.value = '';
  });

  document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (container.contains(target)) return;
    clearSearchResults(results);
  });
}

function syncLayoutButtonsDisabledState() {
  const activeCols = settings.getCols().toString();
  const activeRows = settings.getRows().toString();
  const layoutButtons = document.querySelectorAll('button[data-action="layout"]');

  layoutButtons.forEach(btnElm => {
    if (!(btnElm instanceof HTMLButtonElement)) return;
    btnElm.disabled = btnElm.dataset.cols === activeCols && btnElm.dataset.rows === activeRows;
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
  attachSearchHandlers();
  const actionButtonElements = document.querySelectorAll('button[data-action]');
  actionButtonElements.forEach(btnElm => {
    if (btnElm instanceof HTMLButtonElement) {
      btnElm.addEventListener('click', handleActionButtonClick);
    }
  });
}
