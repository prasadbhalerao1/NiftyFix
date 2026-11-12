import { useMemo, useState } from 'preact/hooks';
import { NumberInput, Panel, SegmentedControl, StatTile, type ToolUiProps } from '@niftyfix/ui';
import { growth, inr, inTodaysMoney, inWords, sipForGoal } from './sip';

type Mode = 'sip' | 'lumpsum' | 'goal';

export default function SipCalculator({ preset }: ToolUiProps) {
  const [mode, setMode] = useState<Mode>(
    preset === 'lumpsum' ? 'lumpsum' : preset === 'goal' ? 'goal' : 'sip',
  );
  const [monthly, setMonthly] = useState<number | null>(10_000);
  const [lumpsum, setLumpsum] = useState<number | null>(500_000);
  const [goal, setGoal] = useState<number | null>(10_000_000);
  const [rate, setRate] = useState<number | null>(12);
  const [years, setYears] = useState<number | null>(15);
  const [stepUp, setStepUp] = useState<number | null>(preset === 'step-up' ? 10 : 0);
  const [inflation, setInflation] = useState<number | null>(6);

  const valid =
    rate !== null && rate >= 0 && rate <= 50 && years !== null && years > 0 && years <= 60;
  const goalSip = mode === 'goal' && valid && goal ? sipForGoal(goal, rate, years) : null;
  const result = useMemo(() => {
    if (!valid) return null;
    if (mode === 'lumpsum')
      return lumpsum ? growth({ monthly: 0, rate, years, stepUp: 0, lumpsum }) : null;
    const instalment = mode === 'goal' ? (goalSip ?? 0) : (monthly ?? 0);
    return instalment > 0
      ? growth({
          monthly: instalment,
          rate,
          years,
          stepUp: mode === 'sip' ? (stepUp ?? 0) : 0,
          lumpsum: 0,
        })
      : null;
  }, [mode, monthly, lumpsum, goalSip, rate, years, stepUp, valid]);
  const real =
    result && valid && inflation !== null ? inTodaysMoney(result.value, inflation, years) : null;
  const gainShare = result && result.value > 0 ? result.gains / result.value : 0;

  return (
    <div class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Panel title="Investment">
        <div class="flex flex-col gap-4">
          <SegmentedControl<Mode>
            label="Calculate"
            value={mode}
            options={[
              { value: 'sip', label: 'SIP' },
              { value: 'lumpsum', label: 'Lumpsum' },
              { value: 'goal', label: 'Goal' },
            ]}
            onChange={setMode}
          />
          {mode === 'sip' ? (
            <NumberInput
              label="Monthly SIP"
              suffix="₹"
              value={monthly}
              min={100}
              step={500}
              onChange={setMonthly}
              testId="monthly"
            />
          ) : null}
          {mode === 'lumpsum' ? (
            <NumberInput
              label="One-time investment"
              suffix="₹"
              value={lumpsum}
              min={1}
              step={10000}
              onChange={setLumpsum}
              testId="lumpsum"
            />
          ) : null}
          {mode === 'goal' ? (
            <NumberInput
              label="Target amount"
              suffix="₹"
              value={goal}
              min={1}
              step={100000}
              onChange={setGoal}
              testId="goal"
            />
          ) : null}
          <NumberInput
            label="Expected return (per year)"
            suffix="%"
            value={rate}
            min={0}
            max={50}
            step={0.5}
            onChange={setRate}
            testId="rate"
          />
          <NumberInput
            label="Time"
            suffix="years"
            value={years}
            min={1}
            max={60}
            step={1}
            onChange={setYears}
            testId="years"
          />
          {mode === 'sip' ? (
            <NumberInput
              label="Step-up (yearly increase)"
              suffix="%"
              value={stepUp}
              min={0}
              max={50}
              step={1}
              onChange={setStepUp}
              hint="Raise the SIP every year, for example with your salary."
              testId="step-up"
            />
          ) : null}
          <NumberInput
            label="Inflation (per year)"
            suffix="%"
            value={inflation}
            min={0}
            max={20}
            step={0.5}
            onChange={setInflation}
            hint="To see what the amount is worth in today's money."
          />
        </div>
      </Panel>
      <div class="flex min-w-0 flex-col gap-4">
        {!valid ? (
          <p class="text-sm text-red-800 dark:text-red-300">
            Enter a return between 0 and 50% and 1 to 60 years.
          </p>
        ) : null}
        {goalSip !== null ? (
          <Panel>
            <p class="text-lg" data-testid="goal-sip">
              Invest <span class="font-semibold">{inr(goalSip)}</span> a month to reach{' '}
              {inr(goal ?? 0)} ({inWords(goal ?? 0)}).
            </p>
          </Panel>
        ) : null}
        {result ? (
          <>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile
                label="You invest"
                value={inr(result.invested)}
                hint={inWords(result.invested)}
              />
              <StatTile label="Gains" value={inr(result.gains)} hint={inWords(result.gains)} />
              <StatTile
                label="Total value"
                value={inr(result.value)}
                hint={inWords(result.value)}
                emphasis
                testId="total-value"
              />
              <StatTile
                label="In today's money"
                value={real === null ? '-' : inr(real)}
                hint={`at ${inflation ?? 0}% inflation`}
              />
            </div>
            <Panel title="How it grows">
              <div class="flex flex-col gap-3">
                <div
                  class="flex h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
                  aria-hidden="true"
                >
                  <span class="bg-stone-500" style={{ width: `${(1 - gainShare) * 100}%` }} />
                  <span class="bg-brand-600" style={{ width: `${gainShare * 100}%` }} />
                </div>
                <p class="text-xs text-stone-600 dark:text-stone-400">
                  Gray: money you put in. Orange: returns ({Math.round(gainShare * 100)}% of the
                  final value).
                </p>
                <div class="overflow-x-auto">
                  <table class="w-full text-right text-sm" data-testid="year-table">
                    <thead>
                      <tr class="text-stone-600 dark:text-stone-400">
                        <th class="py-1 text-left font-medium">Year</th>
                        <th class="py-1 font-medium">Invested</th>
                        <th class="py-1 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row) => (
                        <tr key={row.year} class="border-t border-stone-200 dark:border-stone-700">
                          <td class="py-1 text-left">{row.year}</td>
                          <td class="py-1">{inr(row.invested)}</td>
                          <td class="py-1 font-medium">{inr(row.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          </>
        ) : null}
        <p class="text-xs text-stone-600 dark:text-stone-400">
          Mutual fund returns are not guaranteed; this shows what a steady return would give. Past
          returns do not predict future ones.
        </p>
      </div>
    </div>
  );
}
