import { safeParse } from 'valibot';
import {
  ToolError,
  toSerializedError,
  type ProcessingContext,
  type ProcessorDefinition,
} from '@niftyfix/tool-sdk';
import type { RunRequest } from './protocol';
import type { JobOutcome } from './worker-pool';

export type ProcessorLoader = () => Promise<{ default: ProcessorDefinition }>;

/**
 * The one place a processor is executed — inside a worker or, as a fallback,
 * on the main thread: load lazily, validate untrusted options, run, and turn
 * any failure into a safe, user-presentable error.
 */
export async function executeJob(
  load: ProcessorLoader | undefined,
  file: RunRequest['file'],
  options: unknown,
  context: ProcessingContext,
): Promise<JobOutcome> {
  try {
    if (load === undefined) {
      throw new ToolError(
        'ENGINE_CRASHED',
        'This tool is not available in this version of the site.',
        {
          hint: 'Reload the page to get the latest version.',
        },
      );
    }
    const { default: processor } = await load();
    const parsed = safeParse(processor.options, options);
    if (!parsed.success) {
      throw new ToolError(
        'INVALID_OPTIONS',
        'Some settings are invalid. Please check them and try again.',
      );
    }
    return { ok: true, result: await processor.run(file, parsed.output, context) };
  } catch (error) {
    const serialized = toSerializedError(error);
    // Unexpected failures are logged locally for debugging; the console never leaves the device.
    if (serialized.code === 'UNKNOWN') console.error('[niftyfix] processor failed', error);
    return { ok: false, error: serialized };
  }
}
