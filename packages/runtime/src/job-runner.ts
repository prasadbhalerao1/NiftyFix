import { executeJob, type ProcessorLoader } from './execute';
import type { JobInput } from './protocol';
import type { JobHandle, JobHandlers, JobOutcome, WorkerPool } from './worker-pool';

/**
 * Runs jobs in the worker pool. If a worker reports WORKER_UNSUPPORTED (the
 * browser's workers lack an API such as OffscreenCanvas), the job — and every
 * later job — runs on the frame's main thread instead. Main-thread jobs cancel
 * cooperatively via AbortSignal rather than by terminating a worker.
 */
export class JobRunner {
  private inline = false;

  constructor(
    private readonly pool: Pick<WorkerPool, 'run'> & Partial<Pick<WorkerPool, 'preload'>>,
    private readonly loadProcessor: (toolId: string) => ProcessorLoader | undefined,
  ) {}

  /** Start loading a tool's processor ahead of its first job. */
  preload(toolId: string): void {
    if (this.inline) {
      void this.loadProcessor(toolId)?.().catch(() => undefined);
      return;
    }
    this.pool.preload?.(toolId);
  }

  get usingMainThread(): boolean {
    return this.inline;
  }

  run(toolId: string, file: JobInput, options: unknown, handlers: JobHandlers = {}): JobHandle {
    if (this.inline) return this.runInline(toolId, file, options, handlers);
    let current = this.pool.run(toolId, file, options, handlers);
    let cancelled = false;
    const promise = current.promise.then((outcome): Promise<JobOutcome> | JobOutcome => {
      if (outcome.ok || outcome.error.code !== 'WORKER_UNSUPPORTED' || cancelled) return outcome;
      this.inline = true;
      current = this.runInline(toolId, file, options, handlers);
      return current.promise;
    });
    return {
      promise,
      cancel: () => {
        cancelled = true;
        current.cancel();
      },
    };
  }

  private runInline(
    toolId: string,
    file: JobInput,
    options: unknown,
    handlers: JobHandlers,
  ): JobHandle {
    const controller = new AbortController();
    const promise = executeJob(this.loadProcessor(toolId), file, options, {
      signal: controller.signal,
      progress: (fraction, stage) => handlers.onProgress?.(fraction, stage),
    }).then((outcome): JobOutcome =>
      !outcome.ok && controller.signal.aborted
        ? {
            ok: false,
            error: { code: 'CANCELLED', message: 'Processing was cancelled.', retryable: true },
          }
        : outcome,
    );
    return { promise, cancel: () => controller.abort() };
  }
}
