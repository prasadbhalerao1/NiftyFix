import { useRef } from 'preact/hooks';
import { clampRect, type Rect, type Size } from '@niftyfix/constraints';
import { RangeInput } from './fields';

export interface CropBoxProps {
  imageUrl: string;
  /** Source image size in pixels (after EXIF orientation). */
  image: Size;
  /** Locked aspect ratio (width / height) of the crop. */
  aspect: number;
  crop: Rect;
  onChange(crop: Rect): void;
}

/** Largest crop width for the aspect inside the image. */
function maxCropWidth(image: Size, aspect: number): number {
  return Math.min(image.width, image.height * aspect);
}

function resizeAroundCentre(crop: Rect, width: number, aspect: number, image: Size): Rect {
  const height = width / aspect;
  const cx = crop.x + crop.width / 2;
  const cy = crop.y + crop.height / 2;
  return clampRect({ x: cx - width / 2, y: cy - height / 2, width, height }, image);
}

const MIN_FRACTION = 0.1;

/**
 * Aspect-locked crop selector.
 * Pointer: drag the frame to move it, drag the corner handle to resize.
 * Keyboard (frame focused): arrows move (Shift = larger steps), + / − resize.
 */
export function CropBox({ imageUrl, image, aspect, crop, onChange }: CropBoxProps) {
  const frame = useRef<HTMLButtonElement>(null);
  const maxWidth = maxCropWidth(image, aspect);
  const minWidth = Math.max(1, maxWidth * MIN_FRACTION);

  const startDrag = (event: PointerEvent, mode: 'move' | 'resize'): void => {
    const container = frame.current?.parentElement;
    if (!container) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = container.getBoundingClientRect();
    const scale = image.width / bounds.width;
    const start = { x: event.clientX, y: event.clientY, crop };
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    const onMove = (move: PointerEvent): void => {
      const dx = (move.clientX - start.x) * scale;
      const dy = (move.clientY - start.y) * scale;
      if (mode === 'move') {
        onChange(clampRect({ ...start.crop, x: start.crop.x + dx, y: start.crop.y + dy }, image));
        return;
      }
      const delta = Math.abs(dx) > Math.abs(dy * aspect) ? dx : dy * aspect;
      const width = Math.min(
        Math.max(minWidth, start.crop.width + delta),
        image.width - start.crop.x,
        (image.height - start.crop.y) * aspect,
      );
      onChange({ ...start.crop, width, height: width / aspect });
    };
    const onUp = (): void => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const step = (event.shiftKey ? 0.1 : 0.01) * maxWidth;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      onChange(clampRect({ ...crop, x: crop.x + move[0], y: crop.y + move[1] }, image));
    } else if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      const width = Math.min(
        maxWidth,
        Math.max(minWidth, crop.width + (event.key === '-' ? -step : step)),
      );
      onChange(resizeAroundCentre(crop, width, aspect, image));
    }
  };

  const pct = (value: number, total: number): string => `${(value / total) * 100}%`;

  return (
    <div class="flex flex-col gap-3">
      <div
        class="relative mx-auto w-full max-w-full touch-none select-none overflow-hidden rounded-[var(--radius-control)] bg-stone-200 dark:bg-stone-800"
        style={{
          aspectRatio: `${image.width} / ${image.height}`,
          maxHeight: '60vh',
          maxWidth: `calc(60vh * ${image.width / image.height})`,
        }}
      >
        <img
          src={imageUrl}
          alt="Your upload, shown for cropping"
          class="absolute inset-0 size-full"
          draggable={false}
        />
        <button
          ref={frame}
          type="button"
          aria-label="Crop area. Arrow keys move it; plus and minus change its size."
          data-testid="crop-frame"
          class="absolute block cursor-move border-2 border-white p-0 shadow-[0_0_0_9999px_rgb(0_0_0/0.5)] outline-offset-4"
          style={{
            left: pct(crop.x, image.width),
            top: pct(crop.y, image.height),
            width: pct(crop.width, image.width),
            height: pct(crop.height, image.height),
          }}
          onPointerDown={(event) => startDrag(event, 'move')}
          onKeyDown={onKeyDown}
        >
          <span
            aria-hidden="true"
            class="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} class="border border-white/30" />
            ))}
          </span>
          <span
            aria-hidden="true"
            class="absolute -right-3 -bottom-3 size-6 cursor-nwse-resize rounded-full border-2 border-white bg-teal-600"
            onPointerDown={(event) => startDrag(event, 'resize')}
          />
        </button>
      </div>
      <RangeInput
        label="Crop size"
        min={Math.round(MIN_FRACTION * 100)}
        max={100}
        step={1}
        value={Math.round((crop.width / maxWidth) * 100)}
        format={(value) => `${value}%`}
        onChange={(value) =>
          onChange(resizeAroundCentre(crop, (value / 100) * maxWidth, aspect, image))
        }
        hint="Drag the frame to position your face. Use the handle or this slider to zoom."
      />
    </div>
  );
}
