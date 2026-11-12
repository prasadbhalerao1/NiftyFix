import { describe, expect, it } from 'vitest';
import { redactPixels, type Pixels } from '../src';

/** A 20 × 20 image with a different value in every pixel. */
function noisy(): Pixels {
  const data = new Uint8ClampedArray(20 * 20 * 4);
  for (let i = 0; i < 400; i += 1)
    data.set([(i * 37) % 256, (i * 11) % 256, (i * 5) % 256, 255], i * 4);
  return { data, width: 20, height: 20 };
}
const at = (p: Pixels, x: number, y: number): number[] => [
  ...p.data.slice((y * 20 + x) * 4, (y * 20 + x) * 4 + 4),
];

describe('redactPixels', () => {
  it('fills solid boxes and leaves everything outside untouched', () => {
    const image = noisy();
    const before = noisy();
    redactPixels(
      image,
      [
        { x: 2, y: 2, width: 5, height: 5, style: 'black' },
        { x: 10, y: 10, width: 3, height: 3, style: 'white' },
      ],
      50,
    );
    expect(at(image, 2, 2)).toEqual([0, 0, 0, 255]);
    expect(at(image, 6, 6)).toEqual([0, 0, 0, 255]);
    expect(at(image, 12, 12)).toEqual([255, 255, 255, 255]);
    expect(at(image, 7, 7)).toEqual(at(before, 7, 7));
    expect(at(image, 0, 0)).toEqual(at(before, 0, 0));
  });

  it('pixelates into uniform blocks', () => {
    const image = noisy();
    redactPixels(image, [{ x: 0, y: 0, width: 16, height: 16, style: 'pixelate' }], 50);
    // Block size 4: every pixel of the first block matches.
    expect(at(image, 3, 3)).toEqual(at(image, 0, 0));
    expect(at(image, 4, 0)).not.toEqual(at(image, 0, 0));
  });

  it('blurs inside the box only, smoothing out detail', () => {
    const image = noisy();
    const before = noisy();
    redactPixels(image, [{ x: 0, y: 0, width: 16, height: 16, style: 'blur' }], 100);
    const spread = (p: Pixels): number => {
      let min = 255;
      let max = 0;
      for (let y = 4; y < 12; y += 1)
        for (let x = 4; x < 12; x += 1) {
          const v = at(p, x, y)[0] ?? 0;
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      return max - min;
    };
    expect(spread(image)).toBeLessThan(spread(before) / 4);
    expect(at(image, 17, 17)).toEqual(at(before, 17, 17));
  });

  it('skips boxes outside the image', () => {
    expect(redactPixels(noisy(), [{ x: 30, y: 30, width: 5, height: 5, style: 'black' }], 50)).toBe(
      0,
    );
  });
});
