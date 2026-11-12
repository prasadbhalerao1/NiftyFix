/**
 * Colour formats, contrast and palette extraction for the picker. Pure, so
 * every value shown is unit-tested.
 */
export type Rgb = readonly [number, number, number];

const hex2 = (n: number): string => Math.round(n).toString(16).padStart(2, '0');
export const toHex = ([r, g, b]: Rgb): string => `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase();

export function toHsl([r, g, b]: Rgb): [number, number, number] {
  const [rf, gf, bf] = [r / 255, g / 255, b / 255];
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === rf
      ? (gf - bf) / d + (gf < bf ? 6 : 0)
      : max === gf
        ? (bf - rf) / d + 2
        : (rf - gf) / d + 4;
  return [Math.round(h * 60) % 360, Math.round(s * 100), Math.round(l * 100)];
}

export function toCmyk([r, g, b]: Rgb): [number, number, number, number] {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k === 1) return [0, 0, 0, 100];
  const part = (c: number): number => Math.round(((1 - c / 255 - k) / (1 - k)) * 100);
  return [part(r), part(g), part(b), Math.round(k * 100)];
}

/** Every format people paste into design tools and code. */
export function formats(rgb: Rgb): { label: string; value: string }[] {
  const [h, s, l] = toHsl(rgb);
  const [c, m, y, k] = toCmyk(rgb);
  return [
    { label: 'HEX', value: toHex(rgb) },
    { label: 'RGB', value: `rgb(${rgb.join(', ')})` },
    { label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
    { label: 'CMYK', value: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)` },
  ];
}

/** WCAG relative luminance. */
export function luminance([r, g, b]: Rgb): number {
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** CSS named colours, for a human name next to the code. */
const NAMED =
  'aliceblue:f0f8ff,antiquewhite:faebd7,aqua:00ffff,aquamarine:7fffd4,azure:f0ffff,beige:f5f5dc,bisque:ffe4c4,black:000000,blanchedalmond:ffebcd,blue:0000ff,blueviolet:8a2be2,brown:a52a2a,burlywood:deb887,cadetblue:5f9ea0,chartreuse:7fff00,chocolate:d2691e,coral:ff7f50,cornflowerblue:6495ed,cornsilk:fff8dc,crimson:dc143c,darkblue:00008b,darkcyan:008b8b,darkgoldenrod:b8860b,darkgray:a9a9a9,darkgreen:006400,darkkhaki:bdb76b,darkmagenta:8b008b,darkolivegreen:556b2f,darkorange:ff8c00,darkorchid:9932cc,darkred:8b0000,darksalmon:e9967a,darkseagreen:8fbc8f,darkslateblue:483d8b,darkslategray:2f4f4f,darkturquoise:00ced1,darkviolet:9400d3,deeppink:ff1493,deepskyblue:00bfff,dimgray:696969,dodgerblue:1e90ff,firebrick:b22222,floralwhite:fffaf0,forestgreen:228b22,fuchsia:ff00ff,gainsboro:dcdcdc,ghostwhite:f8f8ff,gold:ffd700,goldenrod:daa520,gray:808080,green:008000,greenyellow:adff2f,honeydew:f0fff0,hotpink:ff69b4,indianred:cd5c5c,indigo:4b0082,ivory:fffff0,khaki:f0e68c,lavender:e6e6fa,lavenderblush:fff0f5,lawngreen:7cfc00,lemonchiffon:fffacd,lightblue:add8e6,lightcoral:f08080,lightcyan:e0ffff,lightgoldenrodyellow:fafad2,lightgray:d3d3d3,lightgreen:90ee90,lightpink:ffb6c1,lightsalmon:ffa07a,lightseagreen:20b2aa,lightskyblue:87cefa,lightslategray:778899,lightsteelblue:b0c4de,lightyellow:ffffe0,lime:00ff00,limegreen:32cd32,linen:faf0e6,maroon:800000,mediumaquamarine:66cdaa,mediumblue:0000cd,mediumorchid:ba55d3,mediumpurple:9370db,mediumseagreen:3cb371,mediumslateblue:7b68ee,mediumspringgreen:00fa9a,mediumturquoise:48d1cc,mediumvioletred:c71585,midnightblue:191970,mintcream:f5fffa,mistyrose:ffe4e1,moccasin:ffe4b5,navajowhite:ffdead,navy:000080,oldlace:fdf5e6,olive:808000,olivedrab:6b8e23,orange:ffa500,orangered:ff4500,orchid:da70d6,palegoldenrod:eee8aa,palegreen:98fb98,paleturquoise:afeeee,palevioletred:db7093,papayawhip:ffefd5,peachpuff:ffdab9,peru:cd853f,pink:ffc0cb,plum:dda0dd,powderblue:b0e0e6,purple:800080,rebeccapurple:663399,red:ff0000,rosybrown:bc8f8f,royalblue:4169e1,saddlebrown:8b4513,salmon:fa8072,sandybrown:f4a460,seagreen:2e8b57,seashell:fff5ee,sienna:a0522d,silver:c0c0c0,skyblue:87ceeb,slateblue:6a5acd,slategray:708090,snow:fffafa,springgreen:00ff7f,steelblue:4682b4,tan:d2b48c,teal:008080,thistle:d8bfd8,tomato:ff6347,turquoise:40e0d0,violet:ee82ee,wheat:f5deb3,white:ffffff,whitesmoke:f5f5f5,yellow:ffff00,yellowgreen:9acd32'
    .split(',')
    .map((entry) => {
      const [name = '', hex = '000000'] = entry.split(':');
      return {
        name,
        rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb,
      };
    });

/** The closest CSS colour name (by a perceptually weighted distance). */
export function nearestName(rgb: Rgb): string {
  let best = NAMED[0]?.name ?? '';
  let bestDistance = Infinity;
  for (const { name, rgb: named } of NAMED) {
    const mean = (rgb[0] + named[0]) / 2;
    const [dr, dg, db] = [rgb[0] - named[0], rgb[1] - named[1], rgb[2] - named[2]];
    // "Redmean" weighting: cheap and close to how people judge colour difference.
    const distance = (2 + mean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - mean) / 256) * db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = name;
    }
  }
  return best;
}

export interface Swatch {
  rgb: Rgb;
  /** Share of the image, 0 to 1. */
  share: number;
}

/**
 * The image's main colours: k-means on up to `samples` evenly spaced opaque
 * pixels, seeded with k-means++ from a fixed seed so the same image always
 * gives the same palette. Sorted by how much of the image each covers.
 */
export function extractPalette(data: Uint8ClampedArray, count: number, samples = 40_000): Swatch[] {
  const total = data.length / 4;
  const step = Math.max(1, Math.floor(total / samples));
  const points: number[][] = [];
  for (let p = 0; p < total; p += step) {
    if ((data[p * 4 + 3] ?? 0) < 128) continue;
    points.push([data[p * 4] ?? 0, data[p * 4 + 1] ?? 0, data[p * 4 + 2] ?? 0]);
  }
  if (points.length === 0) return [];
  let seed = 12345;
  const random = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const dist = (a: number[], b: number[]): number =>
    ((a[0] ?? 0) - (b[0] ?? 0)) ** 2 +
    ((a[1] ?? 0) - (b[1] ?? 0)) ** 2 +
    ((a[2] ?? 0) - (b[2] ?? 0)) ** 2;
  const centres: number[][] = [points[Math.floor(random() * points.length)] ?? [0, 0, 0]];
  const nearest = points.map((p) => dist(p, centres[0] ?? p));
  while (centres.length < Math.min(count, points.length)) {
    const sum = nearest.reduce((a, b) => a + b, 0);
    if (sum === 0) break;
    let target = random() * sum;
    let index = 0;
    while (index < nearest.length - 1 && (target -= nearest[index] ?? 0) > 0) index += 1;
    const centre = points[index] ?? [0, 0, 0];
    centres.push([...centre]);
    points.forEach((p, i) => (nearest[i] = Math.min(nearest[i] ?? Infinity, dist(p, centre))));
  }
  const assignment = new Int32Array(points.length);
  for (let iteration = 0; iteration < 12; iteration += 1) {
    points.forEach((p, i) => {
      let best = 0;
      centres.forEach((c, k) => {
        if (dist(p, c) < dist(p, centres[best] ?? c)) best = k;
      });
      assignment[i] = best;
    });
    const sums = centres.map(() => [0, 0, 0, 0]);
    points.forEach((p, i) => {
      const s = sums[assignment[i] ?? 0] as number[];
      s[0] = (s[0] ?? 0) + (p[0] ?? 0);
      s[1] = (s[1] ?? 0) + (p[1] ?? 0);
      s[2] = (s[2] ?? 0) + (p[2] ?? 0);
      s[3] = (s[3] ?? 0) + 1;
    });
    sums.forEach((s, k) => {
      if ((s[3] ?? 0) > 0) centres[k] = [0, 1, 2].map((c) => (s[c] ?? 0) / (s[3] ?? 1));
    });
  }
  const counts = centres.map(() => 0);
  assignment.forEach((k) => (counts[k] = (counts[k] ?? 0) + 1));
  return centres
    .map((c, k) => ({
      rgb: c.map((v) => Math.round(v)) as unknown as Rgb,
      share: (counts[k] ?? 0) / points.length,
    }))
    .filter((swatch) => swatch.share > 0)
    .sort((a, b) => b.share - a.share);
}

export type ExportFormat = 'hex' | 'css' | 'tailwind' | 'json' | 'gpl';

/** A palette as text for design tools and code. */
export function exportPalette(swatches: readonly Swatch[], format: ExportFormat): string {
  const hexes = swatches.map((s) => toHex(s.rgb));
  switch (format) {
    case 'css':
      return `:root {\n${hexes.map((h, i) => `  --color-${i + 1}: ${h};`).join('\n')}\n}`;
    case 'tailwind':
      return `colors: {\n  palette: {\n${hexes.map((h, i) => `    ${(i + 1) * 100}: '${h}',`).join('\n')}\n  },\n},`;
    case 'json':
      return JSON.stringify(hexes, null, 2);
    case 'gpl':
      return [
        'GIMP Palette',
        'Name: NiftyFix palette',
        '#',
        ...swatches.map(
          (s, i) => `${s.rgb.map((v) => String(v).padStart(3)).join(' ')}\t${hexes[i]}`,
        ),
      ].join('\n');
    default:
      return hexes.join('\n');
  }
}
