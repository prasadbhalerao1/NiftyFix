/**
 * Tone rules shared by page colours, image pixels and the live preview: turn
 * RGB into gray, black and white, or a softer colour. Pure, with no PDF
 * library, so tool UIs can load it for previews.
 */
export type Rgb = [number, number, number];

const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : Number.isFinite(v) ? v : 0);

export type GrayMethod =
  'luminance' | 'rec709' | 'average' | 'lightness' | 'red' | 'green' | 'blue';
export type ToneMode = 'gray' | 'black-text' | 'bw';

export interface ToneSettings {
  method: GrayMethod;
  /** -1 to 1. */
  brightness: number;
  /** -1 to 1. */
  contrast: number;
  mode: ToneMode;
  /** Black-and-white cut-off, 0 to 1: gray below it becomes black. */
  threshold: number;
  /** 0 to 1: how much colour is removed (1 = true gray). Black and white is always 1. */
  strength: number;
}

export function grayOf([r, g, b]: Rgb, method: GrayMethod): number {
  switch (method) {
    case 'rec709':
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    case 'average':
      return (r + g + b) / 3;
    case 'lightness':
      return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    case 'red':
      return r;
    case 'green':
      return g;
    case 'blue':
      return b;
    default:
      return 0.299 * r + 0.587 * g + 0.114 * b;
  }
}

/** Brightness then contrast (around mid-gray) on a 0 to 1 value. */
export function adjust(value: number, { brightness, contrast }: ToneSettings): number {
  const factor = contrast >= 0 ? 1 / Math.max(0.01, 1 - contrast) : 1 + contrast;
  return clamp((value + brightness - 0.5) * factor + 0.5);
}

/** The tone of an RGB colour: a gray level, or (strength below 1) a softened colour. */
export function tone(rgb: Rgb, settings: ToneSettings): { gray: number } | { rgb: Rgb } {
  const gray = adjust(grayOf(rgb, settings.method), settings);
  if (settings.mode === 'bw') return { gray: gray < settings.threshold ? 0 : 1 };
  if (settings.strength >= 1) return { gray };
  const s = settings.strength;
  return { rgb: rgb.map((c) => clamp(adjust(c, settings) * (1 - s) + gray * s)) as Rgb };
}

/** True when the settings leave only gray (so output can use DeviceGray). */
export const isGrayOnly = (settings: ToneSettings): boolean =>
  settings.mode === 'bw' || settings.strength >= 1;

export interface TonedPixels {
  data: Uint8Array;
  channels: 1 | 3;
  bits: 1 | 8;
}

/**
 * Tone RGBA pixels with the same rules as page colours: gray, softened colour,
 * or (black and white) 1-bit rows packed for PDF, by threshold or by
 * Floyd-Steinberg dithering (better for photos). In 1-bit data, 1 is white.
 */
export function tonePixels(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  settings: ToneSettings,
  dither = false,
): TonedPixels {
  const pixels = width * height;
  const lut = Uint8Array.from({ length: 256 }, (_, v) =>
    Math.round(adjust(v / 255, settings) * 255),
  );
  const raw = new Uint8Array(pixels);
  for (let p = 0, i = 0; p < pixels; p += 1, i += 4) {
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    raw[p] = Math.round(grayOf([r, g, b], settings.method));
  }
  if (settings.mode === 'bw') {
    const rowBytes = (width + 7) >> 3;
    const out = new Uint8Array(rowBytes * height).fill(0);
    const cut = settings.threshold * 255;
    const error = dither ? new Float32Array(pixels) : null;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const p = y * width + x;
        const value = (lut[raw[p] ?? 0] ?? 0) + (error?.[p] ?? 0);
        const white = value >= cut;
        if (white)
          out[y * rowBytes + (x >> 3)] = (out[y * rowBytes + (x >> 3)] ?? 0) | (0x80 >> (x & 7));
        if (error) {
          const e = value - (white ? 255 : 0);
          if (x + 1 < width) error[p + 1] = (error[p + 1] ?? 0) + (e * 7) / 16;
          if (y + 1 < height) {
            if (x > 0) error[p + width - 1] = (error[p + width - 1] ?? 0) + (e * 3) / 16;
            error[p + width] = (error[p + width] ?? 0) + (e * 5) / 16;
            if (x + 1 < width) error[p + width + 1] = (error[p + width + 1] ?? 0) + e / 16;
          }
        }
      }
    }
    return { data: out, channels: 1, bits: 1 };
  }
  if (settings.strength >= 1) {
    for (let p = 0; p < pixels; p += 1) raw[p] = lut[raw[p] ?? 0] ?? 0;
    return { data: raw, channels: 1, bits: 8 };
  }
  const s = settings.strength;
  const out = new Uint8Array(pixels * 3);
  for (let p = 0, i = 0; p < pixels; p += 1, i += 4) {
    const gray = lut[raw[p] ?? 0] ?? 0;
    for (let c = 0; c < 3; c += 1) {
      out[p * 3 + c] = Math.round((lut[rgba[i + c] ?? 0] ?? 0) * (1 - s) + gray * s);
    }
  }
  return { data: out, channels: 3, bits: 8 };
}
