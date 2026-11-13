/**
 * Calendar arithmetic on plain dates (no time zones, no clocks): exact
 * years, months and days the way people count them, totals, next birthday,
 * and the date-of-birth window for an exam's age limits on a cut-off date.
 */
export interface Ymd {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
}

export const parseYmd = (value: string): Ymd | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return date.month >= 1 &&
    date.month <= 12 &&
    date.day >= 1 &&
    date.day <= daysIn(date.year, date.month)
    ? date
    : null;
};

export const formatYmd = ({ year, month, day }: Ymd): string =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const daysIn = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();
const serial = ({ year, month, day }: Ymd): number => Date.UTC(year, month - 1, day) / 86_400_000;
const fromSerial = (n: number): Ymd => {
  const d = new Date(n * 86_400_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
};
export const compare = (a: Ymd, b: Ymd): number => serial(a) - serial(b);

/** Add whole months, keeping the day within the target month (31 January + 1 month = 28/29 February). */
export function addMonths(date: Ymd, months: number): Ymd {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysIn(year, month)) };
}

/** Add whole years, keeping 29 February as 28 February in years without it. */
export function addYears(date: Ymd, years: number): Ymd {
  const year = date.year + years;
  return { year, month: date.month, day: Math.min(date.day, daysIn(year, date.month)) };
}

export interface Age {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
}

/** Exact age on `on`: completed years, then months, then days, borrowing from the previous month. */
export function ageOn(birth: Ymd, on: Ymd): Age | null {
  if (compare(on, birth) < 0) return null;
  // Whole months that fit (a 31st counts as the month's last day in shorter months), then the days left.
  let whole = (on.year - birth.year) * 12 + (on.month - birth.month);
  if (compare(addMonths(birth, whole), on) > 0) whole -= 1;
  const years = Math.floor(whole / 12);
  const months = whole % 12;
  const days = serial(on) - serial(addMonths(birth, whole));
  const totalDays = serial(on) - serial(birth);
  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
  };
}

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const weekday = (date: Ymd): string =>
  WEEKDAYS[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()] ?? '';

/** The next birthday on or after `today`, and how many days away it is. */
export function nextBirthday(
  birth: Ymd,
  today: Ymd,
): { date: Ymd; daysLeft: number; turning: number } {
  let turning = today.year - birth.year;
  let date = addYears(birth, turning);
  if (compare(date, today) < 0) {
    turning += 1;
    date = addYears(birth, turning);
  }
  return { date, daysLeft: serial(date) - serial(today), turning };
}

/**
 * For "age between min and max on the cut-off date": the earliest and latest
 * dates of birth that qualify. Age at least `min` means born on or before the
 * cut-off minus `min` years; at most `max` means born after the cut-off
 * minus `max + 1` years.
 */
export function eligibleBirthWindow(
  cutoff: Ymd,
  min: number,
  max: number,
): { earliest: Ymd; latest: Ymd } {
  return {
    earliest: fromSerial(serial(addYears(cutoff, -(max + 1))) + 1),
    latest: addYears(cutoff, -min),
  };
}

/** The date `days` after (or, negative, before) `date`. */
export const addDays = (date: Ymd, days: number): Ymd => fromSerial(serial(date) + days);

/** Days from `a` to `b` (negative when `b` is earlier). */
export const daysBetween = (a: Ymd, b: Ymd): number => serial(b) - serial(a);

/**
 * Working days from `start` to `end`, both included, skipping the given
 * weekdays (0 Sunday to 6 Saturday) and any listed holidays.
 */
export function workingDays(
  start: Ymd,
  end: Ymd,
  weekend: readonly number[],
  holidays: readonly Ymd[] = [],
): number {
  const [from, to] = compare(start, end) <= 0 ? [start, end] : [end, start];
  const off = new Set(holidays.map(serial));
  let count = 0;
  for (let day = serial(from); day <= serial(to); day += 1) {
    const weekday = new Date(day * 86_400_000).getUTCDay();
    if (!weekend.includes(weekday) && !off.has(day)) count += 1;
  }
  return count;
}
