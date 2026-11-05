import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const RemoveExifOptions = v.object({
  fileName: FileNameSchema,
});

export type RemoveExifOptions = v.InferOutput<typeof RemoveExifOptions>;
