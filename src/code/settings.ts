const _MAX_COLS = 6;
const _MAX_ROWS = 5;
const _INITIAL_COLS = 6;
const _INITIAL_ROWS = 5;

let _cols = 1;
let _rows = 1;

export function getCols(): number {
  return _cols;
}

export function setCols(value: number): void {
  _cols = value;
}

export function getRows(): number {
  return _rows;
}

export function setRows(value: number): void {
  _rows = value;
}

export function getMaxCols(): number {
  return _MAX_COLS;
}

export function getMaxRows(): number {
  return _MAX_ROWS;
}

export async function init() {
  setCols(_INITIAL_COLS);
  setRows(_INITIAL_ROWS);
}
