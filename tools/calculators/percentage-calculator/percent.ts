/**
 * Percentage arithmetic. Each returns null when the inputs cannot give an
 * answer (such as dividing by zero), never Infinity or NaN.
 */
const finite = (value: number): number | null => (Number.isFinite(value) ? value : null);

/** X% of Y. */
export const percentOf = (percent: number, of: number): number | null =>
  finite((percent / 100) * of);

/** X is what percent of Y. */
export const whatPercent = (part: number, whole: number): number | null =>
  whole === 0 ? null : finite((part / whole) * 100);

/** Percentage change from A to B (positive = increase). */
export const percentChange = (from: number, to: number): number | null =>
  from === 0 ? null : finite(((to - from) / Math.abs(from)) * 100);

/** Y increased (or, with a negative percent, decreased) by X%. */
export const applyPercent = (value: number, percent: number): number | null =>
  finite(value * (1 + percent / 100));

/** The original value before X% was added (e.g. the price before GST). */
export const reversePercent = (result: number, percent: number): number | null =>
  percent === -100 ? null : finite(result / (1 + percent / 100));

/** Round to at most `places` decimals, dropping trailing zeros, in Indian digit grouping. */
export function format(value: number | null, places = 4): string {
  if (value === null) return '';
  const rounded = Math.round(value * 10 ** places) / 10 ** places;
  return rounded.toLocaleString('en-IN', { maximumFractionDigits: places });
}
