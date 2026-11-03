import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { PhotoResizerOptions } from './options';
import { DEFAULT_SETTINGS, toOptions, validateSettings } from './settings';

const crop = { x: 10, y: 20, width: 300, height: 386 };

describe('photo resizer settings', () => {
  it('defaults are valid and produce schema-valid options', () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toEqual({});
    const options = toOptions(DEFAULT_SETTINGS, crop);
    expect(v.safeParse(PhotoResizerOptions, options).success).toBe(true);
    expect(options).not.toHaveProperty('minBytes');
  });

  it('converts KB with the safe convention', () => {
    const options = toOptions({ ...DEFAULT_SETTINGS, minKb: 20, maxKb: 50 }, crop);
    expect(options.minBytes).toBe(20_480);
    expect(options.maxBytes).toBe(50_000);
  });

  it('flags inverted ranges after unit conversion', () => {
    // Safe mode: 48 KB min → 49,152 bytes fits under 50 KB max → 50,000 bytes,
    // but 49 KB min → 50,176 bytes does not.
    expect(validateSettings({ ...DEFAULT_SETTINGS, minKb: 48, maxKb: 50 }).minKb).toBeUndefined();
    expect(validateSettings({ ...DEFAULT_SETTINGS, minKb: 49, maxKb: 50 }).minKb).toMatch(
      /smaller/,
    );
  });

  it('rejects bad dimensions, DPI and file names', () => {
    const errors = validateSettings({
      ...DEFAULT_SETTINGS,
      width: 10.5,
      height: null,
      dpi: 0,
      fileName: '../x',
    });
    expect(Object.keys(errors).sort()).toEqual(['dpi', 'fileName', 'height', 'width']);
  });

  it('drops DPI for non-JPEG output', () => {
    expect(toOptions({ ...DEFAULT_SETTINGS, format: 'png', dpi: 300 }, crop)).not.toHaveProperty(
      'dpi',
    );
  });

  it('schema rejects tampered options from outside the UI', () => {
    const tampered = {
      ...toOptions(DEFAULT_SETTINGS, crop),
      width: 100_000,
      fileName: '../../evil',
    };
    expect(v.safeParse(PhotoResizerOptions, tampered).success).toBe(false);
  });
});
