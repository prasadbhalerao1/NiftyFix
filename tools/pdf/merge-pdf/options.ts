import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const MergePdfOptions = v.object({
  fileName: FileNameSchema,
});

export type MergePdfOptions = v.InferOutput<typeof MergePdfOptions>;

export const MIN_FILES = 2;
export const MAX_FILES = 50;
