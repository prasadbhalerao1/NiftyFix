import { kilobytesToByteLimit, type KilobyteConvention } from '@niftyfix/tool-sdk';
import type { Rect } from '@niftyfix/constraints';
import type { PhotoResizerOptions } from './options';

/** Form state as the user edits it (KB values, empty fields allowed). */
export interface PhotoSettings {
  width: number | null;
  height: number | null;
  minKb: number | null;
  maxKb: number | null;
  convention: KilobyteConvention;
  format: PhotoResizerOptions['format'];
  dpi: number | null;
  qualityFloor: number;
  background: string;
  fileName: string;
}

export const DEFAULT_SETTINGS: PhotoSettings = {
  width: 413,
  height: 531,
  minKb: null,
  maxKb: null,
  convention: 'safe',
  format: 'jpeg',
  dpi: null,
  qualityFloor: 0.4,
  background: '#ffffff',
  fileName: '',
};

export type SettingsErrors = Partial<
  Record<'width' | 'height' | 'minKb' | 'maxKb' | 'dpi' | 'fileName', string>
>;

const isInt = (n: number | null, min: number, max: number): n is number =>
  n !== null && Number.isInteger(n) && n >= min && n <= max;

export function validateSettings(s: PhotoSettings): SettingsErrors {
  const errors: SettingsErrors = {};
  if (!isInt(s.width, 16, 8000)) errors.width = 'Enter a whole number from 16 to 8000.';
  if (!isInt(s.height, 16, 8000)) errors.height = 'Enter a whole number from 16 to 8000.';
  if (s.minKb !== null && !(s.minKb > 0 && s.minKb <= 100_000))
    errors.minKb = 'Enter a size above 0.';
  if (s.maxKb !== null && !(s.maxKb > 0 && s.maxKb <= 100_000))
    errors.maxKb = 'Enter a size above 0.';
  if (!errors.minKb && !errors.maxKb && s.minKb !== null && s.maxKb !== null) {
    const min = kilobytesToByteLimit(s.minKb, 'min', s.convention);
    const max = kilobytesToByteLimit(s.maxKb, 'max', s.convention);
    if (min > max) errors.minKb = 'Minimum must be smaller than maximum.';
  }
  if (s.dpi !== null && s.format === 'jpeg' && !isInt(s.dpi, 1, 2400))
    errors.dpi = 'Enter a whole number from 1 to 2400.';
  if (!/^[\w\- ]*$/u.test(s.fileName) || s.fileName.length > 60) {
    errors.fileName = 'Use letters, numbers, spaces, - or _ (up to 60 characters).';
  }
  return errors;
}

/** Convert validated settings + crop into processor options (bytes, not KB). */
export function toOptions(s: PhotoSettings, crop: Rect): PhotoResizerOptions {
  if (s.width === null || s.height === null)
    throw new TypeError('Settings must be validated first.');
  return {
    crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
    width: s.width,
    height: s.height,
    format: s.format,
    ...(s.minKb === null ? {} : { minBytes: kilobytesToByteLimit(s.minKb, 'min', s.convention) }),
    ...(s.maxKb === null ? {} : { maxBytes: kilobytesToByteLimit(s.maxKb, 'max', s.convention) }),
    ...(s.dpi === null || s.format !== 'jpeg' ? {} : { dpi: s.dpi }),
    background: s.background,
    quality: 0.92,
    qualityFloor: s.qualityFloor,
    fileName: s.fileName.trim(),
  };
}
