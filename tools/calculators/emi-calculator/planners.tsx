import { useMemo, useState } from 'preact/hooks';
import { formatMoney, type Currency } from '@niftyfix/engine-data';
import { NumberInput, Panel } from '@niftyfix/ui';
import { emi, type Loan } from './emi';
import { simulate, type Simulation } from './simulate';

/** "18 years 4 months". */
export function duration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [
    years > 0 ? `${years} year${years === 1 ? '' : 's'}` : '',
    rest > 0 ? `${rest} month${rest === 1 ? '' : 's'}` : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '0 months';
}

const cell = 'py-2 pl-3 text-right whitespace-nowrap tabular-nums';
const head = 'py-2 pl-3 text-right text-xs font-medium text-stone-600 dark:text-stone-400';

function Row({ label, values, strong }: { label: string; values: string[]; strong?: boolean }) {
  return (
    <tr>
      <th scope="row" class="py-2 text-left text-sm font-normal">
        {label}
      </th>
      {values.map((value, i) => (
        <td
          key={i}
          class={`${cell} ${strong && value ? 'font-semibold text-brand-800 dark:text-brand-300' : ''}`}
        >
          <span key={value} class="nf-tick">
            {value}
          </span>
        </td>
      ))}
    </tr>
  );
}

interface PlannerProps {
  loan: Loan;
  currency: Currency;
}

/** "EMI" in rupees, "payment" for lenders elsewhere. */
const paymentWord = (currency: Currency): string => (currency === 'INR' ? 'EMI' : 'payment');

/** Part-prepayments: what each choice the bank offers actually saves. */
export function PrepaymentPlanner({ loan, currency }: PlannerProps) {
  const indian = currency === 'INR';
  const money = (amount: number): string => formatMoney(amount, currency);
  // Indian borrowers prepay a lump sum; elsewhere an extra amount every month is the usual habit.
  const [oneTime, setOneTime] = useState<number | null>(indian ? 200_000 : 0);
  const [year, setYear] = useState<number | null>(2);
  const [yearly, setYearly] = useState<number | null>(0);
  const [monthly, setMonthly] = useState<number | null>(indian ? 0 : 100);
  const years = Math.ceil(loan.months / 12);
  const yearError =
    year === null || year < 1 || year > years ? `Enter a year from 1 to ${years}.` : undefined;

  const results = useMemo(() => {
    if (yearError) return null;
    const events = {
      ...(oneTime ? { oneTime: { month: (year ?? 1) * 12, amount: oneTime } } : {}),
      ...(yearly ? { yearly } : {}),
      ...(monthly ? { monthly } : {}),
    };
    return {
      none: simulate(loan, { strategy: 'reduce-tenure' }),
      tenure: simulate(loan, { ...events, strategy: 'reduce-tenure' }),
      lowerEmi: simulate(loan, { ...events, strategy: 'reduce-emi' }),
    };
  }, [loan.principal, loan.annualRate, loan.months, oneTime, year, yearly, monthly, yearError]);

  const saved = (s: Simulation): string =>
    results ? money(results.none.totalInterest - s.totalInterest) : '';

  return (
    <Panel title={indian ? 'Prepay and save' : 'Overpay and save'}>
      <p class="mb-4 text-sm text-stone-600 dark:text-stone-400">
        {indian
          ? 'After a part-prepayment the bank asks whether to cut your tenure or your EMI. Cutting the tenure usually saves far more interest. RBI does not allow prepayment charges on floating-rate home loans taken by individuals.'
          : 'Extra payments go straight to the balance. Most lenders then keep your payment and finish sooner, which saves the most interest; some can lower the payment instead. Check whether your loan has an overpayment limit or charge.'}
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <NumberInput
          label="Extra every month"
          value={monthly}
          min={0}
          step={50}
          onChange={setMonthly}
          testId="prepay-monthly"
        />
        <NumberInput
          label="One-time prepayment"
          value={oneTime}
          min={0}
          step={10_000}
          onChange={setOneTime}
          testId="prepay-amount"
        />
        <NumberInput
          label="Paid at the end of year"
          value={year}
          min={1}
          max={years}
          error={yearError}
          onChange={setYear}
          testId="prepay-year"
        />
        <NumberInput
          label="Extra every year"
          value={yearly}
          min={0}
          step={5_000}
          onChange={setYearly}
          testId="prepay-yearly"
        />
      </div>
      {results && (oneTime || yearly || monthly) ? (
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-xs sm:text-sm" data-testid="prepay-table">
            <thead>
              <tr>
                <th class="sr-only">Measure</th>
                <th class={head}>{indian ? 'No prepayment' : 'No extra'}</th>
                <th class={head}>{indian ? 'Reduce tenure' : 'Finish sooner'}</th>
                <th class={head}>{indian ? 'Reduce EMI' : 'Lower payment'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200 dark:divide-stone-800">
              <Row
                label="Loan ends in"
                values={[results.none, results.tenure, results.lowerEmi].map((s) =>
                  duration(s.months),
                )}
              />
              <Row
                label={`${indian ? 'EMI' : 'Payment'} after prepaying`}
                values={[results.none, results.tenure, results.lowerEmi].map((s) =>
                  money(s.finalEmi),
                )}
              />
              <Row
                label="Total interest"
                values={[results.none, results.tenure, results.lowerEmi].map((s) =>
                  money(s.totalInterest),
                )}
              />
              <Row
                label="Interest saved"
                values={['', saved(results.tenure), saved(results.lowerEmi)]}
                strong
              />
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}

/** Floating rates: the hidden cost when the bank keeps the EMI and stretches the loan. */
export function RateChangePlanner({ loan, currency }: PlannerProps) {
  const money = (amount: number): string => formatMoney(amount, currency);
  const word = paymentWord(currency);
  const [newRate, setNewRate] = useState<number | null>(loan.annualRate + 1);
  const [fromYear, setFromYear] = useState<number | null>(3);
  const years = Math.ceil(loan.months / 12);
  const errors = {
    rate:
      newRate === null || newRate < 0 || newRate > 50
        ? 'Enter a rate between 0 and 50%.'
        : undefined,
    year:
      fromYear === null || fromYear < 1 || fromYear > years
        ? `Enter a year from 1 to ${years}.`
        : undefined,
  };

  const results = useMemo(() => {
    if (errors.rate || errors.year || newRate === null || fromYear === null) return null;
    const rateChange = { month: (fromYear - 1) * 12 + 1, annualRate: newRate };
    return {
      before: simulate(loan, { strategy: 'reduce-tenure' }),
      keepEmi: simulate(loan, { rateChange, strategy: 'reduce-tenure' }),
      raiseEmi: simulate(loan, { rateChange, strategy: 'reduce-emi' }),
    };
  }, [loan.principal, loan.annualRate, loan.months, newRate, fromYear, errors.rate, errors.year]);

  const extra = (s: Simulation): string =>
    results ? money(s.totalInterest - results.before.totalInterest) : '';

  return (
    <Panel title="If your rate changes">
      <p class="mb-4 text-sm text-stone-600 dark:text-stone-400">
        When a floating or variable rate rises, many lenders keep your {word} the same and quietly
        make the loan longer. You can ask for a higher {word} instead. Compare the two:
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <NumberInput
          label="New interest rate (%)"
          value={newRate}
          min={0}
          max={50}
          step={0.05}
          error={errors.rate}
          onChange={setNewRate}
          testId="new-rate"
        />
        <NumberInput
          label="From year"
          value={fromYear}
          min={1}
          max={years}
          error={errors.year}
          onChange={setFromYear}
          testId="rate-year"
        />
      </div>
      {results ? (
        results.keepEmi.neverEnds ? (
          <p
            class="mt-4 rounded-[var(--radius-control)] bg-red-50 px-3 py-2 text-sm text-red-900 dark:bg-red-950 dark:text-red-200"
            data-testid="never-ends"
          >
            At this rate your current {word} ({money(emi(loan).emi)}) would no longer cover the
            monthly interest, so the loan would never be repaid. The {word} must go up to at least{' '}
            {money(results.raiseEmi.finalEmi)} to finish on time.
          </p>
        ) : (
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-xs sm:text-sm" data-testid="rate-table">
              <thead>
                <tr>
                  <th class="sr-only">Measure</th>
                  <th class={head}>Keep {word}, longer loan</th>
                  <th class={head}>Raise {word}, same end date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200 dark:divide-stone-800">
                <Row
                  label={word === 'EMI' ? 'EMI' : 'Payment'}
                  values={[money(results.keepEmi.finalEmi), money(results.raiseEmi.finalEmi)]}
                />
                <Row
                  label="Loan ends in"
                  values={[duration(results.keepEmi.months), duration(results.raiseEmi.months)]}
                />
                <Row
                  label="Extra interest"
                  values={[extra(results.keepEmi), extra(results.raiseEmi)]}
                  strong
                />
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </Panel>
  );
}
