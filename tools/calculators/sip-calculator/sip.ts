/**
 * SIP and lumpsum growth, month by month, the way mutual fund calculators
 * count it: each instalment is invested at the start of the month and
 * compounds monthly at the annual rate / 12. Step-up raises the instalment
 * once a year.
 */
export interface SipInput {
  monthly: number;
  /** Expected annual return, percent. */
  rate: number;
  years: number;
  /** Yearly increase of the instalment, percent (0 for a flat SIP). */
  stepUp: number;
  /** One-time amount invested at the start. */
  lumpsum: number;
}

export interface YearRow {
  year: number;
  invested: number;
  value: number;
}

export interface SipResult {
  invested: number;
  value: number;
  gains: number;
  rows: YearRow[];
}

export function growth({ monthly, rate, years, stepUp, lumpsum }: SipInput): SipResult {
  const i = rate / 100 / 12;
  const months = Math.round(years * 12);
  let value = lumpsum;
  let invested = lumpsum;
  let instalment = monthly;
  const rows: YearRow[] = [];
  for (let m = 1; m <= months; m += 1) {
    value += instalment;
    invested += instalment;
    value *= 1 + i;
    if (m % 12 === 0) {
      rows.push({ year: m / 12, invested, value });
      instalment *= 1 + stepUp / 100;
    }
  }
  if (months % 12 !== 0) rows.push({ year: months / 12, invested, value });
  return { invested, value, gains: value - invested, rows };
}

/** The flat monthly SIP that reaches `target` in `years` at `rate` (closed form, annuity due). */
export function sipForGoal(target: number, rate: number, years: number): number {
  const i = rate / 100 / 12;
  const n = Math.round(years * 12);
  if (n <= 0) return 0;
  if (i === 0) return target / n;
  return target / ((((1 + i) ** n - 1) / i) * (1 + i));
}

/** Today's buying power of a future amount, at `inflation` percent a year. */
export const inTodaysMoney = (amount: number, inflation: number, years: number): number =>
  amount / (1 + inflation / 100) ** years;

/** Indian rupee formatting, whole rupees, with lakh/crore grouping. */
export const inr = (value: number): string => `₹${Math.round(value).toLocaleString('en-IN')}`;

/** Short words for big amounts: 12.5 lakh, 1.2 crore. */
export function inWords(value: number): string {
  const v = Math.abs(value);
  if (v >= 1e7) return `${(value / 1e7).toFixed(2).replace(/\.?0+$/, '')} crore`;
  if (v >= 1e5) return `${(value / 1e5).toFixed(2).replace(/\.?0+$/, '')} lakh`;
  return Math.round(value).toLocaleString('en-IN');
}
