import { describe, expect, it } from 'vitest';
import { gst, inr } from './gst';

describe('gst', () => {
  it('adds GST and splits it into CGST and SGST within a state', () => {
    expect(gst(1000, 18, 'add', 'intra')).toEqual({
      net: 1000,
      gst: 180,
      gross: 1180,
      cgst: 90,
      sgst: 90,
      igst: 0,
    });
  });

  it('removes GST from an inclusive price, as IGST between states', () => {
    expect(gst(1180, 18, 'remove', 'inter')).toEqual({
      net: 1000,
      gst: 180,
      gross: 1180,
      cgst: 0,
      sgst: 0,
      igst: 180,
    });
  });

  it('keeps the halves adding up when the tax has an odd paisa', () => {
    const result = gst(100.01, 5, 'add', 'intra');
    expect(result.gst).toBe(5);
    expect(result.cgst + result.sgst).toBeCloseTo(result.gst, 10);
  });

  it('formats rupees with Indian grouping and paise', () => {
    expect(inr(118000)).toBe('₹1,18,000.00');
  });
});
