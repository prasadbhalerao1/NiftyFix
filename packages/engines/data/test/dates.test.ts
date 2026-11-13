import { describe, expect, it } from 'vitest';
import {
  addDays,
  ageOn,
  compare,
  daysBetween,
  eligibleBirthWindow,
  nextBirthday,
  parseYmd,
  weekday,
  workingDays,
} from '../src';

const d = (s: string) => {
  const date = parseYmd(s);
  if (!date) throw new Error(s);
  return date;
};

describe('ageOn', () => {
  it('counts completed years, months and days', () => {
    expect(ageOn(d('1995-08-15'), d('2026-11-13'))).toMatchObject({
      years: 31,
      months: 2,
      days: 29,
    });
    // Borrowing days from the previous month (October has 31).
    expect(ageOn(d('2000-01-31'), d('2000-03-01'))).toMatchObject({ years: 0, months: 1, days: 1 });
    expect(ageOn(d('2000-05-10'), d('2000-05-10'))).toMatchObject({
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
    });
    expect(ageOn(d('2001-01-01'), d('2000-01-01'))).toBeNull();
  });

  it('gives totals', () => {
    expect(ageOn(d('2024-01-01'), d('2025-01-01'))).toMatchObject({
      totalDays: 366,
      totalWeeks: 52,
      totalMonths: 12,
    });
  });
});

describe('birthdays and weekdays', () => {
  it('finds the next birthday, including today and 29 February', () => {
    expect(nextBirthday(d('1990-11-13'), d('2026-11-13'))).toEqual({
      date: d('2026-11-13'),
      daysLeft: 0,
      turning: 36,
    });
    expect(nextBirthday(d('1990-01-05'), d('2026-11-13'))).toMatchObject({
      date: d('2027-01-05'),
      turning: 37,
    });
    expect(nextBirthday(d('2000-02-29'), d('2026-01-01')).date).toEqual(d('2026-02-28'));
    expect(weekday(d('2026-11-13'))).toBe('Friday');
  });
});

describe('eligibleBirthWindow', () => {
  it('gives the date-of-birth range for an age limit on a cut-off date', () => {
    // Age 21 to 32 on 1 August 2026: born between 2 August 1993 and 1 August 2005.
    const window = eligibleBirthWindow(d('2026-08-01'), 21, 32);
    expect(window).toEqual({ earliest: d('1993-08-02'), latest: d('2005-08-01') });
    expect(ageOn(window.latest, d('2026-08-01'))?.years).toBe(21);
    expect(ageOn(window.earliest, d('2026-08-01'))?.years).toBe(32);
    expect(compare(d('1993-08-01'), window.earliest)).toBeLessThan(0);
  });

  it('rejects impossible dates', () => {
    expect(parseYmd('2025-02-29')).toBeNull();
    expect(parseYmd('2024-02-29')).not.toBeNull();
  });
});

describe('date calculator', () => {
  it('adds and subtracts days across months and leap years', () => {
    expect(addDays(d('2024-02-28'), 1)).toEqual(d('2024-02-29'));
    expect(addDays(d('2026-01-10'), -15)).toEqual(d('2025-12-26'));
    expect(daysBetween(d('2026-01-01'), d('2026-12-31'))).toBe(364);
    expect(daysBetween(d('2026-12-31'), d('2026-01-01'))).toBe(-364);
  });

  it('counts working days, skipping weekends and holidays', () => {
    // 1 to 31 January 2026: 22 weekdays; Republic Day (26th, a Monday) off leaves 21.
    expect(workingDays(d('2026-01-01'), d('2026-01-31'), [0, 6])).toBe(22);
    expect(workingDays(d('2026-01-01'), d('2026-01-31'), [0, 6], [d('2026-01-26')])).toBe(21);
    // Sunday-only weekend (six-day week).
    expect(workingDays(d('2026-01-01'), d('2026-01-31'), [0])).toBe(27);
    expect(workingDays(d('2026-01-31'), d('2026-01-01'), [0, 6])).toBe(22);
  });
});
