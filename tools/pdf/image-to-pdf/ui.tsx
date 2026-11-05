import { useEffect, useRef, useState } from 'preact/hooks';
import { downloadBlob, ObjectUrlRegistry } from '@niftyfix/runtime';
import {
  Button,
  Dropzone,
  ErrorView,
  FileQueue,
  FileResultPanel,
  NumberInput,
  Panel,
  ProcessingPanel,
  SegmentedControl,
  useFileQueue,
  useToolJob,
  type ToolUiProps,
} from '@niftyfix/ui';
import { MAX_IMAGES, type ImageToPdfOptions } from './options';
import { fileInput } from '@niftyfix/tool-sdk';

const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.avif,.bmp,.gif,image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif';

export default function ImageToPdf({ manifest, device, run, preload, report }: ToolUiProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const queue = useFileQueue(fileInput(manifest), device);
  const [pageSize, setPageSize] = useState<ImageToPdfOptions['pageSize']>('a4');
  const [orientation, setOrientation] = useState<ImageToPdfOptions['orientation']>('auto');
  const [margin, setMargin] = useState<number | null>(18);
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

  const marginError =
    pageSize === 'fit' || (margin !== null && margin >= 0 && margin <= 72)
      ? null
      : 'Between 0 and 72 points.';
  const start = (): void => {
    if (queue.items.length === 0 || marginError) return;
    void job.start(
      queue.items.map((item) => item.file),
      {
        pageSize,
        orientation,
        margin: pageSize === 'fit' ? 0 : (margin ?? 0),
        maxPixels,
        fileName: '',
      },
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
          detail={`JPEG, PNG, WebP, AVIF, BMP or GIF · up to ${MAX_IMAGES} images · stays on your device`}
          onFiles={(files) => void add(files)}
        />
        {rejected}
      </div>
    );
  }

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel title={`Pages (${queue.items.length})`}>
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
                title="Add more images"
                detail="Added images become the last pages"
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
            successMessage="Your PDF is ready, one image per page."
            disclaimer="The PDF was opened again to confirm it has one page per image."
            onDownload={() => {
              downloadBlob(phase.result.blob, phase.result.fileName);
              report('download');
            }}
          />
        ) : null}
      </div>

      <Panel title="Page layout" class="h-fit">
        <form
          class="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          <SegmentedControl
            label="Page size"
            value={pageSize}
            options={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'Letter' },
              { value: 'fit', label: 'Image size' },
            ]}
            onChange={(value) => {
              changed();
              setPageSize(value);
            }}
          />
          {pageSize === 'fit' ? null : (
            <>
              <SegmentedControl
                label="Orientation"
                value={orientation}
                options={[
                  { value: 'auto', label: 'Automatic' },
                  { value: 'portrait', label: 'Portrait' },
                  { value: 'landscape', label: 'Landscape' },
                ]}
                onChange={(value) => {
                  changed();
                  setOrientation(value);
                }}
              />
              <NumberInput
                label="Margin"
                suffix="pt"
                value={margin}
                min={0}
                max={72}
                step={1}
                error={marginError ?? undefined}
                hint="72 pt = 1 inch (2.54 cm)."
                onChange={(value) => {
                  changed();
                  setMargin(value);
                }}
              />
            </>
          )}
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={marginError !== null || job.busy}
            data-testid="prepare"
          >
            {job.busy ? 'Creating…' : 'Create PDF'}
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
