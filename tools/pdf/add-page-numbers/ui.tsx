import { useState } from 'preact/hooks';
import {
  ALL_PAGES,
  NumberInput,
  PageSelection,
  pageSelectionError,
  SelectInput,
  SingleFileTool,
  type PageSelectionValue,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { PageNumberOptions } from './options';

type Position = PageNumberOptions['position'];
type Style = PageNumberOptions['style'];

export default function AddPageNumbers(props: ToolUiProps) {
  const [position, setPosition] = useState<Position>('bottom-center');
  const [style, setStyle] = useState<Style>('plain');
  const [start, setStart] = useState<number | null>(1);
  const [fontSize, setFontSize] = useState<number | null>(11);
  const [pages, setPages] = useState<PageSelectionValue>(ALL_PAGES);
  const startError =
    start === null || !Number.isInteger(start) || start < 0 ? 'Enter a whole number.' : null;
  const sizeError =
    fontSize === null || fontSize < 6 || fontSize > 36 ? 'Between 6 and 36 points.' : null;
  const options =
    startError === null && sizeError === null && pageSelectionError(pages) === null
      ? { position, style, start, fontSize, pages, fileName: '' }
      : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Page numbers"
      actionLabel="Add page numbers"
      busyLabel="Numbering…"
      successMessage="Page numbers are added."
      disclaimer="The file was opened again to confirm it is valid and has the same number of pages."
      options={options}
    >
      <SelectInput<Position>
        label="Position"
        value={position}
        options={[
          { value: 'bottom-center', label: 'Bottom centre' },
          { value: 'bottom-right', label: 'Bottom right' },
          { value: 'bottom-left', label: 'Bottom left' },
          { value: 'top-center', label: 'Top centre' },
          { value: 'top-right', label: 'Top right' },
          { value: 'top-left', label: 'Top left' },
        ]}
        onChange={setPosition}
        testId="position"
      />
      <SelectInput<Style>
        label="Style"
        value={style}
        options={[
          { value: 'plain', label: '1' },
          { value: 'page', label: 'Page 1' },
          { value: 'of', label: '1 of 10' },
          { value: 'page-of', label: 'Page 1 of 10' },
        ]}
        onChange={setStyle}
        testId="style"
      />
      <div class="grid grid-cols-2 gap-3">
        <NumberInput
          label="Start at"
          value={start}
          min={0}
          step={1}
          error={startError ?? undefined}
          onChange={setStart}
          testId="start"
        />
        <NumberInput
          label="Text size"
          suffix="pt"
          value={fontSize}
          min={6}
          max={36}
          step={1}
          error={sizeError ?? undefined}
          onChange={setFontSize}
        />
      </div>
      <PageSelection label="Pages to number" value={pages} onChange={setPages} />
    </SingleFileTool>
  );
}
