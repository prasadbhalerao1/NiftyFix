import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const CombineImagesOptions = v.object({
  /**
   * vertical: one under another; horizontal: side by side; grid: rows of
   * `columns`; id-a4: ID cards at their real size on an A4 page, for printing.
   */
  arrangement: v.picklist(['vertical', 'horizontal', 'grid', 'id-a4']),
  columns: v.pipe(v.number(), v.integer(), v.minValue(2), v.maxValue(6)),
  /** Space between images, in output pixels (ignored by id-a4, which uses millimetres). */
  gap: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(200)),
  /** id-a4 only: thin grey lines around each card to cut along. */
  cutLines: v.boolean(),
  format: v.picklist(['jpeg', 'png']),
  /** Device pixel limit per input image, from the manifest (re-checked before decoding). */
  maxPixels: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100_000_000)),
  fileName: FileNameSchema,
});

export type CombineImagesOptions = v.InferOutput<typeof CombineImagesOptions>;

export const MIN_IMAGES = 2;
export const MAX_IMAGES = 20;
