import { emi, type Loan } from './emi';

/**
 * Month-by-month loan simulation with what actually happens to loans:
 * part-prepayments or extra monthly payments, and floating rates that change
 * mid-loan. After either, the bank either keeps the EMI and changes the
 * tenure, or keeps the tenure and changes the EMI; this shows the cost of each.
 */
export type Strategy = 'reduce-tenure' | 'reduce-emi';

export interface LoanEvents {
  /** One-time prepayment: amount paid on top of the EMI in a given month (1-based). */
  oneTime?: { month: number; amount: number };
  /** Extra amount paid every 12 months, starting in month 12. */
  yearly?: number;
  /** Extra amount paid every month, as US and UK lenders allow. */
  monthly?: number;
  /** New annual rate from a given month (1-based) onwards. */
  rateChange?: { month: number; annualRate: number };
  strategy: Strategy;
}

export interface Simulation {
  months: number;
  totalInterest: number;
  /** EMI at the end (changes under reduce-emi, or with a rate change under reduce-emi). */
  finalEmi: number;
  /** True when the EMI no longer covers the monthly interest, so the loan would never end. */
  neverEnds: boolean;
}

/** Longest loan we simulate (50 years); beyond this the loan is treated as never ending. */
const MAX_MONTHS = 600;

export function simulate(loan: Loan, events: LoanEvents): Simulation {
  let rate = loan.annualRate;
  let payment = emi(loan).emi;
  let balance = loan.principal;
  let totalInterest = 0;
  let month = 0;
  const remaining = (): number => Math.max(1, loan.months - month);

  while (balance > 0.005 && month < MAX_MONTHS) {
    month += 1;
    if (events.rateChange && month === events.rateChange.month) {
      rate = events.rateChange.annualRate;
      if (events.strategy === 'reduce-emi')
        payment = emi({ principal: balance, annualRate: rate, months: remaining() + 1 }).emi;
    }
    const interest = balance * (rate / 12 / 100);
    if (payment <= interest && events.strategy === 'reduce-tenure') {
      return { months: Infinity, totalInterest: Infinity, finalEmi: payment, neverEnds: true };
    }
    totalInterest += interest;
    balance = Math.max(0, balance + interest - payment);

    const extra =
      (events.oneTime && month === events.oneTime.month ? events.oneTime.amount : 0) +
      (events.yearly && month % 12 === 0 ? events.yearly : 0) +
      (events.monthly ?? 0);
    if (extra > 0 && balance > 0) {
      balance = Math.max(0, balance - extra);
      if (events.strategy === 'reduce-emi' && balance > 0)
        payment = emi({ principal: balance, annualRate: rate, months: remaining() }).emi;
    }
  }
  return { months: month, totalInterest, finalEmi: payment, neverEnds: balance > 0.005 };
}
