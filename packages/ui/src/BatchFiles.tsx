import { useRef, useState } from 'preact/hooks';
import { downloadBlob, zipFiles, type JobHandle } from '@niftyfix/runtime';
import {
  allChecksPassed,
  formatBytes,
  type ProcessedFile,
  type SerializedToolError,
} from '@niftyfix/tool-sdk';
import { Button } from './Button';
import { cx } from './cx';
import { Panel, ProgressBar } from './feedback';
import { useFocusOnMount } from './focus';
import type { ToolUiProps } from './tool-ui';

export type BatchItem =
  | { file: File; status: 'waiting' }
  | { file: File; status: 'processing'; progress: number }
  | { file: File; status: 'done'; result: ProcessedFile }
  | { file: File; status: 'failed'; error: SerializedToolError };

/**
 * Run one tool over many files, one at a time: phones have little memory, and
 * one large image at a time is what the single-file path already handles.
 * Every file gets its own verified result; a failure never stops the rest.
 */
export function useBatchJob({ run, report }: Pick<ToolUiProps, 'run' | 'report'>) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);
  const current = useRef<JobHandle | null>(null);
  const cancelled = useRef(false);

  const update = (index: number, item: BatchItem): void =>
    setItems((all) => all.map((existing, i) => (i === index ? item : existing)));

  const start = async (files: readonly File[], options: unknown): Promise<void> => {
    cancelled.current = false;
    setItems(files.map((file) => ({ file, status: 'waiting' })));
    setRunning(true);
    report('tool_start');
    let failures = 0;
    for (const [index, file] of files.entries()) {
      if (cancelled.current) break;
      update(index, { file, status: 'processing', progress: 0 });
      const handle = run(file, options, {
        onProgress: (progress) => update(index, { file, status: 'processing', progress }),
      });
      current.current = handle;
      const outcome = await handle.promise;
      if (outcome.ok) {
        update(index, { file, status: 'done', result: outcome.result });
        if (!allChecksPassed(outcome.result.verification)) failures += 1;
      } else if (outcome.error.code === 'CANCELLED') {
        update(index, { file, status: 'waiting' });
        break;
      } else {
        update(index, { file, status: 'failed', error: outcome.error });
        failures += 1;
      }
    }
    current.current = null;
    setRunning(false);
    if (!cancelled.current) {
      if (failures === 0) report('tool_success');
      else report('tool_fail', { code: 'BATCH_PARTIAL' });
    }
  };

  const cancel = (): void => {
    cancelled.current = true;
    current.current?.cancel();
  };

  const reset = (): void => setItems([]);

  return { items, running, start, cancel, reset };
}

export interface BatchFilesProps {
  files: readonly File[];
  batch: ReturnType<typeof useBatchJob>;
  /** Name for the ZIP of all results, without extension. */
  zipName: string;
  busy: boolean;
  onClear(): void;
  report: ToolUiProps['report'];
}

/** The chosen files, their progress, and each file's result with a download. */
export function BatchFiles({ files, batch, zipName, busy, onClear, report }: BatchFilesProps) {
  const [zipping, setZipping] = useState(false);
  const rows: BatchItem[] =
    batch.items.length === files.length
      ? batch.items
      : files.map((file) => ({ file, status: 'waiting' }));
  const finished = !batch.running && batch.items.some((item) => item.status === 'done');
  const ready = rows.filter(
    (item): item is Extract<BatchItem, { status: 'done' }> =>
      item.status === 'done' && allChecksPassed(item.result.verification),
  );
  const position = rows.findIndex((item) => item.status === 'processing');
  const active = rows[position];
  const overall =
    position < 0
      ? 0
      : (position + (active?.status === 'processing' ? active.progress : 0)) / rows.length;
  const statusRef = useFocusOnMount<HTMLParagraphElement>(finished);

  const downloadAll = async (): Promise<void> => {
    setZipping(true);
    try {
      const zip = await zipFiles(
        ready.map((item) => ({ name: item.result.fileName, blob: item.result.blob })),
      );
      downloadBlob(zip, `${zipName}.zip`);
      report('download');
    } finally {
      setZipping(false);
    }
  };

  return (
    <Panel>
      <div class="flex flex-col gap-4" data-testid="batch">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-medium">{files.length} files</p>
          <Button variant="ghost" disabled={busy} onClick={onClear}>
            Choose other files
          </Button>
        </div>

        {batch.running ? (
          <div class="flex flex-col gap-3">
            <ProgressBar value={overall} label={`Processing ${position + 1} of ${rows.length}`} />
            <div>
              <Button variant="secondary" onClick={batch.cancel} data-testid="cancel">
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {finished ? (
          <div class="flex flex-col gap-3">
            <p
              ref={statusRef}
              tabIndex={-1}
              role="status"
              data-testid="batch-summary"
              class={cx(
                'rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium',
                ready.length === rows.length
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
              )}
            >
              {ready.length === rows.length
                ? `All ${rows.length} files are ready.`
                : `${ready.length} of ${rows.length} files are ready. See below for the others.`}
            </p>
            {ready.length > 0 ? (
              <Button
                size="lg"
                fullWidth
                disabled={zipping}
                onClick={() => void downloadAll()}
                data-testid="download-all"
              >
                {zipping ? 'Preparing ZIP…' : `Download all (${ready.length}) as ZIP`}
              </Button>
            ) : null}
          </div>
        ) : null}

        <ul
          class="flex flex-col divide-y divide-stone-200 dark:divide-stone-800"
          data-testid="batch-list"
        >
          {rows.map((item, index) => (
            <li
              key={index}
              class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
              data-testid="batch-item"
              data-status={item.status}
            >
              <span class="min-w-0 flex-1 truncate" title={item.file.name}>
                <span class="font-medium">{item.file.name}</span>
                <span class="text-stone-600 dark:text-stone-400">
                  {' '}
                  · {formatBytes(item.file.size)}
                </span>
              </span>
              {item.status === 'waiting' ? (
                <span class="text-stone-600 dark:text-stone-400">Waiting</span>
              ) : item.status === 'processing' ? (
                <span class="text-stone-700 dark:text-stone-300">
                  {Math.round(item.progress * 100)}%
                </span>
              ) : item.status === 'failed' ? (
                <span class="w-full text-red-700 dark:text-red-400">{item.error.message}</span>
              ) : allChecksPassed(item.result.verification) ? (
                <>
                  <span class="text-emerald-800 dark:text-emerald-300">
                    ✓ {formatBytes(item.result.bytes)}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      downloadBlob(item.result.blob, item.result.fileName);
                      report('download');
                    }}
                    data-testid="batch-download"
                  >
                    Download
                  </Button>
                  {item.result.warnings.map((warning) => (
                    <span key={warning} class="w-full text-xs text-amber-800 dark:text-amber-300">
                      {warning}
                    </span>
                  ))}
                </>
              ) : (
                <span class="w-full text-red-700 dark:text-red-400">
                  The produced file failed a check. Please report this; do not upload it.
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
