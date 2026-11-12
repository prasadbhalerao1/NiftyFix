import { describe, expect, it } from 'vitest';
import {
  applyPercent,
  format,
  percentChange,
  percentOf,
  reversePercent,
  whatPercent,
} from './percent';

describe('percentages', () => {
  it('computes the common cases', () => {
    expect(percentOf(18, 2500)).toBe(450);
    expect(whatPercent(432, 500)).toBeCloseTo(86.4);
    expect(percentChange(80, 100)).toBe(25);
    expect(percentChange(100, 80)).toBe(-20);
    expect(applyPercent(1000, -15)).toBe(850);
    expect(reversePercent(1180, 18)).toBeCloseTo(1000);
  });

  it('refuses impossible inputs instead of returning Infinity', () => {
    expect(whatPercent(5, 0)).toBeNull();
    expect(percentChange(0, 10)).toBeNull();
    expect(reversePercent(10, -100)).toBeNull();
  });

  it('formats with Indian grouping and no trailing zeros', () => {
    expect(format(1234567.5)).toBe('12,34,567.5');
    expect(format(1 / 3)).toBe('0.3333');
    expect(format(null)).toBe('');
  });
});
