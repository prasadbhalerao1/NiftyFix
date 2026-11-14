import { useMemo, useState } from 'preact/hooks';
import { formatMoney, type Currency } from '@niftyfix/engine-data';
import {
  CurrencySelect,
  NumberInput,
  Panel,
  SegmentedControl,
  StatTile,
  useCurrency,
  type ToolUiProps,
} from '@niftyfix/ui';
import { emi, yearlySchedule } from './emi';
import { interestOnly, monthlyCosts } from './mortgage';
import { PrepaymentPlanner, RateChangePlanner } from './planners';

type TenureUnit = 'years' | 'months';
type Mode = 'loan' | 'mortgage';
type Repayment = 'repayment' | 'interest-only';

interface Start {
  principal: number;
  rate: number;
  years: number;
}

/** Typical loans to start from, in each currency, so the first figures look familiar. */
const LOANS: Record<Currency, Start> = {
  INR: { principal: 3_000_000, rate: 8.5, years: 20 },
  USD: { principal: 300_000, rate: 6.5, years: 30 },
  GBP: { principal: 200_000, rate: 4.5, years: 25 },
  EUR: { principal: 250_000, rate: 3.5, years: 25 },
  CAD: { principal: 400_000, rate: 4.5, years: 25 },
  AUD: { principal: 500_000, rate: 6, years: 30 },
};

/** Home, car and personal loan pages are Indian and start from typical amounts for that loan. */
const INDIAN: Record<string, Start> = {
  home: LOANS.INR,
  car: { principal: 800_000, rate: 9, years: 5 },
  personal: { principal: 300_000, rate: 12, years: 3 },
};

/** The US and UK mortgage pages open on a typical home and down payment or deposit. */
const HOMES: Record<string, Start & { price: number }> = {
  mortgage: { price: 400_000, principal: 320_000, rate: 6.5, years: 30 },
  'uk-mortgage': { price: 300_000, principal: 270_000, rate: 4.5, years: 25 },
};

/** Country pages that fix the currency they open in. */
const CURRENCY_FOR: Record<string, Currency> = {
  home: 'INR',
  car: 'INR',
  personal: 'INR',
  mortgage: 'USD',
  'uk-mortgage': 'GBP',
};

export default function EmiCalculator({ preset }: ToolUiProps) {
  const [currency, setCurrency] = useCurrency(CURRENCY_FOR[preset ?? '']);
  const home = HOMES[preset ?? ''];
  const start = home ?? INDIAN[preset ?? ''] ?? LOANS[currency];
  const startPrice = home?.price ?? Math.round(start.principal / 0.8);
  const [mode, setMode] = useState<Mode>(
    preset === 'mortgage' || preset === 'uk-mortgage' ? 'mortgage' : 'loan',
  );
  const [principal, setPrincipal] = useState<number | null>(start.principal);
  const [price, setPrice] = useState<number | null>(startPrice);
  const [down, setDown] = useState<number | null>(startPrice - start.principal);
  const [rate, setRate] = useState<number | null>(start.rate);
  const [tenure, setTenure] = useState<number | null>(start.years);
  const [unit, setUnit] = useState<TenureUnit>('years');
  const [repayment, setRepayment] = useState<Repayment>('repayment');
  // US costs on top of the loan; zero leaves them out.
  const [taxRate, setTaxRate] = useState<number | null>(preset === 'mortgage' ? 1.1 : 0);
  const [insurance, setInsurance] = useState<number | null>(preset === 'mortgage' ? 1_800 : 0);
  const [pmiRate, setPmiRate] = useState<number | null>(0.5);
  const [hoa, setHoa] = useState<number | null>(0);

  const money = (amount: number): string => formatMoney(amount, currency);
  const indian = currency === 'INR';
  const payment = indian ? 'EMI' : 'Monthly payment';
  const isMortgage = mode === 'mortgage';
  const amount = isMortgage ? (price ?? 0) - (down ?? 0) : principal;
  const months = tenure === null ? 0 : Math.round(unit === 'years' ? tenure * 12 : tenure);
  const errors = {
    principal: principal === null || principal <= 0 ? 'Enter the loan amount.' : undefined,
    price: price === null || price <= 0 ? 'Enter the home price.' : undefined,
    down:
      down === null || down < 0 || (price !== null && down >= price)
        ? 'Enter a down payment below the price.'
        : undefined,
    rate: rate === null || rate < 0 || rate > 50 ? 'Enter a rate between 0 and 50%.' : undefined,
    tenure: months < 1 || months > 600 ? 'Enter 1 month to 50 years.' : undefined,
  };
  const amountOk = isMortgage ? !errors.price && !errors.down : !errors.principal;
  const loan =
    amount !== null && rate !== null && amountOk && !errors.rate && !errors.tenure
      ? { principal: amount, annualRate: rate, months }
      : null;
  const onlyInterest = isMortgage && repayment === 'interest-only';
  const key = [amount, rate, months, onlyInterest];
  const result = useMemo(
    () => (loan ? (onlyInterest ? interestOnly(loan) : emi(loan)) : null),
    key,
  );
  const schedule = useMemo(() => (loan && !onlyInterest ? yearlySchedule(loan) : []), key);
  const interestShare = result ? result.totalInterest / result.totalPayment : 0;
  const us = isMortgage && currency === 'USD';
  const costs =
    loan && us && !onlyInterest
      ? monthlyCosts(loan, {
          price: price ?? 0,
          taxRate: taxRate ?? 0,
          insurance: insurance ?? 0,
          pmiRate: pmiRate ?? 0,
          hoa: hoa ?? 0,
        })
      : null;
  const ltv = isMortgage && price ? (amount ?? 0) / price : 0;

  return (
    <div class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Panel title={isMortgage ? 'Mortgage' : 'Loan'}>
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-[1fr_auto] items-end gap-3">
            <CurrencySelect value={currency} onChange={setCurrency} />
            <SegmentedControl<Mode>
              label="Loan type"
              value={mode}
              options={[
                { value: 'loan', label: 'Loan' },
                { value: 'mortgage', label: 'Home' },
              ]}
              onChange={setMode}
            />
          </div>
          {isMortgage ? (
            <>
              <NumberInput
                label="Home price"
                value={price}
                min={0}
                step={1000}
                error={errors.price}
                onChange={setPrice}
                testId="price"
              />
              <NumberInput
                label={currency === 'USD' ? 'Down payment' : 'Deposit'}
                value={down}
                min={0}
                step={1000}
                error={errors.down}
                {...(price && down !== null && !errors.down
                  ? {
                      hint: `${Math.round((down / price) * 100)}% of the price; you borrow ${money(price - down)}.`,
                    }
                  : {})}
                onChange={setDown}
                testId="down"
              />
            </>
          ) : (
            <NumberInput
              label="Loan amount"
              value={principal}
              min={0}
              step={1000}
              error={errors.principal}
              onChange={setPrincipal}
              testId="principal"
            />
          )}
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
              label={indian ? 'Tenure' : 'Term'}
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
          {isMortgage && !indian ? (
            <SegmentedControl<Repayment>
              label="Mortgage type"
              value={repayment}
              options={[
                { value: 'repayment', label: 'Repayment' },
                { value: 'interest-only', label: 'Interest only' },
              ]}
              onChange={setRepayment}
            />
          ) : null}
          {us && !onlyInterest ? (
            <div class="grid grid-cols-2 gap-3">
              <NumberInput
                label="Property tax (% a year)"
                value={taxRate}
                min={0}
                max={10}
                step={0.05}
                onChange={setTaxRate}
                testId="tax-rate"
              />
              <NumberInput
                label="Home insurance (a year)"
                value={insurance}
                min={0}
                step={100}
                onChange={setInsurance}
                testId="insurance"
              />
              <NumberInput
                label="PMI (% of loan a year)"
                value={pmiRate}
                min={0}
                max={5}
                step={0.05}
                hint="Only charged under 20% down."
                onChange={setPmiRate}
                testId="pmi-rate"
              />
              <NumberInput
                label="HOA (a month)"
                value={hoa}
                min={0}
                step={10}
                onChange={setHoa}
                testId="hoa"
              />
            </div>
          ) : null}
        </div>
      </Panel>

      <div class="flex min-w-0 flex-col gap-4">
        <Panel title={indian ? 'Your EMI' : 'Your payment'}>
          {result ? (
            <div class="flex flex-col gap-4">
              <div class="grid gap-2 sm:grid-cols-3">
                <StatTile
                  label={costs ? 'Principal and interest' : `Monthly ${indian ? 'EMI' : 'payment'}`}
                  value={money(result.emi)}
                  emphasis={!costs}
                  testId="emi"
                />
                <StatTile
                  label="Total interest"
                  value={money(result.totalInterest)}
                  testId="total-interest"
                />
                <StatTile
                  label={onlyInterest ? 'Total, with the loan repaid at the end' : 'Total payment'}
                  value={money(result.totalPayment)}
                  testId="total-payment"
                />
              </div>
              {costs ? (
                <div class="flex flex-col gap-2" data-testid="piti">
                  <StatTile
                    label="Monthly payment with tax, insurance, PMI and HOA"
                    value={money(costs.total)}
                    emphasis
                    testId="monthly-total"
                  />
                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatTile label="Property tax" value={money(costs.tax)} />
                    <StatTile label="Insurance" value={money(costs.insurance)} />
                    <StatTile
                      label="PMI"
                      value={money(costs.pmi)}
                      hint={
                        costs.pmiMonths > 0
                          ? `for about ${Math.ceil(costs.pmiMonths / 12)} years`
                          : 'none at 20% down'
                      }
                      testId="pmi"
                    />
                    <StatTile label="HOA" value={money(costs.hoa)} />
                  </div>
                </div>
              ) : null}
              {isMortgage ? (
                <p class="text-sm text-stone-600 dark:text-stone-400" data-testid="ltv">
                  Loan to value: {Math.round(ltv * 100)}%.
                  {onlyInterest
                    ? ` The ${money(amount ?? 0)} loan is still owed at the end of the term.`
                    : ''}
                </p>
              ) : null}
              {!onlyInterest ? (
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
              ) : null}
            </div>
          ) : (
            <p class="text-sm text-stone-600 dark:text-stone-400">
              Fill in the loan details to see your {payment.toLowerCase()}.
            </p>
          )}
        </Panel>

        {loan && !onlyInterest ? (
          <>
            <PrepaymentPlanner loan={loan} currency={currency} />
            <RateChangePlanner loan={loan} currency={currency} />
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
                      <td class="py-1.5">{money(row.principalPaid)}</td>
                      <td class="py-1.5">{money(row.interestPaid)}</td>
                      <td class="py-1.5">{money(row.balance)}</td>
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
