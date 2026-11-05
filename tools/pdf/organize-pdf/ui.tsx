import { useEffect, useRef, useState } from 'preact/hooks';
import { downloadBlob, ObjectUrlRegistry, validateFile } from '@niftyfix/runtime';
import {
  fileInput,
  formatBytes,
  toSerializedError,
  type SerializedToolError,
} from '@niftyfix/tool-sdk';
import {
  Button,
  Dropzone,
  ErrorView,
  FileResultPanel,
  Panel,
  PdfPageGrid,
  ProcessingPanel,
  usePdfPreview,
  useToolJob,
  type PageCard,
  type ToolUiProps,
} from '@niftyfix/ui';

const ACCEPT = '.pdf,application/pdf';

export default function OrganizePdf({ manifest, device, run, preload, report }: ToolUiProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const [file, setFile] = useState<File | null>(null);
  const [inputError, setInputError] = useState<SerializedToolError | null>(null);
  const { preview, error: previewError } = usePdfPreview(file);
  const [pages, setPages] = useState<PageCard[]>([]);
  const job = useToolJob<null>({ run, report }, urls.current);
  const { phase } = job;

  useEffect(() => () => urls.current.revokeAll(), []);
  const original = (): PageCard[] =>
    Array.from({ length: preview?.pageCount ?? 0 }, (_, index) => ({
      index,
      rotation: 0,
      removed: false,
    }));
  useEffect(() => setPages(original()), [preview]);

  const choose = async (files: File[]): Promise<void> => {
    const next = files[0];
    if (!next) return;
    setInputError(null);
    try {
      await validateFile(next, fileInput(manifest), device);
      job.reset();
      setFile(next);
      report('file_selected');
      preload();
    } catch (error) {
      setInputError(toSerializedError(error));
    }
  };
  const edit = (next: PageCard[]): void => {
    if (phase.kind === 'done' || phase.kind === 'failed') job.reset();
    setPages(next);
  };

  const kept = pages.filter((page) => !page.removed);
  const changed = pages.some(
    (page, position) => page.removed || page.rotation !== 0 || page.index !== position,
  );
  const start = (): void => {
    if (!file || kept.length === 0) return;
    void job.start(
      file,
      { pages: kept.map(({ index, rotation }) => ({ index, rotation })), fileName: '' },
      null,
    );
  };

  if (!file) {
    return (
      <div class="flex flex-col gap-4">
        <Dropzone
          accept={ACCEPT}
          title="Choose a PDF"
          detail={`Up to ${Math.round((device === 'high' ? fileInput(manifest).maxBytes.desktop : fileInput(manifest).maxBytes.mobile) / 1_000_000)} MB · stays on your device`}
          onFiles={(files) => void choose(files)}
        />
        {inputError ? <ErrorView error={inputError} /> : null}
      </div>
    );
  }

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel>
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p class="min-w-0 truncate text-sm" title={file.name} data-testid="chosen-file">
              <span class="font-medium">{file.name}</span>
              <span class="text-stone-600 dark:text-stone-400">
                {' '}
                · {formatBytes(file.size)}
                {preview ? ` · ${preview.pageCount} pages` : ''}
              </span>
            </p>
            <Button
              variant="ghost"
              disabled={job.busy}
              onClick={() => {
                job.reset();
                setFile(null);
              }}
            >
              Choose another file
            </Button>
          </div>
          {previewError ? <ErrorView error={previewError} /> : null}
          {!preview && !previewError ? (
            <p class="py-10 text-center text-sm text-stone-600 dark:text-stone-400" role="status">
              Loading pages…
            </p>
          ) : null}
          {preview ? (
            <PdfPageGrid preview={preview} pages={pages} onChange={edit} disabled={job.busy} />
          ) : null}
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
            successMessage="Your PDF is organized."
            disclaimer="The file was opened again to confirm the page count and every page's rotation."
            onDownload={() => {
              downloadBlob(phase.result.blob, phase.result.fileName);
              report('download');
            }}
          />
        ) : null}
      </div>

      <Panel title="Save" class="h-fit lg:sticky lg:top-4">
        <div class="flex flex-col gap-4">
          <p class="text-sm text-stone-700 dark:text-stone-300" data-testid="page-summary">
            {kept.length} of {pages.length} pages kept
            {pages.length - kept.length > 0 ? ` · ${pages.length - kept.length} removed` : ''}
          </p>
          <Button
            variant="secondary"
            disabled={job.busy || !preview}
            onClick={() =>
              edit(
                pages.map((page) => ({
                  ...page,
                  rotation: ((page.rotation + 90) % 360) as PageCard['rotation'],
                })),
              )
            }
          >
            Rotate all right
          </Button>
          <Button
            variant="secondary"
            disabled={job.busy || !changed}
            onClick={() => edit(original())}
          >
            Reset
          </Button>
          {kept.length === 0 && pages.length > 0 ? (
            <p class="text-sm text-red-800 dark:text-red-300">Keep at least one page.</p>
          ) : null}
          <Button
            size="lg"
            fullWidth
            disabled={!preview || kept.length === 0 || job.busy}
            onClick={start}
            data-testid="prepare"
          >
            {job.busy ? 'Saving…' : 'Save PDF'}
          </Button>
        </div>
      </Panel>
    </div>
  );
}
