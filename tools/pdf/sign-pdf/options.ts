import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

const fraction = v.pipe(v.number(), v.minValue(0), v.maxValue(1));

/** Options cross the worker boundary, so they are validated there with this schema. */
export const SignPdfOptions = v.object({
  /** The signature as a PNG (transparent background), at most 3 MB. */
  signature: v.pipe(
    v.instance(Uint8Array),
    v.check(
      (bytes) => bytes.byteLength > 0 && bytes.byteLength <= 3_000_000,
      'Signature image too large.',
    ),
  ),
  /** Where it goes, as fractions of the displayed page from the top-left. */
  rect: v.object({
    x: fraction,
    y: fraction,
    width: v.pipe(v.number(), v.minValue(0.02), v.maxValue(1)),
    height: v.pipe(v.number(), v.minValue(0.005), v.maxValue(1)),
  }),
  placeOn: v.variant('mode', [
    v.object({ mode: v.literal('one'), page: v.pipe(v.number(), v.integer(), v.minValue(0)) }),
    v.object({ mode: v.literal('all') }),
  ]),
  fileName: FileNameSchema,
});

export type SignPdfOptions = v.InferOutput<typeof SignPdfOptions>;
