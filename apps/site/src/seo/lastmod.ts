import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Last-change dates for the sitemap, from git history: the date of the last
 * commit that touched the given paths. Google uses <lastmod> only when it is
 * consistently accurate, so a build without full history (a shallow CI
 * checkout, no git) gives no dates at all rather than wrong ones.
 */
const ROOT = resolve(process.cwd(), '../..');

const git = (args: string[]): string | null => {
  try {
    return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
};

const reliable = git(['rev-parse', '--is-shallow-repository']) === 'false';
const cache = new Map<string, string | null>();

/** YYYY-MM-DD of the last commit touching any of `paths` (relative to the repo root). */
export function lastChanged(paths: readonly string[]): string | null {
  if (!reliable) return null;
  const key = paths.join('\n');
  if (!cache.has(key)) {
    const date = git(['log', '-1', '--format=%cs', '--', ...paths]);
    cache.set(key, date || null);
  }
  return cache.get(key) ?? null;
}

/** The newest of several dates (ISO dates compare as strings). */
export const newest = (dates: readonly (string | null)[]): string | null =>
  dates.reduce<string | null>((max, date) => (date && (!max || date > max) ? date : max), null);
