import type { Pixels } from './enhance';

/**
 * Apply an EXIF orientation (1 to 8) to raw pixels, losslessly: rotations by
 * quarter turns and mirrors only move pixels. Orientations 5 to 8 swap width
 * and height. No canvas, so there is no size limit and colours stay exact.
 */
export function orientPixels({ data, width, height }: Pixels, orientation: number): Pixels {
  if (orientation === 1) return { data, width, height };
  const sideways = orientation >= 5;
  const outWidth = sideways ? height : width;
  const outHeight = sideways ? width : height;
  const out = new Uint8ClampedArray(data.length);
  const source = new Uint32Array(data.buffer, data.byteOffset, width * height);
  const target = new Uint32Array(out.buffer);
  for (let v = 0; v < height; v += 1) {
    for (let u = 0; u < width; u += 1) {
      let x: number;
      let y: number;
      switch (orientation) {
        case 2:
          [x, y] = [width - 1 - u, v];
          break;
        case 3:
          [x, y] = [width - 1 - u, height - 1 - v];
          break;
        case 4:
          [x, y] = [u, height - 1 - v];
          break;
        case 5:
          [x, y] = [v, u];
          break;
        case 6:
          [x, y] = [height - 1 - v, u];
          break;
        case 7:
          [x, y] = [height - 1 - v, width - 1 - u];
          break;
        case 8:
          [x, y] = [v, width - 1 - u];
          break;
        default:
          throw new RangeError('Orientation must be an integer from 1 to 8.');
      }
      target[y * outWidth + x] = source[v * width + u] ?? 0;
    }
  }
  return { data: out, width: outWidth, height: outHeight };
}
