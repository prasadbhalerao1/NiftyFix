import type { Rect } from '@niftyfix/constraints';
import {
  resolveOutputSpec,
  validateOutputSpec,
  type OutputSpecDraft,
  type OutputSpecErrors,
} from '@niftyfix/tool-sdk';
import type { PhotoResizerOptions } from './options';

/** Form state as the user edits it: the shared output spec plus a background colour. */
export interface PhotoSettings extends OutputSpecDraft {
  background: string;
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

export type SettingsErrors = OutputSpecErrors;

export const validateSettings = (s: PhotoSettings): SettingsErrors => validateOutputSpec(s);

/** Convert validated settings + crop into processor options (bytes, not KB). */
export function toOptions(s: PhotoSettings, crop: Rect): PhotoResizerOptions {
  return {
    crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
    ...resolveOutputSpec(s),
    background: s.background,
    quality: 0.92,
  };
}
