import { describe, expect, it } from 'vitest';
import { processLines, type LineOptions } from '../src';

const none: LineOptions = {
  trim: false,
  removeEmpty: false,
  removeDuplicates: false,
  ignoreCase: false,
  sort: 'none',
  reverse: false,
  number: false,
};

describe('processLines', () => {
  it('removes duplicates keeping the first, optionally ignoring case', () => {
    const input = 'apple\nBanana\napple\nbanana\n\ncherry';
    expect(processLines(input, { ...none, removeDuplicates: true })).toMatchObject({
      text: 'apple\nBanana\nbanana\n\ncherry',
      duplicates: 1,
    });
    expect(
      processLines(input, { ...none, removeDuplicates: true, ignoreCase: true, removeEmpty: true }),
    ).toEqual({
      text: 'apple\nBanana\ncherry',
      before: 6,
      after: 3,
      duplicates: 2,
      empty: 1,
    });
  });

  it('sorts alphabetically, naturally and by length', () => {
    const items = 'item 10\nitem 2\nItem 1';
    expect(processLines(items, { ...none, sort: 'az', ignoreCase: true }).text).toBe(
      'Item 1\nitem 10\nitem 2',
    );
    expect(processLines(items, { ...none, sort: 'natural' }).text).toBe('Item 1\nitem 2\nitem 10');
    expect(processLines('ccc\na\nbb', { ...none, sort: 'length' }).text).toBe('a\nbb\nccc');
    expect(processLines('a\nb\nc', { ...none, sort: 'za' }).text).toBe('c\nb\na');
  });

  it('shuffles reproducibly for a seed, reverses and numbers', () => {
    const list = Array.from({ length: 10 }, (_, i) => String(i)).join('\n');
    const once = processLines(list, { ...none, sort: 'shuffle' }, 7).text;
    expect(processLines(list, { ...none, sort: 'shuffle' }, 7).text).toBe(once);
    expect(once.split('\n').sort()).toEqual(list.split('\n').sort());
    expect(processLines('a\nb', { ...none, reverse: true, number: true }).text).toBe('1. b\n2. a');
    expect(processLines('  x  ', { ...none, trim: true }).text).toBe('x');
  });
});
