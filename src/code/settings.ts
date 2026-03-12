const _MAX_COLS = 6;
const _MAX_ROWS = 5;
const _INITIAL_COLS = 4;
const _INITIAL_ROWS = 3;

const _STORAGE_COLS_KEY = 'live-matrix.cols';
const _STORAGE_ROWS_KEY = 'live-matrix.rows';

let _cols = 1;
let _rows = 1;

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadGridValue(storageKey: string, fallbackValue: number, maxValue: number): number {
  const storage = getStorage();
  if (!storage) return clampGridSize(fallbackValue, maxValue);

  const rawValue = storage.getItem(storageKey);
  if (rawValue === null) return clampGridSize(fallbackValue, maxValue);
  return clampGridSize(Number(rawValue), maxValue);
}

function saveGridValue(storageKey: string, value: number): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(storageKey, value.toString());
}

function clampGridSize(value: number, maxValue: number): number {
  if (!Number.isFinite(value)) return 1;
  const normalized = Math.trunc(value);
  if (normalized < 1) return 1;
  if (normalized > maxValue) return maxValue;
  return normalized;
}

export function getCols(): number {
  return _cols;
}

export function setCols(value: number): void {
  _cols = clampGridSize(value, _MAX_COLS);
  saveGridValue(_STORAGE_COLS_KEY, _cols);
}

export function getRows(): number {
  return _rows;
}

export function setRows(value: number): void {
  _rows = clampGridSize(value, _MAX_ROWS);
  saveGridValue(_STORAGE_ROWS_KEY, _rows);
}

export function getMaxCols(): number {
  return _MAX_COLS;
}

export function getMaxRows(): number {
  return _MAX_ROWS;
}

export async function init() {
  _cols = loadGridValue(_STORAGE_COLS_KEY, _INITIAL_COLS, _MAX_COLS);
  _rows = loadGridValue(_STORAGE_ROWS_KEY, _INITIAL_ROWS, _MAX_ROWS);
}
