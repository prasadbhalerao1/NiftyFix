import * as v from 'valibot';

const dimension = v.pipe(v.number(), v.integer(), v.minValue(16), v.maxValue(8000));
const coordinate = v.pipe(v.number(), v.minValue(0), v.maxValue(100_000));

export const OUTPUT_FORMATS = ['jpeg', 'png', 'webp'] as const;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const PhotoResizerOptions = v.pipe(
  v.object({
    crop: v.object({
      x: coordinate,
      y: coordinate,
      width: v.pipe(v.number(), v.minValue(1), v.maxValue(100_000)),
      height: v.pipe(v.number(), v.minValue(1), v.maxValue(100_000)),
    }),
    width: dimension,
    height: dimension,
    format: v.picklist(OUTPUT_FORMATS),
    /** Byte limits, already converted from KB by the UI using the chosen convention. */
    minBytes: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
    maxBytes: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
    /** JPEG only: written to the JFIF header. */
    dpi: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2400))),
    /** Fill for transparent areas (JPEG has no transparency). */
    background: v.pipe(v.string(), v.hexColor()),
    /** Quality used when no size limit is set. */
    quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1)),
    /** The size solver never goes below this quality. */
    qualityFloor: v.pipe(v.number(), v.minValue(0.05), v.maxValue(1)),
    /** Output name without extension; empty means derived from the original. */
    fileName: v.pipe(v.string(), v.maxLength(60), v.regex(/^[\w\- ]*$/u)),
  }),
  v.check(
    (o) => o.minBytes === undefined || o.maxBytes === undefined || o.minBytes <= o.maxBytes,
    'Minimum size cannot exceed maximum size.',
  ),
);

export type PhotoResizerOptions = v.InferOutput<typeof PhotoResizerOptions>;
