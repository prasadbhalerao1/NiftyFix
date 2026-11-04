import { useEffect, useRef, useState } from 'preact/hooks';
import type { PreviewDocument } from '@niftyfix/engine-pdf/preview';
import { toSerializedError, type SerializedToolError } from '@niftyfix/tool-sdk';
import { Button } from './Button';
import { cx } from './cx';

/** Thumbnail width in CSS pixels. */
const THUMB = 150;

/**
 * Open a PDF for previews. pdf.js loads only now (a lazy chunk), and its
 * parser runs in its own worker.
 */
export function usePdfPreview(file: File | null): {
  preview: PreviewDocument | null;
  error: SerializedToolError | null;
} {
  const [preview, setPreview] = useState<PreviewDocument | null>(null);
  const [error, setError] = useState<SerializedToolError | null>(null);
  useEffect(() => {
    if (!file) return;
    let alive = true;
    let opened: PreviewDocument | null = null;
    setPreview(null);
    setError(null);
    import('@niftyfix/engine-pdf/preview')
      .then(({ openPreview }) => openPreview(file))
      .then(
        (doc) => {
          opened = doc;
          if (alive) setPreview(doc);
          else void doc.close();
        },
        (reason) => alive && setError(toSerializedError(reason)),
      );
    return () => {
      alive = false;
      void opened?.close();
    };
  }, [file]);
  return { preview, error };
}

/** Renders queued thumbnails two at a time, so scrolling stays smooth. */
class RenderQueue {
  private running = 0;
  private readonly waiting: (() => Promise<void>)[] = [];
  add(task: () => Promise<void>): void {
    this.waiting.push(task);
    this.next();
  }
  private next(): void {
    while (this.running < 2 && this.waiting.length > 0) {
      const task = this.waiting.shift();
      if (!task) return;
      this.running += 1;
      void task()
        .catch(() => undefined)
        .finally(() => {
          this.running -= 1;
          this.next();
        });
    }
  }
}

/** One page thumbnail, drawn when it first scrolls into view. */
export function PdfThumbnail({
  preview,
  index,
  rotation = 0,
  queue,
}: {
  preview: PreviewDocument;
  index: number;
  rotation?: number;
  queue: RenderQueue;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const size = preview.sizes[index] ?? { width: 1, height: 1.414 };

  useEffect(() => {
    const target = box.current;
    if (!target || drawn) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        queue.add(async () => {
          if (canvas.current) await preview.render(index, canvas.current, THUMB);
          setDrawn(true);
        });
      },
      { rootMargin: '400px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [preview, index, drawn, queue]);

  const sideways = rotation % 180 !== 0;
  const aspect = sideways ? size.height / size.width : size.width / size.height;
  return (
    <div
      ref={box}
      class="flex w-full items-center justify-center overflow-hidden"
      style={{ aspectRatio: `${Math.max(aspect, 0.5)} / 1`, maxHeight: '220px' }}
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        class={cx(
          'max-h-full max-w-full bg-white shadow-sm ring-1 ring-stone-200 transition-transform dark:ring-stone-700',
          drawn ? '' : 'animate-pulse bg-stone-100 dark:bg-stone-800',
        )}
        style={{
          transform: `rotate(${rotation}deg)`,
          ...(sideways ? { maxWidth: '70%' } : {}),
        }}
      />
    </div>
  );
}

export interface PageCard {
  /** Stable id: the original page index. */
  index: number;
  /** Extra clockwise rotation chosen by the user. */
  rotation: 0 | 90 | 180 | 270;
  removed: boolean;
}

export interface PdfPageGridProps {
  preview: PreviewDocument;
  pages: readonly PageCard[];
  onChange(pages: PageCard[]): void;
  disabled?: boolean;
}

const turn = (rotation: number, by: number): PageCard['rotation'] =>
  ((((rotation + by) % 360) + 360) % 360) as PageCard['rotation'];

/**
 * Reorder, rotate and remove pages. Drag and drop on pointer devices; every
 * action also has a labelled button, so keyboard and touch users can do the same.
 */
export function PdfPageGrid({ preview, pages, onChange, disabled = false }: PdfPageGridProps) {
  const queue = useRef(new RenderQueue());
  const [dragging, setDragging] = useState<number | null>(null);

  const update = (position: number, patch: Partial<PageCard>): void =>
    onChange(pages.map((page, i) => (i === position ? { ...page, ...patch } : page)));
  const move = (from: number, to: number): void => {
    if (to < 0 || to >= pages.length || from === to) return;
    const next = [...pages];
    const [card] = next.splice(from, 1);
    if (card) next.splice(to, 0, card);
    onChange(next);
  };

  return (
    <ol class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" data-testid="page-grid">
      {pages.map((page, position) => {
        const label = `Page ${page.index + 1}`;
        return (
          // Drag and drop is a pointer convenience only: every action it offers (move) also
          // has a labelled button below, usable by keyboard, touch and screen readers.
          // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
          <li
            key={page.index}
            draggable={!disabled}
            onDragStart={(event) => {
              setDragging(position);
              event.dataTransfer?.setData('text/plain', String(position));
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragging !== null) move(dragging, position);
              setDragging(null);
            }}
            onDragEnd={() => setDragging(null)}
            class={cx(
              'flex flex-col gap-2 rounded-[var(--radius-control)] border bg-paper p-2 dark:bg-stone-900',
              dragging === position
                ? 'border-brand-600 opacity-60 dark:border-brand-400'
                : 'border-stone-200 dark:border-stone-800',
            )}
            data-testid="page-card"
            data-page={page.index + 1}
            data-removed={page.removed ? 'true' : 'false'}
            data-rotation={page.rotation}
          >
            <div class="relative">
              <div class={cx(page.removed && 'opacity-30 grayscale')}>
                <PdfThumbnail
                  preview={preview}
                  index={page.index}
                  rotation={page.rotation}
                  queue={queue.current}
                />
              </div>
              {page.removed ? (
                <span class="absolute inset-0 flex items-center justify-center">
                  <span class="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-900">
                    Removed
                  </span>
                </span>
              ) : null}
            </div>
            <p class="text-center text-xs font-medium text-stone-700 dark:text-stone-300">
              {position + 1}. {label}
            </p>
            <div class="grid grid-cols-5 gap-0.5">
              <Button
                variant="ghost"
                disabled={disabled || position === 0}
                aria-label={`Move ${label} earlier`}
                onClick={() => move(position, position - 1)}
              >
                ←
              </Button>
              <Button
                variant="ghost"
                disabled={disabled}
                aria-label={`Rotate ${label} left`}
                onClick={() => update(position, { rotation: turn(page.rotation, -90) })}
              >
                ↺
              </Button>
              <Button
                variant="ghost"
                disabled={disabled}
                aria-label={page.removed ? `Restore ${label}` : `Remove ${label}`}
                aria-pressed={page.removed}
                onClick={() => update(position, { removed: !page.removed })}
              >
                {page.removed ? '↶' : '✕'}
              </Button>
              <Button
                variant="ghost"
                disabled={disabled}
                aria-label={`Rotate ${label} right`}
                onClick={() => update(position, { rotation: turn(page.rotation, 90) })}
              >
                ↻
              </Button>
              <Button
                variant="ghost"
                disabled={disabled || position === pages.length - 1}
                aria-label={`Move ${label} later`}
                onClick={() => move(position, position + 1)}
              >
                →
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
