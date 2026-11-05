import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Text fill, with an outline in the opposite tone so it reads on light and dark photos. */
export const COLOURS = {
  white: { fill: '#ffffff', outline: 'rgba(0, 0, 0, 0.45)' },
  black: { fill: '#000000', outline: 'rgba(255, 255, 255, 0.45)' },
  grey: { fill: '#808080', outline: 'rgba(0, 0, 0, 0.25)' },
  red: { fill: '#cc1a1a', outline: 'rgba(255, 255, 255, 0.4)' },
} as const;

export const POSITIONS = [
  'center',
  'tile',
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
] as const;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const WatermarkImageOptions = v.object({
  text: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
  position: v.picklist(POSITIONS),
  /** Text height as a percentage of the image's shorter side. */
  size: v.pipe(v.number(), v.minValue(2), v.maxValue(30)),
  opacity: v.pipe(v.number(), v.minValue(0.05), v.maxValue(1)),
  colour: v.picklist(Object.keys(COLOURS) as (keyof typeof COLOURS)[]),
  /** Centre and tiled text only. */
  diagonal: v.boolean(),
  fileName: FileNameSchema,
});

export type WatermarkImageOptions = v.InferOutput<typeof WatermarkImageOptions>;
