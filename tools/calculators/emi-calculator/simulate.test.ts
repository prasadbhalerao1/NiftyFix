import { describe, expect, it } from 'vitest';
import { emi } from './emi';
import { simulate } from './simulate';

const loan = { principal: 3_000_000, annualRate: 8.5, months: 240 };
const base = emi(loan);

describe('simulate', () => {
  it('matches the plain EMI with nothing changed', () => {
    const result = simulate(loan, { strategy: 'reduce-tenure' });
    expect(result.months).toBe(240);
    expect(result.totalInterest).toBeCloseTo(base.totalInterest, -1);
    expect(result.neverEnds).toBe(false);
  });

  it('a prepayment saves interest, and reducing tenure saves more than reducing EMI', () => {
    const oneTime = { month: 24, amount: 500_000 };
    const tenure = simulate(loan, { oneTime, strategy: 'reduce-tenure' });
    const lowerEmi = simulate(loan, { oneTime, strategy: 'reduce-emi' });
    expect(tenure.months).toBeLessThan(240);
    expect(lowerEmi.months).toBe(240);
    expect(lowerEmi.finalEmi).toBeLessThan(base.emi);
    expect(tenure.totalInterest).toBeLessThan(lowerEmi.totalInterest);
    expect(lowerEmi.totalInterest).toBeLessThan(base.totalInterest);
  });

  it('yearly extra payments shorten the loan', () => {
    const result = simulate(loan, { yearly: 100_000, strategy: 'reduce-tenure' });
    expect(result.months).toBeLessThan(200);
  });

  it('extra monthly payments shorten the loan', () => {
    // $100 extra a month on $300,000 at 7% for 30 years.
    const mortgage = { principal: 300_000, annualRate: 7, months: 360 };
    const result = simulate(mortgage, { monthly: 100, strategy: 'reduce-tenure' });
    expect(result.months).toBe(310);
    expect(emi(mortgage).totalInterest - result.totalInterest).toBeGreaterThan(69_000);
  });

  it('a rate rise either stretches the tenure or raises the EMI', () => {
    const rateChange = { month: 37, annualRate: 9.5 };
    const longer = simulate(loan, { rateChange, strategy: 'reduce-tenure' });
    const higherEmi = simulate(loan, { rateChange, strategy: 'reduce-emi' });
    expect(longer.months).toBeGreaterThan(240);
    expect(longer.finalEmi).toBeCloseTo(base.emi, 6);
    expect(higherEmi.months).toBe(240);
    expect(higherEmi.finalEmi).toBeGreaterThan(base.emi);
    // Keeping the EMI and stretching the loan costs more interest overall.
    expect(longer.totalInterest).toBeGreaterThan(higherEmi.totalInterest);
  });

  it('says when the EMI no longer covers the interest', () => {
    const result = simulate(loan, {
      rateChange: { month: 13, annualRate: 14 },
      strategy: 'reduce-tenure',
    });
    expect(result.neverEnds).toBe(true);
  });
});
