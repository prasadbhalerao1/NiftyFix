import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const ImageToPdfOptions = v.object({
  pageSize: v.picklist(['a4', 'letter', 'fit']),
  orientation: v.picklist(['auto', 'portrait', 'landscape']),
  /** Points; 0–72 (one inch). */
  margin: v.pipe(v.number(), v.minValue(0), v.maxValue(72)),
  /** Device pixel limit per image, from the manifest (re-checked here before decoding). */
  maxPixels: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100_000_000)),
  fileName: FileNameSchema,
});

export type ImageToPdfOptions = v.InferOutput<typeof ImageToPdfOptions>;

export const MAX_IMAGES = 100;
