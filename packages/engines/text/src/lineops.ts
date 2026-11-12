/**
 * Line operations for lists: trim, drop empty lines, remove duplicates,
 * sort, reverse, shuffle and number. Applied in a fixed, predictable order.
 */
export type SortOrder = 'none' | 'az' | 'za' | 'natural' | 'length' | 'shuffle';

export interface LineOptions {
  trim: boolean;
  removeEmpty: boolean;
  removeDuplicates: boolean;
  /** Duplicates and sorting ignore upper/lower case. */
  ignoreCase: boolean;
  sort: SortOrder;
  reverse: boolean;
  number: boolean;
}

export interface LineResult {
  text: string;
  before: number;
  after: number;
  duplicates: number;
  empty: number;
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
const natural = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** A small seeded shuffle, so "Shuffle" gives a new order each time it is pressed but tests are stable. */
function shuffle<T>(items: T[], seed: number): T[] {
  let state = seed || 1;
  const random = (): number => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j] as T, items[i] as T];
  }
  return items;
}

export function processLines(input: string, options: LineOptions, seed = 1): LineResult {
  let lines = input === '' ? [] : input.replace(/\r\n?/g, '\n').split('\n');
  const before = lines.length;
  if (options.trim) lines = lines.map((line) => line.trim());
  let empty = 0;
  if (options.removeEmpty) {
    const kept = lines.filter((line) => line.trim() !== '');
    empty = lines.length - kept.length;
    lines = kept;
  }
  let duplicates = 0;
  if (options.removeDuplicates) {
    const seen = new Set<string>();
    const kept: string[] = [];
    for (const line of lines) {
      const key = options.ignoreCase ? line.toLowerCase() : line;
      if (seen.has(key)) duplicates += 1;
      else {
        seen.add(key);
        kept.push(line);
      }
    }
    lines = kept;
  }
  const compare = options.ignoreCase
    ? (a: string, b: string) => collator.compare(a, b)
    : (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  switch (options.sort) {
    case 'az':
      lines = [...lines].sort(compare);
      break;
    case 'za':
      lines = [...lines].sort((a, b) => compare(b, a));
      break;
    case 'natural':
      lines = [...lines].sort((a, b) => natural.compare(a, b));
      break;
    case 'length':
      lines = [...lines].sort((a, b) => a.length - b.length || compare(a, b));
      break;
    case 'shuffle':
      lines = shuffle([...lines], seed);
      break;
    default:
      break;
  }
  if (options.reverse) lines = [...lines].reverse();
  if (options.number) {
    const width = String(lines.length).length;
    lines = lines.map((line, i) => `${String(i + 1).padStart(width, ' ')}. ${line}`);
  }
  return { text: lines.join('\n'), before, after: lines.length, duplicates, empty };
}
