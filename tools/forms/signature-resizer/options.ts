import * as v from 'valibot';
import { byteRangeIsOrdered, CropRectSchema, outputSpecEntries } from '@niftyfix/tool-sdk';

const unit = v.pipe(v.number(), v.minValue(0), v.maxValue(1));
const signed = v.pipe(v.number(), v.minValue(-1), v.maxValue(1));

export const SIGNATURE_FORMATS = ['jpeg', 'png'] as const;

/** Mirrors EnhanceSettings in @niftyfix/engine-image; validated in the worker. */
export const EnhanceSchema = v.object({
  flatten: v.boolean(),
  brightness: signed,
  contrast: signed,
  whiten: unit,
  mode: v.picklist(['color', 'grayscale', 'blackwhite']),
  threshold: unit,
  transparent: v.boolean(),
});

/** Options cross the worker boundary, so they are validated there with this schema. */
export const SignatureResizerOptions = v.pipe(
  v.object({
    crop: CropRectSchema,
    /** 'fit': whole crop scaled into the box with white margins; 'fill': crop already has the box's shape. */
    placement: v.picklist(['fit', 'fill']),
    enhance: EnhanceSchema,
    ...outputSpecEntries(SIGNATURE_FORMATS),
    /** Quality used when no size limit is set. */
    quality: v.pipe(v.number(), v.minValue(0.1), v.maxValue(1)),
  }),
  v.check((o) => byteRangeIsOrdered(o), 'Minimum size cannot exceed maximum size.'),
  v.check(
    (o) => !o.enhance.transparent || o.format === 'png',
    'A transparent background needs PNG output.',
  ),
);

export type SignatureResizerOptions = v.InferOutput<typeof SignatureResizerOptions>;
