import { useEffect, useRef, useState } from 'preact/hooks';
import type { PreviewDocument } from '@niftyfix/engine-pdf/preview';
import {
  ALL_PAGES,
  NumberInput,
  PageSelection,
  pageSelectionError,
  SegmentedControl,
  SelectInput,
  SingleFileTool,
  usePdfPreview,
  type PageSelectionValue,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { CropPdfOptions } from './options';

type Paper = Extract<CropPdfOptions, { mode: 'resize' }>['paper'];
type Side = 'top' | 'right' | 'bottom' | 'left';
type MarginsMm = Record<Side, number | null>;

const PT_PER_MM = 72 / 25.4;
const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];

/** Page 1 with the area that will be cut shaded, updated as margins change. */
function CropPreview({ preview, margins }: { preview: PreviewDocument; margins: MarginsMm }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = preview.sizes[0] ?? { width: 595, height: 842 };
  useEffect(() => {
    if (canvas.current) void preview.render(0, canvas.current, 280);
  }, [preview]);
  const pct = (side: Side, of: number): string =>
    `${Math.min(50, (((margins[side] ?? 0) * PT_PER_MM) / of) * 100)}%`;
  const shade = 'absolute bg-stone-900/45 dark:bg-black/60';
  return (
    <figure class="m-0 flex flex-col items-center gap-2">
      <div
        class="relative w-full max-w-[280px] overflow-hidden ring-1 ring-stone-300 dark:ring-stone-700"
        style={{ aspectRatio: `${size.width} / ${size.height}` }}
        data-testid="crop-preview"
      >
        <canvas ref={canvas} aria-hidden="true" class="absolute inset-0 size-full bg-white" />
        <div class={`${shade} inset-x-0 top-0`} style={{ height: pct('top', size.height) }} />
        <div class={`${shade} inset-x-0 bottom-0`} style={{ height: pct('bottom', size.height) }} />
        <div class={`${shade} inset-y-0 left-0`} style={{ width: pct('left', size.width) }} />
        <div class={`${shade} inset-y-0 right-0`} style={{ width: pct('right', size.width) }} />
      </div>
      <figcaption class="text-xs text-stone-600 dark:text-stone-400">
        Page 1: shaded areas will be cut
      </figcaption>
    </figure>
  );
}

function PreviewForFile({ file, margins }: { file: File; margins: MarginsMm }) {
  const { preview } = usePdfPreview(file);
  return preview ? (
    <CropPreview preview={preview} margins={margins} />
  ) : (
    <p class="py-6 text-center text-sm text-stone-600 dark:text-stone-400">Loading preview…</p>
  );
}

export default function CropPdf(props: ToolUiProps) {
  // "Resize PDF to A4" pages open on the resize setting (A4 is already the default paper).
  const [mode, setMode] = useState<'crop' | 'resize'>(
    props.preset === 'resize-a4' ? 'resize' : 'crop',
  );
  const [margins, setMargins] = useState<MarginsMm>({ top: 10, right: 10, bottom: 10, left: 10 });
  const [paper, setPaper] = useState<Paper>('a4');
  const [pages, setPages] = useState<PageSelectionValue>(ALL_PAGES);
  const marginError = SIDES.some((side) => {
    const value = margins[side];
    return value === null || value < 0 || value > 500;
  });
  const pageError = pageSelectionError(pages) !== null;
  const options =
    pageError || (mode === 'crop' && marginError)
      ? null
      : mode === 'crop'
        ? { mode, margins, pages, fileName: '' }
        : { mode, paper, pages, fileName: '' };

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle={mode === 'crop' ? 'Crop' : 'Resize'}
      actionLabel={mode === 'crop' ? 'Crop PDF' : 'Resize PDF'}
      busyLabel="Working…"
      successMessage={mode === 'crop' ? 'Your pages are cropped.' : 'Your pages are resized.'}
      disclaimer="The file was opened again to confirm it is valid and has the same number of pages."
      options={options}
      {...(mode === 'crop'
        ? { preview: (file: File) => <PreviewForFile file={file} margins={margins} /> }
        : {})}
    >
      <SegmentedControl<'crop' | 'resize'>
        label="What to do"
        value={mode}
        options={[
          { value: 'crop', label: 'Crop margins' },
          { value: 'resize', label: 'Resize pages' },
        ]}
        onChange={setMode}
      />
      {mode === 'crop' ? (
        <div class="grid grid-cols-2 gap-3">
          {SIDES.map((side) => (
            <NumberInput
              key={side}
              label={side[0]?.toUpperCase() + side.slice(1)}
              suffix="mm"
              value={margins[side]}
              min={0}
              max={500}
              step={1}
              error={margins[side] === null ? 'Enter a number.' : undefined}
              onChange={(value) => setMargins((current) => ({ ...current, [side]: value }))}
              testId={`margin-${side}`}
            />
          ))}
        </div>
      ) : (
        <SelectInput<Paper>
          label="Paper size"
          value={paper}
          options={[
            { value: 'a4', label: 'A4 (210 × 297 mm)' },
            { value: 'letter', label: 'US Letter (8.5 × 11 in)' },
            { value: 'legal', label: 'US Legal (8.5 × 14 in)' },
            { value: 'a3', label: 'A3 (297 × 420 mm)' },
            { value: 'a5', label: 'A5 (148 × 210 mm)' },
          ]}
          onChange={setPaper}
          testId="paper"
        />
      )}
      <PageSelection label="Pages" value={pages} onChange={setPages} />
    </SingleFileTool>
  );
}
