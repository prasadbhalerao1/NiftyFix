import { useEffect, useState } from 'preact/hooks';
import {
  imageDisplaySize,
  NumberInput,
  RangeInput,
  SegmentedControl,
  SingleFileTool,
  type ToolUiProps,
} from '@niftyfix/ui';
import { coverArea, planTiles, type Mode, type Shape } from './layout';
import type { SplitImageOptions } from './options';

type Paper = SplitImageOptions['paper'];

/** The image with the cut lines and each piece's number drawn over it. */
function GridPreview({
  url,
  size,
  options,
}: {
  url: string;
  size: { width: number; height: number };
  options: SplitImageOptions;
}) {
  const layout = { ...options, overlap: options.overlap / 100 };
  const tiles = planTiles(size, layout);
  const area = coverArea(size, layout);
  const pct = (value: number, total: number): string => `${(value / total) * 100}%`;
  return (
    <div
      class="relative w-full"
      style={{ aspectRatio: `${size.width} / ${size.height}` }}
      data-testid="grid-preview"
    >
      <img src={url} alt="" class="absolute inset-0 h-full w-full" />
      {/* Parts outside the pieces (cropped away) are dimmed. */}
      <div
        class="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
        style={{
          left: pct(area.x, size.width),
          top: pct(area.y, size.height),
          width: pct(area.width, size.width),
          height: pct(area.height, size.height),
        }}
      />
      {tiles.map((tile) => (
        <div
          key={`${tile.row}-${tile.col}`}
          class="absolute flex items-start justify-start border border-white/90 p-1"
          style={{
            left: pct(tile.x, size.width),
            top: pct(tile.y, size.height),
            width: pct(tile.width, size.width),
            height: pct(tile.height, size.height),
          }}
        >
          <span class="rounded bg-stone-950/75 px-1.5 text-xs font-semibold text-white">
            {tile.order}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SplitImage(props: ToolUiProps) {
  const [image, setImage] = useState<{
    url: string;
    size: { width: number; height: number };
  } | null>(null);
  const [mode, setMode] = useState<Mode>(props.preset === 'instagram' ? 'instagram' : 'grid');
  const [rows, setRows] = useState(props.preset === 'instagram' ? 3 : 2);
  const [cols, setCols] = useState(props.preset === 'instagram' ? 3 : 2);
  const [shape, setShape] = useState<Shape>('4:5');
  const [overlap, setOverlap] = useState(5);
  const [paper, setPaper] = useState<Paper>('a4');
  useEffect(() => () => (image ? URL.revokeObjectURL(image.url) : undefined), [image]);

  const options: SplitImageOptions = { mode, rows, cols, shape, overlap, paper, fileName: '' };
  const valid = rows >= 1 && rows <= 10 && cols >= 1 && cols <= 10 && rows * cols >= 2;

  return (
    <SingleFileTool
      {...props}
      accept="image/*"
      chooseTitle="Choose an image"
      settingsTitle="Split"
      actionLabel={mode === 'poster' ? 'Make poster PDF' : 'Split image'}
      busyLabel="Splitting…"
      successMessage={
        mode === 'poster' ? 'Your poster is ready to print.' : 'Your pieces are ready.'
      }
      disclaimer="Every piece was measured after saving to confirm it has exactly its planned size."
      options={valid ? options : null}
      onFileChange={(file) =>
        void (async () => {
          const size = file ? await imageDisplaySize(file) : null;
          setImage(file && size ? { url: URL.createObjectURL(file), size } : null);
        })()
      }
      preview={() =>
        image ? <GridPreview url={image.url} size={image.size} options={options} /> : null
      }
    >
      <SegmentedControl<Mode>
        label="Make"
        value={mode}
        options={[
          { value: 'grid', label: 'Grid' },
          { value: 'instagram', label: 'Instagram' },
          { value: 'carousel', label: 'Carousel' },
          { value: 'poster', label: 'Poster' },
        ]}
        onChange={setMode}
      />
      {mode !== 'carousel' ? (
        <NumberInput
          label="Rows"
          value={rows}
          min={1}
          max={10}
          step={1}
          onChange={(value) => setRows(value ?? 0)}
          testId="rows"
        />
      ) : null}
      {mode !== 'instagram' ? (
        <NumberInput
          label={mode === 'carousel' ? 'Slides' : 'Columns'}
          value={cols}
          min={1}
          max={10}
          step={1}
          onChange={(value) => setCols(value ?? 0)}
          testId="cols"
        />
      ) : null}
      {mode === 'instagram' || mode === 'carousel' ? (
        <SegmentedControl<Shape>
          label="Post shape"
          value={shape}
          options={[
            { value: '1:1', label: 'Square 1:1' },
            { value: '4:5', label: 'Portrait 4:5' },
            { value: '3:4', label: 'Profile 3:4' },
          ]}
          onChange={setShape}
        />
      ) : null}
      {mode === 'poster' ? (
        <>
          <SegmentedControl<Paper>
            label="Paper"
            value={paper}
            options={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'US Letter' },
            ]}
            onChange={setPaper}
          />
          <RangeInput
            label="Overlap"
            value={overlap}
            min={0}
            max={20}
            step={1}
            format={(v) => `${v}%`}
            hint="Each page repeats a strip of its neighbours, so pieces can be glued or taped without gaps."
            onChange={setOverlap}
          />
        </>
      ) : null}
      {!valid ? (
        <p class="text-sm text-amber-800 dark:text-amber-300">
          Choose at least 2 pieces, up to 10 rows and 10 columns.
        </p>
      ) : null}
    </SingleFileTool>
  );
}
