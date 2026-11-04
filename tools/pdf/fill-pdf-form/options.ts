import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const FillFormOptions = v.object({
  values: v.pipe(
    v.record(
      v.pipe(v.string(), v.maxLength(300)),
      v.union([v.pipe(v.string(), v.maxLength(20_000)), v.boolean()]),
    ),
    v.check((values) => Object.keys(values).length <= 2000, 'Too many fields.'),
  ),
  flatten: v.boolean(),
  fileName: FileNameSchema,
});

export type FillFormOptions = v.InferOutput<typeof FillFormOptions>;
