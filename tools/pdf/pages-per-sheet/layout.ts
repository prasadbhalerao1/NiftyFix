/** Space at the sheet edge and between pages, in points (about 5 mm). */
export const SHEET_MARGIN = 14;
export const CELL_GAP = 8;

export interface Size {
  width: number;
  height: number;
}

export interface Grid {
  columns: number;
  rows: number;
  /** Sheet size in points, turned to whichever orientation gives the largest pages. */
  sheet: Size;
  cell: Size;
}

const SHAPES: Record<number, readonly [number, number][]> = {
  2: [
    [2, 1],
    [1, 2],
  ],
  4: [[2, 2]],
  6: [
    [3, 2],
    [2, 3],
  ],
  9: [[3, 3]],
};

/**
 * Columns, rows and sheet orientation for `perSheet` pages shaped like `page`:
 * every combination is tried and the one that shows the pages largest wins.
 */
export function chooseGrid(perSheet: number, page: Size, paper: Size): Grid {
  const short = Math.min(paper.width, paper.height);
  const long = Math.max(paper.width, paper.height);
  let best: (Grid & { scale: number }) | null = null;
  for (const [columns, rows] of SHAPES[perSheet] ?? [[1, perSheet]]) {
    for (const sheet of [
      { width: short, height: long },
      { width: long, height: short },
    ]) {
      const cell = {
        width: (sheet.width - 2 * SHEET_MARGIN - (columns - 1) * CELL_GAP) / columns,
        height: (sheet.height - 2 * SHEET_MARGIN - (rows - 1) * CELL_GAP) / rows,
      };
      const scale = Math.min(cell.width / page.width, cell.height / page.height);
      if (best === null || scale > best.scale + 1e-9) best = { columns, rows, sheet, cell, scale };
    }
  }
  if (best === null) throw new Error(`Unsupported pages per sheet: ${perSheet}`);
  const { scale: _scale, ...grid } = best;
  return grid;
}

/** Bottom-left corner of cell `index` (reading order: left to right, top to bottom), in PDF points. */
export function cellOrigin(grid: Grid, index: number): { x: number; y: number } {
  const column = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  return {
    x: SHEET_MARGIN + column * (grid.cell.width + CELL_GAP),
    y: grid.sheet.height - SHEET_MARGIN - (row + 1) * grid.cell.height - row * CELL_GAP,
  };
}

/**
 * Page order for a saddle-stitched booklet: pages are padded with blanks to a
 * multiple of 4, then each sheet side holds [left, right]. Printed double-sided
 * (flip on the short edge) and folded, the pages read in order. null = blank.
 */
export function bookletOrder(pageCount: number): (number | null)[] {
  const total = Math.ceil(pageCount / 4) * 4;
  const page = (index: number): number | null => (index < pageCount ? index : null);
  const order: (number | null)[] = [];
  for (let sheet = 0; sheet < total / 4; sheet += 1) {
    order.push(page(total - 1 - 2 * sheet), page(2 * sheet));
    order.push(page(2 * sheet + 1), page(total - 2 - 2 * sheet));
  }
  return order;
}
