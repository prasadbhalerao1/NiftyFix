import { describe, expect, it } from 'vitest';
import { diffSequences, diffText, pixelDiff, summarise } from './diff';

describe('diffSequences', () => {
  it('finds the shortest edit', () => {
    const ops = diffSequences([...'ABCABBA'], [...'CBABAC']);
    const kept = ops?.filter((o) => o.op === 'equal').length;
    expect(kept).toBe(4);
    // Applying the script to A gives B.
    expect(
      ops
        ?.filter((o) => o.op !== 'delete')
        .map((o) => o.item)
        .join(''),
    ).toBe('CBABAC');
    expect(
      ops
        ?.filter((o) => o.op !== 'insert')
        .map((o) => o.item)
        .join(''),
    ).toBe('ABCABBA');
  });

  it('gives up past the edit limit instead of running away', () => {
    expect(diffSequences([...'abcd'], [...'wxyz'], 2)).toBeNull();
  });
});

describe('diffText', () => {
  it('marks changed words inside a changed line, keeping the rest equal', () => {
    const parts = diffText(
      'Rent is 15000 per month.\nDeposit two months.\n',
      'Rent is 18000 per month.\nDeposit two months.\n',
    );
    expect(parts).toEqual([
      { op: 'equal', text: 'Rent is ' },
      { op: 'delete', text: '15000 ' },
      { op: 'insert', text: '18000 ' },
      { op: 'equal', text: 'per month.\nDeposit two months.\n' },
    ]);
    expect(summarise(parts)).toEqual({ added: 1, removed: 1, unchanged: 7 });
  });

  it('handles added and removed lines', () => {
    const parts = diffText('one\ntwo\n', 'one\ntwo\nthree\n');
    expect(parts.at(-1)).toEqual({ op: 'insert', text: 'three\n' });
    expect(diffText('same', 'same')).toEqual([{ op: 'equal', text: 'same' }]);
  });
});

describe('pixelDiff', () => {
  it('counts and marks the pixels that differ', () => {
    const a = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
    const b = new Uint8ClampedArray([255, 255, 255, 255, 200, 200, 200, 255]);
    const out = new Uint8ClampedArray(8);
    expect(pixelDiff(a, b, out)).toBe(0.5);
    expect([...out.slice(4)]).toEqual([234, 88, 12, 255]);
    expect(out[0]).toBe(255);
  });
});
