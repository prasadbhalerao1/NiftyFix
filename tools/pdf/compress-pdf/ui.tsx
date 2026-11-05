import { useState } from 'preact/hooks';
import {
  SegmentedControl,
  SingleFileTool,
  TargetSizeField,
  useTargetSize,
  type ToolUiProps,
} from '@niftyfix/ui';

type Choice = 'light' | 'balanced' | 'strong' | 'target';

export default function CompressPdf(props: ToolUiProps) {
  // An intent page such as "compress PDF to 200 KB" opens with that target filled in.
  const target = useTargetSize(props.preset, { amount: 1, unit: 'MB' });
  const [choice, setChoice] = useState<Choice>(target.fromPreset ? 'target' : 'balanced');
  const options =
    choice === 'target'
      ? target.maxBytes === null
        ? null
        : { mode: 'target', maxBytes: target.maxBytes, fileName: '' }
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
        <TargetSizeField target={target} />
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
