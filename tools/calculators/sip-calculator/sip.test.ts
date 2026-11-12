import { describe, expect, it } from 'vitest';
import { growth, inTodaysMoney, inWords, sipForGoal } from './sip';

describe('growth', () => {
  it('matches the standard SIP formula for a flat SIP', () => {
    // 10,000 a month for 10 years at 12%: P x ((1+i)^n - 1) / i x (1+i).
    const i = 0.01;
    const expected = 10_000 * (((1 + i) ** 120 - 1) / i) * (1 + i);
    const result = growth({ monthly: 10_000, rate: 12, years: 10, stepUp: 0, lumpsum: 0 });
    expect(result.value).toBeCloseTo(expected, 2);
    expect(result.invested).toBe(1_200_000);
    expect(Math.round(result.value)).toBe(2_323_391);
    expect(result.rows).toHaveLength(10);
  });

  it('steps up the instalment once a year and grows a lumpsum', () => {
    const step = growth({ monthly: 10_000, rate: 12, years: 2, stepUp: 10, lumpsum: 0 });
    expect(step.invested).toBe(120_000 + 132_000);
    const lump = growth({ monthly: 0, rate: 12, years: 1, stepUp: 0, lumpsum: 100_000 });
    expect(lump.value).toBeCloseTo(100_000 * 1.01 ** 12, 4);
  });
});

describe('goals and helpers', () => {
  it('finds the SIP for a goal, which then reaches it', () => {
    const monthly = sipForGoal(10_000_000, 12, 20);
    const reached = growth({ monthly, rate: 12, years: 20, stepUp: 0, lumpsum: 0 }).value;
    expect(reached).toBeCloseTo(10_000_000, 0);
    expect(sipForGoal(120_000, 0, 1)).toBe(10_000);
  });

  it('adjusts for inflation and writes lakh and crore', () => {
    expect(inTodaysMoney(1_000_000, 6, 10)).toBeCloseTo(558_394.78, 1);
    expect(inWords(2_323_391)).toBe('23.23 lakh');
    expect(inWords(15_000_000)).toBe('1.5 crore');
  });
});
