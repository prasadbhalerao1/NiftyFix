import { describe, expect, it } from 'vitest';
import { interestOnly, monthlyCosts } from './mortgage';

const costs = { price: 400_000, taxRate: 1.2, insurance: 1_800, pmiRate: 0.5, hoa: 50 };

describe('monthlyCosts', () => {
  it('adds tax, insurance and HOA to principal and interest, with no PMI at 20% down', () => {
    const result = monthlyCosts({ principal: 320_000, annualRate: 6.5, months: 360 }, costs);
    expect(Math.round(result.principalAndInterest)).toBe(2023);
    expect(result.tax).toBe(400);
    expect(result.insurance).toBe(150);
    expect(result.pmi).toBe(0);
    expect(result.pmiMonths).toBe(0);
    expect(Math.round(result.total)).toBe(2623);
  });

  it('charges PMI below 20% down until the balance reaches 78% of the price', () => {
    const result = monthlyCosts({ principal: 360_000, annualRate: 6.5, months: 360 }, costs);
    expect(result.pmi).toBe(150);
    // 10% down at 6.5%: about 9 years of scheduled payments to reach 78%.
    expect(result.pmiMonths).toBeGreaterThan(100);
    expect(result.pmiMonths).toBeLessThan(120);
  });
});

describe('interestOnly', () => {
  it('pays only the interest, leaving the loan due at the end', () => {
    const result = interestOnly({ principal: 200_000, annualRate: 4.5, months: 300 });
    expect(result.emi).toBe(750);
    expect(result.totalPayment).toBe(425_000);
  });
});
