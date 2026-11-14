/**
 * Equated monthly instalment (EMI) on a reducing-balance loan, the fixed
 * monthly payment banks everywhere use:
 * EMI = P × r × (1 + r)^n / ((1 + r)^n − 1), with r the monthly rate
 * (annual rate / 12 / 100) and n the number of months.
 */
export interface Loan {
  principal: number;
  /** Annual interest rate in percent, e.g. 8.5. */
  annualRate: number;
  months: number;
}

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
}

export interface ScheduleYear {
  year: number;
  principalPaid: number;
  interestPaid: number;
  /** Outstanding balance at the end of the year. */
  balance: number;
}

export function emi({ principal, annualRate, months }: Loan): EmiResult {
  const r = annualRate / 12 / 100;
  const payment =
    r === 0 ? principal / months : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);
  const totalPayment = payment * months;
  return { emi: payment, totalInterest: totalPayment - principal, totalPayment };
}

/** Year-by-year split of payments into principal and interest. */
export function yearlySchedule(loan: Loan): ScheduleYear[] {
  const r = loan.annualRate / 12 / 100;
  const { emi: payment } = emi(loan);
  const years: ScheduleYear[] = [];
  let balance = loan.principal;
  for (let month = 1; month <= loan.months; month += 1) {
    const interest = balance * r;
    const principalPart = Math.min(balance, payment - interest);
    balance = Math.max(0, balance - principalPart);
    const year = Math.ceil(month / 12);
    const row = years[year - 1] ?? { year, principalPaid: 0, interestPaid: 0, balance: 0 };
    row.principalPaid += principalPart;
    row.interestPaid += interest;
    row.balance = balance;
    years[year - 1] = row;
  }
  return years;
}
