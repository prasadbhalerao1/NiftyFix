import { useState } from 'preact/hooks';
import {
  SegmentedControl,
  SelectInput,
  SingleFileTool,
  TargetSizeField,
  useTargetSize,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { CompressImageOptions } from './options';

type Choice = 'light' | 'balanced' | 'strong' | 'target';
type Format = CompressImageOptions['format'];

export default function CompressImage(props: ToolUiProps) {
  // An intent page such as "compress image to 50 KB" opens with that target filled in.
  const target = useTargetSize(props.preset, { amount: 100, unit: 'KB' }, 5_000);
  const [choice, setChoice] = useState<Choice>(target.fromPreset ? 'target' : 'balanced');
  const [format, setFormat] = useState<Format>('auto');
  const options: CompressImageOptions | null =
    choice === 'target'
      ? target.maxBytes === null
        ? null
        : { mode: 'target', maxBytes: target.maxBytes, format, fileName: '' }
      : { mode: 'level', level: choice, format, fileName: '' };

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose an image"
      settingsTitle="Compression"
      actionLabel="Compress image"
      busyLabel="Compressing…"
      successMessage="Your image is ready."
      disclaimer="The new file was decoded again to confirm its size, pixel dimensions and format. Check that the details you need are still clear before submitting."
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
            ? 'Close to the original. Smallest change in size.'
            : choice === 'balanced'
              ? 'Hard to tell apart on a screen. Good for most uses.'
              : 'Smallest files. Very large photos are also reduced to 2048 px.'}
        </p>
      )}
      <SelectInput<Format>
        label="Format"
        value={format}
        options={[
          { value: 'auto', label: 'Same as original (recommended)' },
          { value: 'jpeg', label: 'JPG' },
          { value: 'webp', label: 'WebP' },
          { value: 'png', label: 'PNG (lossless)' },
        ]}
        onChange={setFormat}
      />
    </SingleFileTool>
  );
}
