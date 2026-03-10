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

export async function init() {
  setCols(6);
  setRows(5);
}
