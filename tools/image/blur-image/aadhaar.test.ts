import { describe, expect, it } from 'vitest';
import { findAadhaarNumbers, type WordBox } from './aadhaar';

/** Words laid out left to right, 50 px apart, 20 px tall. */
const line = (...texts: string[]): { words: WordBox[] } => ({
  words: texts.map((text, i) => ({ text, box: { x0: i * 50, y0: 100, x1: i * 50 + 40, y1: 120 } })),
});

describe('findAadhaarNumbers', () => {
  it('covers the first eight digits by default, like UIDAI masked Aadhaar', () => {
    const [area] = findAadhaarNumbers([line('Aadhaar:', '1234', '5678', '9012')], 'first8');
    // Groups 1 and 2 (x 50 to 140) with a 4 px margin.
    expect(area).toEqual({ x: 46, y: 96, width: 98, height: 28 });
  });

  it('covers the whole number, and Virtual IDs too', () => {
    expect(findAadhaarNumbers([line('1234', '5678', '9012')], 'all')[0]?.width).toBe(148);
    expect(findAadhaarNumbers([line('VID', '1234', '5678', '9012', '3456')], 'all')[0]?.width).toBe(
      198,
    );
  });

  it('ignores dates, phone numbers and years', () => {
    expect(
      findAadhaarNumbers(
        [line('DOB', '12/05/1990'), line('9876543210'), line('2024', '2025')],
        'all',
      ),
    ).toEqual([]);
  });

  it('reads groups with stray OCR punctuation', () => {
    expect(findAadhaarNumbers([line('1234,', '5678', '9012.')], 'first8')).toHaveLength(1);
  });
});
