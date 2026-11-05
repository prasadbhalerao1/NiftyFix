import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Quality per level; Strong also caps the long side, since camera photos are far larger than screens. */
export const LEVELS = {
  light: { quality: 0.85, maxSide: Number.POSITIVE_INFINITY },
  balanced: { quality: 0.72, maxSide: Number.POSITIVE_INFINITY },
  strong: { quality: 0.55, maxSide: 2048 },
} as const;
export type Level = keyof typeof LEVELS;

/** The lowest quality a target size may use before the image is made smaller instead. */
export const TARGET_QUALITY_FLOOR = 0.45;

const common = {
  /** 'auto' keeps JPEG and WebP, and turns other formats into JPEG (or WebP if transparent). */
  format: v.picklist(['auto', 'jpeg', 'webp', 'png']),
  fileName: FileNameSchema,
};

/** Options cross the worker boundary, so they are validated there with this schema. */
export const CompressImageOptions = v.variant('mode', [
  v.object({
    mode: v.literal('level'),
    level: v.picklist(['light', 'balanced', 'strong']),
    ...common,
  }),
  v.object({
    mode: v.literal('target'),
    maxBytes: v.pipe(v.number(), v.integer(), v.minValue(5_000), v.maxValue(1_000_000_000)),
    ...common,
  }),
]);

export type CompressImageOptions = v.InferOutput<typeof CompressImageOptions>;
