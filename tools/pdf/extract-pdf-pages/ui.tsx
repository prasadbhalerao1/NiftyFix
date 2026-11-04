import { useState } from 'preact/hooks';
import { pageRangeSyntaxError } from '@niftyfix/engine-pdf/pages';
import { SingleFileTool, TextInput, type ToolUiProps } from '@niftyfix/ui';

export default function ExtractPdfPages(props: ToolUiProps) {
  const [ranges, setRanges] = useState('');
  const error = pageRangeSyntaxError(ranges);
  const options = error === null ? { ranges, fileName: '' } : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Pages to extract"
      actionLabel="Extract pages"
      busyLabel="Extracting…"
      successMessage="Your selected pages are in a new PDF."
      disclaimer="The new file was opened again to confirm it has exactly the pages you selected."
      options={options}
    >
      <TextInput
        label="Pages"
        value={ranges}
        placeholder="e.g. 1-3, 5, 8-"
        error={ranges.trim() === '' ? undefined : (error ?? undefined)}
        hint='Separate with commas. Pages keep the order you type. "8-" means to the end.'
        onChange={setRanges}
        testId="page-ranges"
      />
    </SingleFileTool>
  );
}
