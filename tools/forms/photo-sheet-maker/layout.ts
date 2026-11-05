/** Sheets and photos are in millimetres; pixels come from the print DPI. */
export interface SizeMm {
  width: number;
  height: number;
}

export interface SheetLayout {
  /** The sheet as printed: turned to landscape when that fits more photos. */
  sheet: SizeMm;
  columns: number;
  rows: number;
  /** Top-left corner of each photo, in millimetres, row by row. */
  positions: { x: number; y: number }[];
}

/** Space left around the edge (printers cannot print to the edge) and between photos (for cutting). */
export const MARGIN_MM = 3;
export const GAP_MM = 2;

const fit = (length: number, item: number): number =>
  Math.max(0, Math.floor((length - 2 * MARGIN_MM + GAP_MM) / (item + GAP_MM)));

function layoutOn(sheet: SizeMm, photo: SizeMm): SheetLayout {
  const columns = fit(sheet.width, photo.width);
  const rows = fit(sheet.height, photo.height);
  // Centre the grid on the sheet.
  const left = (sheet.width - (columns * photo.width + (columns - 1) * GAP_MM)) / 2;
  const top = (sheet.height - (rows * photo.height + (rows - 1) * GAP_MM)) / 2;
  const positions = Array.from({ length: rows * columns }, (_, i) => ({
    x: left + (i % columns) * (photo.width + GAP_MM),
    y: top + Math.floor(i / columns) * (photo.height + GAP_MM),
  }));
  return { sheet, columns, rows, positions };
}

/** The layout that fits the most photos, trying the sheet both ways round. */
export function bestLayout(sheet: SizeMm, photo: SizeMm): SheetLayout {
  const portrait = layoutOn(sheet, photo);
  const landscape = layoutOn({ width: sheet.height, height: sheet.width }, photo);
  return landscape.positions.length > portrait.positions.length ? landscape : portrait;
}

export const mmToPx = (mm: number, dpi: number): number => Math.round((mm / 25.4) * dpi);
