import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const UnlockPdfOptions = v.object({
  /** The open password; empty for PDFs that only restrict printing or copying. Used in memory only. */
  password: v.pipe(v.string(), v.maxLength(256)),
  fileName: FileNameSchema,
});

export type UnlockPdfOptions = v.InferOutput<typeof UnlockPdfOptions>;
