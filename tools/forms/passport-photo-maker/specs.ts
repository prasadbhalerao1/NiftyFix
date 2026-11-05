import { PORTAL_SPECS, type PortalSpec } from '@niftyfix/portal-specs';

/** A verified photo specification, turned into the exact file this tool produces. */
export interface PhotoTarget {
  spec: PortalSpec;
  label: string;
  width: number;
  height: number;
  dpi?: number;
  minBytes?: number;
  maxBytes?: number;
  /** Physical size for the summary, e.g. "35 × 45 mm". */
  printSize?: string;
  /** Head height (chin to top of head) as fractions of the photo height, when stated. */
  head?: { min: number; max: number };
}

const LABELS: Record<string, string> = {
  'india-passport-photo-print': 'Indian passport (printed, 3.5 × 4.5 cm)',
  'india-visa-photo-online': 'Indian visa (online upload)',
  'us-passport-photo': 'US passport or visa (2 × 2 inch)',
  'uk-passport-photo-print': 'UK passport (printed, 35 × 45 mm)',
};

/** Square uploads are made at this side when the spec allows a range. */
const SQUARE_SIDE = 600;

const mm = (cm: number): number => Math.round(cm * 100) / 10;

export function toTarget(spec: PortalSpec): PhotoTarget | null {
  const label = LABELS[spec.id] ?? spec.applicationName;
  const bytes = {
    ...(spec.minBytes === undefined ? {} : { minBytes: spec.minBytes }),
    ...(spec.maxBytes === undefined ? {} : { maxBytes: spec.maxBytes }),
  };
  const dims = spec.dimensions;
  if (dims?.kind === 'physical-cm') {
    const px = (cm: number): number => Math.round((cm / 2.54) * dims.assumedDpi);
    return {
      spec,
      label,
      width: px(dims.widthCm),
      height: px(dims.heightCm),
      dpi: dims.assumedDpi,
      ...bytes,
      printSize: `${mm(dims.widthCm)} × ${mm(dims.heightCm)} mm`,
      ...(spec.headHeightMm
        ? {
            head: {
              min: spec.headHeightMm.min / (dims.heightCm * 10),
              max: spec.headHeightMm.max / (dims.heightCm * 10),
            },
          }
        : {}),
    };
  }
  if (dims?.kind === 'square-px-range') {
    const side = Math.min(dims.maxSide, Math.max(dims.minSide, SQUARE_SIDE));
    return { spec, label, width: side, height: side, ...bytes };
  }
  if (dims?.kind === 'exact-px')
    return { spec, label, width: dims.width, height: dims.height, ...bytes };
  return null;
}

/** Every verified photo spec this tool can produce, in the order shown. */
export const PHOTO_TARGETS: readonly PhotoTarget[] = PORTAL_SPECS.filter(
  (spec) => spec.documentType === 'photo',
)
  .map(toTarget)
  .filter((target): target is PhotoTarget => target !== null);
