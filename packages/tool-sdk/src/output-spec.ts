import * as v from 'valibot';
import { kilobytesToByteLimit, type KilobyteConvention } from './bytes';

/**
 * The "upload requirements" every image tool asks for: exact pixels, a KB
 * range, format, optional DPI, the quality floor for the size search and an
 * optional plain file name. Shared so every tool validates them identically.
 */
export const IMAGE_OUTPUT_FORMATS = ['jpeg', 'png', 'webp'] as const;
export type ImageOutputFormat = (typeof IMAGE_OUTPUT_FORMATS)[number];

/** Form state as the user edits it (KB values; empty fields allowed). */
export interface OutputSpecDraft {
  width: number | null;
  height: number | null;
  minKb: number | null;
  maxKb: number | null;
  convention: KilobyteConvention;
  format: ImageOutputFormat;
  dpi: number | null;
  qualityFloor: number;
  fileName: string;
}

export type OutputSpecErrors = Partial<
  Record<'width' | 'height' | 'minKb' | 'maxKb' | 'dpi' | 'fileName', string>
>;

const isInt = (n: number | null, min: number, max: number): n is number =>
  n !== null && Number.isInteger(n) && n >= min && n <= max;

const FILE_NAME = /^[\w\- ]*$/u;

/** An optional plain output file name (no extension). Empty means: derive it from the input. */
export const FileNameSchema = v.pipe(v.string(), v.maxLength(60), v.regex(FILE_NAME));

/** Which pages an operation applies to: all, or a typed selection such as "1-3, 5, 8-". */
export const PageSelectionSchema = v.object({
  mode: v.picklist(['all', 'custom']),
  ranges: v.pipe(v.string(), v.maxLength(500)),
});

/** The message shown under a file-name field, or null when the name is acceptable. */
export function fileNameError(name: string): string | null {
  return FILE_NAME.test(name) && name.length <= 60
    ? null
    : 'Use letters, numbers, spaces, - or _ (up to 60 characters).';
}

export function validateOutputSpec(s: OutputSpecDraft): OutputSpecErrors {
  const errors: OutputSpecErrors = {};
  if (!isInt(s.width, 16, 8000)) errors.width = 'Enter a whole number from 16 to 8000.';
  if (!isInt(s.height, 16, 8000)) errors.height = 'Enter a whole number from 16 to 8000.';
  if (s.minKb !== null && !(s.minKb > 0 && s.minKb <= 100_000))
    errors.minKb = 'Enter a size above 0.';
  if (s.maxKb !== null && !(s.maxKb > 0 && s.maxKb <= 100_000))
    errors.maxKb = 'Enter a size above 0.';
  if (!errors.minKb && !errors.maxKb && s.minKb !== null && s.maxKb !== null) {
    const min = kilobytesToByteLimit(s.minKb, 'min', s.convention);
    const max = kilobytesToByteLimit(s.maxKb, 'max', s.convention);
    if (min > max) errors.minKb = 'Minimum must be smaller than maximum.';
  }
  if (s.dpi !== null && s.format === 'jpeg' && !isInt(s.dpi, 1, 2400)) {
    errors.dpi = 'Enter a whole number from 1 to 2400.';
  }
  if (!FILE_NAME.test(s.fileName) || s.fileName.length > 60) {
    errors.fileName = 'Use letters, numbers, spaces, - or _ (up to 60 characters).';
  }
  return errors;
}

/** Processor-facing form: bytes instead of KB, absent fields omitted. */
export interface ResolvedOutputSpec {
  width: number;
  height: number;
  format: ImageOutputFormat;
  minBytes?: number;
  maxBytes?: number;
  dpi?: number;
  qualityFloor: number;
  fileName: string;
}

/** Convert a validated draft (call `validateOutputSpec` first). */
export function resolveOutputSpec(s: OutputSpecDraft): ResolvedOutputSpec {
  if (s.width === null || s.height === null) throw new TypeError('Validate the output spec first.');
  return {
    width: s.width,
    height: s.height,
    format: s.format,
    ...(s.minKb === null ? {} : { minBytes: kilobytesToByteLimit(s.minKb, 'min', s.convention) }),
    ...(s.maxKb === null ? {} : { maxBytes: kilobytesToByteLimit(s.maxKb, 'max', s.convention) }),
    ...(s.dpi === null || s.format !== 'jpeg' ? {} : { dpi: s.dpi }),
    qualityFloor: s.qualityFloor,
    fileName: s.fileName.trim(),
  };
}

const dimension = v.pipe(v.number(), v.integer(), v.minValue(16), v.maxValue(8000));
const byteLimit = v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)));

/**
 * Schema entries for `ResolvedOutputSpec`, spread into a tool's options schema
 * so untrusted options are validated in the worker. Restrict `format` per tool.
 */
export function outputSpecEntries<F extends ImageOutputFormat>(formats: readonly [F, ...F[]]) {
  return {
    width: dimension,
    height: dimension,
    format: v.picklist(formats),
    minBytes: byteLimit,
    maxBytes: byteLimit,
    dpi: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2400))),
    qualityFloor: v.pipe(v.number(), v.minValue(0.05), v.maxValue(1)),
    fileName: v.pipe(v.string(), v.maxLength(60), v.regex(FILE_NAME)),
  };
}

const coordinate = v.pipe(v.number(), v.minValue(0), v.maxValue(100_000));
const extent = v.pipe(v.number(), v.minValue(1), v.maxValue(100_000));

/** A crop rectangle in source-image pixels (after EXIF orientation). */
export const CropRectSchema = v.object({
  x: coordinate,
  y: coordinate,
  width: extent,
  height: extent,
});

/** Use with `v.check` on the tool's object schema. */
export const byteRangeIsOrdered = (o: {
  minBytes?: number | undefined;
  maxBytes?: number | undefined;
}): boolean => o.minBytes === undefined || o.maxBytes === undefined || o.minBytes <= o.maxBytes;
