import * as v from 'valibot';
import { FileNameSchema } from '@niftyfix/tool-sdk';

export const LEVELS = {
  light: { quality: 0.82, maxSide: 3000, convertLossless: false, minBytes: 50_000 },
  balanced: { quality: 0.7, maxSide: 2200, convertLossless: false, minBytes: 30_000 },
  strong: { quality: 0.55, maxSide: 1600, convertLossless: true, minBytes: 20_000 },
} as const;
export type Level = keyof typeof LEVELS;

/** Settings tried in order for a target size: each step a little stronger. */
export const TARGET_LADDER = [
  LEVELS.balanced,
  { quality: 0.62, maxSide: 1900, convertLossless: true, minBytes: 20_000 },
  LEVELS.strong,
  { quality: 0.45, maxSide: 1300, convertLossless: true, minBytes: 10_000 },
  { quality: 0.35, maxSide: 1000, convertLossless: true, minBytes: 5_000 },
] as const;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const CompressPdfOptions = v.variant('mode', [
  v.object({
    mode: v.literal('level'),
    level: v.picklist(['light', 'balanced', 'strong']),
    fileName: FileNameSchema,
  }),
  v.object({
    mode: v.literal('target'),
    maxBytes: v.pipe(v.number(), v.integer(), v.minValue(10_000), v.maxValue(1_000_000_000)),
    fileName: FileNameSchema,
  }),
]);

export type CompressPdfOptions = v.InferOutput<typeof CompressPdfOptions>;
