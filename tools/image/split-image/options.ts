import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

const count = (max: number) => v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(max));

/** Options cross the worker boundary, so they are validated there with this schema. */
export const SplitImageOptions = v.object({
  mode: v.picklist(['grid', 'instagram', 'carousel', 'poster']),
  rows: count(10),
  cols: count(10),
  shape: v.picklist(['1:1', '4:5', '3:4']),
  /** Poster overlap, 0 to 20 (% of a page). */
  overlap: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(20)),
  paper: v.picklist(['a4', 'letter']),
  fileName: FileNameSchema,
});

export type SplitImageOptions = v.InferOutput<typeof SplitImageOptions>;
