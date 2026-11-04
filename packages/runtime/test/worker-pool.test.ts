import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProcessedFile } from '@niftyfix/tool-sdk';
import type { PreloadRequest, RunRequest, WorkerMessage } from '../src/protocol';
import { WorkerPool, type WorkerLike } from '../src/worker-pool';

class FakeWorker implements WorkerLike {
  static all: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  received: RunRequest[] = [];
  preloads: PreloadRequest[] = [];
  terminated = false;

  constructor() {
    FakeWorker.all.push(this);
  }

  postMessage(message: RunRequest | PreloadRequest): void {
    if (message.type === 'preload') this.preloads.push(message);
    else this.received.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  reply(message: WorkerMessage): void {
    this.onmessage?.({ data: message } as MessageEvent<WorkerMessage>);
  }

  crash(): void {
    this.onerror?.({ preventDefault() {} } as ErrorEvent);
  }
}

const result: ProcessedFile = {
  blob: new Blob(['x']),
  fileName: 'x.jpg',
  format: 'jpeg',
  bytes: 1,
  facts: [],
  verification: [],
  warnings: [],
};
const file = { name: 'a.jpg', bytes: 1, blob: new Blob(['a']) };

function pool(size = 1, timeoutMs = 60_000) {
  return new WorkerPool({ createWorker: () => new FakeWorker(), size, timeoutMs });
}

afterEach(() => {
  FakeWorker.all = [];
  vi.useRealTimers();
});

describe('WorkerPool', () => {
  it('runs a job and reports progress', async () => {
    const p = pool();
    const progress: number[] = [];
    const handle = p.run(
      'forms.photo-resizer',
      file,
      { a: 1 },
      { onProgress: (f) => progress.push(f) },
    );
    const worker = FakeWorker.all[0]!;
    const { jobId } = worker.received[0]!;
    worker.reply({ type: 'progress', jobId, fraction: 0.5 });
    worker.reply({ type: 'done', jobId, result });
    await expect(handle.promise).resolves.toEqual({ ok: true, result });
    expect(progress).toEqual([0.5]);
  });

  it('queues jobs beyond the pool size and runs them in order', async () => {
    const p = pool(1);
    const first = p.run('t', file, {});
    const second = p.run('t', file, {});
    expect(p.activeCount).toBe(1);
    expect(p.queuedCount).toBe(1);
    const worker = FakeWorker.all[0]!;
    worker.reply({ type: 'done', jobId: worker.received[0]!.jobId, result });
    await first.promise;
    expect(worker.received).toHaveLength(2);
    worker.reply({ type: 'done', jobId: worker.received[1]!.jobId, result });
    await expect(second.promise).resolves.toMatchObject({ ok: true });
  });

  it('cancels a running job by terminating and replacing its worker', async () => {
    const p = pool(1);
    const handle = p.run('t', file, {});
    handle.cancel();
    await expect(handle.promise).resolves.toMatchObject({
      ok: false,
      error: { code: 'CANCELLED' },
    });
    expect(FakeWorker.all[0]!.terminated).toBe(true);
    expect(FakeWorker.all).toHaveLength(2);
    // A late reply from the terminated worker is ignored.
    FakeWorker.all[0]!.reply({ type: 'done', jobId: 'stale', result });
  });

  it('cancels a queued job without touching workers', async () => {
    const p = pool(1);
    p.run('t', file, {});
    const queued = p.run('t', file, {});
    queued.cancel();
    await expect(queued.promise).resolves.toMatchObject({
      ok: false,
      error: { code: 'CANCELLED' },
    });
    expect(FakeWorker.all[0]!.terminated).toBe(false);
  });

  it('times out a stuck job and recovers', async () => {
    vi.useFakeTimers();
    const p = pool(1, 1000);
    const stuck = p.run('t', file, {});
    const next = p.run('t', file, {});
    vi.advanceTimersByTime(1001);
    await expect(stuck.promise).resolves.toMatchObject({ ok: false, error: { code: 'TIMEOUT' } });
    const replacement = FakeWorker.all[1]!;
    expect(replacement.received).toHaveLength(1);
    replacement.reply({ type: 'done', jobId: replacement.received[0]!.jobId, result });
    await expect(next.promise).resolves.toMatchObject({ ok: true });
  });

  it('isolates a crashing worker', async () => {
    const p = pool(1);
    const handle = p.run('t', file, {});
    FakeWorker.all[0]!.crash();
    await expect(handle.promise).resolves.toMatchObject({
      ok: false,
      error: { code: 'ENGINE_CRASHED' },
    });
    expect(FakeWorker.all).toHaveLength(2);
  });

  it('passes failures through unchanged', async () => {
    const p = pool(1);
    const handle = p.run('t', file, {});
    const worker = FakeWorker.all[0]!;
    const error = { code: 'TARGET_UNREACHABLE' as const, message: 'no', retryable: false };
    worker.reply({ type: 'failed', jobId: worker.received[0]!.jobId, error });
    await expect(handle.promise).resolves.toEqual({ ok: false, error });
  });

  it('fails everything on dispose', async () => {
    const p = pool(1);
    const running = p.run('t', file, {});
    const queued = p.run('t', file, {});
    p.dispose();
    await expect(running.promise).resolves.toMatchObject({ ok: false });
    await expect(queued.promise).resolves.toMatchObject({ ok: false });
    await expect(p.run('t', file, {}).promise).resolves.toMatchObject({
      ok: false,
      error: { code: 'CANCELLED' },
    });
  });
});

describe('WorkerPool.preload', () => {
  it('asks an idle worker to load the processor, starting one if needed', () => {
    const p = pool(2);
    p.preload('pdf.merge-pdf');
    expect(FakeWorker.all).toHaveLength(1);
    expect(FakeWorker.all[0]?.preloads).toEqual([{ type: 'preload', toolId: 'pdf.merge-pdf' }]);
  });

  it('never waits behind a running job and does nothing after dispose', () => {
    const p = pool(1);
    p.run('t', file, {});
    p.preload('t');
    expect(FakeWorker.all[0]?.preloads).toEqual([]);
    p.dispose();
    p.preload('t');
    expect(FakeWorker.all).toHaveLength(1);
  });
});
