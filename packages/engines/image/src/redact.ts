import type { Pixels } from './enhance';

/**
 * Cover parts of an image, on raw pixels (no canvas filters, which Safari
 * lacks in workers). Solid boxes destroy what is under them; pixelation and
 * blur only hide it from the eye and can sometimes be reversed, which is why
 * tools should default to solid boxes for text and numbers.
 */
export type RedactStyle = 'black' | 'white' | 'pixelate' | 'blur';

export interface RedactBox {
  x: number;
  y: number;
  width: number;
  height: number;
  style: RedactStyle;
}

/** The box in whole pixels, inside the image; null if nothing is left. */
function clip(box: RedactBox, width: number, height: number) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(width, Math.ceil(box.x + box.width));
  const y1 = Math.min(height, Math.ceil(box.y + box.height));
  return x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : null;
}

/** Pixelation block size and blur radius for a box, from strength 1 to 100. */
export function effectSize(box: { width: number; height: number }, strength: number): number {
  const side = Math.min(box.width, box.height);
  return Math.max(4, Math.round((side * Math.min(100, Math.max(1, strength))) / 200));
}

function fill(
  pixels: Pixels,
  r: { x0: number; y0: number; x1: number; y1: number },
  value: number,
): void {
  const { data, width } = pixels;
  for (let y = r.y0; y < r.y1; y += 1) {
    for (let x = r.x0; x < r.x1; x += 1) {
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
}

function pixelate(
  pixels: Pixels,
  r: { x0: number; y0: number; x1: number; y1: number },
  block: number,
): void {
  const { data, width } = pixels;
  for (let by = r.y0; by < r.y1; by += block) {
    for (let bx = r.x0; bx < r.x1; bx += block) {
      const ex = Math.min(bx + block, r.x1);
      const ey = Math.min(by + block, r.y1);
      const sum = [0, 0, 0, 0];
      for (let y = by; y < ey; y += 1) {
        for (let x = bx; x < ex; x += 1) {
          const i = (y * width + x) * 4;
          for (let c = 0; c < 4; c += 1) sum[c] = (sum[c] ?? 0) + (data[i + c] ?? 0);
        }
      }
      const count = (ex - bx) * (ey - by);
      for (let y = by; y < ey; y += 1) {
        for (let x = bx; x < ex; x += 1) {
          const i = (y * width + x) * 4;
          for (let c = 0; c < 4; c += 1) data[i + c] = Math.round((sum[c] ?? 0) / count);
        }
      }
    }
  }
}

/** Three box-blur passes in each direction (close to a Gaussian), kept inside the box. */
function blur(
  pixels: Pixels,
  r: { x0: number; y0: number; x1: number; y1: number },
  radius: number,
): void {
  const { data, width } = pixels;
  const w = r.x1 - r.x0;
  const h = r.y1 - r.y0;
  let region: Float32Array = new Float32Array(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = ((r.y0 + y) * width + r.x0 + x) * 4;
      for (let c = 0; c < 4; c += 1) region[(y * w + x) * 4 + c] = data[i + c] ?? 0;
    }
  }
  const pass = (source: Float32Array, horizontal: boolean): Float32Array => {
    const out = new Float32Array(source.length);
    const length = horizontal ? w : h;
    const lines = horizontal ? h : w;
    for (let line = 0; line < lines; line += 1) {
      const at = (k: number): number => {
        const p = Math.min(length - 1, Math.max(0, k));
        return (horizontal ? line * w + p : p * w + line) * 4;
      };
      for (let c = 0; c < 4; c += 1) {
        let sum = 0;
        for (let k = -radius; k <= radius; k += 1) sum += source[at(k) + c] ?? 0;
        for (let k = 0; k < length; k += 1) {
          out[at(k) + c] = sum / (2 * radius + 1);
          sum += (source[at(k + radius + 1) + c] ?? 0) - (source[at(k - radius) + c] ?? 0);
        }
      }
    }
    return out;
  };
  for (let i = 0; i < 3; i += 1) region = pass(pass(region, true), false);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = ((r.y0 + y) * width + r.x0 + x) * 4;
      for (let c = 0; c < 4; c += 1) data[i + c] = Math.round(region[(y * w + x) * 4 + c] ?? 0);
    }
  }
}

/** Apply every box to the pixels in place, in order. Returns how many boxes touched the image. */
export function redactPixels(
  pixels: Pixels,
  boxes: readonly RedactBox[],
  strength: number,
): number {
  let applied = 0;
  for (const box of boxes) {
    const r = clip(box, pixels.width, pixels.height);
    if (!r) continue;
    applied += 1;
    const size = effectSize({ width: r.x1 - r.x0, height: r.y1 - r.y0 }, strength);
    if (box.style === 'black') fill(pixels, r, 0);
    else if (box.style === 'white') fill(pixels, r, 255);
    else if (box.style === 'pixelate') pixelate(pixels, r, size);
    else blur(pixels, r, size);
  }
  return applied;
}
