import * as v from 'valibot';
import { FileNameSchema, PageSelectionSchema } from '@niftyfix/tool-sdk';

const mm = v.pipe(v.number(), v.minValue(0), v.maxValue(500));

/** Options cross the worker boundary, so they are validated there with this schema. */
export const CropPdfOptions = v.variant('mode', [
  v.object({
    mode: v.literal('crop'),
    margins: v.object({ top: mm, right: mm, bottom: mm, left: mm }),
    pages: PageSelectionSchema,
    fileName: FileNameSchema,
  }),
  v.object({
    mode: v.literal('resize'),
    paper: v.picklist(['a4', 'letter', 'legal', 'a3', 'a5']),
    pages: PageSelectionSchema,
    fileName: FileNameSchema,
  }),
]);

export type CropPdfOptions = v.InferOutput<typeof CropPdfOptions>;
