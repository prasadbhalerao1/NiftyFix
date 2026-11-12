import type { Matrix } from './content';

/**
 * Find pictures that the PDF stores as several pieces. Word, PowerPoint and
 * some scanners slice a picture into strips or tiles that are drawn edge to
 * edge; people want the whole picture back. Pieces join only when they are
 * drawn upright at the same scale, line up exactly and touch: side by side
 * with the same height, or stacked with the same width (rows first, so grids
 * join too).
 */

export interface Tile {
  key: string;
  /** Pixel size of the stored image. */
  width: number;
  height: number;
  /** Where it is drawn (unit square to page points). */
  matrix: Matrix;
}

export interface JoinedImage {
  width: number;
  height: number;
  /** Each piece and its top-left corner in the joined image, in pixels. */
  parts: { key: string; x: number; y: number }[];
}

interface Node extends JoinedImage {
  /** Page rectangle in points; y is the bottom edge (PDF space). */
  x: number;
  y: number;
  w: number;
  h: number;
}

const close = (a: number, b: number, tolerance: number): boolean => Math.abs(a - b) <= tolerance;
/** Half a pixel, so rounding in the producer never splits a picture. */
const tolerance = (a: Node, b: Node): number =>
  Math.max(0.02, 0.5 * Math.min(a.w / a.width, b.w / b.width, a.h / a.height, b.h / b.height));
const sameScale = (a: number, b: number): boolean => Math.abs(a - b) <= 0.01 * Math.max(a, b);

function sideBySide(left: Node, right: Node): Node | null {
  const t = tolerance(left, right);
  if (
    !close(left.y, right.y, t) ||
    !close(left.h, right.h, t) ||
    left.height !== right.height ||
    !close(left.x + left.w, right.x, t) ||
    !sameScale(left.w / left.width, right.w / right.width)
  ) {
    return null;
  }
  return {
    x: left.x,
    y: left.y,
    w: right.x + right.w - left.x,
    h: left.h,
    width: left.width + right.width,
    height: left.height,
    parts: [...left.parts, ...right.parts.map((p) => ({ ...p, x: p.x + left.width }))],
  };
}

function stacked(top: Node, bottom: Node): Node | null {
  const t = tolerance(top, bottom);
  if (
    !close(top.x, bottom.x, t) ||
    !close(top.w, bottom.w, t) ||
    top.width !== bottom.width ||
    !close(bottom.y + bottom.h, top.y, t) ||
    !sameScale(top.h / top.height, bottom.h / bottom.height)
  ) {
    return null;
  }
  return {
    x: top.x,
    y: bottom.y,
    w: top.w,
    h: top.y + top.h - bottom.y,
    width: top.width,
    height: top.height + bottom.height,
    parts: [...top.parts, ...bottom.parts.map((p) => ({ ...p, y: p.y + top.height }))],
  };
}

/** Repeatedly join any two nodes that `join` accepts, until none do. */
function joinAll(nodes: Node[], join: (a: Node, b: Node) => Node | null): Node[] {
  const out = [...nodes];
  for (let changed = true; changed;) {
    changed = false;
    for (let i = 0; i < out.length && !changed; i += 1) {
      for (let j = 0; j < out.length && !changed; j += 1) {
        if (i === j) continue;
        const joined = join(out[i] as Node, out[j] as Node);
        if (joined) {
          out.splice(Math.max(i, j), 1);
          out.splice(Math.min(i, j), 1, joined);
          changed = true;
        }
      }
    }
  }
  return out;
}

/** Groups of two or more tiles that form one picture. Tiles drawn rotated, flipped or skewed never join. */
export function joinStrips(tiles: readonly Tile[]): JoinedImage[] {
  const upright: Node[] = tiles
    .filter(({ matrix: [a, b, c, d] }) => a > 0 && d > 0 && b === 0 && c === 0)
    .map(({ key, width, height, matrix }) => ({
      x: matrix[4],
      y: matrix[5],
      w: matrix[0],
      h: matrix[3],
      width,
      height,
      parts: [{ key, x: 0, y: 0 }],
    }));
  return joinAll(joinAll(upright, sideBySide), stacked)
    .filter((node) => node.parts.length > 1)
    .map(({ width, height, parts }) => ({ width, height, parts }));
}
