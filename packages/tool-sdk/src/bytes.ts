/**
 * Size convention for user-entered "KB" values. Portals rarely state whether
 * 1 KB means 1000 or 1024 bytes, so 'safe' satisfies both readings:
 * maximum = 1000 × KB, minimum = 1024 × KB.
 */
export type KilobyteConvention = 'safe' | 'kb1000' | 'kib1024';

export function kilobytesToByteLimit(
  kilobytes: number,
  bound: 'min' | 'max',
  convention: KilobyteConvention,
): number {
  if (convention === 'kb1000') return Math.round(kilobytes * 1000);
  if (convention === 'kib1024') return Math.round(kilobytes * 1024);
  return bound === 'max' ? Math.floor(kilobytes * 1000) : Math.ceil(kilobytes * 1024);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} bytes`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

/** "20.5 KB – 50.0 KB", "at most 50.0 KB", "at least 10.2 KB" or "any". */
export function describeByteRange(range: { minBytes?: number; maxBytes?: number }): string {
  const { minBytes, maxBytes } = range;
  if (minBytes !== undefined && maxBytes !== undefined) {
    return `${formatBytes(minBytes)} – ${formatBytes(maxBytes)}`;
  }
  if (maxBytes !== undefined) return `at most ${formatBytes(maxBytes)}`;
  if (minBytes !== undefined) return `at least ${formatBytes(minBytes)}`;
  return 'any';
}

/** "48.2 KB (48,213 bytes)": exact byte counts matter when a portal is strict. */
export function formatBytesExact(bytes: number): string {
  return `${formatBytes(bytes)} (${bytes.toLocaleString('en-US')} bytes)`;
}
