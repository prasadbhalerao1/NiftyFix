import { describe, expect, it } from 'vitest';
import { cleanText, repeatText, type CleanOptions } from '../src';

const none: CleanOptions = {
  joinLines: false,
  removeAllBreaks: false,
  collapseSpaces: false,
  trimLines: false,
  removeEmptyLines: false,
  plainPunctuation: false,
  stripHtml: false,
  removeEmoji: false,
  removeInvisible: false,
};
const c = (...codes: number[]): string => String.fromCharCode(...codes);

describe('cleanText', () => {
  it('joins lines broken mid-sentence but keeps paragraphs, mending hyphenated words', () => {
    const pdf = 'This is a sen-\ntence copied\nfrom a PDF.\n\nNext paragraph\nhere.';
    expect(cleanText(pdf, { ...none, joinLines: true })).toBe(
      'This is a sentence copied from a PDF.\n\nNext paragraph here.',
    );
    expect(cleanText('a\nb\n\nc', { ...none, removeAllBreaks: true })).toBe('a b c');
  });

  it('collapses spaces, trims lines and removes empty lines', () => {
    expect(
      cleanText('  a   b  \n\n\n  c ', {
        ...none,
        collapseSpaces: true,
        trimLines: true,
        removeEmptyLines: true,
      }),
    ).toBe('a b\nc');
  });

  it('turns curly quotes, long dashes and ellipses into keyboard characters', () => {
    const fancy = `${c(0x201c)}Hi${c(0x201d)} ${c(0x2014)} it${c(0x2019)}s ok${c(0x2026)}`;
    expect(cleanText(fancy, { ...none, plainPunctuation: true })).toBe('"Hi" - it\'s ok...');
  });

  it('strips HTML, emoji and invisible characters', () => {
    expect(
      cleanText('<p>Tom &amp; Jerry</p><script>x()</script><br>end', { ...none, stripHtml: true }),
    ).toBe('Tom & Jerry\n\nend');
    expect(cleanText(`ok${c(0xd83d, 0xde00)} done`, { ...none, removeEmoji: true })).toBe(
      'ok done',
    );
    expect(cleanText(`zero${c(0x200b)}width`, { ...none, removeInvisible: true })).toBe(
      'zerowidth',
    );
  });
});

describe('repeatText', () => {
  it('repeats with separators and numbers', () => {
    expect(repeatText('hi', 3, 'newline')).toBe('hi\nhi\nhi');
    expect(repeatText('hi', 2, 'comma')).toBe('hi, hi');
    expect(repeatText('hi', 2, 'custom', ' | ', true)).toBe('1. hi | 2. hi');
    expect(repeatText('hi', -5, 'space')).toBe('');
  });
});
