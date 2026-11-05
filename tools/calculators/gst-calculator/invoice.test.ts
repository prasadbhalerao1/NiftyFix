import { describe, expect, it } from 'vitest';
import { invoiceTotals } from './invoice';

describe('invoiceTotals', () => {
  const lines = [
    { quantity: 2, unitPrice: 499.5, rate: 18 },
    { quantity: 3, unitPrice: 120.25, rate: 5 },
    { quantity: 1, unitPrice: 250, rate: 18 },
  ];

  it('groups by rate and splits CGST and SGST within a state', () => {
    const totals = invoiceTotals(lines, 'intra');
    expect(totals.byRate).toEqual([
      { rate: 5, taxable: 360.75, cgst: 9.02, sgst: 9.02, igst: 0 },
      { rate: 18, taxable: 1249, cgst: 112.41, sgst: 112.41, igst: 0 },
    ]);
    expect(totals.taxable).toBe(1609.75);
    expect(totals.tax).toBe(242.86);
  });

  it('rounds the total to the nearest rupee with a separate round-off line', () => {
    const totals = invoiceTotals(lines, 'intra');
    expect(totals.exact).toBe(1852.61);
    expect(totals.total).toBe(1853);
    expect(totals.roundOff).toBe(0.39);
  });

  it('uses IGST between states, with the same total tax', () => {
    const totals = invoiceTotals(lines, 'inter');
    expect(totals.byRate.every((g) => g.cgst === 0 && g.sgst === 0)).toBe(true);
    expect(totals.tax).toBe(invoiceTotals(lines, 'intra').tax);
  });
});
