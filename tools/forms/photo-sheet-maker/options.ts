import * as v from 'valibot';
import { CropRectSchema, FileNameSchema } from '@niftyfix/tool-sdk';

const mm = (min: number, max: number) => v.pipe(v.number(), v.minValue(min), v.maxValue(max));

/** Options cross the worker boundary, so they are validated there with this schema. */
export const PhotoSheetOptions = v.object({
  /** Area of the photo to use, in source pixels (after EXIF rotation). */
  crop: CropRectSchema,
  photo: v.object({ width: mm(10, 100), height: mm(10, 100) }),
  sheet: v.object({ width: mm(50, 310), height: mm(50, 310) }),
  /** How many copies to place; the processor uses at most what fits. */
  copies: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
  cutLines: v.boolean(),
  fileName: FileNameSchema,
});

export type PhotoSheetOptions = v.InferOutput<typeof PhotoSheetOptions>;

/** Print resolution of the sheet: what photo labs and home printers expect. */
export const SHEET_DPI = 300;
