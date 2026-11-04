import { describe, expect, it, vi } from 'vitest';
import * as v from 'valibot';
import {
  defineMultiFileProcessor,
  defineProcessor,
  ToolError,
  type ProcessedFile,
} from '@niftyfix/tool-sdk';
import { JobRunner } from '../src/job-runner';
import { executeJob } from '../src/execute';
import type { JobHandle, JobOutcome } from '../src/worker-pool';

const result: ProcessedFile = {
  blob: new Blob(['ok']),
  fileName: 'o.txt',
  format: 'png',
  bytes: 2,
  facts: [],
  verification: [],
  warnings: [],
};
const file = { name: 'a.png', bytes: 1, blob: new Blob(['a']) };

const processor = defineProcessor({
  options: v.object({ size: v.number() }),
  async run(_input, options, context) {
    context.progress(0.5, 'half');
    if (options.size < 0) throw new ToolError('TARGET_UNREACHABLE', 'Too small.');
    if (options.size === 0) throw new Error('internal detail /secret/path');
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    return result;
  },
});
const loader = async () => ({ default: processor });

const poolReturning = (outcome: JobOutcome) => ({
  run: vi.fn((): JobHandle => ({ promise: Promise.resolve(outcome), cancel: vi.fn() })),
});

describe('executeJob', () => {
  it('validates options and runs', async () => {
    const progress = vi.fn();
    await expect(
      executeJob(loader, file, { size: 1 }, { signal: new AbortController().signal, progress }),
    ).resolves.toEqual({ ok: true, result });
    expect(progress).toHaveBeenCalledWith(0.5, 'half');
  });

  it('rejects invalid options and missing tools', async () => {
    const ctx = { signal: new AbortController().signal, progress: () => undefined };
    await expect(executeJob(loader, file, { size: 'x' }, ctx)).resolves.toMatchObject({
      ok: false,
      error: { code: 'INVALID_OPTIONS' },
    });
    await expect(executeJob(undefined, file, {}, ctx)).resolves.toMatchObject({
      ok: false,
      error: { code: 'ENGINE_CRASHED' },
    });
  });

  it('passes tool errors through and hides unexpected ones', async () => {
    const ctx = { signal: new AbortController().signal, progress: () => undefined };
    await expect(executeJob(loader, file, { size: -1 }, ctx)).resolves.toMatchObject({
      error: { code: 'TARGET_UNREACHABLE' },
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const outcome = await executeJob(loader, file, { size: 0 }, ctx);
    expect(outcome).toMatchObject({ ok: false, error: { code: 'UNKNOWN' } });
    expect(JSON.stringify(outcome)).not.toContain('secret');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('JobRunner', () => {
  it('uses the worker pool when it works', async () => {
    const pool = poolReturning({ ok: true, result });
    const runner = new JobRunner(pool, () => loader);
    await expect(runner.run('t.x', file, { size: 1 }).promise).resolves.toEqual({
      ok: true,
      result,
    });
    expect(runner.usingMainThread).toBe(false);
  });

  it('falls back to the main thread when workers lack an API, and stays there', async () => {
    const pool = poolReturning({
      ok: false,
      error: { code: 'WORKER_UNSUPPORTED', message: 'no', retryable: true },
    });
    const runner = new JobRunner(pool, () => loader);
    await expect(runner.run('t.x', file, { size: 1 }).promise).resolves.toEqual({
      ok: true,
      result,
    });
    expect(runner.usingMainThread).toBe(true);
    await runner.run('t.x', file, { size: 1 }).promise;
    expect(pool.run).toHaveBeenCalledTimes(1);
  });

  it('does not fall back for ordinary failures', async () => {
    const pool = poolReturning({
      ok: false,
      error: { code: 'CORRUPT_INPUT', message: 'bad', retryable: false },
    });
    const runner = new JobRunner(pool, () => loader);
    await expect(runner.run('t.x', file, { size: 1 }).promise).resolves.toMatchObject({
      ok: false,
      error: { code: 'CORRUPT_INPUT' },
    });
    expect(runner.usingMainThread).toBe(false);
  });

  it('cancels main-thread jobs cooperatively', async () => {
    const pool = poolReturning({
      ok: false,
      error: { code: 'WORKER_UNSUPPORTED', message: 'no', retryable: true },
    });
    const runner = new JobRunner(pool, () => loader);
    await runner.run('t.x', file, { size: 1 }).promise; // switch to inline
    const handle = runner.run('t.x', file, { size: 1 });
    handle.cancel();
    await expect(handle.promise).resolves.toMatchObject({
      ok: false,
      error: { code: 'CANCELLED' },
    });
  });
});

describe('executeJob — file count', () => {
  const ctx = { signal: new AbortController().signal, progress: () => {} };
  const merge = defineMultiFileProcessor({
    options: v.object({}),
    inputs: { min: 2, max: 3 },
    async run(inputs) {
      return { ...result, fileName: inputs.map((input) => input.name).join('+') };
    },
  });
  const load = async () => ({ default: merge });

  it('passes every file, in order, to a multi-file processor', async () => {
    const outcome = await executeJob(load, [file, { ...file, name: 'b.png' }], {}, ctx);
    expect(outcome).toMatchObject({ ok: true, result: { fileName: 'a.png+b.png' } });
  });

  it('rejects too few or too many files before running', async () => {
    for (const files of [[file], [file, file, file, file]]) {
      await expect(executeJob(load, files, {}, ctx)).resolves.toMatchObject({
        ok: false,
        error: { code: 'TOO_MANY_FILES' },
      });
    }
  });

  it('a single-file processor refuses several files', async () => {
    await expect(executeJob(loader, [file, file], { size: 1 }, ctx)).resolves.toMatchObject({
      ok: false,
      error: { code: 'TOO_MANY_FILES' },
    });
  });
});
