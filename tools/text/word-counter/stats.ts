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
