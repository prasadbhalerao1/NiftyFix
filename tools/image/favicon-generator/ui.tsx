import { useEffect, useState } from 'preact/hooks';
import { readImageHeader } from '@niftyfix/engine-image';
import { downloadBlob, zipFiles } from '@niftyfix/runtime';
import {
  Button,
  copyText,
  Dropzone,
  Panel,
  RangeInput,
  SegmentedControl,
  TextInput,
  type ToolUiProps,
} from '@niftyfix/ui';
import { headTags, textSvg, webManifest } from './bundle';
import { encodeIco, readIcoSizes } from './ico';

type Source = 'image' | 'text';
type Shape = 'square' | 'rounded' | 'circle';

interface Look {
  /** Empty space around the artwork, 0 to 0.3 of the icon. */
  padding: number;
  /** null for transparent. */
  background: string | null;
  shape: Shape;
}

interface FileOut {
  name: string;
  bytes: Uint8Array;
  /** Expected pixel size, checked after rendering. */
  size?: number;
}

/** Draw the artwork into a square icon of `size` pixels. */
async function renderIcon(art: HTMLImageElement, size: number, look: Look): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No canvas');
  context.imageSmoothingQuality = 'high';
  const radius = look.shape === 'circle' ? size / 2 : look.shape === 'rounded' ? size * 0.18 : 0;
  if (look.background) {
    context.fillStyle = look.background;
    context.beginPath();
    context.roundRect(0, 0, size, size, radius);
    context.fill();
  }
  // Fit the artwork inside the padding, keeping its shape.
  const box = size * (1 - 2 * look.padding);
  const scale = Math.min(box / art.naturalWidth, box / art.naturalHeight);
  const w = art.naturalWidth * scale;
  const h = art.naturalHeight * scale;
  context.drawImage(art, (size - w) / 2, (size - h) / 2, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not save a PNG');
  return new Uint8Array(await blob.arrayBuffer());
}

async function loadArt(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  // SVGs without a size report 0; give them one to scale from.
  if (!image.naturalWidth) {
    image.width = 512;
    image.height = 512;
  }
  return image;
}

async function buildPackage(
  art: HTMLImageElement,
  look: Look,
  svg: string | null,
  name: string,
  themeColor: string,
): Promise<FileOut[]> {
  const opaque = look.background ?? '#ffffff';
  const png = (size: number, override: Partial<Look> = {}) =>
    renderIcon(art, size, { ...look, ...override });
  const [p16, p32, p48, apple, a192, a512, maskable] = await Promise.all([
    png(16),
    png(32),
    png(48),
    // iOS fills transparency with black and rounds corners itself: opaque and square.
    png(180, { background: opaque, shape: 'square' }),
    png(192),
    png(512),
    // Android crops maskable icons to many shapes; keep the artwork inside the central safe zone.
    png(512, { background: opaque, shape: 'square', padding: Math.max(0.1, look.padding) + 0.1 }),
  ]);
  const options = {
    name: name.trim() || 'My site',
    themeColor,
    backgroundColor: opaque,
    svg: svg !== null,
  };
  const encoder = new TextEncoder();
  return [
    {
      name: 'favicon.ico',
      bytes: encodeIco([
        { size: 16, png: p16 },
        { size: 32, png: p32 },
        { size: 48, png: p48 },
      ]),
    },
    ...(svg ? [{ name: 'favicon.svg', bytes: encoder.encode(svg) }] : []),
    { name: 'favicon-16x16.png', bytes: p16, size: 16 },
    { name: 'favicon-32x32.png', bytes: p32, size: 32 },
    { name: 'apple-touch-icon.png', bytes: apple, size: 180 },
    { name: 'android-chrome-192x192.png', bytes: a192, size: 192 },
    { name: 'android-chrome-512x512.png', bytes: a512, size: 512 },
    { name: 'maskable-512x512.png', bytes: maskable, size: 512 },
    { name: 'site.webmanifest', bytes: encoder.encode(webManifest(options)) },
    { name: 'favicon-tags.html', bytes: encoder.encode(`${headTags(options)}\n`) },
  ];
}

/** Every file checked after it was made: PNG sizes from their headers, ICO sizes from its directory. */
function verify(files: FileOut[]): string[] {
  const problems: string[] = [];
  for (const file of files) {
    if (file.size) {
      const header = readImageHeader(file.bytes);
      if (header?.width !== file.size || header.height !== file.size) problems.push(file.name);
    }
    if (file.name === 'favicon.ico' && readIcoSizes(file.bytes).join() !== '16,32,48')
      problems.push(file.name);
  }
  return problems;
}

function urlOf(files: FileOut[], name: string): string | null {
  const file = files.find((f) => f.name === name);
  return file
    ? URL.createObjectURL(new Blob([file.bytes as BlobPart], { type: 'image/png' }))
    : null;
}

export default function FaviconGenerator(_props: ToolUiProps) {
  const [source, setSource] = useState<Source>('image');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('N');
  const [textColor, setTextColor] = useState('#ffffff');
  const [padding, setPadding] = useState(0);
  const [transparent, setTransparent] = useState(true);
  const [background, setBackground] = useState('#c2410c');
  const [shape, setShape] = useState<Shape>('rounded');
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#c2410c');
  const [files, setFiles] = useState<FileOut[] | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const look: Look = {
    padding: padding / 100,
    background: source === 'text' || !transparent ? background : null,
    shape,
  };
  // Text is drawn as an SVG; the icon background and shape are added around it.
  const artSvg =
    source === 'text' ? textSvg(text.trim() || '?', textColor, 'transparent', 'square') : null;
  const key = JSON.stringify([
    source,
    file?.name,
    file?.size,
    text,
    textColor,
    look,
    name,
    themeColor,
  ]);

  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    void (async () => {
      setError(null);
      if (source === 'image' && !file) {
        setFiles(null);
        return;
      }
      try {
        const artUrl =
          source === 'text'
            ? URL.createObjectURL(new Blob([artSvg ?? ''], { type: 'image/svg+xml' }))
            : URL.createObjectURL(file as File);
        urls.push(artUrl);
        const art = await loadArt(artUrl);
        // An SVG source is kept as favicon.svg too (sharp at every size); text becomes one.
        const svgText =
          source === 'text'
            ? textSvg(text.trim() || '?', textColor, look.background ?? 'transparent', look.shape)
            : file?.type === 'image/svg+xml'
              ? await (file as File).text()
              : null;
        const made = await buildPackage(art, look, svgText, name, themeColor);
        if (!alive) return;
        const next: Record<string, string> = {};
        for (const n of [
          'favicon-16x16.png',
          'favicon-32x32.png',
          'apple-touch-icon.png',
          'maskable-512x512.png',
        ]) {
          const url = urlOf(made, n);
          if (url) {
            urls.push(url);
            next[n] = url;
          }
        }
        setFiles(made);
        setProblems(verify(made));
        setPreviews(next);
      } catch {
        if (alive) setError('This image could not be read. Try a PNG, JPG, WebP or SVG.');
      }
    })();
    return () => {
      alive = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [key]);

  const tags = files
    ? new TextDecoder().decode(files.find((f) => f.name === 'favicon-tags.html')?.bytes)
    : '';

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <SegmentedControl<Source>
          label="Make it from"
          value={source}
          options={[
            { value: 'image', label: 'An image or logo' },
            { value: 'text', label: 'Text or emoji' },
          ]}
          onChange={setSource}
        />
        {source === 'image' ? (
          file ? (
            <Panel>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="min-w-0 truncate text-sm font-medium" data-testid="chosen-file">
                  {file.name}
                </p>
                <Button variant="ghost" onClick={() => setFile(null)}>
                  Choose another image
                </Button>
              </div>
            </Panel>
          ) : (
            <Dropzone
              accept="image/*,.svg"
              title="Choose your logo"
              detail="PNG, SVG, JPG or WebP, ideally square and at least 512 px · stays on your device"
              onFiles={(chosen) => setFile(chosen[0] ?? null)}
            />
          )
        ) : (
          <Panel>
            <div class="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Text or emoji (1 to 3 characters)"
                value={text}
                onChange={(v) => setText([...v].slice(0, 3).join(''))}
                testId="favicon-text"
              />
              <label class="flex flex-col gap-1.5 text-sm font-medium">
                Text colour
                <input
                  type="color"
                  value={textColor}
                  onInput={(e) => setTextColor(e.currentTarget.value)}
                  class="h-11 w-full cursor-pointer rounded-[var(--radius-control)]"
                />
              </label>
            </div>
          </Panel>
        )}
        {error ? <p class="text-sm text-red-800 dark:text-red-300">{error}</p> : null}
        {files ? (
          <Panel title="Preview">
            <div class="grid gap-4 sm:grid-cols-3" data-testid="favicon-preview">
              <div class="flex flex-col gap-2">
                <p class="text-xs font-medium text-stone-600 dark:text-stone-400">Browser tab</p>
                {['bg-stone-100 text-stone-900', 'bg-stone-800 text-stone-100'].map((theme) => (
                  <div
                    key={theme}
                    class={`flex items-center gap-2 rounded-t-lg px-3 py-2 text-xs ${theme}`}
                  >
                    {previews['favicon-32x32.png'] ? (
                      <img src={previews['favicon-32x32.png']} alt="" width={16} height={16} />
                    ) : null}
                    <span class="truncate">{name || 'My site'}</span>
                  </div>
                ))}
              </div>
              <div class="flex flex-col items-center gap-2">
                <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
                  iPhone home screen
                </p>
                {previews['apple-touch-icon.png'] ? (
                  <img
                    src={previews['apple-touch-icon.png']}
                    alt=""
                    class="size-16 rounded-2xl shadow"
                  />
                ) : null}
              </div>
              <div class="flex flex-col items-center gap-2">
                <p class="text-xs font-medium text-stone-600 dark:text-stone-400">
                  Android (round mask)
                </p>
                {previews['maskable-512x512.png'] ? (
                  <img
                    src={previews['maskable-512x512.png']}
                    alt=""
                    class="size-16 rounded-full shadow"
                  />
                ) : null}
              </div>
            </div>
          </Panel>
        ) : null}
        {files ? (
          <Panel title="HTML for your <head>">
            <div class="flex flex-col gap-2">
              <textarea
                readOnly
                rows={7}
                aria-label="HTML tags"
                class="w-full rounded-[var(--radius-control)] border border-stone-300 bg-paper p-2 font-mono text-xs dark:border-stone-700 dark:bg-stone-900"
                value={tags}
                data-testid="favicon-tags"
              />
              <Button variant="secondary" onClick={() => void copyText(tags)}>
                Copy HTML
              </Button>
            </div>
          </Panel>
        ) : null}
      </div>

      <Panel title="Icon" class="h-fit">
        <div class="flex flex-col gap-5">
          <RangeInput
            label="Padding"
            value={padding}
            min={0}
            max={30}
            step={2}
            format={(v) => `${v}%`}
            onChange={setPadding}
          />
          {source === 'image' ? (
            <SegmentedControl<'yes' | 'no'>
              label="Background"
              value={transparent ? 'no' : 'yes'}
              options={[
                { value: 'no', label: 'Transparent' },
                { value: 'yes', label: 'Colour' },
              ]}
              onChange={(v) => setTransparent(v === 'no')}
            />
          ) : null}
          {source === 'text' || !transparent ? (
            <>
              <label class="flex flex-col gap-1.5 text-sm font-medium">
                Background colour
                <input
                  type="color"
                  value={background}
                  onInput={(e) => setBackground(e.currentTarget.value)}
                  class="h-11 w-full cursor-pointer rounded-[var(--radius-control)]"
                />
              </label>
              <SegmentedControl<Shape>
                label="Shape"
                value={shape}
                options={[
                  { value: 'square', label: 'Square' },
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'circle', label: 'Circle' },
                ]}
                onChange={setShape}
              />
            </>
          ) : null}
          <TextInput
            label="Site or app name"
            value={name}
            onChange={setName}
            placeholder="My site"
            hint="Used in the web app manifest."
          />
          <label class="flex flex-col gap-1.5 text-sm font-medium">
            Theme colour
            <input
              type="color"
              value={themeColor}
              onInput={(e) => setThemeColor(e.currentTarget.value)}
              class="h-11 w-full cursor-pointer rounded-[var(--radius-control)]"
            />
          </label>
          <Button
            size="lg"
            fullWidth
            disabled={!files || problems.length > 0}
            onClick={() =>
              files &&
              void zipFiles(
                files.map((f) => ({ name: f.name, blob: new Blob([f.bytes as BlobPart]) })),
              ).then((zip) => downloadBlob(zip, 'favicons.zip'))
            }
            data-testid="download"
          >
            Download favicons.zip
          </Button>
          {files ? (
            <p class="text-xs text-stone-600 dark:text-stone-400" data-testid="favicon-check">
              {problems.length === 0
                ? `${files.length} files, each checked: every PNG has its exact size and favicon.ico holds 16, 32 and 48 px.`
                : `Could not make: ${problems.join(', ')}. Please try another image.`}
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
