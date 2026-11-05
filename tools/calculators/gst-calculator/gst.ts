/**
 * GST on a price, added (price before tax) or removed (price including tax).
 * Within a state the tax is split equally into CGST and SGST; between states
 * it is IGST. Amounts are rounded to the paisa.
 */
export type GstMode = 'add' | 'remove';
export type Supply = 'intra' | 'inter';

/** Rates since 22 September 2025 (GST Council, 56th meeting; PIB): two main rates and 40%. */
export const GST_RATES = [5, 18, 40] as const;

export interface GstResult {
  /** Price before GST. */
  net: number;
  gst: number;
  /** Price including GST. */
  gross: number;
  cgst: number;
  sgst: number;
  igst: number;
}

const paise = (amount: number): number => Math.round(amount * 100) / 100;

export function gst(amount: number, rate: number, mode: GstMode, supply: Supply): GstResult {
  const net = paise(mode === 'add' ? amount : (amount * 100) / (100 + rate));
  const tax = paise(mode === 'add' ? (amount * rate) / 100 : amount - net);
  const gross = paise(net + tax);
  // Split so the halves always add back to the total tax.
  const cgst = supply === 'intra' ? paise(tax / 2) : 0;
  const sgst = supply === 'intra' ? paise(tax - cgst) : 0;
  return { net, gst: tax, gross, cgst, sgst, igst: supply === 'inter' ? tax : 0 };
}

/** "₹1,18,000.00" with the Indian digit grouping. */
export const inr = (amount: number): string =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
