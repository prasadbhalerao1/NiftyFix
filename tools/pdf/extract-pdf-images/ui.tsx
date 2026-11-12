import { useEffect, useState } from 'preact/hooks';
import { downloadBlob, ObjectUrlRegistry, readZip, zipFiles } from '@niftyfix/runtime';
import type { ProcessedFile } from '@niftyfix/tool-sdk';
import {
  ALL_PAGES,
  Button,
  CheckboxInput,
  cx,
  PageSelection,
  pageSelectionError,
  SegmentedControl,
  SingleFileTool,
  TextInput,
  type PageSelectionValue,
  type ToolUiProps,
} from '@niftyfix/ui';

type MinSide = '0' | '50' | '150';

interface Picture {
  name: string;
  blob: Blob;
  url: string;
}

const mimeOf = (name: string): string => (name.endsWith('.jpg') ? 'image/jpeg' : 'image/png');

/** Thumbnails of what was saved, to download all of them or only the ones ticked. */
function Gallery({ result }: { result: ProcessedFile }) {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const urls = new ObjectUrlRegistry();
    let live = true;
    void (async () => {
      const files =
        result.format === 'zip'
          ? (await readZip(result.blob)).map(({ name, bytes }) => ({
              name,
              blob: new Blob([bytes as BlobPart], { type: mimeOf(name) }),
            }))
          : [{ name: result.fileName, blob: result.blob }];
      if (!live) return;
      setPictures(files.map((file) => ({ ...file, url: urls.create(file.blob) })));
      setPicked(new Set(files.map((file) => file.name)));
    })();
    return () => {
      live = false;
      urls.revokeAll();
    };
  }, [result]);

  if (pictures.length < 2) return null;
  const chosen = pictures.filter((picture) => picked.has(picture.name));
  const toggle = (name: string): void => {
    const next = new Set(picked);
    if (!next.delete(name)) next.add(name);
    setPicked(next);
  };
  const downloadChosen = async (): Promise<void> => {
    const [only] = chosen;
    if (chosen.length === 1 && only) return downloadBlob(only.blob, only.name);
    downloadBlob(await zipFiles(chosen), result.fileName.replace(/\.zip$/, '-selected.zip'));
  };

  return (
    <div class="flex flex-col gap-3" data-testid="image-gallery">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-stone-700 dark:text-stone-300">
          {chosen.length} of {pictures.length} selected
        </p>
        <Button
          variant="ghost"
          onClick={() =>
            setPicked(
              chosen.length === pictures.length
                ? new Set()
                : new Set(pictures.map((picture) => picture.name)),
            )
          }
        >
          {chosen.length === pictures.length ? 'Select none' : 'Select all'}
        </Button>
      </div>
      <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {pictures.map((picture) => (
          <li key={picture.name}>
            <label
              class={cx(
                'grid h-full cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5 rounded-[var(--radius-control)] border p-2 text-xs has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600',
                picked.has(picture.name)
                  ? 'border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950'
                  : 'border-stone-300 dark:border-stone-700',
              )}
            >
              <img
                src={picture.url}
                alt=""
                loading="lazy"
                class="col-span-2 h-28 w-full rounded bg-stone-100 object-contain dark:bg-stone-900"
              />
              <input
                type="checkbox"
                class="size-4 accent-brand-700"
                checked={picked.has(picture.name)}
                onChange={() => toggle(picture.name)}
              />
              <span class="truncate" title={picture.name}>
                {picture.name}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <Button
        variant="secondary"
        fullWidth
        disabled={chosen.length === 0 || chosen.length === pictures.length}
        onClick={() => void downloadChosen()}
        data-testid="download-selected"
      >
        Download {chosen.length === 1 ? 'the selected image' : `${chosen.length} selected images`}
      </Button>
    </div>
  );
}

export default function ExtractPdfImages(props: ToolUiProps) {
  const [minSide, setMinSide] = useState<MinSide>(props.preset === 'photos' ? '150' : '50');
  const [pages, setPages] = useState<PageSelectionValue>(ALL_PAGES);
  const [joinPieces, setJoinPieces] = useState(true);
  const [asShown, setAsShown] = useState(true);
  const [password, setPassword] = useState('');
  const options =
    pageSelectionError(pages) === null
      ? { minSide: Number(minSide), pages, joinPieces, asShown, password, fileName: '' }
      : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Images"
      actionLabel="Extract images"
      busyLabel="Extracting…"
      successMessage="The images are saved at their original quality."
      disclaimer="Each image was measured after it was saved to confirm it kept every pixel stored in the PDF. JPEG photos keep their exact compressed data."
      options={options}
      resultPreview={(result) => <Gallery result={result} />}
    >
      <SegmentedControl<MinSide>
        label="Skip small images"
        value={minSide}
        options={[
          { value: '0', label: 'Keep all' },
          { value: '50', label: 'Under 50 px' },
          { value: '150', label: 'Under 150 px' },
        ]}
        onChange={setMinSide}
      />
      <PageSelection label="Pages" value={pages} onChange={setPages} />
      <CheckboxInput
        label="Join pictures split into pieces"
        hint="Some PDFs store one picture as many strips or tiles."
        checked={joinPieces}
        onChange={setJoinPieces}
      />
      <CheckboxInput
        label="Turn pictures the way the page shows them"
        hint="Fixes images that come out sideways or upside down."
        checked={asShown}
        onChange={setAsShown}
      />
      <TextInput
        label="PDF password (only if it has one)"
        type="password"
        value={password}
        onChange={setPassword}
        testId="pdf-password"
      />
    </SingleFileTool>
  );
}
