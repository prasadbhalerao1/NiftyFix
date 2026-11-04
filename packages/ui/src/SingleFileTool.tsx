import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { downloadBlob, ObjectUrlRegistry, validateFile } from '@niftyfix/runtime';
import { formatBytes, toSerializedError, type SerializedToolError } from '@niftyfix/tool-sdk';
import { Button } from './Button';
import { Dropzone } from './Dropzone';
import { ErrorView, Panel } from './feedback';
import { FileResultPanel, ProcessingPanel } from './results';
import type { ToolUiProps } from './tool-ui';
import { useToolJob } from './use-tool-job';

export interface SingleFileToolProps extends ToolUiProps {
  accept: string;
  /** Drop zone title, e.g. "Choose a PDF". */
  chooseTitle: string;
  /** Title of the settings panel, e.g. "Rotate". */
  settingsTitle: string;
  actionLabel: string;
  busyLabel: string;
  successMessage: string;
  disclaimer: string;
  /** Current options; a change invalidates a previous result. Null while settings are invalid. */
  options: unknown;
  /** Tool-specific settings controls. */
  children?: ComponentChildren;
  /** Optional live preview of the chosen file, shown under the file name. */
  preview?: (file: File) => ComponentChildren;
}

/**
 * The layout every one-file-in, one-file-out tool shares: choose a file
 * (validated by content), adjust settings, run in the worker with progress
 * and cancel, then a verified result with download. The engine starts
 * loading as soon as a file is chosen.
 */
export function SingleFileTool({
  manifest,
  device,
  run,
  preload,
  report,
  accept,
  chooseTitle,
  settingsTitle,
  actionLabel,
  busyLabel,
  successMessage,
  disclaimer,
  options,
  children,
  preview,
}: SingleFileToolProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const [file, setFile] = useState<File | null>(null);
  const [inputError, setInputError] = useState<SerializedToolError | null>(null);
  const job = useToolJob<null>({ run, report }, urls.current);
  const { phase } = job;
  const optionsKey = JSON.stringify(options);
  const limitMb = Math.round(
    (device === 'high' ? manifest.input.maxBytes.desktop : manifest.input.maxBytes.mobile) /
      1_000_000,
  );

  useEffect(() => () => urls.current.revokeAll(), []);
  // Changed settings make an earlier result stale.
  useEffect(() => {
    if (phase.kind === 'done' || phase.kind === 'failed') job.reset();
  }, [optionsKey]);

  const choose = async (files: File[]): Promise<void> => {
    const next = files[0];
    if (!next) return;
    setInputError(null);
    try {
      await validateFile(next, manifest.input, device);
      job.reset();
      setFile(next);
      report('file_selected');
      preload();
    } catch (error) {
      setInputError(toSerializedError(error));
    }
  };

  const start = (): void => {
    if (!file || options === null) return;
    void job.start(file, options, null);
  };

  if (!file) {
    return (
      <div class="flex flex-col gap-4">
        <Dropzone
          accept={accept}
          title={chooseTitle}
          detail={`Up to ${limitMb} MB · stays on your device`}
          onFiles={(files) => void choose(files)}
        />
        {inputError ? <ErrorView error={inputError} /> : null}
      </div>
    );
  }

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="min-w-0 truncate text-sm" title={file.name} data-testid="chosen-file">
              <span class="font-medium">{file.name}</span>
              <span class="text-stone-600 dark:text-stone-400"> · {formatBytes(file.size)}</span>
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
          {preview ? <div class="mt-3">{preview(file)}</div> : null}
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
            successMessage={successMessage}
            disclaimer={disclaimer}
            onDownload={() => {
              downloadBlob(phase.result.blob, phase.result.fileName);
              report('download');
            }}
          />
        ) : null}
      </div>

      <Panel title={settingsTitle} class="h-fit">
        <form
          class="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          {children}
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={options === null || job.busy}
            data-testid="prepare"
          >
            {job.busy ? busyLabel : actionLabel}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
