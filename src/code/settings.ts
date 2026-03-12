const _MAX_COLS = 6;
const _MAX_ROWS = 5;
const _INITIAL_COLS = 4;
const _INITIAL_ROWS = 3;

let _cols = 1;
let _rows = 1;

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
}

export function getRows(): number {
  return _rows;
}

export function setRows(value: number): void {
  _rows = clampGridSize(value, _MAX_ROWS);
}

export function getMaxCols(): number {
  return _MAX_COLS;
}

export function getMaxRows(): number {
  return _MAX_ROWS;
}

export async function init() {
  _cols = clampGridSize(_INITIAL_COLS, _MAX_COLS);
  _rows = clampGridSize(_INITIAL_ROWS, _MAX_ROWS);
}
