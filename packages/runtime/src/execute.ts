import { safeParse } from 'valibot';
import {
  ToolError,
  toSerializedError,
  type ProcessingContext,
  type ProcessorDefinition,
} from '@niftyfix/tool-sdk';
import { toFileList, type JobInput } from './protocol';
import type { JobOutcome } from './worker-pool';

export type ProcessorLoader = () => Promise<{ default: ProcessorDefinition }>;

/**
 * The one place a processor is executed, inside a worker or, as a fallback,
 * on the main thread: load lazily, validate untrusted options, run, and turn
 * any failure into a safe, user-presentable error.
 */
export async function executeJob(
  load: ProcessorLoader | undefined,
  input: JobInput,
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
    const files = toFileList(input);
    if (files.length < processor.inputs.min || files.length > processor.inputs.max) {
      throw new ToolError(
        'TOO_MANY_FILES',
        processor.inputs.max === 1
          ? 'Please choose one file.'
          : `Please choose between ${processor.inputs.min} and ${processor.inputs.max} files.`,
      );
    }
    return { ok: true, result: await processor.run(files, parsed.output, context) };
  } catch (error) {
    const serialized = toSerializedError(error);
    // Unexpected failures are logged locally for debugging; the console never leaves the device.
    if (serialized.code === 'UNKNOWN') console.error('[niftyfix] processor failed', error);
    return { ok: false, error: serialized };
  }
}
