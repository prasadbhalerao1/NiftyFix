import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  downloadBlob,
  ObjectUrlRegistry,
  validateFile,
  validateFileCount,
} from '@niftyfix/runtime';
import { formatBytes, toSerializedError, type SerializedToolError } from '@niftyfix/tool-sdk';
import { BatchFiles, useBatchJob } from './BatchFiles';
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
  /**
   * Cheap identity for options, when they hold large data (e.g. image bytes) that
   * would be slow to compare as JSON on every render. Defaults to the options' JSON.
   */
  optionsKey?: string;
  /** Optional live preview of the chosen file, shown under the file name. */
  preview?: (file: File) => ComponentChildren;
  /** Told when a valid file is chosen (or cleared), for settings that depend on it. */
  onFileChange?: (file: File | null) => void;
}

/**
 * The layout every one-file-in, one-file-out tool shares: choose a file
 * (validated by content), adjust settings, run in the worker with progress
 * and cancel, then a verified result with download. The engine starts
 * loading as soon as a file is chosen. Tools marked `batch` in their manifest
 * also accept several files: each runs through the same steps in turn, with
 * its own result, and all results download as one ZIP.
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
  optionsKey: customKey,
  children,
  preview,
  onFileChange,
}: SingleFileToolProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const [file, setFile] = useState<File | null>(null);
  // Tools whose settings suit any file also take several at once (manifest: batch).
  const batchable = manifest.capabilities.batch && manifest.input.maxFiles > 1;
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [inputError, setInputError] = useState<SerializedToolError | null>(null);
  const job = useToolJob<null>({ run, report }, urls.current);
  const batch = useBatchJob({ run, report });
  const { phase } = job;
  const optionsKey = customKey ?? JSON.stringify(options);
  const limitMb = Math.round(
    (device === 'high' ? manifest.input.maxBytes.desktop : manifest.input.maxBytes.mobile) /
      1_000_000,
  );

  useEffect(() => () => urls.current.revokeAll(), []);
  // Changed settings make an earlier result stale.
  useEffect(() => {
    if (phase.kind === 'done' || phase.kind === 'failed') job.reset();
    if (!batch.running) batch.reset();
  }, [optionsKey]);

  const chooseMany = async (files: File[]): Promise<void> => {
    try {
      validateFileCount(files.length, manifest.input);
    } catch (error) {
      setInputError(toSerializedError(error));
      return;
    }
    const valid: File[] = [];
    const rejected: string[] = [];
    let firstError: unknown = null;
    for (const candidate of files) {
      try {
        await validateFile(candidate, manifest.input, device);
        valid.push(candidate);
      } catch (error) {
        rejected.push(candidate.name);
        firstError ??= error;
      }
    }
    if (valid.length === 0) {
      setInputError(toSerializedError(firstError));
      return;
    }
    setSkipped(rejected);
    if (valid.length === 1) {
      await choose(valid);
      return;
    }
    batch.reset();
    setBatchFiles(valid);
    report('file_selected');
    preload();
  };

  const choose = async (files: File[]): Promise<void> => {
    if (batchable && files.length > 1) return chooseMany(files);
    const next = files[0];
    if (!next) return;
    setInputError(null);
    try {
      await validateFile(next, manifest.input, device);
      job.reset();
      setFile(next);
      onFileChange?.(next);
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

  const settings = (onSubmit: () => void, busy: boolean) => (
    <Panel title={settingsTitle} class="h-fit">
      <form
        class="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={options === null || busy}
          data-testid="prepare"
        >
          {busy ? busyLabel : actionLabel}
        </Button>
      </form>
    </Panel>
  );

  const skippedNotice =
    skipped.length > 0 ? (
      <p
        class="rounded-[var(--radius-control)] bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        data-testid="skipped-files"
      >
        Skipped (not a supported or readable file): {skipped.join(', ')}
      </p>
    ) : null;

  if (batchFiles) {
    return (
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="flex min-w-0 flex-col gap-4">
          {skippedNotice}
          <BatchFiles
            files={batchFiles}
            batch={batch}
            zipName={`niftyfix-${manifest.slug}`}
            busy={batch.running}
            report={report}
            onClear={() => {
              batch.reset();
              setBatchFiles(null);
              setSkipped([]);
            }}
          />
        </div>
        {settings(() => {
          if (options !== null) void batch.start(batchFiles, options);
        }, batch.running)}
      </div>
    );
  }

  if (!file) {
    return (
      <div class="flex flex-col gap-4">
        <Dropzone
          accept={accept}
          title={chooseTitle}
          detail={
            batchable
              ? `One or up to ${manifest.input.maxFiles} files, ${limitMb} MB each · stays on your device`
              : `Up to ${limitMb} MB · stays on your device`
          }
          multiple={batchable}
          onFiles={(files) => void choose(files)}
        />
        {inputError ? <ErrorView error={inputError} /> : null}
      </div>
    );
  }

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        {skippedNotice}
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
                setSkipped([]);
                onFileChange?.(null);
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

      {settings(start, job.busy)}
    </div>
  );
}
