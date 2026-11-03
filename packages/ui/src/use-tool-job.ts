import { useState } from 'preact/hooks';
import type { JobHandle, ObjectUrlRegistry } from '@niftyfix/runtime';
import { allChecksPassed, type ProcessedFile, type SerializedToolError } from '@niftyfix/tool-sdk';
import type { ToolUiProps } from './tool-ui';

export type JobPhase<M> =
  | { kind: 'idle' }
  | { kind: 'processing'; handle: JobHandle; progress: number; stage: string }
  | { kind: 'done'; result: ProcessedFile; url: string; meta: M }
  | { kind: 'failed'; error: SerializedToolError };

/**
 * The shared processing lifecycle for a tool UI: run → progress → done/failed,
 * cancellation, result object-URL ownership and content-free analytics events.
 * `meta` carries tool-specific facts about the request (e.g. output size).
 */
export function useToolJob<M>(
  { run, report }: Pick<ToolUiProps, 'run' | 'report'>,
  urls: ObjectUrlRegistry,
) {
  const [phase, setPhase] = useState<JobPhase<M>>({ kind: 'idle' });

  const reset = (): void => {
    if (phase.kind === 'done') urls.revoke(phase.url);
    setPhase({ kind: 'idle' });
  };

  const start = async (file: File, options: unknown, meta: M): Promise<void> => {
    const handle = run(file, options, {
      onProgress: (progress, stage) =>
        setPhase((current) =>
          current.kind === 'processing'
            ? { ...current, progress, stage: stage ?? current.stage }
            : current,
        ),
    });
    setPhase({ kind: 'processing', handle, progress: 0, stage: 'Starting' });
    report('tool_start');
    const outcome = await handle.promise;
    if (outcome.ok) {
      setPhase({
        kind: 'done',
        result: outcome.result,
        url: urls.create(outcome.result.blob),
        meta,
      });
      if (allChecksPassed(outcome.result.verification)) report('tool_success');
      else report('tool_fail', { code: 'VERIFICATION_FAILED' });
      return;
    }
    if (outcome.error.code === 'CANCELLED') {
      setPhase({ kind: 'idle' });
      return;
    }
    setPhase({ kind: 'failed', error: outcome.error });
    report('tool_fail', { code: outcome.error.code });
  };

  return { phase, start, reset, busy: phase.kind === 'processing' };
}
