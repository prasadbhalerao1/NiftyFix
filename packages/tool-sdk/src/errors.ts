/**
 * Closed set of failure codes. Every failure shown to a user maps to one of
 * these, so analytics can count failures without ever seeing file content.
 */
export const ERROR_CODES = [
  'UNSUPPORTED_FORMAT',
  'CORRUPT_INPUT',
  'FILE_TOO_LARGE',
  'TOO_MANY_PIXELS',
  'TOO_MANY_FILES',
  'INVALID_OPTIONS',
  'TARGET_UNREACHABLE',
  'ENCODER_UNAVAILABLE',
  'OUT_OF_MEMORY',
  'TIMEOUT',
  'CANCELLED',
  'ENGINE_CRASHED',
  /** Internal: this browser lacks an API the worker needs; the runtime retries on the main thread. */
  'WORKER_UNSUPPORTED',
  'UNKNOWN',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface SerializedToolError {
  code: ErrorCode;
  message: string;
  hint?: string;
  retryable: boolean;
}

/** An expected, user-explainable failure. `message` is safe to show to the user. */
export class ToolError extends Error {
  override readonly name = 'ToolError';

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly options: { hint?: string; retryable?: boolean } = {},
  ) {
    super(message);
  }

  serialize(): SerializedToolError {
    return {
      code: this.code,
      message: this.message,
      retryable: this.options.retryable ?? false,
      ...(this.options.hint === undefined ? {} : { hint: this.options.hint }),
    };
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value);
}

/**
 * Structural check rather than `instanceof`: bundlers can emit separate copies
 * of this class into a worker and a lazily loaded processor chunk.
 */
export function isToolError(error: unknown): error is ToolError {
  return (
    error instanceof ToolError ||
    (error instanceof Error &&
      error.name === 'ToolError' &&
      isErrorCode((error as { code?: unknown }).code) &&
      typeof (error as { serialize?: unknown }).serialize === 'function')
  );
}

/** Convert anything thrown into a safe, user-presentable error. Never leaks raw exception text. */
export function toSerializedError(error: unknown): SerializedToolError {
  if (isToolError(error)) return error.serialize();
  if (error instanceof DOMException && error.name === 'AbortError') {
    return { code: 'CANCELLED', message: 'Processing was cancelled.', retryable: true };
  }
  if (error instanceof RangeError || (error instanceof Error && /memory/i.test(error.message))) {
    return {
      code: 'OUT_OF_MEMORY',
      message: 'Your device ran out of memory while processing this file.',
      hint: 'Try a smaller image or close other tabs, then try again.',
      retryable: true,
    };
  }
  return {
    code: 'UNKNOWN',
    message: 'Something unexpected went wrong while processing this file.',
    hint: 'Try again. If it keeps happening, please report it with the file type and browser.',
    retryable: true,
  };
}
