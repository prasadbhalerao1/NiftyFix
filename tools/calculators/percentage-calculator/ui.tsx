import { useState } from 'preact/hooks';
import { Panel, type ToolUiProps } from '@niftyfix/ui';
import {
  applyPercent,
  format,
  percentChange,
  percentOf,
  reversePercent,
  whatPercent,
} from './percent';

const FIELD =
  'h-11 w-24 min-w-0 rounded-[var(--radius-control)] border border-stone-300 bg-paper px-2 text-base dark:border-stone-700 dark:bg-stone-900';

/** A number box inside a sentence; empty while the user clears it. */
function Num({
  value,
  onChange,
  label,
  testId,
}: {
  value: string;
  onChange(v: string): void;
  label: string;
  testId: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step="any"
      aria-label={label}
      class={FIELD}
      value={value}
      onInput={(e) => onChange(e.currentTarget.value)}
      data-testid={testId}
    />
  );
}

const num = (value: string): number | null =>
  value.trim() === '' || Number.isNaN(Number(value)) ? null : Number(value);
const both = (a: string, b: string, f: (x: number, y: number) => number | null): number | null => {
  const x = num(a);
  const y = num(b);
  return x === null || y === null ? null : f(x, y);
};

function Answer({
  value,
  suffix = '',
  testId,
}: {
  value: number | null;
  suffix?: string;
  testId: string;
}) {
  return (
    <output
      class="min-w-16 rounded-[var(--radius-control)] bg-brand-50 px-3 py-2 text-lg font-semibold text-brand-900 dark:bg-brand-950 dark:text-brand-100"
      data-testid={testId}
    >
      {value === null ? '-' : `${format(value)}${suffix}`}
    </output>
  );
}

function Row({ children }: { children: preact.ComponentChildren }) {
  return <div class="flex flex-wrap items-center gap-2 text-base">{children}</div>;
}

export default function PercentageCalculator({ preset }: ToolUiProps) {
  const [a1, setA1] = useState('18');
  const [b1, setB1] = useState('2500');
  const [a2, setA2] = useState(preset === 'marks' ? '432' : '25');
  const [b2, setB2] = useState(preset === 'marks' ? '500' : '200');
  const [a3, setA3] = useState('80');
  const [b3, setB3] = useState('100');
  const [a4, setA4] = useState('1000');
  const [b4, setB4] = useState('15');
  const [sign, setSign] = useState<1 | -1>(-1);
  const [a5, setA5] = useState('1180');
  const [b5, setB5] = useState('18');

  const change = both(a3, b3, percentChange);
  const marks = (
    <Panel title="Marks percentage">
      <Row>
        <Num value={a2} onChange={setA2} label="Marks obtained" testId="marks-got" />
        <span>marks out of</span>
        <Num value={b2} onChange={setB2} label="Total marks" testId="marks-total" />
        <span>is</span>
        <Answer value={both(a2, b2, whatPercent)} suffix="%" testId="marks-answer" />
      </Row>
    </Panel>
  );

  return (
    <div class="grid gap-4 md:grid-cols-2">
      {preset === 'marks' ? marks : null}
      <Panel title="Percent of a number">
        <Row>
          <span>What is</span>
          <Num value={a1} onChange={setA1} label="Percent" testId="pct-of-a" />
          <span>% of</span>
          <Num value={b1} onChange={setB1} label="Number" testId="pct-of-b" />
          <span>?</span>
          <Answer value={both(a1, b1, percentOf)} testId="pct-of-answer" />
        </Row>
      </Panel>
      {preset === 'marks' ? null : (
        <Panel title="What percent">
          <Row>
            <Num value={a2} onChange={setA2} label="Part" testId="what-a" />
            <span>is what % of</span>
            <Num value={b2} onChange={setB2} label="Whole" testId="what-b" />
            <span>?</span>
            <Answer value={both(a2, b2, whatPercent)} suffix="%" testId="what-answer" />
          </Row>
        </Panel>
      )}
      <Panel title="Percentage change">
        <Row>
          <span>From</span>
          <Num value={a3} onChange={setA3} label="From" testId="change-a" />
          <span>to</span>
          <Num value={b3} onChange={setB3} label="To" testId="change-b" />
          <span>is</span>
          <Answer
            value={change === null ? null : Math.abs(change)}
            suffix="%"
            testId="change-answer"
          />
          <span>{change === null || change === 0 ? '' : change > 0 ? 'increase' : 'decrease'}</span>
        </Row>
      </Panel>
      <Panel title="Add or subtract a percent">
        <Row>
          <Num value={a4} onChange={setA4} label="Number" testId="apply-a" />
          <button
            type="button"
            class="h-11 rounded-[var(--radius-control)] border border-stone-300 px-3 font-semibold dark:border-stone-700"
            onClick={() => setSign(sign === 1 ? -1 : 1)}
            aria-label={
              sign === 1 ? 'Adding; switch to subtracting' : 'Subtracting; switch to adding'
            }
            data-testid="apply-sign"
          >
            {sign === 1 ? '+' : '-'}
          </button>
          <Num value={b4} onChange={setB4} label="Percent" testId="apply-b" />
          <span>% =</span>
          <Answer value={both(a4, b4, (x, y) => applyPercent(x, sign * y))} testId="apply-answer" />
        </Row>
      </Panel>
      <Panel title="Before the percent was added">
        <Row>
          <Num value={a5} onChange={setA5} label="Total" testId="reverse-a" />
          <span>includes</span>
          <Num value={b5} onChange={setB5} label="Percent" testId="reverse-b" />
          <span>%; before it was</span>
          <Answer value={both(a5, b5, reversePercent)} testId="reverse-answer" />
        </Row>
      </Panel>
      {preset === 'marks' ? null : marks}
    </div>
  );
}
