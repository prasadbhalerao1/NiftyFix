import * as v from 'valibot';
import { FileNameSchema, PageSelectionSchema } from '@niftyfix/tool-sdk';

/** Skip images narrower or shorter than this (pixels): 0 keeps everything, 150 keeps photos. */
export const MIN_SIDE_CHOICES = [0, 50, 150] as const;
export const MAX_IMAGES = 500;
/** Lossless images are re-encoded as PNG on a canvas; iOS refuses canvases above this. */
export const MAX_CANVAS_PIXELS = 16_777_216;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const ExtractImagesOptions = v.object({
  minSide: v.picklist(MIN_SIDE_CHOICES),
  pages: PageSelectionSchema,
  fileName: FileNameSchema,
});

export type ExtractImagesOptions = v.InferOutput<typeof ExtractImagesOptions>;
