import type { ProcessedFile, SerializedToolError } from '@niftyfix/tool-sdk';
import {
  toFileList,
  type JobInput,
  type PreloadRequest,
  type RunRequest,
  type WorkerMessage,
} from './protocol';

/** Minimal surface of a Worker, so the pool can be tested without real workers. */
export interface WorkerLike {
  postMessage(message: RunRequest | PreloadRequest): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

export interface JobHandlers {
  onProgress?(fraction: number, stage?: string): void;
}

export type JobOutcome =
  { ok: true; result: ProcessedFile } | { ok: false; error: SerializedToolError };

export interface JobHandle {
  readonly promise: Promise<JobOutcome>;
  /** Cancel: terminates the worker running the job (WASM/encoders cannot be interrupted otherwise). */
  cancel(): void;
}

interface PendingJob {
  request: RunRequest;
  handlers: JobHandlers;
  resolve(outcome: JobOutcome): void;
  timer?: ReturnType<typeof setTimeout>;
}

interface Slot {
  worker: WorkerLike;
  job: PendingJob | null;
}

export interface WorkerPoolOptions {
  createWorker(): WorkerLike;
  size: number;
  /** Per-job hard limit; the worker is terminated and replaced when exceeded. */
  timeoutMs: number;
}

let counter = 0;
const nextJobId = (): string => `job-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/**
 * A fixed set of workers, one job each at a time. A crashed, cancelled or
 * timed-out worker is replaced, so one bad file cannot take down the others.
 */
export class WorkerPool {
  private readonly slots: Slot[] = [];
  private readonly queue: PendingJob[] = [];
  private disposed = false;

  constructor(private readonly options: WorkerPoolOptions) {
    if (!(options.size >= 1)) throw new RangeError('Pool size must be at least 1.');
  }

  run(toolId: string, file: JobInput, options: unknown, handlers: JobHandlers = {}): JobHandle {
    let pending!: PendingJob;
    const promise = new Promise<JobOutcome>((resolve) => {
      pending = {
        request: { type: 'run', jobId: nextJobId(), toolId, files: toFileList(file), options },
        handlers,
        resolve,
      };
    });
    if (this.disposed) {
      pending.resolve({
        ok: false,
        error: { code: 'CANCELLED', message: 'The tool was closed.', retryable: true },
      });
    } else {
      this.queue.push(pending);
      this.pump();
    }
    return { promise, cancel: () => this.cancel(pending) };
  }

  /**
   * Ask an idle worker (starting one if allowed) to load a tool's processor
   * now, so a heavy engine downloads while the user is still choosing settings.
   * Best effort: does nothing when every worker is busy.
   */
  preload(toolId: string): void {
    if (this.disposed) return;
    this.freeSlot()?.worker.postMessage({ type: 'preload', toolId });
  }

  /** Terminate all workers and fail queued jobs. */
  dispose(): void {
    this.disposed = true;
    for (const job of this.queue.splice(0)) {
      job.resolve({
        ok: false,
        error: { code: 'CANCELLED', message: 'The tool was closed.', retryable: true },
      });
    }
    for (const slot of this.slots) {
      if (slot.job)
        this.finish(slot, {
          ok: false,
          error: { code: 'CANCELLED', message: 'The tool was closed.', retryable: true },
        });
      slot.worker.terminate();
    }
    this.slots.length = 0;
  }

  get activeCount(): number {
    return this.slots.filter((slot) => slot.job !== null).length;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  private cancel(job: PendingJob): void {
    const queued = this.queue.indexOf(job);
    if (queued >= 0) {
      this.queue.splice(queued, 1);
      job.resolve({
        ok: false,
        error: { code: 'CANCELLED', message: 'Processing was cancelled.', retryable: true },
      });
      return;
    }
    const slot = this.slots.find((s) => s.job === job);
    if (slot) {
      this.finish(slot, {
        ok: false,
        error: { code: 'CANCELLED', message: 'Processing was cancelled.', retryable: true },
      });
      this.replaceWorker(slot);
      this.pump();
    }
  }

  private pump(): void {
    while (this.queue.length > 0) {
      const slot = this.freeSlot();
      if (slot === null) return;
      const job = this.queue.shift();
      if (job === undefined) return;
      slot.job = job;
      job.timer = setTimeout(() => {
        if (slot.job !== job) return;
        this.finish(slot, {
          ok: false,
          error: {
            code: 'TIMEOUT',
            message: 'Processing took too long and was stopped.',
            hint: 'Try a smaller file or simpler settings.',
            retryable: true,
          },
        });
        this.replaceWorker(slot);
        this.pump();
      }, this.options.timeoutMs);
      slot.worker.postMessage(job.request);
    }
  }

  private freeSlot(): Slot | null {
    const idle = this.slots.find((slot) => slot.job === null);
    if (idle) return idle;
    if (this.slots.length < this.options.size) {
      const slot: Slot = { worker: this.options.createWorker(), job: null };
      this.attach(slot);
      this.slots.push(slot);
      return slot;
    }
    return null;
  }

  private attach(slot: Slot): void {
    slot.worker.onmessage = (event) => {
      const message = event.data;
      const job = slot.job;
      if (job === null || message.jobId !== job.request.jobId) return;
      if (message.type === 'progress') {
        job.handlers.onProgress?.(message.fraction, message.stage);
        return;
      }
      this.finish(
        slot,
        message.type === 'done'
          ? { ok: true, result: message.result }
          : { ok: false, error: message.error },
      );
      this.pump();
    };
    slot.worker.onerror = (event) => {
      event.preventDefault();
      if (slot.job) {
        this.finish(slot, {
          ok: false,
          error: {
            code: 'ENGINE_CRASHED',
            message: 'The processing engine stopped unexpectedly.',
            hint: 'This can happen when a device runs low on memory. Try a smaller file.',
            retryable: true,
          },
        });
      }
      this.replaceWorker(slot);
      this.pump();
    };
  }

  private finish(slot: Slot, outcome: JobOutcome): void {
    const job = slot.job;
    if (job === null) return;
    clearTimeout(job.timer);
    slot.job = null;
    job.resolve(outcome);
  }

  private replaceWorker(slot: Slot): void {
    slot.worker.onmessage = null;
    slot.worker.onerror = null;
    slot.worker.terminate();
    slot.worker = this.options.createWorker();
    this.attach(slot);
  }
}
