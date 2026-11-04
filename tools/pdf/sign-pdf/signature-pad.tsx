import { useEffect, useRef, useState } from 'preact/hooks';
import { Button } from '@niftyfix/ui';

export const INK = { black: '#111111', blue: '#1d3fa6' } as const;
export type Ink = keyof typeof INK;

/** A transparent PNG of the drawn strokes, trimmed to their bounds (with a small margin). */
export async function exportSignature(canvas: HTMLCanvasElement): Promise<Uint8Array | null> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  const pad = 6;
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  const w = Math.min(width, right + pad + 1) - left;
  const h = Math.min(height, bottom + pad + 1) - top;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d')?.drawImage(canvas, left, top, w, h, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}

/**
 * Draw a signature with a mouse, finger or stylus. Strokes are smoothed with
 * quadratic curves between pointer samples; the canvas uses the screen's
 * pixel density so lines stay crisp.
 */
export function SignaturePad({
  ink,
  onChange,
}: {
  ink: Ink;
  /** Called with the canvas after every stroke (or null when cleared). */
  onChange(canvas: HTMLCanvasElement | null): void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const density = Math.min(3, globalThis.devicePixelRatio || 1);
    element.width = Math.round(element.clientWidth * density);
    element.height = Math.round(element.clientHeight * density);
    const ctx = element.getContext('2d');
    ctx?.scale(density, density);
  }, []);

  const point = (event: PointerEvent): { x: number; y: number } => {
    const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const clear = (): void => {
    const element = canvas.current;
    if (!element) return;
    element.getContext('2d')?.clearRect(0, 0, element.width, element.height);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium">
        Draw your signature
        <span class="sr-only">
          {' '}
          with a mouse, finger or stylus, or choose Upload a photo instead
        </span>
      </p>
      <canvas
        ref={canvas}
        class="h-40 w-full touch-none rounded-[var(--radius-control)] border border-dashed border-stone-300 bg-white dark:border-stone-700"
        // Drawing needs a pointer; keyboard and screen-reader users use "Upload a photo".
        aria-hidden="true"
        data-testid="signature-pad"
        onPointerDown={(event) => {
          (event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId);
          last.current = point(event);
        }}
        onPointerMove={(event) => {
          const from = last.current;
          const ctx = canvas.current?.getContext('2d');
          if (!from || !ctx) return;
          const to = point(event);
          ctx.strokeStyle = INK[ink];
          ctx.lineWidth =
            event.pressure > 0 && event.pointerType === 'pen' ? 1.5 + event.pressure * 2.5 : 2.6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
          ctx.quadraticCurveTo(from.x, from.y, mid.x, mid.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          last.current = to;
          if (empty) setEmpty(false);
        }}
        onPointerUp={() => {
          last.current = null;
          onChange(canvas.current);
        }}
        onPointerCancel={() => {
          last.current = null;
        }}
      />
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs text-stone-600 dark:text-stone-400">
          {empty ? 'Sign in the box above.' : 'Looks good? Place it on the page.'}
        </p>
        <Button variant="ghost" onClick={clear} disabled={empty} data-testid="clear-signature">
          Clear
        </Button>
      </div>
    </div>
  );
}
