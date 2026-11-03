/**
 * Shared image output pipeline used by every image tool: safe header checks,
 * encoding to an exact byte range, and independent verification of the
 * produced file. Browser-only (encoding and the verification decode).
 */
import { positionInRange, solveQualityForRange, type ByteRange } from '@niftyfix/constraints';
import {
  describeByteRange,
  FILE_FORMATS,
  formatBytes,
  formatBytesExact,
  ToolError,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import { encodeCanvas, type Canvas, type EncodableFormat } from './browser';
import { HEADER_PROBE_BYTES, readImageHeader, type ImageHeader } from './header';
import { jpegDpi, setJpegDpi } from './jfif';

const percent = (quality: number): string => `${Math.round(quality * 100)}%`;

/** Read the header and reject images whose pixel count could exhaust memory. */
export async function readSafeHeader(blob: Blob, maxPixels: number): Promise<ImageHeader> {
  const header = readImageHeader(
    new Uint8Array(await blob.slice(0, HEADER_PROBE_BYTES).arrayBuffer()),
  );
  if (header === null) {
    throw new ToolError('CORRUPT_INPUT', 'This image header is damaged or unreadable.', {
      hint: 'Save a fresh copy from your gallery or camera app and try again.',
    });
  }
  if (header.width * header.height > maxPixels) {
    throw new ToolError(
      'TOO_MANY_PIXELS',
      `This image is ${header.width} × ${header.height} px, which is too large to process safely in a browser.`,
      { hint: 'Resize it in your gallery app first, or use a smaller image.' },
    );
  }
  return header;
}

export interface ExportOptions {
  format: EncodableFormat;
  range: ByteRange;
  /** JPEG only; written to the JFIF header (counted in the byte size). */
  dpi?: number | undefined;
  /** Quality when no byte range is set. */
  quality: number;
  /** The size solver never goes below this quality. */
  qualityFloor: number;
  /** Word used in messages: "photo", "signature". */
  subject: string;
  signal: AbortSignal;
  /** Called after each encode attempt, for progress reporting. */
  onAttempt?: (attempt: number) => void;
}

export interface ExportResult {
  bytes: Uint8Array;
  /** Quality used, or null for lossless PNG. */
  quality: number | null;
}

const hasRange = (range: ByteRange): boolean =>
  range.minBytes !== undefined || range.maxBytes !== undefined;

/**
 * Encode a canvas, meeting the byte range if one is given. Never pads files and
 * never returns a file outside the range: unreachable targets throw
 * TARGET_UNREACHABLE with the reason and what to change.
 */
export async function exportImage(canvas: Canvas, options: ExportOptions): Promise<ExportResult> {
  const { format, range, subject } = options;
  const dpi = format === 'jpeg' ? options.dpi : undefined;
  let attempts = 0;
  const encode = async (quality: number): Promise<{ bytes: number; value: Uint8Array }> => {
    if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const blob = await encodeCanvas(canvas, format, quality);
    let bytes: Uint8Array = new Uint8Array(await blob.arrayBuffer());
    if (dpi !== undefined) bytes = setJpegDpi(bytes, dpi);
    attempts += 1;
    options.onAttempt?.(attempts);
    return { bytes: bytes.length, value: bytes };
  };

  if (format === 'png') {
    const { value } = await encode(1);
    if (hasRange(range) && positionInRange(value.length, range) !== 'within') {
      throw new ToolError(
        'TARGET_UNREACHABLE',
        `As PNG this ${subject} is ${formatBytes(value.length)}, outside your limit (${describeByteRange(range)}). PNG is lossless, so its size cannot be tuned.`,
        { hint: 'Choose JPEG, which can be compressed to fit a size range.' },
      );
    }
    return { bytes: value, quality: null };
  }

  if (!hasRange(range)) {
    const { value } = await encode(options.quality);
    return { bytes: value, quality: options.quality };
  }

  const result = await solveQualityForRange({
    encode,
    range,
    qualityFloor: Math.min(options.qualityFloor, 1),
    qualityCeiling: 1,
    signal: options.signal,
  });
  if (result.status === 'met')
    return { bytes: result.attempt.value, quality: result.attempt.quality };

  const closest = result.closest.bytes;
  if (result.status === 'too-large') {
    throw new ToolError(
      'TARGET_UNREACHABLE',
      `Even at the lowest quality you allow (${percent(options.qualityFloor)}), the ${subject} is ${formatBytes(closest)}, above the ${formatBytes(range.maxBytes ?? 0)} maximum.`,
      {
        hint: 'Lower the minimum quality, choose smaller dimensions if the form allows, or crop out busy background.',
      },
    );
  }
  if (result.status === 'too-small') {
    throw new ToolError(
      'TARGET_UNREACHABLE',
      `Even at maximum quality the ${subject} is only ${formatBytes(closest)}, below the ${formatBytes(range.minBytes ?? 0)} minimum. We never pad files with junk data to reach a minimum.`,
      {
        hint: 'Use larger pixel dimensions if the form allows them, or check whether the minimum really applies.',
      },
    );
  }
  throw new ToolError(
    'TARGET_UNREACHABLE',
    `No quality setting produces a file inside ${describeByteRange(range)}; the closest is ${formatBytes(closest)}.`,
    { hint: 'Widen the size range slightly or change the dimensions.' },
  );
}

export interface OutputRequirements {
  width: number;
  height: number;
  format: EncodableFormat;
  range: ByteRange;
  dpi?: number | undefined;
  fileName: string;
}

/** Re-measure the produced file. Nothing here trusts the encoder's intent. */
export async function verifyImageOutput(
  bytes: Uint8Array,
  required: OutputRequirements,
): Promise<VerificationCheck[]> {
  const header = readImageHeader(bytes.subarray(0, HEADER_PROBE_BYTES));
  const blob = new Blob([bytes.slice().buffer], { type: FILE_FORMATS[required.format].mime });
  const decoded = await createImageBitmap(blob).then(
    (bitmap) => {
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    },
    () => null,
  );
  const checks: VerificationCheck[] = [];

  checks.push({
    id: 'dimensions',
    label: 'Dimensions',
    required: `${required.width} × ${required.height} px`,
    actual: header ? `${header.width} × ${header.height} px` : 'unreadable',
    status:
      header?.width === required.width &&
      header.height === required.height &&
      decoded?.width === required.width &&
      decoded.height === required.height
        ? 'pass'
        : 'fail',
  });

  const ranged = hasRange(required.range);
  checks.push({
    id: 'size',
    label: 'File size',
    required: describeByteRange(required.range),
    actual: formatBytesExact(bytes.length),
    status: !ranged
      ? 'not-checked'
      : positionInRange(bytes.length, required.range) === 'within'
        ? 'pass'
        : 'fail',
    ...(ranged ? {} : { note: 'No size limit was set.' }),
  });

  checks.push({
    id: 'format',
    label: 'Format',
    required: FILE_FORMATS[required.format].label,
    actual: header ? FILE_FORMATS[header.format].label : 'unknown',
    status: header?.format === required.format && decoded !== null ? 'pass' : 'fail',
  });

  const extension = required.fileName.slice(required.fileName.lastIndexOf('.') + 1);
  const allowed: readonly string[] = FILE_FORMATS[required.format].extensions;
  checks.push({
    id: 'extension',
    label: 'File extension',
    required: allowed.map((e) => `.${e}`).join(' or '),
    actual: `.${extension}`,
    status: allowed.includes(extension) ? 'pass' : 'fail',
  });

  if (required.format === 'jpeg') {
    const actualDpi = jpegDpi(bytes);
    checks.push({
      id: 'dpi',
      label: 'Resolution (DPI)',
      required: required.dpi === undefined ? 'not set' : `${required.dpi} DPI`,
      actual: actualDpi === null ? 'not declared' : `${actualDpi} DPI`,
      status:
        required.dpi === undefined ? 'not-checked' : actualDpi === required.dpi ? 'pass' : 'fail',
    });
  }
  return checks;
}
