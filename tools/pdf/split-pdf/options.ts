import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

export const MAX_PARTS = 500;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const SplitPdfOptions = v.variant('mode', [
  v.object({
    mode: v.literal('every'),
    size: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2000)),
    fileName: FileNameSchema,
  }),
  v.object({
    mode: v.literal('ranges'),
    ranges: v.pipe(v.string(), v.maxLength(2000)),
    fileName: FileNameSchema,
  }),
]);

export type SplitPdfOptions = v.InferOutput<typeof SplitPdfOptions>;
