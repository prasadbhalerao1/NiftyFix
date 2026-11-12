import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

export const MODES = ['gray', 'black-text', 'bw'] as const;
export const METHODS = [
  'luminance',
  'rec709',
  'average',
  'lightness',
  'red',
  'green',
  'blue',
] as const;
/** Largest image (pixels) converted in memory; larger ones are reported and left as they are. */
export const MAX_PIXELS = 100_000_000;

const percent = (min: number) => v.pipe(v.number(), v.integer(), v.minValue(min), v.maxValue(100));

/** Options cross the worker boundary, so they are validated there with this schema. */
export const GrayscalePdfOptions = v.object({
  mode: v.picklist(MODES),
  method: v.picklist(METHODS),
  brightness: percent(-100),
  contrast: percent(-100),
  /** Black and white: gray below this percentage becomes black. */
  threshold: percent(1),
  /** Grayscale: how much colour to remove (100 = all). */
  strength: percent(0),
  /** Black and white: dither photos instead of a hard cut. */
  dither: v.boolean(),
  fileName: FileNameSchema,
});

export type GrayscalePdfOptions = v.InferOutput<typeof GrayscalePdfOptions>;
