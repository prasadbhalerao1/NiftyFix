/**
 * Lossless PNG encoding of raw RGBA in plain JavaScript. Unlike a canvas it
 * has no size cap (iOS refuses canvases over about 16M pixels), keeps exact
 * colours (a canvas premultiplies alpha) and runs in any worker.
 * Opaque images are written as RGB, opaque gray ones as gray, to stay small.
 */
import { zlibSync } from 'fflate';
import type { Pixels } from './enhance';

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

const paeth = (a: number, b: number, c: number): number => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

/** Each row with the filter that leaves the smallest residuals (the usual heuristic). */
function filterRows(raw: Uint8Array, rowBytes: number, height: number, bpp: number): Uint8Array {
  const out = new Uint8Array((rowBytes + 1) * height);
  const candidates = Array.from({ length: 5 }, () => new Uint8Array(rowBytes));
  for (let y = 0; y < height; y += 1) {
    const row = raw.subarray(y * rowBytes, (y + 1) * rowBytes);
    const up = y > 0 ? raw.subarray((y - 1) * rowBytes, y * rowBytes) : null;
    let best = 0;
    let bestScore = Infinity;
    for (let filter = 0; filter < 5; filter += 1) {
      const target = candidates[filter] as Uint8Array;
      let score = 0;
      for (let i = 0; i < rowBytes; i += 1) {
        const x = row[i] ?? 0;
        const a = i >= bpp ? (row[i - bpp] ?? 0) : 0;
        const b = up ? (up[i] ?? 0) : 0;
        const c = up && i >= bpp ? (up[i - bpp] ?? 0) : 0;
        const predicted =
          filter === 0
            ? 0
            : filter === 1
              ? a
              : filter === 2
                ? b
                : filter === 3
                  ? (a + b) >> 1
                  : paeth(a, b, c);
        const value = (x - predicted) & 0xff;
        target[i] = value;
        score += value < 128 ? value : 256 - value;
      }
      if (score < bestScore) {
        bestScore = score;
        best = filter;
      }
    }
    out[y * (rowBytes + 1)] = best;
    out.set(candidates[best] as Uint8Array, y * (rowBytes + 1) + 1);
  }
  return out;
}

export function encodePng({ data, width, height }: Pixels): Uint8Array {
  let opaque = true;
  let gray = true;
  for (let i = 0; i < data.length && (opaque || gray); i += 4) {
    if (data[i + 3] !== 255) opaque = false;
    if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) gray = false;
  }
  const channels = !opaque ? 4 : gray ? 1 : 3;
  const raw = new Uint8Array(width * height * channels);
  if (channels === 4) raw.set(data);
  else {
    for (let p = 0, o = 0; p < data.length; p += 4) {
      raw[o++] = data[p] ?? 0;
      if (channels === 3) {
        raw[o++] = data[p + 1] ?? 0;
        raw[o++] = data[p + 2] ?? 0;
      }
    }
  }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = channels === 4 ? 6 : channels === 3 ? 2 : 0;
  const parts = [
    Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
    chunk('IHDR', header),
    chunk('IDAT', zlibSync(filterRows(raw, width * channels, height, channels), { level: 6 })),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
