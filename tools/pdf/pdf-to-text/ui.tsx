import { useState } from 'preact/hooks';
import {
  ALL_PAGES,
  CheckboxInput,
  PageSelection,
  pageSelectionError,
  SingleFileTool,
  type PageSelectionValue,
  type ToolUiProps,
} from '@niftyfix/ui';

export default function PdfToText(props: ToolUiProps) {
  const [pages, setPages] = useState<PageSelectionValue>(ALL_PAGES);
  const [markers, setMarkers] = useState(true);
  const options = pageSelectionError(pages) === null ? { pages, markers, fileName: '' } : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Text"
      actionLabel="Extract text"
      busyLabel="Extracting…"
      successMessage="The text is extracted."
      disclaimer="The text file was read back to confirm it is valid UTF-8. Pages without a text layer are listed above."
      options={options}
    >
      <PageSelection label="Pages" value={pages} onChange={setPages} />
      <CheckboxInput
        label="Mark where each page starts"
        checked={markers}
        hint='Adds "--- Page 3 ---" lines.'
        onChange={setMarkers}
        testId="markers"
      />
    </SingleFileTool>
  );
}
