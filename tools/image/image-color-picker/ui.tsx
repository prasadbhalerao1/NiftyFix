import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { downloadBlob } from '@niftyfix/runtime';
import {
  Button,
  copyText,
  cx,
  Dropzone,
  Panel,
  RangeInput,
  SegmentedControl,
  type ToolUiProps,
} from '@niftyfix/ui';
import {
  contrast,
  exportPalette,
  extractPalette,
  formats,
  nearestName,
  toHex,
  type ExportFormat,
  type Rgb,
} from './colors';

/** Longest side kept for picking: enough for exact pixels in any normal photo, bounded memory. */
const MAX_SIDE = 4096;
/** The loupe shows this many pixels across, magnified. */
const LOUPE = 11;

interface Loaded {
  name: string;
  width: number;
  height: number;
  data: Uint8ClampedArray;
  url: string;
}

async function load(file: File): Promise<Loaded> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  await image.decode();
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('No canvas');
  context.drawImage(image, 0, 0, width, height);
  return {
    name: file.name,
    width,
    height,
    data: context.getImageData(0, 0, width, height).data,
    url,
  };
}

const pixelAt = (image: Loaded, x: number, y: number): Rgb => {
  const i = (Math.min(image.height - 1, y) * image.width + Math.min(image.width - 1, x)) * 4;
  return [image.data[i] ?? 0, image.data[i + 1] ?? 0, image.data[i + 2] ?? 0];
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div class="flex items-center justify-between gap-2 text-sm">
      <span class="w-12 shrink-0 font-medium text-stone-600 dark:text-stone-400">{label}</span>
      <code class="min-w-0 flex-1 truncate font-mono">{value}</code>
      <Button
        variant="ghost"
        onClick={() =>
          void copyText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
        }
        aria-label={`Copy ${label} ${value}`}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

function Swatch({ rgb, size = 'md' }: { rgb: Rgb; size?: 'md' | 'lg' }) {
  return (
    <span
      class={cx(
        'inline-block shrink-0 rounded-[var(--radius-control)] ring-1 ring-stone-300 dark:ring-stone-600',
        size === 'lg' ? 'size-16' : 'size-8',
      )}
      style={{ backgroundColor: toHex(rgb) }}
    />
  );
}

export default function ImageColorPicker({ preset }: ToolUiProps) {
  const [image, setImage] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<Rgb | null>(null);
  const [history, setHistory] = useState<Rgb[]>([]);
  const [count, setCount] = useState(preset === 'palette' ? 8 : 6);
  const [format, setFormat] = useState<ExportFormat>('hex');
  const view = useRef<HTMLCanvasElement>(null);
  const loupe = useRef<HTMLCanvasElement>(null);
  useEffect(() => () => (image ? URL.revokeObjectURL(image.url) : undefined), [image]);

  // The picture as shown: drawn once per image.
  useEffect(() => {
    const canvas = view.current;
    if (!canvas || !image) return;
    canvas.width = image.width;
    canvas.height = image.height;
    canvas
      .getContext('2d')
      ?.putImageData(
        new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
        0,
        0,
      );
  }, [image]);

  // The loupe: the pixels around the cursor, magnified, with the centre marked.
  useEffect(() => {
    const canvas = loupe.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !image || !cursor) return;
    const cell = canvas.width / LOUPE;
    const half = Math.floor(LOUPE / 2);
    for (let dy = -half; dy <= half; dy += 1) {
      for (let dx = -half; dx <= half; dx += 1) {
        const x = cursor.x + dx;
        const y = cursor.y + dy;
        context.fillStyle =
          x < 0 || y < 0 || x >= image.width || y >= image.height
            ? '#d6d3d1'
            : toHex(pixelAt(image, x, y));
        context.fillRect((dx + half) * cell, (dy + half) * cell, cell, cell);
      }
    }
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.strokeRect(half * cell, half * cell, cell, cell);
  }, [image, cursor]);

  const palette = useMemo(() => (image ? extractPalette(image.data, count) : []), [image, count]);
  const current = picked ?? (image && cursor ? pixelAt(image, cursor.x, cursor.y) : null);

  const choose = async (files: File[]): Promise<void> => {
    const file = files[0];
    if (!file) return;
    setError(null);
    try {
      const loaded = await load(file);
      setImage(loaded);
      setCursor({ x: Math.floor(loaded.width / 2), y: Math.floor(loaded.height / 2) });
      setPicked(null);
    } catch {
      setError('This image could not be opened. Try a JPG, PNG, WebP or screenshot.');
    }
  };

  const pick = (rgb: Rgb): void => {
    setPicked(rgb);
    setHistory((list) => [rgb, ...list.filter((c) => toHex(c) !== toHex(rgb))].slice(0, 12));
  };

  const toPixel = (event: PointerEvent): { x: number; y: number } | null => {
    const canvas = view.current;
    if (!canvas || !image) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          image.width - 1,
          Math.floor(((event.clientX - bounds.left) / bounds.width) * image.width),
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          image.height - 1,
          Math.floor(((event.clientY - bounds.top) / bounds.height) * image.height),
        ),
      ),
    };
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!image || !cursor) return;
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = moves[event.key];
    if (delta) {
      event.preventDefault();
      setPicked(null);
      setCursor({
        x: Math.max(0, Math.min(image.width - 1, cursor.x + delta[0])),
        y: Math.max(0, Math.min(image.height - 1, cursor.y + delta[1])),
      });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pick(pixelAt(image, cursor.x, cursor.y));
    }
  };

  const eyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  const screenPick = async (): Promise<void> => {
    try {
      const Ctor = (
        window as unknown as { EyeDropper: new () => { open(): Promise<{ sRGBHex: string }> } }
      ).EyeDropper;
      const { sRGBHex } = await new Ctor().open();
      const hex = sRGBHex.replace('#', '');
      pick([0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb);
    } catch {
      // Cancelled with Escape, or not allowed here.
    }
  };

  const text = exportPalette(palette, format);
  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        {!image ? (
          <Dropzone
            accept="image/*"
            title="Choose an image"
            detail="Or paste a screenshot · stays on your device"
            onFiles={(files) => void choose(files)}
          />
        ) : (
          <Panel>
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p class="min-w-0 truncate text-sm font-medium" data-testid="chosen-file">
                {image.name}
              </p>
              <Button variant="ghost" onClick={() => setImage(null)}>
                Choose another image
              </Button>
            </div>
            <canvas
              ref={view}
              tabIndex={0}
              aria-label="Your image. Tap or click a spot to pick its colour, or use the arrow keys and press Enter."
              class="block h-auto max-h-[70vh] w-full cursor-crosshair touch-none object-contain focus-visible:outline-2 focus-visible:outline-brand-600"
              data-testid="pick-area"
              onPointerMove={(event) => {
                const point = toPixel(event);
                if (point && !picked) setCursor(point);
              }}
              onPointerDown={(event) => {
                const point = toPixel(event);
                if (!point || !image) return;
                setCursor(point);
                pick(pixelAt(image, point.x, point.y));
              }}
              onKeyDown={onKeyDown}
            />
          </Panel>
        )}
        {error ? <p class="text-sm text-red-800 dark:text-red-300">{error}</p> : null}
        {image ? (
          <Panel title="Palette">
            <div class="flex flex-col gap-4">
              <RangeInput
                label="Colours"
                value={count}
                min={2}
                max={12}
                step={1}
                format={(v) => String(v)}
                onChange={setCount}
              />
              <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="palette">
                {palette.map((swatch) => (
                  <li key={toHex(swatch.rgb)}>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-[var(--radius-control)] border border-stone-200 p-2 text-left text-sm hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800"
                      onClick={() => pick(swatch.rgb)}
                    >
                      <Swatch rgb={swatch.rgb} />
                      <span class="flex flex-col">
                        <span class="font-mono">{toHex(swatch.rgb)}</span>
                        <span class="text-xs text-stone-600 dark:text-stone-400">
                          {Math.round(swatch.share * 100)}%
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <SegmentedControl<ExportFormat>
                label="Export as"
                value={format}
                options={[
                  { value: 'hex', label: 'HEX' },
                  { value: 'css', label: 'CSS' },
                  { value: 'tailwind', label: 'Tailwind' },
                  { value: 'json', label: 'JSON' },
                  { value: 'gpl', label: 'GIMP' },
                ]}
                onChange={setFormat}
              />
              <textarea
                readOnly
                rows={6}
                aria-label="Palette as text"
                class="w-full rounded-[var(--radius-control)] border border-stone-300 bg-paper p-2 font-mono text-xs dark:border-stone-700 dark:bg-stone-900"
                value={text}
                data-testid="palette-export"
              />
              <div class="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void copyText(text)}>
                  Copy palette
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    downloadBlob(
                      new Blob([text], { type: 'text/plain' }),
                      `palette.${format === 'gpl' ? 'gpl' : format === 'json' ? 'json' : format === 'css' ? 'css' : 'txt'}`,
                    )
                  }
                >
                  Download
                </Button>
              </div>
            </div>
          </Panel>
        ) : null}
      </div>

      <Panel title="Colour" class="h-fit">
        <div class="flex flex-col gap-4" aria-live="polite">
          {image ? (
            <canvas
              ref={loupe}
              width={132}
              height={132}
              aria-hidden="true"
              class="mx-auto size-32 rounded-[var(--radius-control)] ring-1 ring-stone-300 [image-rendering:pixelated] dark:ring-stone-600"
            />
          ) : null}
          {current ? (
            <>
              <div class="flex items-center gap-3" data-testid="picked">
                <Swatch rgb={current} size="lg" />
                <div class="flex flex-col">
                  <span class="font-mono text-lg font-semibold">{toHex(current)}</span>
                  <span class="text-sm text-stone-600 dark:text-stone-400">
                    Close to {nearestName(current)}
                  </span>
                  {!picked ? (
                    <span class="text-xs text-stone-500">Tap or click to pick</span>
                  ) : null}
                </div>
              </div>
              <div class="flex flex-col gap-1">
                {formats(current).map((f) => (
                  <CopyRow key={f.label} label={f.label} value={f.value} />
                ))}
              </div>
              <div class="flex flex-col gap-1 text-sm">
                {(
                  [
                    ['On white', [255, 255, 255]],
                    ['On black', [0, 0, 0]],
                  ] as const
                ).map(([label, background]) => {
                  const ratio = contrast(current, background);
                  return (
                    <p key={label} class="flex justify-between gap-2">
                      <span>{label}</span>
                      <span>
                        {ratio.toFixed(2)}:1 ·{' '}
                        {ratio >= 7
                          ? 'AAA'
                          : ratio >= 4.5
                            ? 'AA'
                            : ratio >= 3
                              ? 'AA large text'
                              : 'Too low for text'}
                      </span>
                    </p>
                  );
                })}
              </div>
            </>
          ) : (
            <p class="text-sm text-stone-600 dark:text-stone-400">
              Choose an image, then tap or click any spot on it.
            </p>
          )}
          {eyeDropper ? (
            <Button variant="secondary" onClick={() => void screenPick()}>
              Pick from anywhere on screen
            </Button>
          ) : null}
          {history.length > 0 ? (
            <div class="flex flex-col gap-2">
              <p class="text-sm font-medium">Picked</p>
              <div class="flex flex-wrap gap-2">
                {history.map((rgb) => (
                  <button
                    key={toHex(rgb)}
                    type="button"
                    aria-label={`Show ${toHex(rgb)}`}
                    onClick={() => setPicked(rgb)}
                  >
                    <Swatch rgb={rgb} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
