import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const MakeSquareOptions = v.object({
  /** square: pad the whole image to a square; border: same shape, framed on every side. */
  shape: v.picklist(['square', 'border']),
  /** Extra space on every side, as a percentage of the image's longer side. */
  borderPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(50)),
  /** colour: a flat fill; blur: a blurred, enlarged copy of the photo behind it. */
  fill: v.picklist(['colour', 'blur']),
  colour: v.pipe(v.string(), v.regex(/^#[0-9a-f]{6}$/i)),
  fileName: FileNameSchema,
});

export type MakeSquareOptions = v.InferOutput<typeof MakeSquareOptions>;
