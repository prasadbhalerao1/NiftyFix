import { useState } from 'preact/hooks';
import { parseTargetPreset, targetToBytes, type TargetPreset } from '@niftyfix/tool-sdk';
import { NumberInput, SegmentedControl } from './fields';

type Unit = TargetPreset['unit'];

export interface TargetSize {
  amount: number | null;
  unit: Unit;
  setAmount(amount: number | null): void;
  setUnit(unit: Unit): void;
  /** The limit in bytes, or null while the entry is empty or below the minimum. */
  maxBytes: number | null;
  error: string | null;
  /** True when the page opened with a size preset ("compress to 200 KB"). */
  fromPreset: boolean;
}

/** State for a "maximum size" entry, starting from an intent page's preset when there is one. */
export function useTargetSize(
  preset: string | undefined,
  fallback: TargetPreset,
  minBytes = 10_000,
): TargetSize {
  const [initial] = useState(() => parseTargetPreset(preset));
  const [amount, setAmount] = useState<number | null>((initial ?? fallback).amount);
  const [unit, setUnit] = useState<Unit>((initial ?? fallback).unit);
  const bytes = amount === null ? null : targetToBytes(amount, unit);
  const valid = bytes !== null && bytes >= minBytes;
  return {
    amount,
    unit,
    setAmount,
    setUnit,
    maxBytes: valid ? bytes : null,
    error: valid ? null : `Enter at least ${minBytes / 1000} KB.`,
    fromPreset: initial !== null,
  };
}

/** The "Maximum size" number with a KB / MB switch. */
export function TargetSizeField({ target }: { target: TargetSize }) {
  return (
    <div class="grid grid-cols-[1fr_auto] items-end gap-3">
      <NumberInput
        label="Maximum size"
        value={target.amount}
        // min 0 with a fine step: whole numbers and decimals such as 1, 266 or 1.5 are all
        // valid (min 0.01 with step 0.1 made the browser silently reject "1").
        min={0}
        step={0.001}
        error={target.error ?? undefined}
        onChange={target.setAmount}
        testId="target-size"
      />
      <SegmentedControl<Unit>
        label="Unit"
        value={target.unit}
        options={[
          { value: 'KB', label: 'KB' },
          { value: 'MB', label: 'MB' },
        ]}
        onChange={target.setUnit}
      />
    </div>
  );
}
