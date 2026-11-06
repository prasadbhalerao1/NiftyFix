import type { CombineImagesOptions } from './options';

export interface Size {
  width: number;
  height: number;
}

export interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layout {
  width: number;
  height: number;
  /** One per input image, in order. */
  placements: Placement[];
  /** Below 1 when the result was shrunk to stay inside the canvas limit. */
  scale: number;
}

/**
 * Largest canvas we draw: Safari on iPhone refuses canvases over 16.7 million
 * pixels, and no side may exceed 16,384 px in any browser.
 */
export const MAX_CANVAS_PIXELS = 16_000_000;
export const MAX_CANVAS_SIDE = 16_000;

/** A4 at 300 DPI, and an ID-1 card (Aadhaar, PAN, driving licence): 85.6 × 53.98 mm. */
export const PRINT_DPI = 300;
const mm = (value: number): number => Math.round((value / 25.4) * PRINT_DPI);
const A4 = { width: mm(210), height: mm(297) };
const CARD = { width: mm(85.6), height: mm(53.98) };

/** Scale `size` to fit inside `box` without stretching, centred in it. */
function contain(size: Size, box: Placement): Placement {
  const scale = Math.min(box.width / size.width, box.height / size.height);
  const width = Math.max(1, Math.round(size.width * scale));
  const height = Math.max(1, Math.round(size.height * scale));
  return {
    x: box.x + Math.round((box.width - width) / 2),
    y: box.y + Math.round((box.height - height) / 2),
    width,
    height,
  };
}

/** Cards in one centred column (two columns past four cards), from the top of an A4 page. */
function idCardsOnA4(sizes: readonly Size[]): Layout {
  const columns = sizes.length > 4 ? 2 : 1;
  const gap = mm(10);
  const left = Math.round((A4.width - (columns * CARD.width + (columns - 1) * gap)) / 2);
  const placements = sizes.map((size, index) =>
    contain(size, {
      x: left + (index % columns) * (CARD.width + gap),
      y: mm(20) + Math.floor(index / columns) * (CARD.height + gap),
      width: CARD.width,
      height: CARD.height,
    }),
  );
  return { width: A4.width, height: A4.height, placements, scale: 1 };
}

/**
 * Where each image goes. Images are matched to the narrowest (vertical) or
 * shortest (horizontal) one, so nothing is enlarged and the edges line up; a
 * grid uses equal cells sized to the smallest image.
 */
export function planLayout(
  sizes: readonly Size[],
  options: Pick<CombineImagesOptions, 'arrangement' | 'columns' | 'gap'>,
): Layout {
  if (options.arrangement === 'id-a4') return idCardsOnA4(sizes);
  const { gap } = options;
  let width = 0;
  let height = 0;
  let placements: Placement[];

  if (options.arrangement === 'vertical') {
    width = Math.min(...sizes.map((size) => size.width));
    placements = sizes.map((size) => {
      const placed = {
        x: 0,
        y: height,
        width,
        height: Math.round((size.height * width) / size.width),
      };
      height += placed.height + gap;
      return placed;
    });
    height -= gap;
  } else if (options.arrangement === 'horizontal') {
    height = Math.min(...sizes.map((size) => size.height));
    placements = sizes.map((size) => {
      const placed = {
        x: width,
        y: 0,
        width: Math.round((size.width * height) / size.height),
        height,
      };
      width += placed.width + gap;
      return placed;
    });
    width -= gap;
  } else {
    const columns = Math.min(options.columns, sizes.length);
    const rows = Math.ceil(sizes.length / columns);
    const cell = {
      width: Math.min(...sizes.map((size) => size.width)),
      height: Math.min(...sizes.map((size) => size.height)),
    };
    width = columns * cell.width + (columns - 1) * gap;
    height = rows * cell.height + (rows - 1) * gap;
    placements = sizes.map((size, index) =>
      contain(size, {
        x: (index % columns) * (cell.width + gap),
        y: Math.floor(index / columns) * (cell.height + gap),
        width: cell.width,
        height: cell.height,
      }),
    );
  }

  const scale = Math.min(
    1,
    Math.sqrt(MAX_CANVAS_PIXELS / (width * height)),
    MAX_CANVAS_SIDE / Math.max(width, height),
  );
  if (scale === 1) return { width, height, placements, scale };
  const shrink = (value: number): number => Math.round(value * scale);
  return {
    width: Math.max(1, shrink(width)),
    height: Math.max(1, shrink(height)),
    placements: placements.map((placed) => ({
      x: shrink(placed.x),
      y: shrink(placed.y),
      width: Math.max(1, shrink(placed.width)),
      height: Math.max(1, shrink(placed.height)),
    })),
    scale,
  };
}
