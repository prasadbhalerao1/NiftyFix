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

type Angle = '90' | '180' | '270';

export default function RotatePdf(props: ToolUiProps) {
  const [angle, setAngle] = useState<Angle>('90');
  const [pages, setPages] = useState<PageSelectionValue>(ALL_PAGES);
  const options =
    pageSelectionError(pages) === null ? { angle: Number(angle), pages, fileName: '' } : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Rotate"
      actionLabel="Rotate PDF"
      busyLabel="Rotating…"
      successMessage="Your pages are rotated."
      disclaimer="The file was opened again to confirm every page's rotation and the page count."
      options={options}
    >
      <SegmentedControl<Angle>
        label="Direction"
        value={angle}
        options={[
          { value: '270', label: '↺ Left' },
          { value: '90', label: '↻ Right' },
          { value: '180', label: 'Upside down' },
        ]}
        onChange={setAngle}
      />
      <PageSelection label="Pages to rotate" value={pages} onChange={setPages} />
    </SingleFileTool>
  );
}
