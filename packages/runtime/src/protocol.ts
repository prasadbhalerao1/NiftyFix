import type { ProcessedFile, SerializedToolError } from '@niftyfix/tool-sdk';

/** Main thread → worker. Blobs are structured-cloned by reference, not copied. */
export interface RunRequest {
  type: 'run';
  jobId: string;
  toolId: string;
  file: { name: string; bytes: number; blob: Blob };
  options: unknown;
}

export type WorkerMessage =
  | { type: 'progress'; jobId: string; fraction: number; stage?: string }
  | { type: 'done'; jobId: string; result: ProcessedFile }
  | { type: 'failed'; jobId: string; error: SerializedToolError };
