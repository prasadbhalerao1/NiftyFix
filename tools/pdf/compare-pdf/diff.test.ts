import { describe, expect, it } from 'vitest';
import { pixelDiff } from './diff';

describe('pixelDiff', () => {
  it('counts and marks the pixels that differ', () => {
    const a = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    const b = new Uint8ClampedArray([255, 255, 255, 255, 200, 200, 200, 255]);
    const out = new Uint8ClampedArray(8);
    expect(pixelDiff(a, b, out)).toBe(0.5);
    expect([...out.slice(4)]).toEqual([234, 88, 12, 255]);
    expect(out[0]).toBe(255);
  });
});
