import { useEffect, useRef } from 'preact/hooks';
import type { PreviewDocument } from '@niftyfix/engine-pdf/preview';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * The chosen page with the signature on top. Drag the signature to move it;
 * it is also a focusable button that arrow keys move (Shift for bigger steps).
 */
export function Placement({
  preview,
  page,
  signatureUrl,
  rect,
  onRect,
}: {
  preview: PreviewDocument;
  page: number;
  signatureUrl: string;
  rect: Rect;
  onRect(rect: Rect): void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const size = preview.sizes[page] ?? { width: 595, height: 842 };

  useEffect(() => {
    if (canvas.current) void preview.render(page, canvas.current, 520);
  }, [preview, page]);

  const moveTo = (x: number, y: number): void =>
    onRect({ ...rect, x: clamp(x, 0, 1 - rect.width), y: clamp(y, 0, 1 - rect.height) });

  const fraction = (event: PointerEvent): { x: number; y: number } => {
    const box = area.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  };

  return (
    <div
      ref={area}
      class="relative mx-auto w-full max-w-[520px] overflow-hidden bg-white ring-1 ring-stone-300 select-none dark:ring-stone-700"
      style={{ aspectRatio: `${size.width} / ${size.height}` }}
      data-testid="sign-page"
    >
      <canvas ref={canvas} aria-hidden="true" class="absolute inset-0 size-full" />
      <button
        type="button"
        class="absolute cursor-move touch-none rounded-sm border-2 border-dashed border-brand-600 bg-transparent p-0 focus-visible:outline-2"
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.width * 100}%`,
          height: `${rect.height * 100}%`,
        }}
        aria-label="Signature position. Drag it, or use the arrow keys to move it."
        data-testid="signature-box"
        onPointerDown={(event) => {
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
          const at = fraction(event);
          drag.current = { dx: at.x - rect.x, dy: at.y - rect.y };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const at = fraction(event);
          moveTo(at.x - drag.current.dx, at.y - drag.current.dy);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.05 : 0.01;
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
          };
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          moveTo(rect.x + move[0], rect.y + move[1]);
        }}
      >
        <img
          src={signatureUrl}
          alt=""
          class="pointer-events-none size-full object-contain"
          draggable={false}
        />
      </button>
    </div>
  );
}
