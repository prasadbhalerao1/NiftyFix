import { emi, type Loan } from './emi';

/**
 * The full monthly cost of a US-style mortgage (PITI): principal and
 * interest, property tax, homeowners insurance, private mortgage insurance
 * while the loan is above 80% of the home's value, and HOA dues.
 */
export interface HomeCosts {
  price: number;
  /** Property tax, percent of the home price a year. */
  taxRate: number;
  /** Homeowners insurance a year. */
  insurance: number;
  /** PMI, percent of the loan amount a year. */
  pmiRate: number;
  /** HOA dues a month. */
  hoa: number;
}

export interface MonthlyCosts {
  principalAndInterest: number;
  tax: number;
  insurance: number;
  pmi: number;
  /** Months of PMI before the balance reaches 78% of the price, when lenders must drop it. */
  pmiMonths: number;
  hoa: number;
  total: number;
}

/**
 * Lenders must cancel PMI once the scheduled balance reaches 78% of the
 * original value (Homeowners Protection Act); it is not charged at all when
 * the loan starts at 80% or less.
 */
export function monthlyCosts(loan: Loan, costs: HomeCosts): MonthlyCosts {
  const { emi: payment } = emi(loan);
  const r = loan.annualRate / 12 / 100;
  let pmiMonths = 0;
  if (loan.principal > costs.price * 0.8) {
    let balance = loan.principal;
    while (balance > costs.price * 0.78 && pmiMonths < loan.months) {
      balance -= payment - balance * r;
      pmiMonths += 1;
    }
  }
  const tax = (costs.price * costs.taxRate) / 100 / 12;
  const insurance = costs.insurance / 12;
  const pmi = pmiMonths > 0 ? (loan.principal * costs.pmiRate) / 100 / 12 : 0;
  return {
    principalAndInterest: payment,
    tax,
    insurance,
    pmi,
    pmiMonths,
    hoa: costs.hoa,
    total: payment + tax + insurance + pmi + costs.hoa,
  };
}

/** Interest-only mortgage: the monthly payment covers the interest and the whole loan is due at the end. */
export const interestOnly = ({ principal, annualRate, months }: Loan) => {
  const payment = (principal * annualRate) / 12 / 100;
  return {
    emi: payment,
    totalInterest: payment * months,
    totalPayment: payment * months + principal,
  };
};
