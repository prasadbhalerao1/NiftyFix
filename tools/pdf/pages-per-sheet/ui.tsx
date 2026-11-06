import { useState } from 'preact/hooks';
import { CheckboxInput, SegmentedControl, SingleFileTool, type ToolUiProps } from '@niftyfix/ui';
import type { PagesPerSheetOptions } from './options';

type Mode = PagesPerSheetOptions['mode'];
type PerSheet = PagesPerSheetOptions['perSheet'];

/** A small diagram of one sheet, so the layout is clear before saving. */
function SheetDiagram({ mode, perSheet }: { mode: Mode; perSheet: PerSheet }) {
  const count = mode === 'booklet' ? 2 : perSheet;
  const columns = count === 2 ? 2 : count === 4 ? 2 : 3;
  const labels =
    mode === 'booklet' ? ['8', '1'] : Array.from({ length: count }, (_, i) => String(i + 1));
  return (
    <div
      class="mx-auto grid w-40 gap-1 rounded bg-white p-2 shadow-sm ring-1 ring-stone-300 dark:ring-stone-700"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        aspectRatio: count === 2 || count === 6 ? '1.414 / 1' : '1 / 1.414',
      }}
      aria-hidden="true"
      data-testid="sheet-diagram"
    >
      {labels.map((label) => (
        <span
          key={label}
          class="flex items-center justify-center rounded-sm bg-stone-100 text-xs text-stone-700"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export default function PagesPerSheet(props: ToolUiProps) {
  const [mode, setMode] = useState<Mode>(props.preset === 'booklet' ? 'booklet' : 'nup');
  const [perSheet, setPerSheet] = useState<PerSheet>(props.preset === '4' ? 4 : 2);
  const [paper, setPaper] = useState<PagesPerSheetOptions['paper']>('a4');
  const [frame, setFrame] = useState(false);
  const options: PagesPerSheetOptions = { mode, perSheet, paper, frame, fileName: '' };

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Sheet layout"
      actionLabel={mode === 'booklet' ? 'Make booklet' : 'Arrange pages'}
      busyLabel="Arranging…"
      successMessage={
        mode === 'booklet'
          ? 'Your booklet is ready to print double-sided.'
          : `Your PDF now has ${perSheet} pages on every sheet.`
      }
      disclaimer="The file was opened again to confirm it is valid and has the expected number of sheets."
      options={options}
      preview={() => <SheetDiagram mode={mode} perSheet={perSheet} />}
    >
      <SegmentedControl<Mode>
        label="Layout"
        value={mode}
        options={[
          { value: 'nup', label: 'Pages per sheet' },
          { value: 'booklet', label: 'Booklet' },
        ]}
        onChange={setMode}
      />
      {mode === 'nup' ? (
        <SegmentedControl<string>
          label="Pages on each sheet"
          value={String(perSheet)}
          options={['2', '4', '6', '9'].map((value) => ({ value, label: value }))}
          onChange={(value) => setPerSheet(Number(value) as PerSheet)}
        />
      ) : (
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Two pages on each side of the paper, ordered so that a double-sided print folds into a
          booklet.
        </p>
      )}
      <SegmentedControl<PagesPerSheetOptions['paper']>
        label="Paper"
        value={paper}
        options={[
          { value: 'a4', label: 'A4' },
          { value: 'letter', label: 'US Letter' },
        ]}
        onChange={setPaper}
      />
      <CheckboxInput
        label="Thin frame around each page"
        checked={frame}
        onChange={setFrame}
        testId="frame"
      />
    </SingleFileTool>
  );
}
