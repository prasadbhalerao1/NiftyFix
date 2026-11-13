import { useState } from 'preact/hooks';
import { NumberInput, Panel, StatTile, type ToolUiProps } from '@niftyfix/ui';
import {
  ageOn,
  compare,
  eligibleBirthWindow,
  formatYmd,
  nextBirthday,
  parseYmd,
  weekday,
  type Ymd,
} from '@niftyfix/engine-data';

const today = (): string => {
  const now = new Date();
  return formatYmd({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
};
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
const readable = (d: Ymd): string => `${d.day} ${MONTHS[d.month - 1]} ${d.year}`;
const n = (value: number): string => value.toLocaleString('en-IN');
const plural = (value: number, word: string): string => `${value} ${word}${value === 1 ? '' : 's'}`;

const DATE_INPUT =
  'h-11 w-full rounded-[var(--radius-control)] border border-stone-300 bg-paper px-3 text-base dark:border-stone-700 dark:bg-stone-900';

function DateField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange(v: string): void;
  hint?: string;
}) {
  return (
    <div class="flex flex-col gap-1.5">
      <label htmlFor={id} class="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="date"
        class={DATE_INPUT}
        value={value}
        onInput={(e) => onChange(e.currentTarget.value)}
        data-testid={id}
      />
      {hint ? <p class="text-xs text-stone-600 dark:text-stone-400">{hint}</p> : null}
    </div>
  );
}

export default function AgeCalculator({ preset }: ToolUiProps) {
  const exam = preset === 'exam';
  const [birth, setBirth] = useState('');
  const [on, setOn] = useState(today());
  const [min, setMin] = useState<number | null>(exam ? 21 : null);
  const [max, setMax] = useState<number | null>(exam ? 32 : null);

  const birthDate = parseYmd(birth);
  const onDate = parseYmd(on);
  const age = birthDate && onDate ? ageOn(birthDate, onDate) : null;
  const next = birthDate && onDate && age ? nextBirthday(birthDate, onDate) : null;
  const window =
    onDate && min !== null && max !== null && max >= min
      ? eligibleBirthWindow(onDate, min, max)
      : null;
  const eligible =
    window && birthDate
      ? compare(birthDate, window.earliest) >= 0 && compare(birthDate, window.latest) <= 0
      : null;

  return (
    <div class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Panel title="Dates">
        <div class="flex flex-col gap-4">
          <DateField id="birth" label="Date of birth" value={birth} onChange={setBirth} />
          <DateField
            id="on"
            label={exam ? 'Cut-off date (age as on)' : 'Age on'}
            value={on}
            onChange={setOn}
            hint={
              exam
                ? 'The date in the notification, such as 1 August.'
                : 'Today, or any date such as an exam cut-off.'
            }
          />
          <div class="grid grid-cols-2 gap-3">
            <NumberInput
              label="Minimum age"
              value={min}
              min={0}
              max={100}
              step={1}
              onChange={setMin}
              testId="min-age"
            />
            <NumberInput
              label="Maximum age"
              value={max}
              min={0}
              max={100}
              step={1}
              onChange={setMax}
              testId="max-age"
            />
          </div>
          <p class="text-xs text-stone-600 dark:text-stone-400">
            For eligibility, enter the age limits from the notification, including any relaxation
            for your category.
          </p>
        </div>
      </Panel>
      <div class="flex min-w-0 flex-col gap-4">
        {birthDate && onDate && !age ? (
          <p class="text-sm text-red-800 dark:text-red-300">
            The date of birth is after the "age on" date.
          </p>
        ) : null}
        {age && birthDate && onDate ? (
          <Panel>
            <div class="flex flex-col gap-4">
              <p class="text-lg" data-testid="age">
                Age on {readable(onDate)}:{' '}
                <span class="font-semibold">
                  {plural(age.years, 'year')}, {plural(age.months, 'month')} and{' '}
                  {plural(age.days, 'day')}
                </span>
              </p>
              <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatTile label="Total months" value={n(age.totalMonths)} />
                <StatTile label="Total weeks" value={n(age.totalWeeks)} />
                <StatTile label="Total days" value={n(age.totalDays)} testId="total-days" />
                <StatTile label="Total hours" value={n(age.totalDays * 24)} />
              </div>
              <p class="text-sm">
                Born on a <span class="font-medium">{weekday(birthDate)}</span>.
                {next ? (
                  next.daysLeft === 0 ? (
                    <> Happy birthday: {next.turning} today!</>
                  ) : (
                    <>
                      {' '}
                      Next birthday: {readable(next.date)} ({weekday(next.date)}), turning{' '}
                      {next.turning}, in {plural(next.daysLeft, 'day')}.
                    </>
                  )
                ) : null}
              </p>
            </div>
          </Panel>
        ) : null}
        {window && onDate ? (
          <Panel title="Eligibility">
            <div class="flex flex-col gap-2" data-testid="eligibility">
              <p class="text-sm">
                Age {min} to {max} on {readable(onDate)} means born between{' '}
                <span class="font-semibold">{readable(window.earliest)}</span> and{' '}
                <span class="font-semibold">{readable(window.latest)}</span> (both days included).
              </p>
              {eligible !== null ? (
                <p
                  class={
                    eligible
                      ? 'font-semibold text-emerald-800 dark:text-emerald-300'
                      : 'font-semibold text-red-800 dark:text-red-300'
                  }
                >
                  {eligible ? 'You are within the age limit.' : 'You are outside the age limit.'}
                </p>
              ) : null}
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
