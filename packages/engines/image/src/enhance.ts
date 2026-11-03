/**
 * Document/signature enhancement on raw RGBA pixels. Pure functions: no DOM,
 * no canvas — the same code drives the live preview (main thread, downscaled)
 * and the final render (worker), and is unit-tested in Node.
 *
 * Pipeline: flatten lighting → brightness/contrast → whiten background →
 * ink mode (colour / grayscale / black-and-white) → optional transparency.
 * Every step is optional and parameterised; nothing modifies the input array.
 */

export interface Pixels {
  /** RGBA, row-major, 4 bytes per pixel. */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type InkMode = 'color' | 'grayscale' | 'blackwhite';

export interface EnhanceSettings {
  /** Remove uneven lighting, shadows and grey/tinted paper. */
  flatten: boolean;
  /** −1 … 1 */
  brightness: number;
  /** −1 … 1 */
  contrast: number;
  /** 0 … 1: how aggressively near-white paper becomes pure white (0 = off). */
  whiten: number;
  mode: InkMode;
  /** 0 … 1: luminance cut-off for black-and-white mode. */
  threshold: number;
  /** Make the paper transparent (ink keeps its colour). PNG output only. */
  transparent: boolean;
}

/** Safe defaults: flatten and a moderate whiten keep thin strokes; no hard threshold. */
export const DEFAULT_ENHANCE: EnhanceSettings = {
  flatten: true,
  brightness: 0,
  contrast: 0.1,
  whiten: 0.4,
  mode: 'color',
  threshold: 0.6,
  transparent: false,
};

/** Settings that leave the image unchanged (used for "Original" comparisons). */
export const NO_ENHANCE: EnhanceSettings = {
  flatten: false,
  brightness: 0,
  contrast: 0,
  whiten: 0,
  mode: 'color',
  threshold: 0.6,
  transparent: false,
};

const clamp255 = (value: number): number => (value < 0 ? 0 : value > 255 ? 255 : value);
const luma = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Estimate the paper brightness at every pixel. Blocks take their maximum
 * luminance (ink is darker than paper), then a 3×3 dilation (max of
 * neighbours) stops thick strokes from being mistaken for paper, and two box
 * blurs smooth the result. Returned at full resolution via bilinear sampling.
 */
export function estimateBackground(pixels: Pixels): Float32Array {
  const { data, width, height } = pixels;
  const block = Math.max(8, Math.round(Math.min(width, height) / 12));
  const gw = Math.ceil(width / block);
  const gh = Math.ceil(height / block);
  const grid = new Float32Array(gw * gh);
  for (let y = 0; y < height; y += 1) {
    const gy = Math.floor(y / block) * gw;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const l = luma(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0);
      const g = gy + Math.floor(x / block);
      if (l > (grid[g] ?? 0)) grid[g] = l;
    }
  }
  const neighbourhood = (source: Float32Array, reduce: 'max' | 'mean'): Float32Array => {
    const out = new Float32Array(source.length);
    for (let y = 0; y < gh; y += 1) {
      for (let x = 0; x < gw; x += 1) {
        let acc = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
            const v = source[ny * gw + nx] ?? 0;
            acc = reduce === 'max' ? Math.max(acc, v) : acc + v;
            n += 1;
          }
        }
        out[y * gw + x] = reduce === 'max' ? acc : acc / n;
      }
    }
    return out;
  };
  const smoothed = neighbourhood(neighbourhood(neighbourhood(grid, 'max'), 'mean'), 'mean');

  const background = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const fy = Math.min(gh - 1, Math.max(0, (y + 0.5) / block - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(gh - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < width; x += 1) {
      const fx = Math.min(gw - 1, Math.max(0, (x + 0.5) / block - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(gw - 1, x0 + 1);
      const tx = fx - x0;
      const a = smoothed[y0 * gw + x0] ?? 255;
      const b = smoothed[y0 * gw + x1] ?? 255;
      const c = smoothed[y1 * gw + x0] ?? 255;
      const d = smoothed[y1 * gw + x1] ?? 255;
      background[y * width + x] = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
    }
  }
  return background;
}

/** Apply `settings` and return a new pixel buffer. The input is never modified. */
export function enhancePixels(pixels: Pixels, settings: EnhanceSettings): Pixels {
  const { data, width, height } = pixels;
  const out = new Uint8ClampedArray(data.length);
  const background = settings.flatten ? estimateBackground(pixels) : null;
  const contrast = 1 + Math.max(-1, Math.min(1, settings.contrast));
  const brightness = Math.max(-1, Math.min(1, settings.brightness)) * 128;
  const whitePoint = 255 - Math.max(0, Math.min(1, settings.whiten)) * 127;
  const cutoff = Math.max(0, Math.min(1, settings.threshold)) * 255;

  for (let p = 0, i = 0; p < width * height; p += 1, i += 4) {
    let r = data[i] ?? 0;
    let g = data[i + 1] ?? 0;
    let b = data[i + 2] ?? 0;
    const alpha = data[i + 3] ?? 255;

    if (background !== null) {
      const factor = 255 / Math.max(32, background[p] ?? 255);
      r *= factor;
      g *= factor;
      b *= factor;
    }
    r = (r - 128) * contrast + 128 + brightness;
    g = (g - 128) * contrast + 128 + brightness;
    b = (b - 128) * contrast + 128 + brightness;
    if (whitePoint < 255) {
      const stretch = 255 / whitePoint;
      r *= stretch;
      g *= stretch;
      b *= stretch;
    }
    r = clamp255(r);
    g = clamp255(g);
    b = clamp255(b);

    if (settings.mode !== 'color') {
      const l = luma(r, g, b);
      const v = settings.mode === 'blackwhite' ? (l < cutoff ? 0 : 255) : l;
      r = v;
      g = v;
      b = v;
    }

    if (settings.transparent) {
      // Un-blend from white: observed = a·ink + (1 − a)·255, with a = darkness.
      const a = 255 - luma(r, g, b);
      if (a <= 0) {
        out[i] = 255;
        out[i + 1] = 255;
        out[i + 2] = 255;
        out[i + 3] = 0;
        continue;
      }
      out[i] = clamp255(((r - 255 + a) * 255) / a);
      out[i + 1] = clamp255(((g - 255 + a) * 255) / a);
      out[i + 2] = clamp255(((b - 255 + a) * 255) / a);
      out[i + 3] = Math.round((a * alpha) / 255);
      continue;
    }
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = alpha;
  }
  return { data: out, width, height };
}

/** Darkness of a pixel after compositing on white (handles transparency). */
function darkness(data: Uint8ClampedArray, i: number): number {
  const a = (data[i + 3] ?? 255) / 255;
  const l = luma(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0) * a + 255 * (1 - a);
  return 255 - l;
}

/** Pixels at least this much darker than white count as ink. */
const INK_DARKNESS = 40;

export function inkFraction(pixels: Pixels): number {
  const total = pixels.width * pixels.height;
  if (total === 0) return 0;
  let ink = 0;
  for (let i = 0; i < pixels.data.length; i += 4)
    if (darkness(pixels.data, i) >= INK_DARKNESS) ink += 1;
  return ink / total;
}

export type LegibilityIssue = 'strokes-lost' | 'empty' | 'background-dark';

/**
 * Compare the result with the same image after lighting correction only (the
 * best estimate of "what is ink"). Flags settings that erase strokes, leave
 * nothing visible, or fail to clean the background.
 */
export function assessLegibility(original: Pixels, result: Pixels): LegibilityIssue[] {
  const reference = inkFraction(enhancePixels(original, { ...NO_ENHANCE, flatten: true }));
  const after = inkFraction(result);
  const issues: LegibilityIssue[] = [];
  if (after < 0.001) issues.push('empty');
  else if (reference > 0 && after < reference * 0.6) issues.push('strokes-lost');
  if (after > 0.4) issues.push('background-dark');
  return issues;
}

export interface InkBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Bounding box of the ink after lighting correction, with `padding` added as a
 * fraction of the box size. Ink is grouped into 8-connected components and
 * components smaller than a minimum area (dust, specks, JPEG artefacts) are
 * ignored; a pen stroke is one long component, however thin. Returns null
 * when no ink is found.
 */
export function findInkBounds(pixels: Pixels, padding = 0.08): InkBounds | null {
  const flat = enhancePixels(pixels, { ...NO_ENHANCE, flatten: true });
  const { width, height } = flat;
  const total = width * height;
  const ink = new Uint8Array(total);
  for (let p = 0; p < total; p += 1)
    ink[p] = darkness(flat.data, p * 4) >= INK_DARKNESS * 2 ? 1 : 0;

  const minArea = Math.max(6, Math.round(total * 0.0002));
  const stack = new Int32Array(total);
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let start = 0; start < total; start += 1) {
    if (ink[start] !== 1) continue;
    // Flood-fill one component, marking visited pixels with 2.
    let size = 0;
    let cx0 = width;
    let cy0 = height;
    let cx1 = -1;
    let cy1 = -1;
    let sp = 0;
    stack[sp++] = start;
    ink[start] = 2;
    while (sp > 0) {
      const p = stack[--sp] ?? 0;
      const x = p % width;
      const y = (p - x) / width;
      size += 1;
      if (x < cx0) cx0 = x;
      if (x > cx1) cx1 = x;
      if (y < cy0) cy0 = y;
      if (y > cy1) cy1 = y;
      for (let dy = -1; dy <= 1; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const q = ny * width + nx;
          if (ink[q] === 1) {
            ink[q] = 2;
            stack[sp++] = q;
          }
        }
      }
    }
    if (size < minArea) continue;
    left = Math.min(left, cx0);
    top = Math.min(top, cy0);
    right = Math.max(right, cx1);
    bottom = Math.max(bottom, cy1);
  }
  if (right < 0) return null;
  const padX = Math.round((right - left + 1) * padding);
  const padY = Math.round((bottom - top + 1) * padding);
  const x = Math.max(0, left - padX);
  const y = Math.max(0, top - padY);
  return {
    x,
    y,
    width: Math.min(width, right + padX + 1) - x,
    height: Math.min(height, bottom + padY + 1) - y,
  };
}
