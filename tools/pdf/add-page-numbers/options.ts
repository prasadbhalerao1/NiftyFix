import * as v from 'valibot';
import { FileNameSchema, PageSelectionSchema } from '@niftyfix/tool-sdk';

export const STYLES = {
  plain: '{n}',
  page: 'Page {n}',
  of: '{n} of {total}',
  'page-of': 'Page {n} of {total}',
} as const;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const PageNumberOptions = v.object({
  position: v.picklist([
    'bottom-center',
    'bottom-right',
    'bottom-left',
    'top-center',
    'top-right',
    'top-left',
  ]),
  style: v.picklist(Object.keys(STYLES) as (keyof typeof STYLES)[]),
  start: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(99_999)),
  fontSize: v.pipe(v.number(), v.minValue(6), v.maxValue(36)),
  pages: PageSelectionSchema,
  fileName: FileNameSchema,
});

export type PageNumberOptions = v.InferOutput<typeof PageNumberOptions>;
