import { useEffect, useRef, useState } from 'preact/hooks';
import { downloadBlob, ObjectUrlRegistry } from '@niftyfix/runtime';
import {
  Button,
  CheckboxInput,
  Dropzone,
  ErrorView,
  FileQueue,
  FileResultPanel,
  NumberInput,
  Panel,
  ProcessingPanel,
  SegmentedControl,
  SelectInput,
  useFileQueue,
  useToolJob,
  type ToolUiProps,
} from '@niftyfix/ui';
import { fileInput } from '@niftyfix/tool-sdk';
import { MAX_IMAGES, MIN_IMAGES, type CombineImagesOptions } from './options';

const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.avif,.bmp,.gif,image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif';

type Arrangement = CombineImagesOptions['arrangement'];
const ARRANGEMENTS: readonly Arrangement[] = ['vertical', 'horizontal', 'grid', 'id-a4'];

export default function CombineImages({
  manifest,
  device,
  run,
  preload,
  report,
  preset,
}: ToolUiProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const queue = useFileQueue(fileInput(manifest), device);
  const [arrangement, setArrangement] = useState<Arrangement>(
    ARRANGEMENTS.find((value) => value === preset) ?? 'vertical',
  );
  const [columns, setColumns] = useState(2);
  const [gap, setGap] = useState<number | null>(20);
  const [cutLines, setCutLines] = useState(true);
  const [format, setFormat] = useState<CombineImagesOptions['format']>('jpeg');
  const job = useToolJob<null>({ run, report }, urls.current);
  const { phase } = job;
  const limit = fileInput(manifest).maxPixels;
  const maxPixels = limit ? (device === 'high' ? limit.desktop : limit.mobile) : 50_000_000;

  useEffect(() => () => urls.current.revokeAll(), []);

  const changed = (): void => {
    if (phase.kind === 'done' || phase.kind === 'failed') job.reset();
  };
  const add = async (files: File[]): Promise<void> => {
    changed();
    if ((await queue.add(files)) > 0) {
      report('file_selected');
      preload();
    }
  };

  const idCards = arrangement === 'id-a4';
  const gapError =
    idCards || (gap !== null && gap >= 0 && gap <= 200) ? null : 'Between 0 and 200 pixels.';
  const tooFew = queue.items.length < MIN_IMAGES;
  const start = (): void => {
    if (tooFew || gapError) return;
    void job.start(
      queue.items.map((item) => item.file),
      { arrangement, columns, gap: gap ?? 0, cutLines, format, maxPixels, fileName: '' },
      null,
    );
  };

  const rejected = queue.errors.length > 0 && (
    <ul class="flex flex-col gap-2" data-testid="rejected-files">
      {queue.errors.map(({ name, error }) => (
        <li key={name} class="text-sm text-red-800 dark:text-red-300">
          <span class="font-medium">{name}:</span> {error.message}
          {error.hint ? ` ${error.hint}` : ''}
        </li>
      ))}
    </ul>
  );

  if (queue.items.length === 0) {
    return (
      <div class="flex flex-col gap-4">
        <Dropzone
          accept={ACCEPT}
          multiple
          title="Choose images"
          detail={`2 to ${MAX_IMAGES} images, such as the front and back of a card · stays on your device`}
          onFiles={(files) => void add(files)}
        />
        {rejected}
      </div>
    );
  }

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel title={`Images (${queue.items.length})`}>
          <div class="flex flex-col gap-3">
            <FileQueue
              items={queue.items}
              disabled={job.busy}
              onMove={(id, delta) => {
                changed();
                queue.move(id, delta);
              }}
              onRemove={(id) => {
                changed();
                queue.remove(id);
              }}
            />
            {queue.items.length < MAX_IMAGES ? (
              <Dropzone
                compact
                accept={ACCEPT}
                multiple
                title={tooFew ? 'Add one more image' : 'Add more images'}
                detail="Added images go last"
                onFiles={(files) => void add(files)}
              />
            ) : null}
            {rejected}
          </div>
        </Panel>
        {phase.kind === 'processing' ? (
          <ProcessingPanel handle={phase.handle} progress={phase.progress} stage={phase.stage} />
        ) : null}
        {phase.kind === 'failed' ? (
          <ErrorView error={phase.error} onRetry={start} focusOnMount />
        ) : null}
        {phase.kind === 'done' ? (
          <FileResultPanel
            result={phase.result}
            successMessage={
              idCards
                ? 'Your A4 page is ready to print at 100% scale.'
                : 'Your combined image is ready.'
            }
            disclaimer="The image was opened again to confirm its size and format."
            onDownload={() => {
              downloadBlob(phase.result.blob, phase.result.fileName);
              report('download');
            }}
          />
        ) : null}
      </div>

      <Panel title="Layout" class="h-fit">
        <form
          class="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          <SelectInput<Arrangement>
            label="Arrange"
            value={arrangement}
            options={[
              { value: 'vertical', label: 'One under another' },
              { value: 'horizontal', label: 'Side by side' },
              { value: 'grid', label: 'Grid' },
              { value: 'id-a4', label: 'ID card front and back on A4' },
            ]}
            hint={
              idCards
                ? 'Each image is placed at real card size (85.6 x 54 mm) on an A4 page, for printing.'
                : 'Images are matched in size so the edges line up. Nothing is enlarged.'
            }
            onChange={(value) => {
              changed();
              setArrangement(value);
            }}
            testId="arrangement"
          />
          {arrangement === 'grid' ? (
            <SegmentedControl
              label="Columns"
              value={String(columns)}
              options={['2', '3', '4'].map((value) => ({ value, label: value }))}
              onChange={(value) => {
                changed();
                setColumns(Number(value));
              }}
            />
          ) : null}
          {idCards ? (
            <CheckboxInput
              label="Cutting guides"
              checked={cutLines}
              hint="A thin grey line around each card."
              onChange={(checked) => {
                changed();
                setCutLines(checked);
              }}
            />
          ) : (
            <NumberInput
              label="Space between images"
              suffix="px"
              value={gap}
              min={0}
              max={200}
              step={1}
              error={gapError ?? undefined}
              onChange={(value) => {
                changed();
                setGap(value);
              }}
              testId="gap"
            />
          )}
          <SegmentedControl
            label="Format"
            value={format}
            options={[
              { value: 'jpeg', label: 'JPG' },
              { value: 'png', label: 'PNG' },
            ]}
            onChange={(value) => {
              changed();
              setFormat(value);
            }}
          />
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={tooFew || gapError !== null || job.busy}
            data-testid="prepare"
          >
            {job.busy ? 'Combining…' : tooFew ? 'Add at least 2 images' : 'Combine images'}
          </Button>
          <Button
            variant="ghost"
            disabled={job.busy}
            onClick={() => {
              job.reset();
              queue.clear();
            }}
          >
            Start over
          </Button>
        </form>
      </Panel>
    </div>
  );
}
