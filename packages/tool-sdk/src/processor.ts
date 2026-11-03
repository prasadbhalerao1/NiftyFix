import type { GenericSchema, InferOutput } from 'valibot';
import type { FileFormatId } from './formats';

/** A file handed to a processor inside the worker. */
export interface ToolInputFile {
  name: string;
  bytes: number;
  blob: Blob;
}

export interface ProcessingContext {
  /** Aborted when the user cancels. Processors check it between expensive steps. */
  signal: AbortSignal;
  /** Report progress in [0, 1] with an optional short stage label. */
  progress(fraction: number, stage?: string): void;
}

export type VerificationStatus = 'pass' | 'fail' | 'not-checked';

/** One line of the validation report shown to the user. */
export interface VerificationCheck {
  id: string;
  label: string;
  /** Human-readable requirement, e.g. "200 × 230 px". */
  required: string;
  /** Measured on the produced file, e.g. "200 × 230 px". */
  actual: string;
  status: VerificationStatus;
  note?: string;
}

export interface OutputFact {
  label: string;
  value: string;
}

export interface ProcessedFile {
  blob: Blob;
  fileName: string;
  format: FileFormatId;
  bytes: number;
  facts: readonly OutputFact[];
  verification: readonly VerificationCheck[];
  warnings: readonly string[];
}

export interface ProcessorDefinition<S extends GenericSchema = GenericSchema> {
  /** Options are untrusted (they cross a worker boundary): validated before `run`. */
  options: S;
  run(
    input: ToolInputFile,
    options: InferOutput<S>,
    context: ProcessingContext,
  ): Promise<ProcessedFile>;
}

export const defineProcessor = <S extends GenericSchema>(
  definition: ProcessorDefinition<S>,
): ProcessorDefinition<S> => definition;

/** A result is a success only if every requested check passed. */
export function allChecksPassed(checks: readonly VerificationCheck[]): boolean {
  return checks.every((check) => check.status !== 'fail');
}
