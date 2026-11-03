export interface ByteRange {
  minBytes?: number;
  maxBytes?: number;
}

export type RangePosition = 'below' | 'within' | 'above';

export function positionInRange(bytes: number, range: ByteRange): RangePosition {
  if (range.minBytes !== undefined && bytes < range.minBytes) return 'below';
  if (range.maxBytes !== undefined && bytes > range.maxBytes) return 'above';
  return 'within';
}

export function validateRange(range: ByteRange): string | null {
  const { minBytes, maxBytes } = range;
  if (minBytes !== undefined && (!Number.isFinite(minBytes) || minBytes < 0)) {
    return 'Minimum size must be a positive number.';
  }
  if (maxBytes !== undefined && (!Number.isFinite(maxBytes) || maxBytes <= 0)) {
    return 'Maximum size must be greater than zero.';
  }
  if (minBytes !== undefined && maxBytes !== undefined && minBytes > maxBytes) {
    return 'Minimum size cannot be larger than maximum size.';
  }
  return null;
}
