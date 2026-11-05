import { describe, expect, it } from 'vitest';
import { bestLayout, mmToPx } from './layout';

const PHOTO_35x45 = { width: 35, height: 45 };
const SHEET_4x6 = { width: 101.6, height: 152.4 };

describe('bestLayout', () => {
  it('fits 8 passport photos on 4 × 6 inch paper by turning it landscape', () => {
    const layout = bestLayout(SHEET_4x6, PHOTO_35x45);
    expect(layout.positions).toHaveLength(8);
    expect(layout).toMatchObject({ columns: 4, rows: 2, sheet: { width: 152.4, height: 101.6 } });
  });

  it('fits 30 on A4, and 2 US 2 × 2 inch photos on 4 × 6 (3 would need zero margin)', () => {
    expect(bestLayout({ width: 210, height: 297 }, PHOTO_35x45).positions).toHaveLength(30);
    expect(bestLayout(SHEET_4x6, { width: 50.8, height: 50.8 }).positions).toHaveLength(2);
  });

  it('keeps every photo inside the sheet with a margin', () => {
    const { sheet, positions } = bestLayout({ width: 210, height: 297 }, PHOTO_35x45);
    for (const { x, y } of positions) {
      expect(x).toBeGreaterThanOrEqual(3);
      expect(y).toBeGreaterThanOrEqual(3);
      expect(x + 35).toBeLessThanOrEqual(sheet.width - 3);
      expect(y + 45).toBeLessThanOrEqual(sheet.height - 3);
    }
  });

  it('converts millimetres to pixels at the DPI', () => {
    expect(mmToPx(152.4, 300)).toBe(1800);
  });
});
