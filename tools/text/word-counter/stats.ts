/**
 * Text statistics that work for every script. Characters are counted as a reader
 * sees them (Intl.Segmenter graphemes), so "क्षि" is one character. Words are
 * counted between spaces, as word processors do, which gives the same answer in
 * every browser; only scripts written without spaces (Chinese, Japanese, Thai...)
 * use the browser's word splitter.
 */
export interface TextStats {
  words: number;
  /** User-perceived characters (grapheme clusters), including spaces. */
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  /** Minutes, rounded up; 0 for empty text. */
  readingMinutes: number;
  speakingMinutes: number;
}

/** Typical adult reading and speaking speeds, in words per minute. */
export const READING_WPM = 200;
export const SPEAKING_WPM = 130;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });

const count = <T>(items: Iterable<T>, keep: (item: T) => boolean = () => true): number => {
  let n = 0;
  for (const item of items) if (keep(item)) n += 1;
  return n;
};

/** Scripts written without spaces between words. */
const NO_SPACES =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
const HAS_LETTER = /[\p{L}\p{N}]/u;

function countWords(text: string): number {
  let words = 0;
  for (const token of text.split(/\s+/u)) {
    if (!HAS_LETTER.test(token)) continue;
    words += NO_SPACES.test(token)
      ? count(
          wordSegmenter.segment(token),
          (s) => s.isWordLike === true || HAS_LETTER.test(s.segment),
        )
      : 1;
  }
  return words;
}

export function textStats(text: string): TextStats {
  const characters = count(graphemes.segment(text));
  const charactersNoSpaces = count(graphemes.segment(text), (s) => !/^\s+$/u.test(s.segment));
  const words = countWords(text);
  const sentences = count(sentenceSegmenter.segment(text), (s) => /[\p{L}\p{N}]/u.test(s.segment));
  const trimmed = text.trim();
  const paragraphs = trimmed === '' ? 0 : trimmed.split(/\n\s*\n/u).length;
  const lines = trimmed === '' ? 0 : text.split('\n').filter((line) => line.trim() !== '').length;
  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingMinutes: words === 0 ? 0 : Math.ceil(words / READING_WPM),
    speakingMinutes: words === 0 ? 0 : Math.ceil(words / SPEAKING_WPM),
  };
}

/** Common limits people check text against. */
export const LIMITS = [
  { label: 'X (Twitter) post', max: 280, unit: 'characters' },
  { label: 'Instagram caption', max: 2200, unit: 'characters' },
  { label: 'Meta description (search result)', max: 160, unit: 'characters' },
  { label: 'SMS message', max: 160, unit: 'characters' },
] as const;

/** Very common words left out of "most repeated", in English and Hindi. */
const COMMON = new Set(
  (
    'a an and are as at be but by for from has have he her his i if in is it its me my not of on or our ' +
    'she so that the their them they this to was we were what which who will with you your ' +
    'है हैं के की का को में से और पर भी यह वह एक था थी थे तो ही ने कि लिए हो'
  ).split(' '),
);

/** Words used more than once, most frequent first (ignoring case and very common words). */
export function repeatedWords(text: string, limit = 8): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLocaleLowerCase().split(/[^\p{L}\p{M}\p{N}']+/u)) {
    const word = raw.replace(/^'+|'+$/gu, '');
    if (word.length < 2 || COMMON.has(word) || /^\p{N}+$/u.test(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
