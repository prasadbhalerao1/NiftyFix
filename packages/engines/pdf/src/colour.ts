import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFString,
  type PDFContext,
} from '@cantoo/pdf-lib';
import { makeFunction } from './functions';
import type { Rgb } from './tone';

/**
 * Colour spaces as functions to RGB (0 to 1), and the tone settings that
 * turn RGB into gray, black and white, or a softer colour. Device colour
 * conversions are the simple ones viewers use when no profile applies
 * (CMYK as 1 - min(1, c + k)), so gray values match what people see.
 */

export interface ColourSpace {
  /** Components an `sc`/`scn` operator or an image sample carries. */
  components: number;
  toRgb(components: readonly number[]): Rgb;
  /** Default component values (the initial colour after `cs`). */
  initial: number[];
}

const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : Number.isFinite(v) ? v : 0);
const GRAY: ColourSpace = { components: 1, toRgb: ([g = 0]) => [g, g, g], initial: [0] };
const RGB: ColourSpace = {
  components: 3,
  toRgb: ([r = 0, g = 0, b = 0]) => [r, g, b],
  initial: [0, 0, 0],
};
const CMYK: ColourSpace = {
  components: 4,
  toRgb: ([c = 0, m = 0, y = 0, k = 1]) => [
    1 - Math.min(1, c + k),
    1 - Math.min(1, m + k),
    1 - Math.min(1, y + k),
  ],
  initial: [0, 0, 0, 1],
};

export const DEVICE_SPACES: Record<string, ColourSpace> = {
  DeviceGray: GRAY,
  CalGray: GRAY,
  G: GRAY,
  DeviceRGB: RGB,
  CalRGB: RGB,
  RGB,
  DeviceCMYK: CMYK,
  CMYK,
};

/** CIE L*a*b* (D65 white) to sRGB. */
function labToRgb(l: number, a: number, b: number): Rgb {
  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inv = (t: number): number => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const [x, y, z] = [0.95047 * inv(fx), inv(fy), 1.08883 * inv(fz)];
  const linear = [
    3.2406 * x - 1.5372 * y - 0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x - 0.204 * y + 1.057 * z,
  ];
  return linear.map((c) =>
    clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055),
  ) as Rgb;
}

/** A colour space object (name or array) as a converter; null for Pattern or unknown spaces. */
export function colourSpace(value: unknown, context: PDFContext, depth = 0): ColourSpace | null {
  if (depth > 8) return null;
  const space = value instanceof PDFRef ? context.lookup(value) : value;
  if (space instanceof PDFName) return DEVICE_SPACES[space.decodeText()] ?? null;
  if (!(space instanceof PDFArray)) return null;
  const family = space.lookup(0);
  const kind = family instanceof PDFName ? family.decodeText() : '';
  if (kind in DEVICE_SPACES) return DEVICE_SPACES[kind] ?? null;
  if (kind === 'ICCBased') {
    const profile = space.lookup(1);
    const dict = profile instanceof PDFRawStream ? profile.dict : null;
    const alternate = dict?.lookup(PDFName.of('Alternate'));
    if (alternate) {
      const resolved = colourSpace(alternate, context, depth + 1);
      if (resolved) return resolved;
    }
    const n = (dict?.lookup(PDFName.of('N')) as PDFNumber | undefined)?.asNumber();
    return n === 1 ? GRAY : n === 3 ? RGB : n === 4 ? CMYK : null;
  }
  if (kind === 'Lab') {
    const dict = space.lookup(1);
    const range =
      dict instanceof PDFDict && dict.lookup(PDFName.of('Range')) instanceof PDFArray
        ? (dict.lookup(PDFName.of('Range')) as PDFArray)
            .asArray()
            .map((n) => (n instanceof PDFNumber ? n.asNumber() : 0))
        : [-100, 100, -100, 100];
    return {
      components: 3,
      toRgb: ([l = 0, a = 0, b = 0]) =>
        labToRgb(
          l,
          Math.min(range[1] ?? 100, Math.max(range[0] ?? -100, a)),
          Math.min(range[3] ?? 100, Math.max(range[2] ?? -100, b)),
        ),
      initial: [0, 0, 0],
    };
  }
  if (kind === 'Indexed' || kind === 'I') {
    const base = colourSpace(space.lookup(1), context, depth + 1);
    const hival = (space.lookup(2) as PDFNumber | undefined)?.asNumber() ?? 0;
    const lookup = space.lookup(3);
    let table: Uint8Array | null = null;
    if (lookup instanceof PDFRawStream) table = decodePDFRawStream(lookup).decode();
    else if (lookup instanceof PDFHexString || lookup instanceof PDFString)
      table = lookup.asBytes();
    if (!base || !table) return null;
    const n = base.components;
    const palette = table;
    return {
      components: 1,
      toRgb: ([index = 0]) => {
        const i = Math.max(0, Math.min(hival, Math.round(index)));
        return base.toRgb(Array.from({ length: n }, (_, c) => (palette[i * n + c] ?? 0) / 255));
      },
      initial: [0],
    };
  }
  if (kind === 'Separation' || kind === 'DeviceN') {
    const names = space.lookup(1);
    const components = names instanceof PDFArray ? names.size() : 1;
    // The /None colourant never marks the page; /All marks every plate (registration).
    const name = names instanceof PDFName ? names.decodeText() : '';
    const alternate = colourSpace(space.lookup(2), context, depth + 1);
    const tint = makeFunction(space.get(3), context);
    if (name === 'All') {
      return { components: 1, toRgb: ([t = 1]) => [1 - t, 1 - t, 1 - t], initial: [1] };
    }
    if (!alternate || !tint) return null;
    return {
      components,
      toRgb: (c) => alternate.toRgb(tint(c)),
      initial: new Array<number>(components).fill(1),
    };
  }
  return null;
}
