import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

const field = v.pipe(v.string(), v.maxLength(500));

export const FIELDS = ['title', 'author', 'subject', 'keywords', 'creator'] as const;
export type Field = (typeof FIELDS)[number];

/** Options cross the worker boundary, so they are validated there with this schema. */
export const MetadataOptions = v.variant('mode', [
  v.object({
    mode: v.literal('edit'),
    fields: v.object({
      title: field,
      author: field,
      subject: field,
      keywords: field,
      creator: field,
    }),
    fileName: FileNameSchema,
  }),
  v.object({ mode: v.literal('remove'), fileName: FileNameSchema }),
]);

export type MetadataOptions = v.InferOutput<typeof MetadataOptions>;
