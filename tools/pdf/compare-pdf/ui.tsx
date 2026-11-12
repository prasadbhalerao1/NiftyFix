import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { PreviewDocument } from '@niftyfix/engine-pdf/preview';
import {
  Button,
  cx,
  Dropzone,
  Panel,
  SegmentedControl,
  usePdfPreview,
  type ToolUiProps,
} from '@niftyfix/ui';
import { diffText, pixelDiff, summarise, type Part } from './diff';

type View = 'text' | 'visual';
/** Pages are drawn this wide (CSS pixels) for the visual comparison. */
const RENDER_WIDTH = 600;

async function allText(doc: PreviewDocument): Promise<string> {
  const pages: string[] = [];
  for (let i = 0; i < doc.pageCount; i += 1) {
    // Page markers anchor the comparison, so a change stays on its page.
    pages.push(`[Page ${i + 1}]\n${await doc.text(i)}\n`);
  }
  return pages.join('\n');
}

/** Render page `index` of both documents at the same size and compare the pixels. */
async function comparePage(
  a: PreviewDocument,
  b: PreviewDocument,
  index: number,
  width: number,
): Promise<{ a: HTMLCanvasElement; b: HTMLCanvasElement; diff: HTMLCanvasElement; share: number }> {
  const draw = async (doc: PreviewDocument): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    if (index < doc.pageCount) await doc.render(index, canvas, width);
    return canvas;
  };
  const [ca, cb] = await Promise.all([draw(a), draw(b)]);
  const w = Math.max(ca.width, cb.width, 1);
  const h = Math.max(ca.height, cb.height, 1);
  const pixels = (canvas: HTMLCanvasElement): Uint8ClampedArray => {
    const flat = document.createElement('canvas');
    flat.width = w;
    flat.height = h;
    const context = flat.getContext('2d', { willReadFrequently: true });
    if (!context) return new Uint8ClampedArray(w * h * 4);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, w, h);
    if (canvas.width) context.drawImage(canvas, 0, 0);
    return context.getImageData(0, 0, w, h).data;
  };
  const diff = document.createElement('canvas');
  diff.width = w;
  diff.height = h;
  const out = new ImageData(w, h);
  const share = pixelDiff(pixels(ca), pixels(cb), out.data);
  diff.getContext('2d')?.putImageData(out, 0, 0);
  return { a: ca, b: cb, diff, share };
}

function Picker({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile(file: File | null): void;
}) {
  return file ? (
    <Panel>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="min-w-0 truncate text-sm">
          <span class="font-medium">{label}:</span> {file.name}
        </p>
        <Button variant="ghost" onClick={() => onFile(null)}>
          Change
        </Button>
      </div>
    </Panel>
  ) : (
    <Dropzone
      accept=".pdf,application/pdf"
      title={`Choose the ${label.toLowerCase()} PDF`}
      detail="Stays on your device"
      onFiles={(files) => onFile(files[0] ?? null)}
    />
  );
}

function TextView({ parts }: { parts: Part[] }) {
  const summary = summarise(parts);
  const container = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(-1);
  const changes = parts.filter((p) => p.op !== 'equal').length;
  const jump = (step: number): void => {
    const marks = container.current?.querySelectorAll<HTMLElement>('[data-change]') ?? [];
    if (marks.length === 0) return;
    const next = (at + step + marks.length) % marks.length;
    setAt(next);
    marks[next]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  return (
    <Panel>
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2" data-testid="text-summary">
          <p class="text-sm">
            <span class="font-semibold text-emerald-800 dark:text-emerald-300">
              {summary.added} words added
            </span>
            {' · '}
            <span class="font-semibold text-red-800 dark:text-red-300">
              {summary.removed} removed
            </span>
            {' · '}
            {summary.unchanged} unchanged
          </p>
          {changes > 0 ? (
            <div class="flex gap-2">
              <Button variant="secondary" onClick={() => jump(-1)}>
                Previous change
              </Button>
              <Button variant="secondary" onClick={() => jump(1)}>
                Next change
              </Button>
            </div>
          ) : null}
        </div>
        {changes === 0 ? (
          <p class="text-sm font-medium">The text of both PDFs is identical.</p>
        ) : null}
        <div
          ref={container}
          class="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-control)] border border-stone-200 p-3 font-mono text-sm leading-relaxed dark:border-stone-700"
          data-testid="text-diff"
        >
          {parts.map((part, i) =>
            part.op === 'equal' ? (
              <span key={i}>{part.text}</span>
            ) : (
              <span
                key={i}
                data-change
                class={cx(
                  'rounded px-0.5',
                  part.op === 'insert'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-red-100 text-red-900 line-through dark:bg-red-950 dark:text-red-200',
                )}
              >
                {part.op === 'insert' ? (
                  <span class="sr-only">Added: </span>
                ) : (
                  <span class="sr-only">Removed: </span>
                )}
                {part.text}
              </span>
            ),
          )}
        </div>
      </div>
    </Panel>
  );
}

function VisualView({ a, b }: { a: PreviewDocument; b: PreviewDocument }) {
  const pages = Math.max(a.pageCount, b.pageCount);
  const [page, setPage] = useState(0);
  const [shares, setShares] = useState<(number | null)[]>(() =>
    Array.from({ length: pages }, () => null),
  );
  const [scanning, setScanning] = useState(false);
  const original = useRef<HTMLDivElement>(null);
  const changed = useRef<HTMLDivElement>(null);
  const differences = useRef<HTMLDivElement>(null);
  const panes = [
    ['Original', original],
    ['Changed', changed],
    ['Differences', differences],
  ] as const;

  useEffect(() => {
    let alive = true;
    void comparePage(a, b, page, RENDER_WIDTH).then((result) => {
      if (!alive) return;
      [result.a, result.b, result.diff].forEach((canvas, i) => {
        canvas.className = 'h-auto w-full bg-white ring-1 ring-stone-200 dark:ring-stone-700';
        panes[i]?.[1].current?.replaceChildren(canvas);
      });
      setShares((list) => list.map((value, i) => (i === page ? result.share : value)));
    });
    return () => {
      alive = false;
    };
  }, [a, b, page]);

  const scan = async (): Promise<void> => {
    setScanning(true);
    for (let i = 0; i < pages; i += 1) {
      const { share } = await comparePage(a, b, i, 200);
      setShares((list) => list.map((value, k) => (k === i ? share : value)));
    }
    setScanning(false);
  };

  const label = (share: number | null): string =>
    share === null
      ? ''
      : share === 0
        ? 'no change'
        : `${Math.max(0.1, share * 100).toFixed(1)}% changed`;

  return (
    <Panel>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous page
          </Button>
          <span class="text-sm font-medium" data-testid="visual-page">
            Page {page + 1} of {pages} · {label(shares[page] ?? null)}
          </span>
          <Button
            variant="secondary"
            disabled={page >= pages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next page
          </Button>
          <Button variant="ghost" disabled={scanning} onClick={() => void scan()}>
            {scanning ? 'Checking pages…' : 'Check every page'}
          </Button>
        </div>
        {shares.some((s) => s !== null && s > 0) ? (
          <div class="flex flex-wrap gap-1.5" data-testid="changed-pages">
            {shares.map((share, i) =>
              share !== null && share > 0 ? (
                <button
                  key={i}
                  type="button"
                  class="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-900 dark:bg-orange-950 dark:text-orange-200"
                  onClick={() => setPage(i)}
                >
                  Page {i + 1}
                </button>
              ) : null,
            )}
          </div>
        ) : null}
        <div class="grid gap-3 sm:grid-cols-3">
          {panes.map(([title, holder]) => (
            <figure key={title} class="flex flex-col gap-1">
              <figcaption class="text-xs font-medium text-stone-600 dark:text-stone-400">
                {title}
              </figcaption>
              <div ref={holder} data-testid={`visual-${title.toLowerCase()}`} />
            </figure>
          ))}
        </div>
        <p class="text-xs text-stone-600 dark:text-stone-400">
          Differences are orange over a faded copy of the original page.
        </p>
      </div>
    </Panel>
  );
}

export default function ComparePdf(_props: ToolUiProps) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [view, setView] = useState<View>('text');
  const a = usePdfPreview(fileA);
  const b = usePdfPreview(fileB);
  const [texts, setTexts] = useState<[string, string] | null>(null);

  useEffect(() => {
    setTexts(null);
    if (!a.preview || !b.preview) return;
    let alive = true;
    void Promise.all([allText(a.preview), allText(b.preview)]).then(
      (pair) => alive && setTexts(pair),
    );
    return () => {
      alive = false;
    };
  }, [a.preview, b.preview]);

  const parts = useMemo(() => (texts ? diffText(texts[0], texts[1]) : null), [texts]);
  const error = a.error ?? b.error;

  return (
    <div class="flex flex-col gap-4">
      <div class="grid gap-3 md:grid-cols-2">
        <Picker label="Original" file={fileA} onFile={setFileA} />
        <Picker label="Changed" file={fileB} onFile={setFileB} />
      </div>
      {error ? <p class="text-sm text-red-800 dark:text-red-300">{error.message}</p> : null}
      {a.preview && b.preview ? (
        <>
          <SegmentedControl<View>
            label="Compare"
            value={view}
            options={[
              { value: 'text', label: 'Text changes' },
              { value: 'visual', label: 'Visual changes' },
            ]}
            onChange={setView}
          />
          {view === 'text' ? (
            parts ? (
              <TextView parts={parts} />
            ) : (
              <p class="text-sm">Reading both documents…</p>
            )
          ) : (
            <VisualView a={a.preview} b={b.preview} />
          )}
        </>
      ) : null}
    </div>
  );
}
