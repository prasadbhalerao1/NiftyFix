import { useState } from 'preact/hooks';
import { pageRangeSyntaxError } from '@niftyfix/engine-pdf/pages';
import {
  NumberInput,
  SegmentedControl,
  SingleFileTool,
  TextInput,
  type ToolUiProps,
} from '@niftyfix/ui';

export default function SplitPdf(props: ToolUiProps) {
  const [mode, setMode] = useState<'every' | 'ranges'>('every');
  const [size, setSize] = useState<number | null>(1);
  const [ranges, setRanges] = useState('');
  const rangeError = pageRangeSyntaxError(ranges);
  const sizeError =
    size === null || !Number.isInteger(size) || size < 1
      ? 'Enter a whole number of pages, 1 or more.'
      : null;
  const options =
    mode === 'every'
      ? sizeError === null
        ? { mode, size, fileName: '' }
        : null
      : rangeError === null
        ? { mode, ranges, fileName: '' }
        : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Split"
      actionLabel="Split PDF"
      busyLabel="Splitting…"
      successMessage="Your PDF is split. Every part was checked."
      disclaimer="Each part was opened again to confirm its pages before it was added to the download."
      options={options}
    >
      <SegmentedControl<'every' | 'ranges'>
        label="How to split"
        value={mode}
        options={[
          { value: 'every', label: 'Every N pages' },
          { value: 'ranges', label: 'By ranges' },
        ]}
        onChange={setMode}
      />
      {mode === 'every' ? (
        <NumberInput
          label="Pages per file"
          value={size}
          min={1}
          step={1}
          error={sizeError ?? undefined}
          hint="1 makes one PDF per page."
          onChange={setSize}
          testId="pages-per-file"
        />
      ) : (
        <TextInput
          label="Ranges (one file each)"
          value={ranges}
          placeholder="e.g. 1-2, 3, 4-"
          error={ranges.trim() === '' ? undefined : (rangeError ?? undefined)}
          hint="Each comma-separated item becomes its own PDF."
          onChange={setRanges}
          testId="page-ranges"
        />
      )}
    </SingleFileTool>
  );
}
