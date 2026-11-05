import { describe, expect, it } from 'vitest';
import { repeatedWords, textStats } from './stats';

describe('textStats', () => {
  it('counts words, characters, sentences, paragraphs and lines', () => {
    const stats = textStats('Hello world. This is a test!\n\nSecond paragraph here.');
    expect(stats).toMatchObject({
      words: 9,
      sentences: 3,
      paragraphs: 2,
      lines: 2,
      characters: 52,
      charactersNoSpaces: 43,
    });
  });

  it('counts Hindi letters as a reader sees them', () => {
    // "क्षि" is four code points but one character on screen.
    expect(textStats('क्षि').characters).toBe(1);
    expect(textStats('नमस्ते दुनिया').words).toBe(2);
  });

  it('counts words between spaces, and splits scripts written without spaces', () => {
    expect(textStats('e-mail test! & 2026').words).toBe(3);
    expect(textStats('東京都に住んでいます').words).toBeGreaterThan(1);
  });

  it('gives reading and speaking time, rounded up, and zeros for empty text', () => {
    expect(textStats('word '.repeat(201))).toMatchObject({ readingMinutes: 2, speakingMinutes: 2 });
    expect(textStats('   \n ')).toMatchObject({
      words: 0,
      paragraphs: 0,
      lines: 0,
      readingMinutes: 0,
    });
  });
});

describe('repeatedWords', () => {
  it('lists repeated words, most frequent first, without common words', () => {
    const text = 'The project was a great project. A great team made the project great; the end.';
    expect(repeatedWords(text)).toEqual([
      { word: 'great', count: 3 },
      { word: 'project', count: 3 },
    ]);
  });

  it('works for Hindi', () => {
    expect(repeatedWords('भारत महान है। भारत सुंदर है।')).toEqual([{ word: 'भारत', count: 2 }]);
  });
});
