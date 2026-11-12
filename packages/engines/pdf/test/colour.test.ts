import { PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  adjust,
  colourSpace,
  grayOf,
  makeFunction,
  tone,
  tonePixels,
  type ToneSettings,
} from '../src';

const doc = await PDFDocument.create();
const { context } = doc;

const close = (actual: readonly number[], expected: readonly number[]): void =>
  expected.forEach((value, i) => expect(actual[i]).toBeCloseTo(value, 3));

describe('makeFunction', () => {
  it('evaluates exponential and stitching functions', () => {
    const half = context.obj({ FunctionType: 2, Domain: [0, 1], C0: [1, 0], C1: [0, 1], N: 1 });
    close(makeFunction(half, context)?.([0.25]) ?? [], [0.75, 0.25]);
    const stitched = context.obj({
      FunctionType: 3,
      Domain: [0, 1],
      Functions: [
        context.obj({ FunctionType: 2, Domain: [0, 1], C0: [0], C1: [1], N: 1 }),
        context.obj({ FunctionType: 2, Domain: [0, 1], C0: [1], C1: [0], N: 1 }),
      ],
      Bounds: [0.5],
      Encode: [0, 1, 0, 1],
    });
    const f = makeFunction(stitched, context);
    close(f?.([0.25]) ?? [], [0.5]);
    close(f?.([0.75]) ?? [], [0.5]);
  });

  it('runs PostScript calculator functions, with conditionals and stack operators', () => {
    // A spot colour tint to CMYK: 0 0.5t 0 t, then if t > 0.5 swap the last two.
    const code = '{ dup 0.5 mul exch 0 exch 0 4 1 roll dup 0.5 gt { 1 index exch pop } if }';
    const stream = context.stream(code, {
      FunctionType: 4,
      Domain: [0, 1],
      Range: [0, 1, 0, 1, 0, 1, 0, 1],
    });
    close(makeFunction(stream, context)?.([0.4]) ?? [], [0, 0.2, 0, 0.4]);
    close(makeFunction(stream, context)?.([1]) ?? [], [0, 0.5, 0, 0]);
  });

  it('interpolates sampled functions', () => {
    const stream = context.stream(Uint8Array.of(0, 255), {
      FunctionType: 0,
      Domain: [0, 1],
      Range: [0, 1],
      Size: [2],
      BitsPerSample: 8,
    });
    close(makeFunction(stream, context)?.([0.25]) ?? [], [0.25]);
  });
});

describe('colourSpace', () => {
  it('converts device, ICC, indexed and spot colour spaces to RGB', () => {
    close(colourSpace(PDFName.of('DeviceCMYK'), context)?.toRgb([0, 1, 1, 0]) ?? [], [1, 0, 0]);
    const icc = context.stream('', { N: 3 });
    close(
      colourSpace(context.obj([PDFName.of('ICCBased'), icc]), context)?.toRgb([0, 1, 0]) ?? [],
      [0, 1, 0],
    );
    const indexed = context.obj([
      PDFName.of('Indexed'),
      PDFName.of('DeviceRGB'),
      1,
      context.stream(Uint8Array.of(255, 0, 0, 0, 0, 255)),
    ]);
    close(colourSpace(indexed, context)?.toRgb([1]) ?? [], [0, 0, 1]);
    // A spot ink whose full tint is pure cyan in CMYK.
    const spot = context.obj([
      PDFName.of('Separation'),
      PDFName.of('PANTONE 300'),
      PDFName.of('DeviceCMYK'),
      context.obj({ FunctionType: 2, Domain: [0, 1], C0: [0, 0, 0, 0], C1: [1, 0, 0, 0], N: 1 }),
    ]);
    close(colourSpace(spot, context)?.toRgb([1]) ?? [], [0, 1, 1]);
    close(colourSpace(PDFName.of('Pattern'), context)?.toRgb([0]) ?? [-1], [-1]);
  });
});

describe('tone', () => {
  const settings: ToneSettings = {
    method: 'luminance',
    brightness: 0,
    contrast: 0,
    mode: 'gray',
    threshold: 0.5,
    strength: 1,
  };

  it('offers several gray formulas, including single channels that drop coloured ink', () => {
    expect(grayOf([1, 0, 0], 'luminance')).toBeCloseTo(0.299);
    expect(grayOf([1, 0, 0], 'rec709')).toBeCloseTo(0.2126);
    expect(grayOf([1, 0, 0], 'average')).toBeCloseTo(1 / 3);
    expect(grayOf([1, 0, 0], 'lightness')).toBeCloseTo(0.5);
    // Red ink on white paper disappears in the red channel.
    expect(grayOf([1, 0.1, 0.1], 'red')).toBe(1);
  });

  it('applies brightness and contrast, thresholds for black and white, and softens colour', () => {
    expect(adjust(0.5, { ...settings, brightness: 0.2 })).toBeCloseTo(0.7);
    expect(adjust(0.6, { ...settings, contrast: 0.5 })).toBeCloseTo(0.7);
    expect(tone([1, 0, 0], { ...settings, mode: 'bw' })).toEqual({ gray: 0 });
    expect(tone([1, 1, 0], { ...settings, mode: 'bw' })).toEqual({ gray: 1 });
    const half = tone([1, 0, 0], { ...settings, strength: 0.5 });
    expect('rgb' in half && half.rgb[0]).toBeCloseTo((1 + 0.299) / 2);
  });
});

describe('tonePixels', () => {
  const base: ToneSettings = {
    method: 'luminance',
    brightness: 0,
    contrast: 0,
    mode: 'gray',
    threshold: 0.5,
    strength: 1,
  };
  // Red, white, black, mid gray.
  const rgba = Uint8Array.of(255, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 128, 128, 128, 255);

  it('makes one gray byte per pixel', () => {
    expect([...tonePixels(rgba, 4, 1, base).data]).toEqual([76, 255, 0, 128]);
  });

  it('packs black and white into bits, 1 for white', () => {
    const bw = tonePixels(rgba, 4, 1, { ...base, mode: 'bw' });
    expect(bw.bits).toBe(1);
    expect(bw.data[0]).toBe(0b01010000);
  });

  it('dithers mid gray into a mix of black and white', () => {
    const gray = new Uint8Array(16 * 16 * 4).fill(128);
    const out = tonePixels(gray, 16, 16, { ...base, mode: 'bw' }, true);
    const ones = [...out.data].reduce(
      (sum, byte) => sum + byte.toString(2).split('1').length - 1,
      0,
    );
    expect(ones).toBeGreaterThan(100);
    expect(ones).toBeLessThan(156);
  });
});
