import { useState } from 'preact/hooks';
import { NumberInput, SegmentedControl, SingleFileTool, type ToolUiProps } from '@niftyfix/ui';
import { parseTargetPreset } from './preset';

type Choice = 'light' | 'balanced' | 'strong' | 'target';
type Unit = 'KB' | 'MB';

export default function CompressPdf(props: ToolUiProps) {
  // An intent page such as "compress PDF to 200 KB" opens with that target filled in.
  const [preset] = useState(() => parseTargetPreset(props.preset));
  const [choice, setChoice] = useState<Choice>(preset ? 'target' : 'balanced');
  const [amount, setAmount] = useState<number | null>(preset?.amount ?? 1);
  const [unit, setUnit] = useState<Unit>(preset?.unit ?? 'MB');
  // Upload limits are stated in decimal units (1 MB = 1,000,000 bytes); staying below that also meets 1 MiB.
  const maxBytes = amount === null ? null : Math.floor(amount * (unit === 'MB' ? 1_000_000 : 1000));
  const targetError =
    choice === 'target' && (maxBytes === null || maxBytes < 10_000)
      ? 'Enter at least 10 KB.'
      : null;
  const options =
    choice === 'target'
      ? targetError === null
        ? { mode: 'target', maxBytes, fileName: '' }
        : null
      : { mode: 'level', level: choice, fileName: '' };

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Compression"
      actionLabel="Compress PDF"
      busyLabel="Compressing…"
      successMessage="Your PDF is smaller."
      disclaimer="The compressed file was opened again to confirm it is valid, has every page, and is smaller than the original. Check fine print in scanned pages before submitting."
      options={options}
    >
      <SegmentedControl<Choice>
        label="Level"
        value={choice}
        options={[
          { value: 'light', label: 'Less' },
          { value: 'balanced', label: 'Recommended' },
          { value: 'strong', label: 'Strong' },
          { value: 'target', label: 'Target size' },
        ]}
        onChange={setChoice}
      />
      {choice === 'target' ? (
        <div class="grid grid-cols-[1fr_auto] items-end gap-3">
          <NumberInput
            label="Maximum size"
            value={amount}
            // min 0 with a fine step: whole numbers and decimals such as 1, 266 or 1.5 are all
            // valid (min 0.01 with step 0.1 made the browser silently reject "1").
            min={0}
            step={0.001}
            error={targetError ?? undefined}
            onChange={setAmount}
            testId="target-size"
          />
          <SegmentedControl<Unit>
            label="Unit"
            value={unit}
            options={[
              { value: 'KB', label: 'KB' },
              { value: 'MB', label: 'MB' },
            ]}
            onChange={setUnit}
          />
        </div>
      ) : (
        <p class="text-sm text-stone-600 dark:text-stone-400">
          {choice === 'light'
            ? 'Keeps photos close to the original. Smallest change in size.'
            : choice === 'balanced'
              ? 'Good for email and most upload portals.'
              : 'Smallest files. Photos lose detail; text stays sharp.'}
        </p>
      )}
    </SingleFileTool>
  );
}
