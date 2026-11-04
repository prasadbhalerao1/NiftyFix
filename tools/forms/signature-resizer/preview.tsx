import { useEffect, useRef, useState } from 'preact/hooks';
import type { Rect } from '@niftyfix/constraints';
import {
  assessLegibility,
  enhancePixels,
  findInkBounds,
  type EnhanceSettings,
  type LegibilityIssue,
  type Pixels,
} from '@niftyfix/engine-image';

/** Longest side of the live preview. Big enough to judge thin strokes, cheap enough for phones. */
const PREVIEW_MAX = 640;
const ANALYSIS_MAX = 800;

export function useLoadedImage(url: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let alive = true;
    const element = new Image();
    element.onload = () => {
      if (alive) setImage(element);
    };
    element.src = url;
    return () => {
      alive = false;
    };
  }, [url]);
  return image;
}

/** Draw a region of an image onto white at a bounded size and read its pixels. */
function sample(image: HTMLImageElement, region: Rect, maxSide: number): Pixels | null {
  const scale = Math.min(1, maxSide / Math.max(region.width, region.height));
  const width = Math.max(1, Math.round(region.width * scale));
  const height = Math.max(1, Math.round(region.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, region.x, region.y, region.width, region.height, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  return { data: data.data, width, height };
}

/** Auto-crop: the ink bounds of the whole image, in source pixels, or null. */
export function detectSignature(image: HTMLImageElement): Rect | null {
  const full = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
  const pixels = sample(image, full, ANALYSIS_MAX);
  if (!pixels) return null;
  const bounds = findInkBounds(pixels);
  if (!bounds) return null;
  const scale = full.width / pixels.width;
  return {
    x: bounds.x * scale,
    y: bounds.y * scale,
    width: bounds.width * scale,
    height: bounds.height * scale,
  };
}

const ISSUE_TEXT: Record<LegibilityIssue, string> = {
  'strokes-lost':
    'Some pen strokes are disappearing with these settings. Lower "Background cleanup" or use Colour/Grayscale.',
  empty: 'Almost nothing of the signature is visible. Check the crop and the cleanup settings.',
  'background-dark':
    'The background is still dark. Turn on "Even out lighting" or raise "Background cleanup".',
};

export interface SignaturePreviewProps {
  image: HTMLImageElement;
  crop: Rect;
  enhance: EnhanceSettings;
  showOriginal: boolean;
}

/** Live preview of the cleanup on the current crop, with legibility warnings. */
export function SignaturePreview({ image, crop, enhance, showOriginal }: SignaturePreviewProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [issues, setIssues] = useState<LegibilityIssue[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const target = canvas.current;
      const original = sample(image, crop, PREVIEW_MAX);
      if (!target || !original) return;
      const cleaned = enhancePixels(original, enhance);
      setIssues(assessLegibility(original, cleaned));
      const shown = showOriginal ? original : cleaned;
      target.width = shown.width;
      target.height = shown.height;
      target
        .getContext('2d')
        ?.putImageData(
          new ImageData(new Uint8ClampedArray(shown.data), shown.width, shown.height),
          0,
          0,
        );
    });
    return () => cancelAnimationFrame(frame);
  }, [image, crop, enhance, showOriginal]);

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-stone-200 bg-[conic-gradient(#e7e5e4_25%,#fafaf9_0_50%,#e7e5e4_0_75%,#fafaf9_0)] bg-[length:16px_16px] p-2 dark:border-stone-800">
        <figure class="m-0">
          <canvas
            ref={canvas}
            class="max-h-64 max-w-full"
            aria-hidden="true"
            data-testid="signature-preview"
            data-view={showOriginal ? 'original' : 'cleaned'}
          />
          <figcaption class="sr-only">
            {showOriginal ? 'Preview of the original crop' : 'Preview of the cleaned signature'}
          </figcaption>
        </figure>
      </div>
      {!showOriginal
        ? issues.map((issue) => (
            <p
              key={issue}
              role="status"
              class="text-sm text-amber-800 dark:text-amber-300"
              data-testid="preview-warning"
              data-issue={issue}
            >
              {ISSUE_TEXT[issue]}
            </p>
          ))
        : null}
    </div>
  );
}
