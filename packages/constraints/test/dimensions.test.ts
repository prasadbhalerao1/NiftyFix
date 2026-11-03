import { describe, expect, it } from 'vitest';
import { centredCropForAspect, clampRect, cmToPixels, upscaleFactor } from '../src/dimensions';
import { positionInRange, validateRange } from '../src/byte-range';

describe('centredCropForAspect', () => {
  it('crops the sides of a wide image', () => {
    expect(centredCropForAspect({ width: 4000, height: 3000 }, 3 / 4)).toEqual({
      x: 875,
      y: 0,
      width: 2250,
      height: 3000,
    });
  });

  it('crops top and bottom of a tall image', () => {
    expect(centredCropForAspect({ width: 1000, height: 3000 }, 1)).toEqual({
      x: 0,
      y: 1000,
      width: 1000,
      height: 1000,
    });
  });

  it('rejects non-positive input', () => {
    expect(() => centredCropForAspect({ width: 0, height: 10 }, 1)).toThrow(RangeError);
  });
});

describe('clampRect', () => {
  it('moves a rectangle back inside the bounds', () => {
    expect(
      clampRect({ x: -10, y: 950, width: 100, height: 100 }, { width: 500, height: 1000 }),
    ).toEqual({ x: 0, y: 900, width: 100, height: 100 });
  });
});

describe('physical sizes', () => {
  it('converts 3.5 cm at 200 DPI', () => {
    expect(cmToPixels(3.5, 200)).toBe(276);
  });

  it('computes upscaling', () => {
    expect(upscaleFactor({ width: 100, height: 100 }, { width: 200, height: 150 })).toBe(2);
  });
});

describe('byte ranges', () => {
  it('positions values', () => {
    expect(positionInRange(5, { minBytes: 10 })).toBe('below');
    expect(positionInRange(15, { minBytes: 10, maxBytes: 20 })).toBe('within');
    expect(positionInRange(25, { maxBytes: 20 })).toBe('above');
  });

  it('validates ranges', () => {
    expect(validateRange({ minBytes: 30, maxBytes: 20 })).toMatch(/cannot be larger/);
    expect(validateRange({ maxBytes: 0 })).toMatch(/greater than zero/);
    expect(validateRange({ minBytes: 10, maxBytes: 20 })).toBeNull();
  });
});
