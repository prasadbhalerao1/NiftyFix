import { describe, expect, it } from 'vitest';
import { bookletOrder, cellOrigin, chooseGrid, SHEET_MARGIN } from './layout';

const A4 = { width: 595.28, height: 841.89 };
const portrait = { width: 595.28, height: 841.89 };
const landscape = { width: 841.89, height: 595.28 };

describe('chooseGrid', () => {
  it('puts 2 portrait pages side by side on a landscape sheet', () => {
    const grid = chooseGrid(2, portrait, A4);
    expect([grid.columns, grid.rows]).toEqual([2, 1]);
    expect(grid.sheet.width).toBeGreaterThan(grid.sheet.height);
  });

  it('stacks 2 landscape pages on a portrait sheet', () => {
    const grid = chooseGrid(2, landscape, A4);
    expect([grid.columns, grid.rows]).toEqual([1, 2]);
    expect(grid.sheet.height).toBeGreaterThan(grid.sheet.width);
  });

  it('uses a 2 x 2 portrait sheet for 4 portrait pages', () => {
    const grid = chooseGrid(4, portrait, A4);
    expect([grid.columns, grid.rows]).toEqual([2, 2]);
    expect(grid.sheet.height).toBeGreaterThan(grid.sheet.width);
  });

  it('lays 6 portrait pages 3 across on a landscape sheet', () => {
    const grid = chooseGrid(6, portrait, A4);
    expect([grid.columns, grid.rows]).toEqual([3, 2]);
  });
});

describe('cellOrigin', () => {
  it('counts cells from the top left, in PDF coordinates (origin bottom left)', () => {
    const grid = chooseGrid(4, portrait, A4);
    const first = cellOrigin(grid, 0);
    expect(first.x).toBe(SHEET_MARGIN);
    expect(first.y + grid.cell.height).toBeCloseTo(grid.sheet.height - SHEET_MARGIN);
    const fourth = cellOrigin(grid, 3);
    expect(fourth.x).toBeGreaterThan(first.x);
    expect(fourth.y).toBeCloseTo(SHEET_MARGIN);
  });
});

describe('bookletOrder', () => {
  it('orders 8 pages so two folded sheets read 1 to 8', () => {
    // Sheet 1: front 8|1, back 2|7. Sheet 2: front 6|3, back 4|5 (1-based).
    expect(bookletOrder(8)).toEqual([7, 0, 1, 6, 5, 2, 3, 4]);
  });

  it('pads with blank pages to a multiple of 4', () => {
    expect(bookletOrder(5)).toEqual([null, 0, 1, null, null, 2, 3, 4]);
  });
});
