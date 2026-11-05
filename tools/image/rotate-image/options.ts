import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const RotateImageOptions = v.object({
  /** Clockwise. */
  turn: v.picklist([0, 90, 180, 270]),
  flipHorizontal: v.boolean(),
  flipVertical: v.boolean(),
  fileName: FileNameSchema,
});

export type RotateImageOptions = v.InferOutput<typeof RotateImageOptions>;
