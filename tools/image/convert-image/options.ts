import * as v from 'valibot';
import { FileNameSchema, IMAGE_OUTPUT_FORMATS } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const ConvertImageOptions = v.object({
  format: v.picklist(IMAGE_OUTPUT_FORMATS),
  /** JPG and WebP only; PNG is lossless. */
  quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1)),
  /** Fill for transparent areas when converting to JPG, which has no transparency. */
  background: v.pipe(v.string(), v.hexColor()),
  fileName: FileNameSchema,
});

export type ConvertImageOptions = v.InferOutput<typeof ConvertImageOptions>;
