import * as v from 'valibot';
import { FileNameSchema, PageSelectionSchema } from '@niftyfix/tool-sdk';

export const COLOURS = {
  grey: [0.45, 0.45, 0.45],
  red: [0.8, 0.1, 0.1],
  blue: [0.1, 0.25, 0.75],
  black: [0, 0, 0],
} as const;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const WatermarkOptions = v.object({
  text: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
  opacity: v.pipe(v.number(), v.minValue(0.05), v.maxValue(1)),
  layout: v.picklist(['diagonal', 'horizontal']),
  colour: v.picklist(Object.keys(COLOURS) as (keyof typeof COLOURS)[]),
  pages: PageSelectionSchema,
  fileName: FileNameSchema,
});

export type WatermarkOptions = v.InferOutput<typeof WatermarkOptions>;
