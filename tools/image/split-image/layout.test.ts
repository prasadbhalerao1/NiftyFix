import { describe, expect, it } from 'vitest';
import { coverArea, planTiles, type LayoutOptions } from './layout';

const base: LayoutOptions = { mode: 'grid', rows: 2, cols: 3, shape: '1:1', overlap: 0 };

describe('planTiles', () => {
  it('cuts a grid on whole pixels with no gaps, in reading order', () => {
    const tiles = planTiles({ width: 1000, height: 501 }, base);
    expect(tiles).toHaveLength(6);
    expect(tiles.map((t) => t.x)).toEqual([0, 333, 667, 0, 333, 667]);
    expect(tiles.map((t) => t.width)).toEqual([333, 334, 333, 333, 334, 333]);
    expect(tiles.map((t) => t.height)).toEqual([251, 251, 251, 250, 250, 250]);
    expect(tiles.map((t) => t.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('makes an Instagram grid of 1080 px tiles, numbered so the bottom-right is posted first', () => {
    const tiles = planTiles(
      { width: 3000, height: 3000 },
      { ...base, mode: 'instagram', rows: 2, shape: '4:5' },
    );
    expect(tiles).toHaveLength(6);
    expect(tiles[0]).toMatchObject({ outWidth: 1080, outHeight: 1350, order: 6 });
    expect(tiles[5]?.order).toBe(1);
    // 3 tiles of 4:5 over 2 rows make a 1.2 : 1 area, centred: full width, 2500 px high.
    const area = coverArea(
      { width: 3000, height: 3000 },
      { ...base, mode: 'instagram', rows: 2, shape: '4:5' },
    );
    expect([area.x, area.y, area.width, area.height].map(Math.round)).toEqual([0, 250, 3000, 2500]);
  });

  it('cuts a panorama into seamless carousel slides', () => {
    const tiles = planTiles(
      { width: 4000, height: 1000 },
      { ...base, mode: 'carousel', cols: 4, shape: '1:1' },
    );
    expect(tiles.map((t) => [t.x, t.width, t.outWidth, t.outHeight])).toEqual([
      [0, 1000, 1080, 1080],
      [1000, 1000, 1080, 1080],
      [2000, 1000, 1080, 1080],
      [3000, 1000, 1080, 1080],
    ]);
  });

  it('adds overlap between poster pages, but not at the outer edges', () => {
    const [first, second] = planTiles(
      { width: 1000, height: 1000 },
      { ...base, mode: 'poster', rows: 1, cols: 2, overlap: 0.1 },
    );
    expect(first).toMatchObject({ x: 0, width: 550 });
    expect(second).toMatchObject({ x: 450, width: 550 });
  });
});
