/**
 * Runs inside a Web Worker. The tool frame passes a map of lazy processor
 * loaders, so a processor (and its engine) is downloaded only when a job for
 * that tool arrives.
 */
import { executeJob, type ProcessorLoader } from './execute';
import type { RunRequest, WorkerMessage } from './protocol';

export type { ProcessorLoader } from './execute';

interface WorkerScope {
  onmessage: ((event: MessageEvent<RunRequest>) => void) | null;
  postMessage(message: WorkerMessage): void;
}

export function hostProcessors(
  scope: WorkerScope,
  loaders: ReadonlyMap<string, ProcessorLoader>,
): void {
  scope.onmessage = (event) => {
    const request = event.data;
    if (request?.type !== 'run') return;
    const { jobId } = request;
    // Cancellation terminates the whole worker, so no per-job AbortController wiring is needed here.
    const signal = new AbortController().signal;
    void executeJob(loaders.get(request.toolId), request.file, request.options, {
      signal,
      progress: (fraction, stage) =>
        scope.postMessage({
          type: 'progress',
          jobId,
          fraction: Math.min(1, Math.max(0, fraction)),
          ...(stage === undefined ? {} : { stage }),
        }),
    }).then((outcome) =>
      scope.postMessage(
        outcome.ok
          ? { type: 'done', jobId, result: outcome.result }
          : { type: 'failed', jobId, error: outcome.error },
      ),
    );
  };
}
