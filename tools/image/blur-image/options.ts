import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

export const STYLES = ['black', 'white', 'pixelate', 'blur'] as const;
export const MAX_BOXES = 200;

const BoxSchema = v.object({
  /** In source pixels, after EXIF rotation. */
  x: v.number(),
  y: v.number(),
  width: v.pipe(v.number(), v.minValue(1)),
  height: v.pipe(v.number(), v.minValue(1)),
  style: v.picklist(STYLES),
});

/** Options cross the worker boundary, so they are validated there with this schema. */
export const BlurImageOptions = v.object({
  boxes: v.pipe(v.array(BoxSchema), v.minLength(1), v.maxLength(MAX_BOXES)),
  /** Pixelation and blur strength, 1 to 100. */
  strength: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
  fileName: FileNameSchema,
});

export type BlurImageOptions = v.InferOutput<typeof BlurImageOptions>;
export type RedactArea = BlurImageOptions['boxes'][number];
