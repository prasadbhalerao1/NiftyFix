import { positionInRange, type ByteRange } from './byte-range';

export interface EncodeAttempt<T> {
  quality: number;
  bytes: number;
  value: T;
}

export interface QualitySolverInput<T> {
  /** Encode at a quality in [0, 1]. Must be deterministic for a given quality. */
  encode(quality: number): Promise<{ bytes: number; value: T }>;
  range: ByteRange;
  /** Lowest quality the user accepts. The solver never goes below it. */
  qualityFloor: number;
  /** Highest quality to try. */
  qualityCeiling: number;
  /** Stop when the search interval is narrower than this (browsers quantise to 1/100). */
  resolution?: number;
  maxIterations?: number;
  signal?: AbortSignal;
}

export type QualitySolverResult<T> =
  | { status: 'met'; attempt: EncodeAttempt<T>; attempts: number }
  /** Even the lowest allowed quality is larger than the maximum. */
  | { status: 'too-large'; closest: EncodeAttempt<T>; attempts: number }
  /** Even the highest allowed quality is smaller than the minimum. */
  | { status: 'too-small'; closest: EncodeAttempt<T>; attempts: number }
  /** The range lies between two adjacent quality steps (non-monotonic or very narrow range). */
  | { status: 'no-fit'; closest: EncodeAttempt<T>; attempts: number };

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
}

function distanceToRange(bytes: number, range: ByteRange): number {
  if (range.minBytes !== undefined && bytes < range.minBytes) return range.minBytes - bytes;
  if (range.maxBytes !== undefined && bytes > range.maxBytes) return bytes - range.maxBytes;
  return 0;
}

/**
 * Find the highest quality whose encoded size lies inside `range`.
 *
 * Encoded size is *usually* monotonic in quality but not strictly, so the
 * solver keeps the best in-range attempt seen rather than trusting the last
 * one, and reports honestly when no quality fits. It never pads output.
 */
export async function solveQualityForRange<T>(
  input: QualitySolverInput<T>,
): Promise<QualitySolverResult<T>> {
  const { range, qualityFloor, qualityCeiling, signal } = input;
  const resolution = input.resolution ?? 0.01;
  const maxIterations = input.maxIterations ?? 10;
  if (!(qualityFloor >= 0 && qualityCeiling <= 1 && qualityFloor <= qualityCeiling)) {
    throw new RangeError('Quality bounds must satisfy 0 ≤ floor ≤ ceiling ≤ 1.');
  }

  let attempts = 0;
  const run = async (quality: number): Promise<EncodeAttempt<T>> => {
    throwIfAborted(signal);
    attempts += 1;
    const { bytes, value } = await input.encode(quality);
    return { quality, bytes, value };
  };

  let best: EncodeAttempt<T> | null = null;
  let closest: EncodeAttempt<T> | null = null;
  const record = (attempt: EncodeAttempt<T>): void => {
    if (positionInRange(attempt.bytes, range) === 'within') {
      if (best === null || attempt.quality > best.quality) best = attempt;
    }
    if (
      closest === null ||
      distanceToRange(attempt.bytes, range) < distanceToRange(closest.bytes, range)
    ) {
      closest = attempt;
    }
  };

  const top = await run(qualityCeiling);
  record(top);
  const topPosition = positionInRange(top.bytes, range);
  if (topPosition === 'within') return { status: 'met', attempt: top, attempts };
  if (topPosition === 'below') return { status: 'too-small', closest: top, attempts };

  const bottom = await run(qualityFloor);
  record(bottom);
  const bottomPosition = positionInRange(bottom.bytes, range);
  if (bottomPosition === 'above') return { status: 'too-large', closest: bottom, attempts };

  // Invariant: `low` produced bytes ≤ max, `high` produced bytes > max.
  let low = qualityFloor;
  let high = qualityCeiling;
  for (let i = 0; i < maxIterations && high - low > resolution; i += 1) {
    const mid = Math.round(((low + high) / 2) * 1000) / 1000;
    const attempt = await run(mid);
    record(attempt);
    if (positionInRange(attempt.bytes, range) === 'above') high = mid;
    else low = mid;
  }

  const found = best as EncodeAttempt<T> | null;
  if (found !== null) return { status: 'met', attempt: found, attempts };
  const nearest = (closest ?? bottom) as EncodeAttempt<T>;
  return { status: 'no-fit', closest: nearest, attempts };
}
