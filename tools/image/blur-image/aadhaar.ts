/**
 * Find Aadhaar numbers in OCR output: three groups of four digits on one line
 * (a 16-digit Virtual ID is four groups). Boxes cover the first eight digits,
 * as UIDAI's own masked Aadhaar does, or the whole number.
 */
export interface WordBox {
  text: string;
  box: { x0: number; y0: number; x1: number; y1: number };
}

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GROUP = /^\d{4}$/;

export function findAadhaarNumbers(
  lines: readonly { words: readonly WordBox[] }[],
  cover: 'first8' | 'all',
): Area[] {
  const areas: Area[] = [];
  for (const { words } of lines) {
    // OCR sometimes leaves stray punctuation on a group: keep digits only.
    const digits = words.map((word) => word.text.replace(/[^\d]/g, ''));
    for (let i = 0; i + 2 < words.length; i += 1) {
      if (![0, 1, 2].every((k) => GROUP.test(digits[i + k] ?? ''))) continue;
      if (i > 0 && GROUP.test(digits[i - 1] ?? '')) continue;
      const groups = GROUP.test(digits[i + 3] ?? '') ? 4 : 3;
      const covered = words.slice(i, i + (cover === 'all' ? groups : groups - 1));
      const x0 = Math.min(...covered.map((w) => w.box.x0));
      const y0 = Math.min(...covered.map((w) => w.box.y0));
      const x1 = Math.max(...covered.map((w) => w.box.x1));
      const y1 = Math.max(...covered.map((w) => w.box.y1));
      // A little margin so no edge of a digit shows.
      const pad = (y1 - y0) * 0.2;
      areas.push({ x: x0 - pad, y: y0 - pad, width: x1 - x0 + 2 * pad, height: y1 - y0 + 2 * pad });
      i += groups - 1;
    }
  }
  return areas;
}
