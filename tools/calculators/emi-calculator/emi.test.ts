import { describe, expect, it } from 'vitest';
import { emi, yearlySchedule } from './emi';

describe('emi', () => {
  it('matches the standard formula', () => {
    // ₹10,00,000 at 10% for 10 years: the textbook EMI is ₹13,215.07.
    const result = emi({ principal: 1_000_000, annualRate: 10, months: 120 });
    expect(result.emi).toBeCloseTo(13215.07, 1);
    expect(result.totalPayment).toBeCloseTo(13215.07 * 120, -1);
    expect(result.totalInterest).toBeCloseTo(result.totalPayment - 1_000_000, 6);
  });

  it('handles a zero-interest loan', () => {
    expect(emi({ principal: 120_000, annualRate: 0, months: 12 }).emi).toBe(10_000);
  });
});

describe('yearlySchedule', () => {
  it('pays the loan off exactly, with totals that add up', () => {
    const loan = { principal: 500_000, annualRate: 9, months: 60 };
    const years = yearlySchedule(loan);
    expect(years).toHaveLength(5);
    expect(years.at(-1)?.balance).toBeCloseTo(0, 2);
    const principal = years.reduce((sum, y) => sum + y.principalPaid, 0);
    const interest = years.reduce((sum, y) => sum + y.interestPaid, 0);
    expect(principal).toBeCloseTo(500_000, 2);
    expect(interest).toBeCloseTo(emi(loan).totalInterest, 2);
    // Early years are mostly interest; later years mostly principal.
    expect(years[0]!.interestPaid).toBeGreaterThan(years[4]!.interestPaid);
  });
});
