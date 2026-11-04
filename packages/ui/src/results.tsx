import type { ComponentChildren } from 'preact';
import type { JobHandle } from '@niftyfix/runtime';
import { allChecksPassed, type ProcessedFile } from '@niftyfix/tool-sdk';
import { BeforeAfter } from './BeforeAfter';
import { Button } from './Button';
import { cx } from './cx';
import { FactList, Panel, ProgressBar, ValidationReport } from './feedback';
import { useFocusOnMount } from './focus';

export function ProcessingPanel({
  handle,
  progress,
  stage,
}: {
  handle: JobHandle;
  progress: number;
  stage: string;
}) {
  return (
    <Panel>
      <ProgressBar value={progress} label={stage} />
      <div class="mt-3">
        <Button variant="secondary" onClick={() => handle.cancel()} data-testid="cancel">
          Cancel
        </Button>
      </div>
    </Panel>
  );
}

export interface FileResultPanelProps {
  result: ProcessedFile;
  /** Sentence shown when every check passed, e.g. "Your PDF is ready." */
  successMessage: string;
  /** Tool-specific reminder of what the checks cannot cover. */
  disclaimer: string;
  /** Optional visual comparison, shown under the status line. */
  preview?: ComponentChildren;
  onDownload(): void;
}

/** Status, optional preview, measured validation report, warnings, facts and download. */
export function FileResultPanel({
  result,
  successMessage,
  disclaimer,
  preview,
  onDownload,
}: FileResultPanelProps) {
  const passed = allChecksPassed(result.verification);
  // On phones the result renders above the settings panel; bring it into view.
  const statusRef = useFocusOnMount<HTMLParagraphElement>();
  return (
    <Panel>
      <div class="flex flex-col gap-5" data-testid="result">
        <p
          ref={statusRef}
          tabIndex={-1}
          role="status"
          class={cx(
            'rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium',
            passed
              ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200',
          )}
        >
          {passed
            ? successMessage
            : 'The produced file failed a check below. Please report this; do not upload it.'}
        </p>
        {preview}
        <ValidationReport checks={result.verification} />
        {result.warnings.map((warning) => (
          <p
            key={warning}
            class="text-sm text-amber-800 dark:text-amber-300"
            data-testid="result-warning"
          >
            {warning}
          </p>
        ))}
        <FactList facts={result.facts} />
        <Button
          size="lg"
          fullWidth
          onClick={onDownload}
          data-testid="download"
          variant={passed ? 'primary' : 'secondary'}
        >
          Download {result.fileName}
        </Button>
        <p class="text-xs text-stone-600 dark:text-stone-400">{disclaimer}</p>
      </div>
    </Panel>
  );
}

export interface ImageResultPanelProps {
  result: ProcessedFile;
  url: string;
  size: { width: number; height: number };
  original: { url: string; width: number; height: number; bytes: number };
  /** "photo", "signature" — used in the status sentence. */
  subject: string;
  disclaimer: string;
  onDownload(): void;
}

/** The file result panel with a before/after comparison of the image. */
export function ImageResultPanel({
  result,
  url,
  size,
  original,
  subject,
  ...rest
}: ImageResultPanelProps) {
  return (
    <FileResultPanel
      result={result}
      successMessage={`Your ${subject} meets every requirement you entered.`}
      preview={
        <BeforeAfter
          before={{ ...original, label: 'Original' }}
          after={{ url, label: 'Prepared', ...size, bytes: result.bytes }}
        />
      }
      {...rest}
    />
  );
}
