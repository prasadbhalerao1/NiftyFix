import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Largest output a browser can safely draw (about a 50 MP photo). */
export const MAX_OUTPUT_PIXELS = 50_000_000;

const side = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(20_000));

/** Options cross the worker boundary, so they are validated there with this schema. */
export const ResizeImageOptions = v.pipe(
  v.object({
    width: side,
    height: side,
    /** When the new shape differs from the original: squash, add borders, or crop the edges. */
    fit: v.picklist(['stretch', 'contain', 'cover']),
    /** 'auto' keeps the original format (formats a browser cannot write become JPEG or PNG). */
    format: v.picklist(['auto', 'jpeg', 'webp', 'png']),
    /** Written into JPEG files, for print sizes in cm or inches. */
    dpi: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2400))),
    fileName: FileNameSchema,
  }),
  v.check(
    (o) => o.width * o.height <= MAX_OUTPUT_PIXELS,
    'That size is too large to create in a browser. Keep it under 50 megapixels.',
  ),
);

export type ResizeImageOptions = v.InferOutput<typeof ResizeImageOptions>;
