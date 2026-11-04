import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
  byteRangeIsOrdered,
  CropRectSchema,
  outputSpecEntries,
  parseKbPreset,
  resolveOutputSpec,
  validateOutputSpec,
  type OutputSpecDraft,
} from '../src';

const draft: OutputSpecDraft = {
  width: 140,
  height: 60,
  minKb: 10,
  maxKb: 20,
  convention: 'safe',
  format: 'jpeg',
  dpi: null,
  qualityFloor: 0.4,
  fileName: 'signature',
};

describe('output spec', () => {
  it('resolves KB to bytes with the chosen convention and drops empty fields', () => {
    expect(resolveOutputSpec(draft)).toEqual({
      width: 140,
      height: 60,
      format: 'jpeg',
      minBytes: 10_240,
      maxBytes: 20_000,
      qualityFloor: 0.4,
      fileName: 'signature',
    });
    expect(
      resolveOutputSpec({ ...draft, minKb: null, maxKb: null, format: 'png', dpi: 300 }),
    ).not.toHaveProperty('dpi');
  });

  it('validates every field', () => {
    expect(validateOutputSpec(draft)).toEqual({});
    const errors = validateOutputSpec({
      ...draft,
      width: 8001,
      height: 0,
      minKb: -1,
      dpi: 0,
      fileName: 'a/b',
    });
    expect(Object.keys(errors).sort()).toEqual(['dpi', 'fileName', 'height', 'minKb', 'width']);
  });

  it('refuses to resolve an invalid draft', () => {
    expect(() => resolveOutputSpec({ ...draft, width: null })).toThrow(TypeError);
  });

  it('restricts formats per tool in the worker-side schema', () => {
    const schema = v.object(outputSpecEntries(['jpeg', 'png']));
    const resolved = resolveOutputSpec(draft);
    expect(v.safeParse(schema, resolved).success).toBe(true);
    expect(v.safeParse(schema, { ...resolved, format: 'webp' }).success).toBe(false);
    expect(v.safeParse(schema, { ...resolved, fileName: '../x' }).success).toBe(false);
  });

  it('checks byte-range order and crop rectangles', () => {
    expect(byteRangeIsOrdered({ minBytes: 5, maxBytes: 4 })).toBe(false);
    expect(byteRangeIsOrdered({ maxBytes: 4 })).toBe(true);
    expect(v.safeParse(CropRectSchema, { x: -1, y: 0, width: 10, height: 10 }).success).toBe(false);
    expect(v.safeParse(CropRectSchema, { x: 0, y: 0, width: 10, height: 10 }).success).toBe(true);
  });
});

describe('parseKbPreset', () => {
  it('reads maximum and range presets', () => {
    expect(parseKbPreset('max-50kb')).toEqual({ minKb: null, maxKb: 50 });
    expect(parseKbPreset('10-to-20kb')).toEqual({ minKb: 10, maxKb: 20 });
  });

  it('ignores unknown, empty and impossible presets', () => {
    for (const preset of [undefined, '', 'target-200kb', 'max-0kb', '20-to-10kb', '5-to-5kb'])
      expect(parseKbPreset(preset)).toBeNull();
  });
});
