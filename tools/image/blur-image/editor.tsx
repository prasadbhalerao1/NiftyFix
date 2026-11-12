import { useEffect, useRef } from 'preact/hooks';
import { redactPixels } from '@niftyfix/engine-image';
import { cx } from '@niftyfix/ui';
import type { RedactArea } from './options';

const PREVIEW_WIDTH = 1000;
/** Boxes smaller than this (fraction of the shorter side) are a click, not a drag. */
const MIN_FRACTION = 0.01;

export interface EditorProps {
  imageUrl: string;
  size: { width: number; height: number };
  boxes: RedactArea[];
  selected: number | null;
  strength: number;
  newStyle: RedactArea['style'];
  onChange(boxes: RedactArea[], selected: number | null): void;
}

const STYLE_NAMES: Record<RedactArea['style'], string> = {
  black: 'black box',
  white: 'white box',
  pixelate: 'pixelated',
  blur: 'blurred',
};

/**
 * Draw boxes on the image (drag on an empty spot), move them (drag a box),
 * resize them (drag the corner), and see the real result underneath: the
 * preview runs the same code as the saved file. Keyboard: Tab to a box,
 * arrows move it (Shift for bigger steps), Delete removes it.
 */
export function Editor({
  imageUrl,
  size,
  boxes,
  selected,
  strength,
  newStyle,
  onChange,
}: EditorProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement | null>(null);

  const redraw = (): void => {
    const target = canvas.current;
    const source = image.current;
    if (!target || !source?.complete) return;
    const scale = Math.min(1, PREVIEW_WIDTH / size.width);
    const width = Math.max(1, Math.round(size.width * scale));
    const height = Math.max(1, Math.round(size.height * scale));
    target.width = width;
    target.height = height;
    const context = target.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    context.drawImage(source, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    redactPixels(
      { data: pixels.data, width, height },
      boxes.map((box) => ({
        ...box,
        x: box.x * scale,
        y: box.y * scale,
        width: box.width * scale,
        height: box.height * scale,
      })),
      strength,
    );
    context.putImageData(pixels, 0, 0);
  };

  useEffect(() => {
    const element = new Image();
    element.onload = redraw;
    element.src = imageUrl;
    image.current = element;
  }, [imageUrl]);
  useEffect(redraw, [boxes, strength, size]);

  /** Pointer position in image pixels. */
  const toImage = (event: PointerEvent): { x: number; y: number } => {
    const bounds = area.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: Math.min(
        size.width,
        Math.max(0, ((event.clientX - bounds.left) / bounds.width) * size.width),
      ),
      y: Math.min(
        size.height,
        Math.max(0, ((event.clientY - bounds.top) / bounds.height) * size.height),
      ),
    };
  };

  const onPointerDown = (event: PointerEvent): void => {
    const target = event.target as HTMLElement;
    const index = Number(target.closest<HTMLElement>('[data-index]')?.dataset.index ?? NaN);
    const resizing = target.dataset.handle === 'resize';
    const start = toImage(event);
    area.current?.setPointerCapture(event.pointerId);
    event.preventDefault();
    const original = Number.isNaN(index) ? null : boxes[index];
    const drawing = original === null || original === undefined;
    const editing = drawing ? boxes.length : index;
    let current = boxes;
    const move = (moved: PointerEvent): void => {
      const point = toImage(moved);
      let next: RedactArea;
      if (drawing) {
        next = {
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y),
          style: newStyle,
        };
      } else if (resizing) {
        next = {
          ...original,
          width: Math.max(4, Math.min(size.width - original.x, original.width + point.x - start.x)),
          height: Math.max(
            4,
            Math.min(size.height - original.y, original.height + point.y - start.y),
          ),
        };
      } else {
        next = {
          ...original,
          x: Math.min(size.width - original.width, Math.max(0, original.x + point.x - start.x)),
          y: Math.min(size.height - original.height, Math.max(0, original.y + point.y - start.y)),
        };
      }
      current = [...boxes.slice(0, editing), next, ...boxes.slice(editing + 1)];
      onChange(current, editing);
    };
    const up = (): void => {
      area.current?.removeEventListener('pointermove', move);
      area.current?.removeEventListener('pointerup', up);
      area.current?.removeEventListener('pointercancel', up);
      const made = current[editing];
      const tiny = Math.min(size.width, size.height) * MIN_FRACTION;
      if (drawing && (!made || made.width < tiny || made.height < tiny)) {
        onChange(boxes, null);
      } else if (!drawing && current === boxes) {
        onChange(boxes, index);
      }
    };
    area.current?.addEventListener('pointermove', move);
    area.current?.addEventListener('pointerup', up);
    area.current?.addEventListener('pointercancel', up);
  };

  const onKeyDown = (event: KeyboardEvent, index: number): void => {
    const box = boxes[index];
    if (!box) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onChange(
        boxes.filter((_, i) => i !== index),
        null,
      );
      return;
    }
    const step = (event.shiftKey ? 0.05 : 0.01) * Math.min(size.width, size.height);
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = moves[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = {
      ...box,
      x: Math.min(size.width - box.width, Math.max(0, box.x + delta[0])),
      y: Math.min(size.height - box.height, Math.max(0, box.y + delta[1])),
    };
    onChange([...boxes.slice(0, index), next, ...boxes.slice(index + 1)], index);
  };

  const percent = (value: number, total: number): string => `${(value / total) * 100}%`;
  return (
    <div class="flex flex-col gap-2">
      <div
        ref={area}
        class="relative w-full touch-none select-none overflow-hidden rounded-[var(--radius-control)] bg-stone-100 dark:bg-stone-900"
        style={{ aspectRatio: `${size.width} / ${size.height}`, cursor: 'crosshair' }}
        onPointerDown={onPointerDown}
        data-testid="redact-area"
      >
        <canvas
          ref={canvas}
          class="absolute inset-0 h-full w-full"
          aria-label="Preview with your boxes applied"
        />
        {boxes.map((box, index) => (
          <button
            key={index}
            type="button"
            data-index={index}
            aria-label={`Area ${index + 1}, ${STYLE_NAMES[box.style]}. Arrow keys move it, Delete removes it.`}
            class={cx(
              'absolute cursor-move border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              index === selected ? 'border-brand-500' : 'border-dashed border-amber-400',
            )}
            style={{
              left: percent(box.x, size.width),
              top: percent(box.y, size.height),
              width: percent(box.width, size.width),
              height: percent(box.height, size.height),
            }}
            onFocus={() => onChange(boxes, index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {index === selected ? (
              <span
                data-handle="resize"
                aria-hidden="true"
                class="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-600"
              />
            ) : null}
          </button>
        ))}
      </div>
      <p class="text-xs text-stone-600 dark:text-stone-400">
        Drag on the picture to draw a box. Drag a box to move it, or its corner to resize it.
      </p>
    </div>
  );
}
