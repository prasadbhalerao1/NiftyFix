import { useMemo, useState } from 'preact/hooks';
import { NumberInput, Panel, SegmentedControl, StatTile, type ToolUiProps } from '@niftyfix/ui';
import { emi, rupees, yearlySchedule } from './emi';
import { PrepaymentPlanner, RateChangePlanner } from './planners';

type TenureUnit = 'years' | 'months';

/** Home, car and personal loan pages start from typical amounts for that loan. */
const HOME = { principal: 3_000_000, rate: 8.5, years: 20 };
const PRESETS: Record<string, { principal: number; rate: number; years: number }> = {
  home: HOME,
  car: { principal: 800_000, rate: 9, years: 5 },
  personal: { principal: 300_000, rate: 12, years: 3 },
};

export default function EmiCalculator({ preset }: ToolUiProps) {
  const start = PRESETS[preset ?? ''] ?? HOME;
  const [principal, setPrincipal] = useState<number | null>(start.principal);
  const [rate, setRate] = useState<number | null>(start.rate);
  const [tenure, setTenure] = useState<number | null>(start.years);
  const [unit, setUnit] = useState<TenureUnit>('years');

  const months = tenure === null ? 0 : Math.round(unit === 'years' ? tenure * 12 : tenure);
  const errors = {
    principal: principal === null || principal <= 0 ? 'Enter the loan amount.' : undefined,
    rate: rate === null || rate < 0 || rate > 50 ? 'Enter a rate between 0 and 50%.' : undefined,
    tenure: months < 1 || months > 600 ? 'Enter 1 month to 50 years.' : undefined,
  };
  const loan =
    principal !== null && rate !== null && !errors.principal && !errors.rate && !errors.tenure
      ? { principal, annualRate: rate, months }
      : null;
  const result = useMemo(() => (loan ? emi(loan) : null), [principal, rate, months]);
  const schedule = useMemo(() => (loan ? yearlySchedule(loan) : []), [principal, rate, months]);
  const interestShare = result ? result.totalInterest / result.totalPayment : 0;

  return (
    <div class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Panel title="Loan">
        <div class="flex flex-col gap-4">
          <NumberInput
            label="Loan amount (₹)"
            value={principal}
            min={0}
            step={1000}
            error={errors.principal}
            onChange={setPrincipal}
            testId="principal"
          />
          <NumberInput
            label="Interest rate (% a year)"
            value={rate}
            min={0}
            max={50}
            step={0.05}
            error={errors.rate}
            onChange={setRate}
            testId="rate"
          />
          <div class="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberInput
              label="Tenure"
              value={tenure}
              min={0}
              step={1}
              error={errors.tenure}
              onChange={setTenure}
              testId="tenure"
            />
            <SegmentedControl<TenureUnit>
              label="Unit"
              value={unit}
              options={[
                { value: 'years', label: 'Years' },
                { value: 'months', label: 'Months' },
              ]}
              onChange={(next) => {
                // Keep the same length of loan when the unit changes.
                if (tenure !== null) setTenure(next === 'months' ? tenure * 12 : tenure / 12);
                setUnit(next);
              }}
            />
          </div>
        </div>
      </Panel>

      <div class="flex min-w-0 flex-col gap-4">
        <Panel title="Your EMI">
          {result ? (
            <div class="flex flex-col gap-4">
              <div class="grid gap-2 sm:grid-cols-3">
                <StatTile label="Monthly EMI" value={rupees(result.emi)} emphasis testId="emi" />
                <StatTile
                  label="Total interest"
                  value={rupees(result.totalInterest)}
                  testId="total-interest"
                />
                <StatTile
                  label="Total payment"
                  value={rupees(result.totalPayment)}
                  testId="total-payment"
                />
              </div>
              <div>
                <div class="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                  <span>Principal {Math.round((1 - interestShare) * 100)}%</span>
                  <span>Interest {Math.round(interestShare * 100)}%</span>
                </div>
                <div class="mt-1 h-2.5 overflow-hidden rounded-full bg-amber-300 dark:bg-amber-700">
                  <div
                    class="h-full origin-left bg-brand-600 transition-transform duration-300"
                    style={{ transform: `scaleX(${1 - interestShare})` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p class="text-sm text-stone-600 dark:text-stone-400">
              Fill in the loan details to see your EMI.
            </p>
          )}
        </Panel>

        {loan ? (
          <>
            <PrepaymentPlanner loan={loan} />
            <RateChangePlanner loan={loan} />
          </>
        ) : null}

        {schedule.length > 0 ? (
          <Panel title="Year by year">
            <div class="max-h-80 overflow-auto">
              <table class="w-full text-right text-sm tabular-nums" data-testid="schedule">
                <thead class="sticky top-0 bg-paper text-xs text-stone-600 dark:bg-stone-900 dark:text-stone-400">
                  <tr>
                    <th class="py-2 text-left font-medium">Year</th>
                    <th class="py-2 font-medium">Principal</th>
                    <th class="py-2 font-medium">Interest</th>
                    <th class="py-2 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-200 dark:divide-stone-800">
                  {schedule.map((row) => (
                    <tr key={row.year}>
                      <td class="py-1.5 text-left">{row.year}</td>
                      <td class="py-1.5">{rupees(row.principalPaid)}</td>
                      <td class="py-1.5">{rupees(row.interestPaid)}</td>
                      <td class="py-1.5">{rupees(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
