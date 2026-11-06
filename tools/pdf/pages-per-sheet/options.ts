import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const PagesPerSheetOptions = v.object({
  /** nup: pages in reading order on each sheet; booklet: 2 per side, ordered to fold. */
  mode: v.picklist(['nup', 'booklet']),
  perSheet: v.picklist([2, 4, 6, 9]),
  paper: v.picklist(['a4', 'letter']),
  /** A thin line around each page. */
  frame: v.boolean(),
  fileName: FileNameSchema,
});

export type PagesPerSheetOptions = v.InferOutput<typeof PagesPerSheetOptions>;
