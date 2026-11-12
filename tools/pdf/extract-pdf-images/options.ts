import * as v from 'valibot';
import { FileNameSchema, PageSelectionSchema } from '@niftyfix/tool-sdk';

/** Skip images narrower or shorter than this (pixels): 0 keeps everything, 150 keeps photos. */
export const MIN_SIDE_CHOICES = [0, 50, 150] as const;
export const MAX_IMAGES = 500;
/** Largest picture (pixels) decoded or joined in memory: 400 MB of RGBA. */
export const MAX_PIXELS = 100_000_000;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const ExtractImagesOptions = v.object({
  minSide: v.picklist(MIN_SIDE_CHOICES),
  pages: PageSelectionSchema,
  /** Rejoin pictures the PDF stores as strips or tiles. */
  joinPieces: v.boolean(),
  /** Save each picture turned and mirrored the way it appears on the page. */
  asShown: v.boolean(),
  /** Opens a protected PDF; used in memory only. */
  password: v.pipe(v.string(), v.maxLength(256)),
  fileName: FileNameSchema,
});

export type ExtractImagesOptions = v.InferOutput<typeof ExtractImagesOptions>;
