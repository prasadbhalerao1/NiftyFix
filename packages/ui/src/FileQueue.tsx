import { useState } from 'preact/hooks';
import { validateFile, type DeviceClass } from '@niftyfix/runtime';
import {
  formatBytes,
  toSerializedError,
  ToolError,
  type FileFormatId,
  type FileInputSpec,
  type SerializedToolError,
} from '@niftyfix/tool-sdk';
import { Button } from './Button';

export interface QueuedFile {
  id: string;
  file: File;
  format: FileFormatId;
}

let nextId = 0;

/**
 * An ordered list of input files for tools that combine several (merge, images
 * to PDF). Each file is validated by content as it is added; a bad file is
 * reported by name and skipped without dropping the good ones.
 */
export function useFileQueue(spec: FileInputSpec, device: DeviceClass) {
  const [items, setItems] = useState<QueuedFile[]>([]);
  const [errors, setErrors] = useState<{ name: string; error: SerializedToolError }[]>([]);

  const add = async (files: readonly File[]): Promise<number> => {
    const accepted: QueuedFile[] = [];
    const rejected: { name: string; error: SerializedToolError }[] = [];
    const room = spec.maxFiles - items.length;
    for (const [index, file] of files.entries()) {
      if (index >= room) {
        rejected.push({
          name: file.name,
          error: toSerializedError(
            new ToolError(
              'TOO_MANY_FILES',
              `You can combine up to ${spec.maxFiles} files at once.`,
            ),
          ),
        });
        continue;
      }
      try {
        const { format } = await validateFile(file, spec, device);
        nextId += 1;
        accepted.push({ id: `f${nextId}`, file, format });
      } catch (error) {
        rejected.push({ name: file.name, error: toSerializedError(error) });
      }
    }
    setItems((current) => [...current, ...accepted]);
    setErrors(rejected);
    return accepted.length;
  };

  const move = (id: string, delta: -1 | 1): void =>
    setItems((current) => {
      const from = current.findIndex((item) => item.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to] as QueuedFile, next[from] as QueuedFile];
      return next;
    });

  const remove = (id: string): void =>
    setItems((current) => current.filter((item) => item.id !== id));
  const clear = (): void => {
    setItems([]);
    setErrors([]);
  };

  return { items, errors, add, move, remove, clear };
}

export interface FileQueueProps {
  items: readonly QueuedFile[];
  disabled?: boolean;
  onMove(id: string, delta: -1 | 1): void;
  onRemove(id: string): void;
}

/** The ordered file list with move and remove controls (keyboard and screen-reader friendly). */
export function FileQueue({ items, disabled = false, onMove, onRemove }: FileQueueProps) {
  return (
    <ol class="flex flex-col gap-2" data-testid="file-queue">
      {items.map((item, index) => (
        <li
          key={item.id}
          class="flex items-center gap-3 rounded-[var(--radius-control)] border border-stone-200 bg-paper px-3 py-2 dark:border-stone-800 dark:bg-stone-900"
          data-testid="queued-file"
        >
          <span class="w-6 shrink-0 text-right text-sm tabular-nums text-stone-600 dark:text-stone-400">
            {index + 1}.
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium" title={item.file.name}>
              {item.file.name}
            </span>
            <span class="text-xs text-stone-600 dark:text-stone-400">
              {formatBytes(item.file.size)}
            </span>
          </span>
          <span class="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              disabled={disabled || index === 0}
              aria-label={`Move ${item.file.name} up`}
              onClick={() => onMove(item.id, -1)}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              disabled={disabled || index === items.length - 1}
              aria-label={`Move ${item.file.name} down`}
              onClick={() => onMove(item.id, 1)}
            >
              ↓
            </Button>
            <Button
              variant="ghost"
              disabled={disabled}
              aria-label={`Remove ${item.file.name}`}
              onClick={() => onRemove(item.id)}
            >
              ✕
            </Button>
          </span>
        </li>
      ))}
    </ol>
  );
}
