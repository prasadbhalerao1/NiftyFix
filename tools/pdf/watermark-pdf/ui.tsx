import { useState } from 'preact/hooks';
import {
  ALL_PAGES,
  PageSelection,
  pageSelectionError,
  RangeInput,
  SegmentedControl,
  SelectInput,
  SingleFileTool,
  TextInput,
  type PageSelectionValue,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { WatermarkOptions } from './options';

export default function WatermarkPdf(props: ToolUiProps) {
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.25);
  const [layout, setLayout] = useState<WatermarkOptions['layout']>('diagonal');
  const [colour, setColour] = useState<WatermarkOptions['colour']>('grey');
  const [pages, setPages] = useState<PageSelectionValue>(ALL_PAGES);
  const textError =
    text.trim() === ''
      ? 'Enter the watermark text.'
      : text.length > 100
        ? 'Up to 100 characters.'
        : null;
  const options =
    textError === null && pageSelectionError(pages) === null
      ? { text, opacity, layout, colour, pages, fileName: '' }
      : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Watermark"
      actionLabel="Add watermark"
      busyLabel="Adding watermark…"
      successMessage="Your watermark is added."
      disclaimer="The file was opened again to confirm it is valid and has the same number of pages."
      options={options}
    >
      <TextInput
        label="Text"
        value={text}
        error={textError ?? undefined}
        onChange={setText}
        testId="watermark-text"
      />
      <SegmentedControl<WatermarkOptions['layout']>
        label="Layout"
        value={layout}
        options={[
          { value: 'diagonal', label: 'Diagonal' },
          { value: 'horizontal', label: 'Horizontal' },
        ]}
        onChange={setLayout}
      />
      <SelectInput<WatermarkOptions['colour']>
        label="Colour"
        value={colour}
        options={[
          { value: 'grey', label: 'Grey' },
          { value: 'red', label: 'Red' },
          { value: 'blue', label: 'Blue' },
          { value: 'black', label: 'Black' },
        ]}
        onChange={setColour}
      />
      <RangeInput
        label="Opacity"
        min={0.05}
        max={1}
        step={0.05}
        value={opacity}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={setOpacity}
      />
      <PageSelection label="Pages" value={pages} onChange={setPages} />
    </SingleFileTool>
  );
}
