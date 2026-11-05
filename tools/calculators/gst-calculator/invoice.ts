import type { Supply } from './gst';

/**
 * A GST invoice with items at different rates, worked out the way billing
 * software does: tax per line to the paisa, a summary per rate (as invoices
 * and GSTR-1 group it), and the total rounded to the nearest rupee with a
 * separate round-off line.
 */
export interface InvoiceLine {
  quantity: number;
  /** Price per unit before GST. */
  unitPrice: number;
  rate: number;
}

export interface RateSummary {
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface InvoiceTotals {
  byRate: RateSummary[];
  taxable: number;
  tax: number;
  /** Taxable value plus tax, before rounding. */
  exact: number;
  /** Rounded total minus exact total, between -0.50 and +0.50. */
  roundOff: number;
  total: number;
}

const paise = (amount: number): number => Math.round(amount * 100) / 100;

export function invoiceTotals(lines: readonly InvoiceLine[], supply: Supply): InvoiceTotals {
  const groups = new Map<number, RateSummary>();
  for (const line of lines) {
    const taxable = paise(line.quantity * line.unitPrice);
    const tax = paise((taxable * line.rate) / 100);
    const cgst = supply === 'intra' ? paise(tax / 2) : 0;
    const group = groups.get(line.rate) ?? {
      rate: line.rate,
      taxable: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
    };
    group.taxable = paise(group.taxable + taxable);
    group.cgst = paise(group.cgst + cgst);
    group.sgst = paise(group.sgst + (supply === 'intra' ? tax - cgst : 0));
    group.igst = paise(group.igst + (supply === 'inter' ? tax : 0));
    groups.set(line.rate, group);
  }
  const byRate = [...groups.values()].sort((a, b) => a.rate - b.rate);
  const taxable = paise(byRate.reduce((sum, g) => sum + g.taxable, 0));
  const tax = paise(byRate.reduce((sum, g) => sum + g.cgst + g.sgst + g.igst, 0));
  const exact = paise(taxable + tax);
  const total = Math.round(exact);
  return { byRate, taxable, tax, exact, roundOff: paise(total - exact), total };
}
