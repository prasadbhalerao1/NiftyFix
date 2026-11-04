import type { Rect } from '@niftyfix/constraints';
import { DEFAULT_ENHANCE, type EnhanceSettings } from '@niftyfix/engine-image';
import {
  resolveOutputSpec,
  validateOutputSpec,
  type OutputSpecDraft,
  type OutputSpecErrors,
} from '@niftyfix/tool-sdk';
import type { SignatureResizerOptions } from './options';

export type Placement = SignatureResizerOptions['placement'];

/** Form state: the shared output spec plus placement and cleanup settings. */
export interface SignatureSettings extends OutputSpecDraft {
  format: 'jpeg' | 'png';
  placement: Placement;
  enhance: EnhanceSettings;
}

/** Generic defaults; not any portal's requirement (none has been verified). */
export const DEFAULT_SETTINGS: SignatureSettings = {
  width: 400,
  height: 150,
  minKb: null,
  maxKb: null,
  convention: 'safe',
  format: 'jpeg',
  dpi: null,
  qualityFloor: 0.4,
  fileName: '',
  placement: 'fit',
  enhance: DEFAULT_ENHANCE,
};

export type SignatureErrors = OutputSpecErrors & { transparent?: string };

export function validateSettings(s: SignatureSettings): SignatureErrors {
  const errors: SignatureErrors = validateOutputSpec(s);
  if (s.enhance.transparent && s.format !== 'png') {
    errors.transparent = 'A transparent background needs PNG output.';
  }
  return errors;
}

export function toOptions(s: SignatureSettings, crop: Rect): SignatureResizerOptions {
  const spec = resolveOutputSpec(s);
  return {
    crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
    placement: s.placement,
    enhance: { ...s.enhance },
    ...spec,
    format: s.format,
    quality: 0.92,
  };
}
