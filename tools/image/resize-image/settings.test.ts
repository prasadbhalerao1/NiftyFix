import { describe, expect, it } from 'vitest';
import { fromPixels, proportional, resolveSize } from './settings';

const source = { width: 4000, height: 3000 };
const entry = { unit: 'px', width: null, height: null, percent: null, dpi: 300 } as const;

describe('resolveSize', () => {
  it('uses pixels as typed', () => {
    expect(resolveSize({ ...entry, width: 800, height: 600 }, source)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('scales by a percentage', () => {
    expect(resolveSize({ ...entry, unit: 'percent', percent: 25 }, source)).toEqual({
      width: 1000,
      height: 750,
    });
  });

  it('converts centimetres and inches at the DPI', () => {
    expect(resolveSize({ ...entry, unit: 'cm', width: 3.5, height: 4.5 }, source)).toEqual({
      width: 413,
      height: 531,
    });
    expect(resolveSize({ ...entry, unit: 'in', width: 2, height: 2 }, source)).toEqual({
      width: 600,
      height: 600,
    });
  });

  it('explains empty, tiny and huge sizes', () => {
    expect(resolveSize(entry, source)).toHaveProperty('error');
    expect(resolveSize({ ...entry, unit: 'percent', percent: 0 }, source)).toHaveProperty('error');
    expect(resolveSize({ ...entry, width: 20_000, height: 20_000 }, source)).toHaveProperty(
      'error',
    );
    expect(
      resolveSize({ ...entry, unit: 'cm', width: 3, height: 4, dpi: null }, source),
    ).toHaveProperty('error');
  });
});

describe('unit helpers', () => {
  it('keeps proportions', () => {
    expect(proportional(800, 4000, 3000, 'px')).toBe(600);
    expect(proportional(10, 4000, 3000, 'cm')).toBe(7.5);
  });

  it('shows pixels in other units', () => {
    expect(fromPixels(600, 'in', 300)).toBe(2);
    expect(fromPixels(413, 'cm', 300)).toBe(3.5);
  });
});
