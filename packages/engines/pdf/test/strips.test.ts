import { describe, expect, it } from 'vitest';
import { joinStrips, type Tile } from '../src/strips';

/** A tile of `width` × `height` pixels drawn at 0.5 pt per pixel with its bottom-left at (x, y). */
const tile = (key: string, x: number, y: number, width = 200, height = 10): Tile => ({
  key,
  width,
  height,
  matrix: [width / 2, 0, 0, height / 2, x, y],
});

describe('joinStrips', () => {
  it('joins horizontal strips stacked top to bottom into one picture', () => {
    // Drawn out of order, as producers often do.
    const strips = [tile('b', 50, 495), tile('a', 50, 500), tile('c', 50, 490)];
    expect(joinStrips(strips)).toEqual([
      {
        width: 200,
        height: 30,
        parts: [
          { key: 'a', x: 0, y: 0 },
          { key: 'b', x: 0, y: 10 },
          { key: 'c', x: 0, y: 20 },
        ],
      },
    ]);
  });

  it('joins a 2 × 2 grid of tiles', () => {
    const grid = [
      tile('tl', 0, 50, 100, 100),
      tile('tr', 50, 50, 100, 100),
      tile('bl', 0, 0, 100, 100),
      tile('br', 50, 0, 100, 100),
    ];
    const [joined] = joinStrips(grid);
    expect(joined?.width).toBe(200);
    expect(joined?.height).toBe(200);
    expect(joined?.parts).toEqual(
      expect.arrayContaining([
        { key: 'tl', x: 0, y: 0 },
        { key: 'tr', x: 100, y: 0 },
        { key: 'bl', x: 0, y: 100 },
        { key: 'br', x: 100, y: 100 },
      ]),
    );
  });

  it('keeps separate pictures apart: a gap, a different width or a different scale', () => {
    expect(joinStrips([tile('a', 50, 500), tile('b', 50, 480)])).toEqual([]);
    expect(joinStrips([tile('a', 50, 500), tile('b', 50, 495, 180)])).toEqual([]);
    const sharper: Tile = { key: 'b', width: 200, height: 20, matrix: [100, 0, 0, 5, 50, 495] };
    expect(joinStrips([tile('a', 50, 500), sharper])).toEqual([]);
  });

  it('never joins flipped or rotated pieces', () => {
    const flipped: Tile = { key: 'b', width: 200, height: 10, matrix: [100, 0, 0, -5, 50, 500] };
    expect(joinStrips([tile('a', 50, 500), flipped])).toEqual([]);
  });
});
