import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { downloadBlob } from '@niftyfix/runtime';
import { formatBytes } from '@niftyfix/tool-sdk';
import {
  Button,
  copyText,
  Dropzone,
  Panel,
  SegmentedControl,
  SelectInput,
  type ToolUiProps,
} from '@niftyfix/ui';
import { detectKind, fromBase64, snippet, toBase64, type Snippet } from './base64';

type Direction = 'encode' | 'decode';

/** Inlining images this big into CSS or HTML slows pages down more than a separate file. */
const INLINE_WARNING = 100_000;

const SNIPPETS: { value: Snippet; label: string }[] = [
  { value: 'data-uri', label: 'Data URI (data:image/...;base64,...)' },
  { value: 'raw', label: 'Base64 only' },
  { value: 'css', label: 'CSS background-image' },
  { value: 'html', label: 'HTML <img> tag' },
  { value: 'markdown', label: 'Markdown image' },
  { value: 'json', label: 'JSON' },
];

interface Encoded {
  name: string;
  size: number;
  mime: string;
  base64: string;
  url: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={() =>
        void copyText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? 'Copied' : label}
    </Button>
  );
}

function EncodePanel() {
  const [items, setItems] = useState<Encoded[]>([]);
  const [kind, setKind] = useState<Snippet>('data-uri');
  const live = useRef<Encoded[]>([]);
  live.current = items;
  // Previews are freed when an image is removed and when the tool closes.
  useEffect(() => () => live.current.forEach((item) => URL.revokeObjectURL(item.url)), []);

  const add = async (files: File[]): Promise<void> => {
    const encoded = await Promise.all(
      files.map(async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const mime = detectKind(bytes)?.mime ?? (file.type || 'application/octet-stream');
        return {
          name: file.name,
          size: file.size,
          mime,
          base64: toBase64(bytes),
          url: URL.createObjectURL(file),
        };
      }),
    );
    setItems((current) => [...current, ...encoded]);
  };

  return (
    <div class="flex flex-col gap-4">
      <Dropzone
        accept="image/*,.svg,.ico"
        multiple
        compact={items.length > 0}
        title={items.length > 0 ? 'Add more images' : 'Choose images'}
        detail="JPG, PNG, WebP, GIF, SVG, ICO and more · or paste · stays on your device"
        onFiles={(files) => void add(files)}
      />
      {items.length > 0 ? (
        <SelectInput<Snippet>
          label="Output as"
          value={kind}
          options={SNIPPETS}
          onChange={setKind}
          testId="snippet"
        />
      ) : null}
      {items.map((item, index) => {
        const text = snippet(item.base64, item.mime, kind, item.name.replace(/\.[^.]+$/, ''));
        return (
          <Panel key={`${item.name}-${index}`}>
            <div class="flex flex-col gap-3" data-testid="encoded">
              <div class="flex flex-wrap items-center gap-3">
                <img
                  src={item.url}
                  alt=""
                  class="size-14 rounded bg-stone-100 object-contain dark:bg-stone-800"
                />
                <div class="min-w-0 flex-1 text-sm">
                  <p class="truncate font-medium">{item.name}</p>
                  <p class="text-stone-600 dark:text-stone-400">
                    {formatBytes(item.size)} as a file, {formatBytes(text.length)} as text
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    URL.revokeObjectURL(item.url);
                    setItems(items.filter((_, i) => i !== index));
                  }}
                >
                  Remove
                </Button>
              </div>
              {item.size > INLINE_WARNING ? (
                <p class="text-xs text-amber-800 dark:text-amber-300">
                  Base64 is a third bigger than the file. Above about 100 KB, a separate image file
                  usually loads faster than one inlined in CSS or HTML.
                </p>
              ) : null}
              <textarea
                readOnly
                rows={4}
                aria-label={`Base64 of ${item.name}`}
                class="w-full break-all rounded-[var(--radius-control)] border border-stone-300 bg-paper p-2 font-mono text-xs dark:border-stone-700 dark:bg-stone-900"
                value={text}
                data-testid="encoded-text"
              />
              <div class="flex flex-wrap gap-2">
                <CopyButton text={text} label="Copy" />
                <Button
                  variant="ghost"
                  onClick={() =>
                    downloadBlob(
                      new Blob([text], { type: 'text/plain' }),
                      `${item.name}.base64.txt`,
                    )
                  }
                >
                  Download .txt
                </Button>
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function DecodePanel() {
  const [input, setInput] = useState('');
  const result = useMemo(() => (input.trim() ? fromBase64(input) : null), [input]);
  const [preview, setPreview] = useState<{ url: string; width: number; height: number } | null>(
    null,
  );
  const blob = useMemo(
    () =>
      result?.ok
        ? new Blob([result.bytes as BlobPart], {
            type: result.kind?.mime ?? 'application/octet-stream',
          })
        : null,
    [result],
  );
  useEffect(() => {
    if (!blob || !result?.ok || !result.kind || result.kind.extension === 'pdf') {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () =>
      setPreview({ url, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => setPreview(null);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return (
    <Panel>
      <div class="flex flex-col gap-3">
        <label htmlFor="base64-input" class="text-sm font-medium">
          Base64 or data URI
        </label>
        <textarea
          id="base64-input"
          rows={8}
          spellcheck={false}
          placeholder="data:image/png;base64,iVBORw0KGgo..."
          class="w-full break-all rounded-[var(--radius-control)] border border-stone-300 bg-paper p-2 font-mono text-xs dark:border-stone-700 dark:bg-stone-900"
          value={input}
          onInput={(event) => setInput(event.currentTarget.value)}
          data-testid="base64-input"
        />
        {result && !result.ok ? (
          <p role="alert" class="text-sm text-red-800 dark:text-red-300" data-testid="decode-error">
            {result.error}
          </p>
        ) : null}
        {result?.ok ? (
          <div class="flex flex-col gap-3" data-testid="decoded">
            {preview ? (
              <img
                src={preview.url}
                alt="Decoded from Base64"
                class="max-h-80 w-auto self-start rounded bg-stone-100 object-contain dark:bg-stone-800"
              />
            ) : null}
            <p class="text-sm">
              {result.kind ? result.kind.label : 'Not an image format we recognise'}
              {preview ? ` · ${preview.width} × ${preview.height} px` : ''} ·{' '}
              {formatBytes(result.bytes.length)}
              {result.declaredMime && result.kind && result.declaredMime !== result.kind.mime
                ? ` · labelled ${result.declaredMime}, but it is ${result.kind.label}`
                : ''}
            </p>
            <Button
              onClick={() =>
                blob && downloadBlob(blob, `decoded.${result.kind?.extension ?? 'bin'}`)
              }
              data-testid="download-decoded"
            >
              Download {result.kind ? result.kind.label : 'file'}
            </Button>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export default function ImageToBase64({ preset }: ToolUiProps) {
  const [direction, setDirection] = useState<Direction>(preset === 'decode' ? 'decode' : 'encode');
  return (
    <div class="flex flex-col gap-4">
      <SegmentedControl<Direction>
        label="Convert"
        value={direction}
        options={[
          { value: 'encode', label: 'Image to Base64' },
          { value: 'decode', label: 'Base64 to image' },
        ]}
        onChange={setDirection}
      />
      {direction === 'encode' ? <EncodePanel /> : <DecodePanel />}
    </div>
  );
}
