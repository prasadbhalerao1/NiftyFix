import * as v from 'valibot';
import { FileNameSchema, PageSelectionSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const RotatePdfOptions = v.object({
  angle: v.picklist([90, 180, 270]),
  pages: PageSelectionSchema,
  fileName: FileNameSchema,
});

export type RotatePdfOptions = v.InferOutput<typeof RotatePdfOptions>;
