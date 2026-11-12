import { describe, expect, it } from 'vitest';
import { ageOn, compare, eligibleBirthWindow, nextBirthday, parseYmd, weekday } from './age';

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
