/** Pixel differences between two renders of the same page. Pure and unit-tested. */
/**
 * Pixels that differ between two same-sized renders, marked in `out`
 * (orange where they differ, the original faded elsewhere). Returns the
 * share of pixels that changed.
 */
export function pixelDiff(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
  out: Uint8ClampedArray,
  tolerance = 32,
): number {
  let changed = 0;
  const pixels = Math.min(a.length, b.length) / 4;
  for (let p = 0; p < pixels; p += 1) {
    const i = p * 4;
    const delta = Math.max(
      Math.abs((a[i] ?? 0) - (b[i] ?? 0)),
      Math.abs((a[i + 1] ?? 0) - (b[i + 1] ?? 0)),
      Math.abs((a[i + 2] ?? 0) - (b[i + 2] ?? 0)),
    );
    if (delta > tolerance) {
      changed += 1;
      out.set([234, 88, 12, 255], i);
    } else {
      // The unchanged page, washed out so the changes stand out.
      const gray = ((a[i] ?? 0) + (a[i + 1] ?? 0) + (a[i + 2] ?? 0)) / 3;
      const light = 255 - (255 - gray) * 0.25;
      out.set([light, light, light, 255], i);
    }
  }
  return pixels === 0 ? 0 : changed / pixels;
}
