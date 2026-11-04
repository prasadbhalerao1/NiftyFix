import { useState } from 'preact/hooks';
import {
  ALL_PAGES,
  PageSelection,
  pageSelectionError,
  SegmentedControl,
  SingleFileTool,
  type PageSelectionValue,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { PdfToImageOptions } from './options';

type Dpi = '72' | '150' | '300';

export default function PdfToImage(props: ToolUiProps) {
  const [format, setFormat] = useState<PdfToImageOptions['format']>('jpeg');
  const [dpi, setDpi] = useState<Dpi>('150');
  const [pages, setPages] = useState<PageSelectionValue>(ALL_PAGES);
  const options =
    pageSelectionError(pages) === null ? { format, dpi: Number(dpi), pages, fileName: '' } : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Images"
      actionLabel="Convert to images"
      busyLabel="Converting…"
      successMessage="Your pages are converted to images."
      disclaimer="Each image was measured after it was saved to confirm its size matches the page at the chosen resolution."
      options={options}
    >
      <SegmentedControl<PdfToImageOptions['format']>
        label="Format"
        value={format}
        options={[
          { value: 'jpeg', label: 'JPG' },
          { value: 'png', label: 'PNG' },
        ]}
        onChange={setFormat}
      />
      <SegmentedControl<Dpi>
        label="Resolution"
        value={dpi}
        options={[
          { value: '72', label: '72 DPI' },
          { value: '150', label: '150 DPI' },
          { value: '300', label: '300 DPI' },
        ]}
        onChange={setDpi}
      />
      <PageSelection label="Pages" value={pages} onChange={setPages} />
    </SingleFileTool>
  );
}
