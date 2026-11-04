import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const OrganizePdfOptions = v.object({
  /** The output, in order: which original page (0-based) and the extra clockwise rotation. */
  pages: v.pipe(
    v.array(
      v.object({
        index: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1999)),
        rotation: v.picklist([0, 90, 180, 270]),
      }),
    ),
    v.minLength(1, 'Keep at least one page.'),
    v.maxLength(2000),
  ),
  fileName: FileNameSchema,
});

export type OrganizePdfOptions = v.InferOutput<typeof OrganizePdfOptions>;
