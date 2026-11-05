import * as v from 'valibot';
import { CropRectSchema, FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const CropImageOptions = v.object({
  /** In source pixels, after EXIF rotation. */
  crop: CropRectSchema,
  fileName: FileNameSchema,
});

export type CropImageOptions = v.InferOutput<typeof CropImageOptions>;
