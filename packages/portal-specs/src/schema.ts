import * as v from 'valibot';

const isoDate = v.pipe(v.string(), v.isoDate());
const positiveInt = v.pipe(v.number(), v.integer(), v.minValue(1));

/**
 * A published upload requirement from an official source. Every field that
 * is not stated by the source is omitted rather than guessed; `unspecified`
 * lists requirements the source is silent or ambiguous about.
 */
export const PortalSpecSchema = v.pipe(
  v.object({
    id: v.pipe(v.string(), v.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)),
    portalName: v.pipe(v.string(), v.minLength(2)),
    /** e.g. "Combined Graduate Level Examination 2026" */
    applicationName: v.pipe(v.string(), v.minLength(2)),
    documentType: v.picklist(['photo', 'signature', 'document']),
    dimensions: v.optional(
      v.union([
        v.object({ kind: v.literal('exact-px'), width: positiveInt, height: positiveInt }),
        v.object({
          kind: v.literal('physical-cm'),
          widthCm: v.pipe(v.number(), v.minValue(0.5)),
          heightCm: v.pipe(v.number(), v.minValue(0.5)),
          /** DPI used to convert cm → px when the source does not state pixels. Must be justified in `notes`. */
          assumedDpi: positiveInt,
        }),
        /** A square whose side may be anywhere in a range, e.g. "350 to 1000 pixels, height equal to width". */
        v.object({
          kind: v.literal('square-px-range'),
          minSide: positiveInt,
          maxSide: positiveInt,
        }),
      ]),
    ),
    /** Head height from chin to top of head, when the source states it (printed photos). */
    headHeightMm: v.optional(
      v.object({
        min: v.pipe(v.number(), v.minValue(1)),
        max: v.pipe(v.number(), v.minValue(1)),
      }),
    ),
    minBytes: v.optional(positiveInt),
    maxBytes: v.optional(positiveInt),
    /** How the source defines KB, when it says. Otherwise the tool uses its safe convention. */
    byteConvention: v.picklist(['stated-1000', 'stated-1024', 'not-stated']),
    formats: v.pipe(v.array(v.picklist(['jpeg', 'png', 'pdf'])), v.minLength(1)),
    dpi: v.optional(positiveInt),
    background: v.optional(v.string()),
    otherRequirements: v.array(v.string()),
    unspecified: v.array(v.string()),
    source: v.object({
      url: v.pipe(v.string(), v.url(), v.startsWith('https://')),
      title: v.pipe(v.string(), v.minLength(3)),
      noticeReference: v.optional(v.string()),
    }),
    effectiveDate: v.optional(isoDate),
    verifiedAt: isoDate,
    verifiedBy: v.pipe(v.string(), v.minLength(2)),
    version: positiveInt,
    notes: v.optional(v.string()),
  }),
  v.check(
    (spec) =>
      spec.minBytes === undefined || spec.maxBytes === undefined || spec.minBytes <= spec.maxBytes,
    'minBytes must not exceed maxBytes',
  ),
  v.check(
    (spec) =>
      (spec.headHeightMm === undefined || spec.headHeightMm.min <= spec.headHeightMm.max) &&
      (spec.dimensions?.kind !== 'square-px-range' ||
        spec.dimensions.minSide <= spec.dimensions.maxSide),
    'ranges must not be inverted',
  ),
);

export type PortalSpec = v.InferOutput<typeof PortalSpecSchema>;

/**
 * A generic size template (not tied to any portal). Shown as "Common sizes",
 * never as an official requirement.
 */
export interface SizeTemplate {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
  dpi?: number;
}
