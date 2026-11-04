/**
 * Tool search shared by the site's search box and command palette. Runs in the
 * browser over the index from `Registry.searchIndex()`, so it stays small and
 * dependency-free.
 *
 * Understands tool names and aliases ("merge pdf"), format pairs ("png to jpg")
 * and size intents ("photo under 50 kb" finds the 50 KB intent page).
 */
export interface SearchRecord {
  /** A built tool, an intent page (a tool opened with a preset) or a planned tool. */
  kind: 'tool' | 'intent' | 'planned';
  id: string;
  name: string;
  /** Absent for planned tools: they have no page until they work. */
  path?: string;
  category: string;
  /** Lower-case words to match, including the name. */
  terms: string;
}

/** Words that carry no meaning for finding a tool. */
const STOPWORDS = new Set(
  'a an the to for of in on my this that it is i me want need how can do make get under below less than max maximum upto up with into from file files online free'.split(
    ' ',
  ),
);

/** "50 kb", "50kb", "1.5 MB" → "50kb", "1.5mb", so sizes match intent slugs. */
const SIZE = /(\d+(?:\.\d+)?)\s*(kb|mb)\b/g;

export function queryTokens(query: string): string[] {
  const normalised = query
    .toLowerCase()
    .replace(SIZE, '$1$2')
    .replace(/[^\p{L}\p{N}.]+/gu, ' ');
  return [...new Set(normalised.split(' ').filter((word) => word && !STOPWORDS.has(word)))];
}

const words = (text: string): string[] => text.toLowerCase().split(/[^\p{L}\p{N}.]+/u);

/** A token matches a word it starts (prefix search while typing), or a size exactly. */
function matches(token: string, candidates: readonly string[]): boolean {
  const exact = /^\d/.test(token);
  return candidates.some((word) => (exact ? word === token : word.startsWith(token)));
}

const KIND_BONUS: Record<SearchRecord['kind'], number> = { tool: 2, intent: 1, planned: -2 };

/**
 * Best matches first. Records must match every meaningful word; if none do,
 * records matching the most words (at least half) are returned instead, so a
 * typo in one word still finds something.
 */
export function searchRecords(
  records: readonly SearchRecord[],
  query: string,
  limit = 8,
): SearchRecord[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return [];
  const scored = records.map((record) => {
    const nameWords = words(record.name);
    const termWords = words(record.terms);
    let hits = 0;
    let score = KIND_BONUS[record.kind];
    for (const token of tokens) {
      // A size in the query ("50kb") is a strong signal for the preset page of that size.
      if (record.kind === 'intent' && /^\d/.test(token) && matches(token, termWords)) score += 6;
      if (matches(token, nameWords)) {
        hits += 1;
        score += /^\d/.test(token) ? 8 : 3;
      } else if (matches(token, termWords)) {
        hits += 1;
        score += /^\d/.test(token) ? 6 : 1;
      }
    }
    return { record, hits, score };
  });
  const best = Math.max(...scored.map(({ hits }) => hits));
  // Partial matches must still cover at least half the words, so nonsense finds nothing.
  if (best === 0 || best < tokens.length / 2) return [];
  const required = best;
  return scored
    .filter(({ hits }) => hits >= required)
    .sort((a, b) => b.score - a.score || a.record.name.localeCompare(b.record.name))
    .slice(0, limit)
    .map(({ record }) => record);
}
