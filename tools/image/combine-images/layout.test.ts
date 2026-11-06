import { describe, expect, it } from 'vitest';
import { MAX_CANVAS_PIXELS, planLayout } from './layout';

const base = { columns: 2, gap: 0 } as const;

describe('planLayout', () => {
  it('stacks images vertically at the narrowest width, never enlarging', () => {
    const layout = planLayout(
      [
        { width: 1000, height: 600 },
        { width: 500, height: 300 },
      ],
      { ...base, arrangement: 'vertical', gap: 20 },
    );
    expect(layout.width).toBe(500);
    expect(layout.placements).toEqual([
      { x: 0, y: 0, width: 500, height: 300 },
      { x: 0, y: 320, width: 500, height: 300 },
    ]);
    expect(layout.height).toBe(620);
  });

  it('puts images side by side at the shortest height', () => {
    const layout = planLayout(
      [
        { width: 400, height: 400 },
        { width: 800, height: 200 },
      ],
      { ...base, arrangement: 'horizontal' },
    );
    expect(layout.height).toBe(200);
    expect(layout.placements.map((placed) => placed.width)).toEqual([200, 800]);
    expect(layout.width).toBe(1000);
  });

  it('fits each image into equal grid cells without stretching', () => {
    const layout = planLayout(
      [
        { width: 300, height: 300 },
        { width: 600, height: 300 },
        { width: 300, height: 300 },
      ],
      { ...base, arrangement: 'grid', gap: 10 },
    );
    expect(layout.width).toBe(610);
    expect(layout.height).toBe(610);
    // The wide image is letterboxed in its 300 x 300 cell.
    expect(layout.placements[1]).toEqual({ x: 310, y: 75, width: 300, height: 150 });
    expect(layout.placements[2]).toMatchObject({ x: 0, y: 310 });
  });

  it('places ID cards at their real size on A4 at 300 DPI', () => {
    const layout = planLayout(
      [
        { width: 1712, height: 1080 },
        { width: 1712, height: 1080 },
      ],
      { ...base, arrangement: 'id-a4' },
    );
    expect(layout).toMatchObject({ width: 2480, height: 3508, scale: 1 });
    // 85.6 mm at 300 DPI is 1011 px; the card is centred across the page.
    expect(layout.placements[0]?.width).toBe(1011);
    expect(layout.placements[0]?.x).toBe(Math.round((2480 - 1011) / 2));
  });

  it('shrinks a huge result to stay inside the phone canvas limit', () => {
    const layout = planLayout(
      Array.from({ length: 10 }, () => ({ width: 4000, height: 3000 })),
      { ...base, arrangement: 'vertical' },
    );
    expect(layout.scale).toBeLessThan(1);
    expect(layout.width * layout.height).toBeLessThanOrEqual(MAX_CANVAS_PIXELS * 1.01);
    expect(Math.max(layout.width, layout.height)).toBeLessThanOrEqual(16_000);
  });
});
