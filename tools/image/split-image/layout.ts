/**
 * Where each tile comes from and how big it is saved. Pure, so the preview
 * grid and the processor cut exactly the same pieces.
 */
export type Mode = 'grid' | 'instagram' | 'carousel' | 'poster';
export type Shape = '1:1' | '4:5' | '3:4';

export interface LayoutOptions {
  mode: Mode;
  rows: number;
  cols: number;
  shape: Shape;
  /** Poster: overlap between neighbouring pages, as a fraction of a tile (0 to 0.2). */
  overlap: number;
}

export interface Tile {
  /** Source rectangle in image pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Saved size in pixels. */
  outWidth: number;
  outHeight: number;
  row: number;
  col: number;
  /** 1-based order to post or print it in. */
  order: number;
}

/** Instagram and carousel tiles are saved 1080 px wide, the size Instagram shows. */
export const POST_WIDTH = 1080;
const SHAPES: Record<Shape, number> = { '1:1': 1, '4:5': 4 / 5, '3:4': 3 / 4 };

/** The grid's rows and columns for a mode (Instagram is always 3 wide, a carousel 1 high). */
export function gridOf(options: LayoutOptions): { rows: number; cols: number } {
  if (options.mode === 'instagram') return { rows: options.rows, cols: 3 };
  if (options.mode === 'carousel') return { rows: 1, cols: options.cols };
  return { rows: options.rows, cols: options.cols };
}

/** The centred area of the image the tiles cover: all of it, or the largest area in the needed shape. */
export function coverArea(
  image: { width: number; height: number },
  options: LayoutOptions,
): { x: number; y: number; width: number; height: number } {
  if (options.mode === 'grid' || options.mode === 'poster') {
    return { x: 0, y: 0, width: image.width, height: image.height };
  }
  const { rows, cols } = gridOf(options);
  const aspect = (cols * (SHAPES[options.shape] ?? 1)) / rows;
  const width = Math.min(image.width, image.height * aspect);
  const height = width / aspect;
  return { x: (image.width - width) / 2, y: (image.height - height) / 2, width, height };
}

export function planTiles(
  image: { width: number; height: number },
  options: LayoutOptions,
): Tile[] {
  const { rows, cols } = gridOf(options);
  const area = coverArea(image, options);
  const tiles: Tile[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      // Edges on whole pixels, so neighbouring tiles meet with no gap or overlap.
      const left = Math.round(area.x + (area.width * col) / cols);
      const right = Math.round(area.x + (area.width * (col + 1)) / cols);
      const top = Math.round(area.y + (area.height * row) / rows);
      const bottom = Math.round(area.y + (area.height * (row + 1)) / rows);
      let x = left;
      let y = top;
      let width = right - left;
      let height = bottom - top;
      if (options.mode === 'poster' && options.overlap > 0) {
        // Each page repeats a strip of its neighbours, for gluing or taping.
        const extraX = Math.round(width * options.overlap);
        const extraY = Math.round(height * options.overlap);
        x = Math.max(0, x - (col > 0 ? extraX : 0));
        y = Math.max(0, y - (row > 0 ? extraY : 0));
        width = Math.min(image.width, right + (col < cols - 1 ? extraX : 0)) - x;
        height = Math.min(image.height, bottom + (row < rows - 1 ? extraY : 0)) - y;
      }
      const post = options.mode === 'instagram' || options.mode === 'carousel';
      const outWidth = post ? POST_WIDTH : width;
      const outHeight = post ? Math.round(POST_WIDTH / (SHAPES[options.shape] ?? 1)) : height;
      // Instagram shows the newest post first: post the bottom-right tile first.
      const order =
        options.mode === 'instagram' ? rows * cols - (row * cols + col) : row * cols + col + 1;
      tiles.push({ x, y, width, height, outWidth, outHeight, row, col, order });
    }
  }
  return tiles;
}
