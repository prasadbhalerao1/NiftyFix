import { useState } from 'preact/hooks';
import { NumberInput, Panel, SegmentedControl, StatTile, type ToolUiProps } from '@niftyfix/ui';
import { gst, GST_RATES, inr, type GstMode, type Supply } from './gst';

type RateChoice = `${(typeof GST_RATES)[number]}` | 'custom';

export default function GstCalculator({ preset }: ToolUiProps) {
  const [amount, setAmount] = useState<number | null>(1000);
  const [choice, setChoice] = useState<RateChoice>('18');
  const [custom, setCustom] = useState<number | null>(12);
  // The reverse GST page opens on "remove GST from a price".
  const [mode, setMode] = useState<GstMode>(preset === 'remove' ? 'remove' : 'add');
  const [supply, setSupply] = useState<Supply>('intra');

  const rate = choice === 'custom' ? custom : Number(choice);
  const amountError = amount === null || amount < 0 ? 'Enter an amount.' : undefined;
  const rateError =
    rate === null || rate < 0 || rate > 100 ? 'Enter a rate between 0 and 100%.' : undefined;
  const result =
    amount !== null && rate !== null && !amountError && !rateError
      ? gst(amount, rate, mode, supply)
      : null;

  return (
    <div class="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Panel title="Price and rate">
        <div class="flex flex-col gap-4">
          <SegmentedControl<GstMode>
            label="Calculate"
            value={mode}
            options={[
              { value: 'add', label: 'Add GST' },
              { value: 'remove', label: 'Remove GST' },
            ]}
            onChange={setMode}
          />
          <NumberInput
            label={mode === 'add' ? 'Price before GST (₹)' : 'Price including GST (₹)'}
            value={amount}
            min={0}
            step={0.01}
            error={amountError}
            onChange={setAmount}
            testId="amount"
          />
          <SegmentedControl<RateChoice>
            label="GST rate"
            value={choice}
            options={[
              ...GST_RATES.map((r) => ({ value: `${r}` as RateChoice, label: `${r}%` })),
              { value: 'custom', label: 'Other' },
            ]}
            onChange={setChoice}
          />
          {choice === 'custom' ? (
            <NumberInput
              label="Rate (%)"
              value={custom}
              min={0}
              max={100}
              step={0.01}
              error={rateError}
              onChange={setCustom}
              hint="For example 12 or 28 for invoices before 22 September 2025."
              testId="custom-rate"
            />
          ) : null}
          <SegmentedControl<Supply>
            label="Supply"
            value={supply}
            options={[
              { value: 'intra', label: 'Within a state' },
              { value: 'inter', label: 'Between states' },
            ]}
            onChange={setSupply}
          />
        </div>
      </Panel>

      <Panel title="Result">
        {result ? (
          <div class="flex flex-col gap-3">
            <div class="grid gap-2 sm:grid-cols-3">
              <StatTile label="Price before GST" value={inr(result.net)} testId="net" />
              <StatTile label={`GST at ${rate}%`} value={inr(result.gst)} testId="gst" />
              <StatTile
                label="Price including GST"
                value={inr(result.gross)}
                emphasis
                testId="gross"
              />
            </div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {supply === 'intra' ? (
                <>
                  <StatTile label="CGST" value={inr(result.cgst)} testId="cgst" />
                  <StatTile label="SGST / UTGST" value={inr(result.sgst)} testId="sgst" />
                </>
              ) : (
                <StatTile label="IGST" value={inr(result.igst)} testId="igst" />
              )}
            </div>
          </div>
        ) : (
          <p class="text-sm text-stone-600 dark:text-stone-400">Enter a price and a rate.</p>
        )}
      </Panel>
    </div>
  );
}
