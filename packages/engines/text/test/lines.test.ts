import { describe, expect, it } from 'vitest';
import { compareLines, lineStats, normaliseJson, unifiedPatch } from '../src';

const exact = { ignoreCase: false, ignoreWhitespace: false };

describe('compareLines', () => {
  it('pairs changed lines with word highlights, and keeps line numbers', () => {
    const rows = compareLines('a\nprice: 100\nc', 'a\nprice: 120\nc\nd', exact);
    expect(rows.map((r) => r.type)).toEqual(['equal', 'change', 'equal', 'insert']);
    expect(rows[1]?.left?.parts).toEqual([
      { op: 'equal', text: 'price: ' },
      { op: 'delete', text: '100' },
    ]);
    expect(rows[1]?.right?.parts.at(-1)).toEqual({ op: 'insert', text: '120' });
    expect(rows[3]?.right).toMatchObject({ line: 4, text: 'd' });
    expect(lineStats(rows)).toEqual({ added: 1, removed: 0, changed: 1 });
  });

  it('can ignore case and whitespace', () => {
    const rows = compareLines('Hello   World', 'hello world', {
      ignoreCase: true,
      ignoreWhitespace: true,
    });
    expect(rows.map((r) => r.type)).toEqual(['equal']);
    expect(compareLines('Hello', 'hello', exact)[0]?.type).toBe('change');
  });
});

describe('unifiedPatch', () => {
  it('writes hunks like diff -u', () => {
    const rows = compareLines('1\n2\n3\n4\n5\n6\n7\n8\n9', '1\n2\n3\n4\nFIVE\n6\n7\n8\n9', exact);
    expect(unifiedPatch(rows, ['a.txt', 'b.txt'])).toBe(
      [
        '--- a.txt',
        '+++ b.txt',
        '@@ -2,7 +2,7 @@',
        ' 2',
        ' 3',
        ' 4',
        '-5',
        '+FIVE',
        ' 6',
        ' 7',
        ' 8',
        '',
      ].join('\n'),
    );
    expect(unifiedPatch(compareLines('x', 'x', exact), ['a', 'b'])).toBe('');
  });
});

describe('normaliseJson', () => {
  it('sorts keys and formats, so only real differences remain', () => {
    expect(normaliseJson('{"b":1,"a":{"d":2,"c":3}}')).toEqual({
      ok: true,
      text: '{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}',
    });
    expect(normaliseJson('{bad')).toMatchObject({ ok: false });
  });
});
