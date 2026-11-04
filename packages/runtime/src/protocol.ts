import type { ProcessedFile, SerializedToolError } from '@niftyfix/tool-sdk';

export interface JobFile {
  name: string;
  bytes: number;
  blob: Blob;
}

/** One file, or several for tools that combine files (merge, images to PDF). */
export type JobInput = JobFile | readonly JobFile[];

export const toFileList = (input: JobInput): readonly JobFile[] =>
  Array.isArray(input) ? input : [input as JobFile];

/** Main thread → worker. Blobs are structured-cloned by reference, not copied. */
export interface RunRequest {
  type: 'run';
  jobId: string;
  toolId: string;
  files: readonly JobFile[];
  options: unknown;
}

export type WorkerMessage =
  | { type: 'progress'; jobId: string; fraction: number; stage?: string }
  | { type: 'done'; jobId: string; result: ProcessedFile }
  | { type: 'failed'; jobId: string; error: SerializedToolError };
