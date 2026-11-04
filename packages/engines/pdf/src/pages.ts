import { ToolError } from '@niftyfix/tool-sdk';

/**
 * Page selections typed by users, e.g. "1-3, 5, 8-". Pages are 1-based in
 * text and 0-based in results. Pure functions; no PDF library involved.
 */

export type RangeResult = { ok: true; pages: number[] } | { ok: false; error: string };

const PART = /^(\d*)\s*(?:-\s*(\d*))?$/;

/**
 * Parse one selection into page indices, in the order typed. "3-" means page
 * 3 to the end, "-4" means 1 to 4. Duplicates are kept only if `allowRepeat`.
 */
export function parsePageRange(
  text: string,
  pageCount: number,
  { allowRepeat = false }: { allowRepeat?: boolean } = {},
): RangeResult {
  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  if (parts.length === 0) return { ok: false, error: 'Enter at least one page, e.g. 1-3, 5.' };
  const pages: number[] = [];
  const seen = new Set<number>();
  for (const part of parts) {
    const match = PART.exec(part);
    if (!match || (match[1] === '' && match[2] === undefined)) {
      return { ok: false, error: `"${part}" is not a page or range. Use e.g. 2 or 4-7.` };
    }
    const isRange = part.includes('-');
    const from = match[1] === '' ? 1 : Number(match[1]);
    const to = isRange
      ? match[2] === '' || match[2] === undefined
        ? pageCount
        : Number(match[2])
      : from;
    if (from < 1 || to < 1) return { ok: false, error: 'Pages start at 1.' };
    if (from > pageCount || to > pageCount) {
      return {
        ok: false,
        error: `"${part}" goes past the last page. This PDF has ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
      };
    }
    if (from > to)
      return { ok: false, error: `"${part}" runs backwards. Write it as ${to}-${from}.` };
    for (let page = from; page <= to; page += 1) {
      if (!allowRepeat && seen.has(page)) continue;
      seen.add(page);
      pages.push(page - 1);
    }
  }
  return { ok: true, pages };
}

/**
 * Check only the form of a selection, before the page count is known (in the
 * UI). Bounds are checked against the real document by `parsePageRange`.
 */
export function pageRangeSyntaxError(text: string): string | null {
  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  if (parts.length === 0) return 'Enter at least one page, e.g. 1-3, 5.';
  for (const part of parts) {
    const match = PART.exec(part);
    if (!match || (match[1] === '' && match[2] === undefined)) {
      return `"${part}" is not a page or range. Use e.g. 2 or 4-7.`;
    }
    const from = match[1] === '' ? 1 : Number(match[1]);
    const to = match[2] === undefined || match[2] === '' ? Infinity : Number(match[2]);
    if (from < 1 || to < 1) return 'Pages start at 1.';
    if (part.includes('-') && from > to)
      return `"${part}" runs backwards. Write it as ${to}-${from}.`;
  }
  return null;
}

/** Pages 1, 2, … n as indices. */
export const allPages = (pageCount: number): number[] =>
  Array.from({ length: pageCount }, (_, index) => index);

/** Split points for "split every N pages". */
export function chunkPages(pageCount: number, size: number): number[][] {
  const chunks: number[][] = [];
  for (let start = 0; start < pageCount; start += size) {
    chunks.push(allPages(pageCount).slice(start, start + size));
  }
  return chunks;
}

/** "1-3, 5" style label for a sorted or unsorted list of indices. */
export function describePages(indices: readonly number[]): string {
  const parts: string[] = [];
  let start = -1;
  let previous = -2;
  const flush = (): void => {
    if (start < 0) return;
    parts.push(start === previous ? `${start + 1}` : `${start + 1}-${previous + 1}`);
  };
  for (const index of indices) {
    if (index === previous + 1) {
      previous = index;
      continue;
    }
    flush();
    start = index;
    previous = index;
  }
  flush();
  return parts.join(', ');
}

/**
 * Resolve a page selection against the real document. Out-of-range or
 * malformed selections become an INVALID_OPTIONS error with the exact reason
 * ("This PDF has 10 pages"), shown to the user next to a retry button.
 */
export function selectPages(
  selection: { mode: 'all' | 'custom'; ranges: string },
  pageCount: number,
  { allowRepeat = false }: { allowRepeat?: boolean } = {},
): number[] {
  if (selection.mode === 'all') return allPages(pageCount);
  const result = parsePageRange(selection.ranges, pageCount, { allowRepeat });
  if (!result.ok) throw new ToolError('INVALID_OPTIONS', result.error);
  return result.pages;
}
