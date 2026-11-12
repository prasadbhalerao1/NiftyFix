import { describe, expect, it } from 'vitest';
import {
  contrast,
  exportPalette,
  extractPalette,
  formats,
  nearestName,
  toCmyk,
  toHex,
  toHsl,
} from './colors';

describe('colour formats', () => {
  it('converts to HEX, HSL and CMYK', () => {
    expect(toHex([255, 165, 0])).toBe('#FFA500');
    expect(toHsl([255, 165, 0])).toEqual([39, 100, 50]);
    expect(toCmyk([255, 165, 0])).toEqual([0, 35, 100, 0]);
    expect(toCmyk([0, 0, 0])).toEqual([0, 0, 0, 100]);
    expect(formats([18, 52, 86]).map((f) => f.value)).toEqual([
      '#123456',
      'rgb(18, 52, 86)',
      'hsl(210, 65%, 20%)',
      'cmyk(79%, 40%, 0%, 66%)',
    ]);
  });

  it('measures WCAG contrast and names colours', () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21);
    expect(contrast([118, 118, 118], [255, 255, 255])).toBeCloseTo(4.54, 1);
    expect(nearestName([250, 128, 114])).toBe('salmon');
    expect(nearestName([254, 1, 2])).toBe('red');
  });
});

describe('extractPalette', () => {
  it('finds the main colours with their share, the same way every time', () => {
    // Three quarters orange, one quarter dark green.
    const data = new Uint8ClampedArray(400 * 4);
    for (let p = 0; p < 400; p += 1)
      data.set(p < 300 ? [255, 140, 0, 255] : [0, 100, 0, 255], p * 4);
    const palette = extractPalette(data, 4);
    expect(palette.map((s) => toHex(s.rgb))).toEqual(['#FF8C00', '#006400']);
    expect(palette[0]?.share).toBeCloseTo(0.75);
    expect(extractPalette(data, 4)).toEqual(palette);
  });

  it('ignores transparent pixels', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 0, 0, 0, 255, 255]);
    expect(extractPalette(data, 2).map((s) => toHex(s.rgb))).toEqual(['#0000FF']);
  });
});

describe('exportPalette', () => {
  const swatches = [{ rgb: [255, 140, 0] as const, share: 1 }];
  it('writes CSS variables, Tailwind, JSON and GIMP palettes', () => {
    expect(exportPalette(swatches, 'css')).toBe(':root {\n  --color-1: #FF8C00;\n}');
    expect(exportPalette(swatches, 'json')).toBe('[\n  "#FF8C00"\n]');
    expect(exportPalette(swatches, 'gpl')).toContain('255 140   0\t#FF8C00');
    expect(exportPalette(swatches, 'tailwind')).toContain("100: '#FF8C00'");
  });
});
