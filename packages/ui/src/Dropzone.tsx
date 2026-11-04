import { useRef, useState } from 'preact/hooks';
import { cx } from './cx';

export interface DropzoneProps {
  /** `accept` attribute for the file picker (a hint only; content is validated later). */
  accept: string;
  multiple?: boolean;
  title: string;
  /** e.g. "JPEG, PNG or WebP · up to 30 MB on this device" */
  detail: string;
  onFiles(files: File[]): void;
}

/** File input with drag-and-drop and paste. The whole area is one large keyboard-focusable button. */
export function Dropzone({ accept, multiple = false, title, detail, onFiles }: DropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = (list: FileList | null | undefined): void => {
    const files = list ? [...list] : [];
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          take(event.dataTransfer?.files);
        }}
        onPaste={(event) => take(event.clipboardData?.files)}
        class={cx(
          'flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-panel)] border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging
            ? 'border-teal-600 bg-teal-50 dark:border-teal-400 dark:bg-teal-950'
            : 'border-stone-300 bg-white hover:border-teal-600 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-teal-400 dark:hover:bg-stone-800',
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          class="size-10 text-teal-700 dark:text-teal-400"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</span>
        <span class="text-sm text-stone-600 dark:text-stone-400">
          or drag and drop · paste with Ctrl+V
        </span>
        <span class="text-xs text-stone-500 dark:text-stone-400">{detail}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        class="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="file-input"
        onChange={(event) => {
          take(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
