import { describe, expect, it } from 'vitest';
import {
  assessLegibility,
  DEFAULT_ENHANCE,
  enhancePixels,
  findInkBounds,
  inkFraction,
  type Pixels,
} from '../src/enhance';

type Rgb = [number, number, number];
interface Stroke {
  from: [number, number];
  to: [number, number];
  width: number;
  color: Rgb;
}

/** Render paper (per-pixel colour function) with anti-aliased line strokes. */
function render(
  width: number,
  height: number,
  paper: (x: number, y: number) => Rgb,
  strokes: Stroke[],
  noise = 0,
): Pixels {
  const data = new Uint8ClampedArray(width * height * 4);
  let seed = 42;
  const rand = (): number =>
    ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let [r, g, b] = paper(x, y);
      for (const s of strokes) {
        const [x0, y0] = s.from;
        const [x1, y1] = s.to;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const t = Math.max(
          0,
          Math.min(1, ((x + 0.5 - x0) * dx + (y + 0.5 - y0) * dy) / (dx * dx + dy * dy || 1)),
        );
        const dist = Math.hypot(x + 0.5 - (x0 + t * dx), y + 0.5 - (y0 + t * dy));
        const cover = Math.max(0, Math.min(1, s.width / 2 + 0.5 - dist));
        r = r * (1 - cover) + s.color[0] * cover;
        g = g * (1 - cover) + s.color[1] * cover;
        b = b * (1 - cover) + s.color[2] * cover;
      }
      const n = noise * rand();
      const i = (y * width + x) * 4;
      data[i] = r + n;
      data[i + 1] = g + n;
      data[i + 2] = b + n;
      data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

const white = (): Rgb => [250, 250, 248];
const BLACK: Rgb = [20, 20, 25];
const BLUE: Rgb = [25, 45, 160];
const signature = (color: Rgb, width: number): Stroke[] => [
  { from: [40, 70], to: [120, 40], width, color },
  { from: [120, 40], to: [200, 90], width, color },
  { from: [200, 90], to: [270, 50], width, color },
];

const at = (p: Pixels, x: number, y: number): Rgb => {
  const i = (y * p.width + x) * 4;
  return [p.data[i] ?? 0, p.data[i + 1] ?? 0, p.data[i + 2] ?? 0];
};
const lum = ([r, g, b]: Rgb): number => 0.299 * r + 0.587 * g + 0.114 * b;
/** Fraction of pixels in the outer border that are (near) pure white. */
const borderWhiteness = (p: Pixels, threshold = 245): number => {
  let white = 0;
  let total = 0;
  for (let y = 0; y < p.height; y += 1) {
    for (let x = 0; x < p.width; x += 1) {
      if (x > 10 && y > 10 && x < p.width - 10 && y < p.height - 10) continue;
      total += 1;
      if (lum(at(p, x, y)) >= threshold) white += 1;
    }
  }
  return white / total;
};
/** Mean darkness along the centre of the middle stroke. */
const strokeDarkness = (p: Pixels): number => {
  let sum = 0;
  for (let k = 1; k < 10; k += 1) {
    const x = Math.round(120 + (80 * k) / 10);
    const y = Math.round(40 + (50 * k) / 10);
    sum += 255 - lum(at(p, x, y));
  }
  return sum / 9;
};

describe('enhancePixels', () => {
  it('whitens clean white paper and keeps a black signature dark', () => {
    const input = render(320, 130, white, signature(BLACK, 4));
    const out = enhancePixels(input, DEFAULT_ENHANCE);
    expect(borderWhiteness(out)).toBe(1);
    expect(strokeDarkness(out)).toBeGreaterThan(180);
  });

  it('keeps 1 px pen strokes visible with the default settings', () => {
    const input = render(320, 130, white, signature(BLACK, 1));
    const out = enhancePixels(input, DEFAULT_ENHANCE);
    expect(strokeDarkness(out)).toBeGreaterThan(80);
    expect(assessLegibility(input, out)).toEqual([]);
  });

  it('keeps blue ink blue in colour mode', () => {
    const out = enhancePixels(render(320, 130, white, signature(BLUE, 4)), DEFAULT_ENHANCE);
    const [r, , b] = at(out, 160, 65);
    expect(b - r).toBeGreaterThan(60);
  });

  it('removes uneven lighting across the page', () => {
    // Paper fades from 250 (left) to 140 (right): a phone photo under a lamp.
    const fade = (x: number): Rgb => {
      const v = 250 - (110 * x) / 320;
      return [v, v, v * 0.97];
    };
    const input = render(320, 130, fade, signature(BLACK, 3));
    const out = enhancePixels(input, DEFAULT_ENHANCE);
    expect(borderWhiteness(out)).toBeGreaterThan(0.97);
    expect(lum(at(out, 300, 120))).toBeGreaterThan(245);
    expect(strokeDarkness(out)).toBeGreaterThan(150);
  });

  it('lifts a hand shadow without erasing ink inside it', () => {
    const shadow = (x: number, y: number): Rgb =>
      x > 150 && y > 20 ? [135, 135, 140] : [248, 248, 246];
    const input = render(320, 130, shadow, signature(BLACK, 3));
    const out = enhancePixels(input, DEFAULT_ENHANCE);
    expect(lum(at(out, 300, 115))).toBeGreaterThan(240); // paper inside shadow
    expect(255 - lum(at(out, 235, 70))).toBeGreaterThan(120); // ink inside shadow
  });

  it('turns grey paper white', () => {
    const grey = (): Rgb => [188, 186, 182];
    const out = enhancePixels(render(320, 130, grey, signature(BLACK, 3)), DEFAULT_ENHANCE);
    expect(borderWhiteness(out)).toBe(1);
  });

  it('cleans JPEG-like noise on the paper', () => {
    const out = enhancePixels(render(320, 130, white, signature(BLACK, 3), 14), DEFAULT_ENHANCE);
    expect(borderWhiteness(out, 240)).toBeGreaterThan(0.95);
  });

  it('does not wash out thick strokes (wider than the background block)', () => {
    const input = render(320, 130, white, [
      { from: [60, 65], to: [260, 65], width: 30, color: BLACK },
    ]);
    const out = enhancePixels(input, DEFAULT_ENHANCE);
    expect(255 - lum(at(out, 160, 65))).toBeGreaterThan(180);
  });

  it('handles very small (low-resolution) images', () => {
    const input = render(60, 25, white, [{ from: [5, 15], to: [55, 8], width: 2, color: BLACK }]);
    const out = enhancePixels(input, DEFAULT_ENHANCE);
    expect(out.width).toBe(60);
    expect(inkFraction(out)).toBeGreaterThan(0.01);
  });

  it('makes paper transparent and un-blends ink colour', () => {
    const out = enhancePixels(render(320, 130, white, signature(BLUE, 5)), {
      ...DEFAULT_ENHANCE,
      transparent: true,
    });
    expect(out.data[3]).toBe(0); // corner alpha
    const i = (65 * 320 + 160) * 4;
    expect(out.data[i + 3]).toBeGreaterThan(150);
    expect((out.data[i + 2] ?? 0) - (out.data[i] ?? 0)).toBeGreaterThan(60);
  });

  it('produces pure black and white in threshold mode', () => {
    const out = enhancePixels(render(320, 130, white, signature(BLACK, 4)), {
      ...DEFAULT_ENHANCE,
      mode: 'blackwhite',
    });
    const values = new Set<number>();
    for (let i = 0; i < out.data.length; i += 4) values.add(out.data[i] ?? 0);
    expect([...values].sort((a, b) => a - b)).toEqual([0, 255]);
  });

  it('never modifies its input', () => {
    const input = render(80, 40, white, [{ from: [5, 20], to: [75, 20], width: 3, color: BLACK }]);
    const copy = input.data.slice();
    enhancePixels(input, DEFAULT_ENHANCE);
    expect(input.data).toEqual(copy);
  });
});

describe('assessLegibility', () => {
  it('flags a threshold that erases thin light strokes', () => {
    const faint: Rgb = [140, 140, 150];
    const input = render(320, 130, white, signature(faint, 1));
    const harsh = enhancePixels(input, { ...DEFAULT_ENHANCE, mode: 'blackwhite', threshold: 0.2 });
    expect(assessLegibility(input, harsh)).toContain('empty');
  });

  it('flags strokes partly lost to over-whitening', () => {
    const faint: Rgb = [150, 150, 160];
    const input = render(320, 130, white, signature(faint, 2));
    const washed = enhancePixels(input, { ...DEFAULT_ENHANCE, whiten: 1, brightness: 0.5 });
    expect(
      assessLegibility(input, washed).some(
        (issue) => issue === 'strokes-lost' || issue === 'empty',
      ),
    ).toBe(true);
  });

  it('flags a background that stayed dark', () => {
    const dark = (): Rgb => [90, 90, 90];
    const input = render(320, 130, dark, signature(BLACK, 3));
    const untouched = enhancePixels(input, {
      ...DEFAULT_ENHANCE,
      flatten: false,
      whiten: 0,
      contrast: 0,
    });
    expect(assessLegibility(input, untouched)).toContain('background-dark');
  });
});

describe('findInkBounds', () => {
  it('finds the signature with padding', () => {
    const bounds = findInkBounds(render(320, 130, white, signature(BLACK, 3)));
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    expect(bounds.x).toBeLessThanOrEqual(40);
    expect(bounds.y).toBeLessThanOrEqual(40);
    expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(270);
    expect(bounds.y + bounds.height).toBeGreaterThanOrEqual(90);
    expect(bounds.x).toBeGreaterThan(5); // empty margin was trimmed
  });

  it('ignores an isolated speck and returns null for blank paper', () => {
    const speck: Stroke = { from: [300, 10], to: [301, 10], width: 1, color: BLACK };
    expect(findInkBounds(render(320, 130, white, [speck]))).toBeNull();
    expect(findInkBounds(render(320, 130, white, []))).toBeNull();
  });

  it('works under uneven lighting', () => {
    const fade = (x: number): Rgb => [250 - x / 3, 250 - x / 3, 245 - x / 3];
    const bounds = findInkBounds(render(320, 130, fade, signature(BLACK, 3)));
    expect(bounds?.x).toBeLessThanOrEqual(40);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeGreaterThanOrEqual(270);
  });
});
