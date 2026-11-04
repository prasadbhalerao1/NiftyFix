import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const ExtractPagesOptions = v.object({
  ranges: v.pipe(v.string(), v.maxLength(500)),
  fileName: FileNameSchema,
});

export type ExtractPagesOptions = v.InferOutput<typeof ExtractPagesOptions>;
