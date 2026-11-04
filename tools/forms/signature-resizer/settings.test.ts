import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { SignatureResizerOptions } from './options';
import { DEFAULT_SETTINGS, toOptions, validateSettings } from './settings';

const crop = { x: 12, y: 30, width: 600, height: 220 };

describe('signature resizer settings', () => {
  it('defaults are valid and produce schema-valid options', () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toEqual({});
    const options = toOptions(DEFAULT_SETTINGS, crop);
    expect(v.safeParse(SignatureResizerOptions, options).success).toBe(true);
    expect(options).toMatchObject({ width: 400, height: 150, placement: 'fit', format: 'jpeg' });
    expect(options).not.toHaveProperty('maxBytes');
  });

  it('converts KB with the safe convention', () => {
    const options = toOptions({ ...DEFAULT_SETTINGS, minKb: 10, maxKb: 20 }, crop);
    expect(options.minBytes).toBe(10_240);
    expect(options.maxBytes).toBe(20_000);
  });

  it('requires PNG for a transparent background', () => {
    const transparent = { ...DEFAULT_SETTINGS.enhance, transparent: true };
    expect(validateSettings({ ...DEFAULT_SETTINGS, enhance: transparent }).transparent).toMatch(
      /PNG/,
    );
    expect(validateSettings({ ...DEFAULT_SETTINGS, format: 'png', enhance: transparent })).toEqual(
      {},
    );
  });

  it('copies cleanup settings instead of sharing the defaults object', () => {
    const options = toOptions(DEFAULT_SETTINGS, crop);
    expect(options.enhance).toEqual(DEFAULT_SETTINGS.enhance);
    expect(options.enhance).not.toBe(DEFAULT_SETTINGS.enhance);
  });

  it('schema rejects tampered options from outside the UI', () => {
    const valid = toOptions(DEFAULT_SETTINGS, crop);
    for (const tampered of [
      { ...valid, format: 'webp' },
      { ...valid, placement: 'stretch' },
      { ...valid, enhance: { ...valid.enhance, whiten: 5 } },
      { ...valid, enhance: { ...valid.enhance, transparent: true } }, // JPEG cannot be transparent
      { ...valid, minBytes: 30_000, maxBytes: 20_000 },
      { ...valid, fileName: '../../evil' },
    ]) {
      expect(v.safeParse(SignatureResizerOptions, tampered).success).toBe(false);
    }
  });
});
