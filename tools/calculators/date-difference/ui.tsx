import { useState } from 'preact/hooks';
import {
  addDays,
  addMonths,
  ageOn,
  compare,
  daysBetween,
  formatYmd,
  parseYmd,
  weekday,
  workingDays,
  type Ymd,
} from '@niftyfix/engine-data';
import {
  CheckboxInput,
  NumberInput,
  Panel,
  SegmentedControl,
  StatTile,
  type ToolUiProps,
} from '@niftyfix/ui';

type Weekend = 'sat-sun' | 'sun' | 'none';
const WEEKEND: Record<Weekend, number[]> = { 'sat-sun': [0, 6], sun: [0], none: [] };
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const readable = (d: Ymd): string => `${weekday(d)}, ${d.day} ${MONTHS[d.month - 1]} ${d.year}`;
const n = (v: number): string => v.toLocaleString('en-IN');
const plural = (v: number, word: string): string => `${v} ${word}${Math.abs(v) === 1 ? '' : 's'}`;
const today = (): string => {
  const now = new Date();
  return formatYmd({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
};
const INPUT =
  'h-11 w-full rounded-[var(--radius-control)] border border-stone-300 bg-paper px-3 text-base dark:border-stone-700 dark:bg-stone-900';

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange(v: string): void;
}) {
  return (
    <div class="flex flex-col gap-1.5">
      <label htmlFor={id} class="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="date"
        class={INPUT}
        value={value}
        onInput={(e) => onChange(e.currentTarget.value)}
        data-testid={id}
      />
    </div>
  );
}

function Between() {
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState('');
  const [includeEnd, setIncludeEnd] = useState(false);
  const [weekend, setWeekend] = useState<Weekend>('sat-sun');
  const [holidays, setHolidays] = useState('');
  const a = parseYmd(start);
  const b = parseYmd(end);
  const [from, to] = a && b ? (compare(a, b) <= 0 ? [a, b] : [b, a]) : [null, null];
  const span = from && to ? ageOn(from, to) : null;
  const days = from && to ? daysBetween(from, to) + (includeEnd ? 1 : 0) : null;
  const holidayDates = holidays
    .split(/[\s,]+/)
    .map((s) => parseYmd(s.trim()))
    .filter((d): d is Ymd => d !== null);
  const work =
    from && to
      ? workingDays(from, includeEnd ? to : addDays(to, -1), WEEKEND[weekend], holidayDates)
      : null;

  return (
    <Panel title="Days between two dates">
      <div class="flex flex-col gap-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <DateField id="start" label="From" value={start} onChange={setStart} />
          <DateField id="end" label="To" value={end} onChange={setEnd} />
        </div>
        <CheckboxInput
          label="Include the end date"
          hint="Count both the first and the last day (for leave, rentals, events)."
          checked={includeEnd}
          onChange={setIncludeEnd}
        />
        {days !== null && span ? (
          <>
            <p class="text-lg" data-testid="between">
              <span class="font-semibold">{plural(days, 'day')}</span>
              {span.years || span.months
                ? ` (${plural(span.years, 'year')}, ${plural(span.months, 'month')} and ${plural(span.days + (includeEnd ? 1 : 0), 'day')})`
                : ''}
            </p>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile label="Weeks" value={`${Math.floor(days / 7)} w ${days % 7} d`} />
              <StatTile label="Hours" value={n(days * 24)} />
              <StatTile label="Minutes" value={n(days * 1440)} />
              <StatTile
                label="Working days"
                value={work === null ? '-' : n(work)}
                testId="working-days"
                emphasis
              />
            </div>
            <SegmentedControl<Weekend>
              label="Weekend for working days"
              value={weekend}
              options={[
                { value: 'sat-sun', label: 'Sat and Sun' },
                { value: 'sun', label: 'Sun only' },
                { value: 'none', label: 'No weekend' },
              ]}
              onChange={setWeekend}
            />
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Holidays to skip (optional, one date per line, YYYY-MM-DD)
              <textarea
                rows={3}
                class="w-full rounded-[var(--radius-control)] border border-stone-300 bg-paper p-2 font-mono text-sm font-normal dark:border-stone-700 dark:bg-stone-900"
                value={holidays}
                onInput={(e) => setHolidays(e.currentTarget.value)}
                placeholder="2026-01-26"
                data-testid="holidays"
              />
            </label>
          </>
        ) : (
          <p class="text-sm text-stone-600 dark:text-stone-400">Choose both dates.</p>
        )}
      </div>
    </Panel>
  );
}

function AddSubtract() {
  const [start, setStart] = useState(today());
  const [sign, setSign] = useState<1 | -1>(1);
  const [years, setYears] = useState<number | null>(0);
  const [months, setMonths] = useState<number | null>(0);
  const [weeks, setWeeks] = useState<number | null>(0);
  const [days, setDays] = useState<number | null>(90);
  const base = parseYmd(start);
  const result = base
    ? addDays(
        addMonths(base, sign * ((years ?? 0) * 12 + (months ?? 0))),
        sign * ((weeks ?? 0) * 7 + (days ?? 0)),
      )
    : null;

  return (
    <Panel title="Add or subtract time">
      <div class="flex flex-col gap-4">
        <DateField id="base" label="Start date" value={start} onChange={setStart} />
        <SegmentedControl<'add' | 'sub'>
          label="Then"
          value={sign === 1 ? 'add' : 'sub'}
          options={[
            { value: 'add', label: 'Add' },
            { value: 'sub', label: 'Subtract' },
          ]}
          onChange={(v) => setSign(v === 'add' ? 1 : -1)}
        />
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberInput label="Years" value={years} min={0} step={1} onChange={setYears} />
          <NumberInput label="Months" value={months} min={0} step={1} onChange={setMonths} />
          <NumberInput label="Weeks" value={weeks} min={0} step={1} onChange={setWeeks} />
          <NumberInput
            label="Days"
            value={days}
            min={0}
            step={1}
            onChange={setDays}
            testId="add-days"
          />
        </div>
        {result ? (
          <p class="text-lg" data-testid="added">
            <span class="font-semibold">{readable(result)}</span>
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

export default function DateCalculator(_props: ToolUiProps) {
  return (
    <div class="grid gap-4 lg:grid-cols-2">
      <Between />
      <AddSubtract />
    </div>
  );
}
