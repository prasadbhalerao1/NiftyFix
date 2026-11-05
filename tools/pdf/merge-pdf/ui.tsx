import { useEffect, useRef, useState } from 'preact/hooks';
import { downloadBlob, ObjectUrlRegistry } from '@niftyfix/runtime';
import { fileInput, fileNameError } from '@niftyfix/tool-sdk';
import {
  Button,
  Dropzone,
  ErrorView,
  FileQueue,
  FileResultPanel,
  Panel,
  ProcessingPanel,
  TextInput,
  useFileQueue,
  useToolJob,
  type ToolUiProps,
} from '@niftyfix/ui';
import { MAX_FILES, MIN_FILES } from './options';

const ACCEPT = '.pdf,application/pdf';

export default function MergePdf({ manifest, device, run, preload, report }: ToolUiProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const queue = useFileQueue(fileInput(manifest), device);
  const [fileName, setFileName] = useState('');
  const job = useToolJob<null>({ run, report }, urls.current);
  const { phase } = job;
  const limitMb = Math.round(
    (device === 'high'
      ? fileInput(manifest).maxBytes.desktop
      : fileInput(manifest).maxBytes.mobile) / 1_000_000,
  );

  useEffect(() => () => urls.current.revokeAll(), []);

  // Any change to the inputs invalidates a previous result.
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

  const nameError = fileNameError(fileName);
  const enough = queue.items.length >= MIN_FILES;
  const start = (): void => {
    if (!enough || nameError) return;
    void job.start(
      queue.items.map((item) => item.file),
      { fileName: fileName.trim() },
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
          title="Choose PDF files"
          detail={`Up to ${MAX_FILES} PDFs · ${limitMb} MB each · stays on your device`}
          onFiles={(files) => void add(files)}
        />
        {rejected}
      </div>
    );
  }

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel title={`Files to merge (${queue.items.length})`}>
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
            {queue.items.length < MAX_FILES ? (
              <Dropzone
                compact
                accept={ACCEPT}
                multiple
                title="Add more PDFs"
                detail="Added files go to the end of the list"
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
            successMessage="Your PDFs are merged into one file."
            disclaimer="The merged file was opened again and its page count checked. Bookmarks and form fields from the original files are not included."
            onDownload={() => {
              downloadBlob(phase.result.blob, phase.result.fileName);
              report('download');
            }}
          />
        ) : null}
      </div>

      <Panel title="Merge" class="h-fit">
        <form
          class="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          <TextInput
            label="File name (optional)"
            value={fileName}
            placeholder="merged"
            error={nameError ?? undefined}
            onChange={(value) => {
              changed();
              setFileName(value);
            }}
            hint="Leave empty to use the first file's name."
            testId="file-name"
          />
          {enough ? null : (
            <p class="text-sm text-stone-600 dark:text-stone-400">Add at least {MIN_FILES} PDFs.</p>
          )}
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!enough || nameError !== null || job.busy}
            data-testid="prepare"
          >
            {job.busy ? 'Merging…' : `Merge ${queue.items.length} PDFs`}
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
