import * as v from 'valibot';
import {
  byteRangeIsOrdered,
  CropRectSchema,
  IMAGE_OUTPUT_FORMATS,
  outputSpecEntries,
} from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const PhotoResizerOptions = v.pipe(
  v.object({
    crop: CropRectSchema,
    ...outputSpecEntries(IMAGE_OUTPUT_FORMATS),
    /** Fill for transparent areas (JPEG has no transparency). */
    background: v.pipe(v.string(), v.hexColor()),
    /** Quality used when no size limit is set. */
    quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1)),
  }),
  v.check((o) => byteRangeIsOrdered(o), 'Minimum size cannot exceed maximum size.'),
);

export type PhotoResizerOptions = v.InferOutput<typeof PhotoResizerOptions>;
