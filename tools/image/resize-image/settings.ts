import { cmToPixels } from '@niftyfix/constraints';
import { MAX_OUTPUT_PIXELS } from './options';

export type Unit = 'px' | 'percent' | 'cm' | 'in';

export interface Size {
  width: number;
  height: number;
}

/** What the user typed, in the chosen unit. */
export interface SizeEntry {
  unit: Unit;
  width: number | null;
  height: number | null;
  percent: number | null;
  dpi: number | null;
}

const toPixels = (value: number, unit: Exclude<Unit, 'percent'>, dpi: number): number =>
  unit === 'px'
    ? Math.round(value)
    : unit === 'cm'
      ? cmToPixels(value, dpi)
      : Math.round(value * dpi);

/** A pixel length shown in another unit: whole pixels, centimetres and inches to 2 decimals. */
export function fromPixels(pixels: number, unit: Exclude<Unit, 'percent'>, dpi: number): number {
  if (unit === 'px') return pixels;
  const inches = pixels / dpi;
  return Math.round((unit === 'cm' ? inches * 2.54 : inches) * 100) / 100;
}

/** The other side, keeping the original's proportions (in any unit). */
export function proportional(value: number, from: number, to: number, unit: Unit): number {
  const exact = (value * to) / from;
  return unit === 'px' ? Math.max(1, Math.round(exact)) : Math.round(exact * 100) / 100;
}

/** The output size in pixels, or an error to show next to the fields. */
export function resolveSize(entry: SizeEntry, source: Size): Size | { error: string } {
  let size: Size;
  if (entry.unit === 'percent') {
    if (entry.percent === null || entry.percent <= 0 || entry.percent > 1000)
      return { error: 'Enter a percentage between 1 and 1000.' };
    size = {
      width: Math.max(1, Math.round((source.width * entry.percent) / 100)),
      height: Math.max(1, Math.round((source.height * entry.percent) / 100)),
    };
  } else {
    if (entry.width === null || entry.height === null || entry.width <= 0 || entry.height <= 0)
      return { error: 'Enter a width and a height.' };
    const dpi = entry.dpi ?? 0;
    if (entry.unit !== 'px' && (!Number.isInteger(dpi) || dpi < 1 || dpi > 2400))
      return { error: 'Enter a DPI between 1 and 2400 (300 is usual for print).' };
    size = {
      width: toPixels(entry.width, entry.unit, dpi),
      height: toPixels(entry.height, entry.unit, dpi),
    };
  }
  if (size.width < 1 || size.height < 1) return { error: 'That size is less than one pixel.' };
  if (size.width > 20_000 || size.height > 20_000 || size.width * size.height > MAX_OUTPUT_PIXELS)
    return { error: 'That is too large to create in a browser. Keep it under 50 megapixels.' };
  return size;
}
