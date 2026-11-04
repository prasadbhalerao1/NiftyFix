import { useEffect, useRef, useState } from 'preact/hooks';
import { ObjectUrlRegistry } from '@niftyfix/runtime';
import { toSerializedError } from '@niftyfix/tool-sdk';
import {
  Button,
  Dropzone,
  RangeInput,
  SegmentedControl,
  SingleFileTool,
  usePdfPreview,
  type ToolUiProps,
} from '@niftyfix/ui';
import { Placement, type Rect } from './placement';
import { exportSignature, SignaturePad, type Ink } from './signature-pad';
import { cleanSignaturePhoto } from './signature-source';

interface Signature {
  bytes: Uint8Array;
  url: string;
  /** Height ÷ width of the signature image. */
  aspect: number;
}

async function measure(bytes: Uint8Array): Promise<number> {
  const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/png' }));
  const aspect = bitmap.height / bitmap.width;
  bitmap.close();
  return aspect;
}

function PagePreview({
  file,
  page,
  onPage,
  signature,
  rect,
  onRect,
  onLayout,
}: {
  file: File;
  page: number;
  onPage(page: number): void;
  signature: Signature | null;
  rect: Rect;
  onRect(rect: Rect): void;
  onLayout(pageCount: number, pageAspect: number): void;
}) {
  const { preview, error } = usePdfPreview(file);
  const size = preview?.sizes[page];
  useEffect(() => {
    if (preview && size) onLayout(preview.pageCount, size.width / size.height);
  }, [preview, page]);
  if (error) return <p class="text-sm text-red-800 dark:text-red-300">{error.message}</p>;
  if (!preview) {
    return (
      <p class="py-10 text-center text-sm text-stone-600 dark:text-stone-400">Loading pages…</p>
    );
  }
  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          ←
        </Button>
        <span class="text-sm tabular-nums" data-testid="page-indicator">
          Page {page + 1} of {preview.pageCount}
        </span>
        <Button
          variant="ghost"
          disabled={page >= preview.pageCount - 1}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          →
        </Button>
      </div>
      {signature ? (
        <Placement
          preview={preview}
          page={page}
          signatureUrl={signature.url}
          rect={rect}
          onRect={onRect}
        />
      ) : (
        <p class="rounded-[var(--radius-control)] bg-stone-100 p-4 text-center text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-300">
          Draw or upload your signature, then drag it into place on the page.
        </p>
      )}
    </div>
  );
}

export default function SignPdf(props: ToolUiProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const [source, setSource] = useState<'draw' | 'upload'>('draw');
  const [ink, setInk] = useState<Ink>('black');
  const [signature, setSignature] = useState<Signature | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pageAspect, setPageAspect] = useState(595 / 842);
  const [everyPage, setEveryPage] = useState(false);
  const [width, setWidth] = useState(0.3);
  const [position, setPosition] = useState({ x: 0.6, y: 0.8 });

  useEffect(() => () => urls.current.revokeAll(), []);

  const use = async (bytes: Uint8Array | null): Promise<void> => {
    if (signature) urls.current.revoke(signature.url);
    if (!bytes) {
      setSignature(null);
      return;
    }
    const url = urls.current.create(new Blob([bytes as BlobPart], { type: 'image/png' }));
    setSignature({ bytes, url, aspect: await measure(bytes) });
  };

  // Height follows the signature's own shape on this page's proportions.
  const height = signature ? Math.min(1, width * signature.aspect * pageAspect) : 0.1;
  const rect: Rect = {
    x: Math.min(position.x, 1 - width),
    y: Math.min(position.y, 1 - height),
    width,
    height,
  };
  const options = signature
    ? {
        signature: signature.bytes,
        rect,
        placeOn: everyPage ? { mode: 'all' } : { mode: 'one', page },
        fileName: '',
      }
    : null;

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF to sign"
      settingsTitle="Your signature"
      actionLabel="Sign PDF"
      busyLabel="Signing…"
      successMessage="Your signature is placed."
      disclaimer="The saved file was read back to confirm the signature is on the chosen pages. This is a visual signature, not a certificate-based digital signature."
      options={options}
      optionsKey={
        signature ? `${signature.url}|${JSON.stringify(rect)}|${everyPage ? 'all' : page}` : 'none'
      }
      preview={(file) => (
        <PagePreview
          file={file}
          page={page}
          onPage={setPage}
          signature={signature}
          rect={rect}
          onRect={(next) => setPosition({ x: next.x, y: next.y })}
          onLayout={(count, aspect) => {
            setPageCount(count);
            setPageAspect(aspect);
          }}
        />
      )}
    >
      <SegmentedControl<'draw' | 'upload'>
        label="Signature"
        value={source}
        options={[
          { value: 'draw', label: 'Draw' },
          { value: 'upload', label: 'Upload a photo' },
        ]}
        onChange={(next) => {
          setSource(next);
          void use(null);
        }}
      />
      {source === 'draw' ? (
        <>
          <SegmentedControl<Ink>
            label="Ink"
            value={ink}
            options={[
              { value: 'black', label: 'Black' },
              { value: 'blue', label: 'Blue' },
            ]}
            onChange={setInk}
          />
          <SignaturePad
            ink={ink}
            onChange={(canvas) => void (canvas ? exportSignature(canvas).then(use) : use(null))}
          />
        </>
      ) : (
        <div class="flex flex-col gap-2">
          <Dropzone
            compact
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            title={signature ? 'Choose another photo' : 'Choose a signature photo'}
            detail="Sign on white paper; the paper is removed automatically"
            onFiles={(files) => {
              const photo = files[0];
              if (!photo) return;
              setUploadError(null);
              cleanSignaturePhoto(photo).then(use, (error) =>
                setUploadError(toSerializedError(error).message),
              );
            }}
          />
          {uploadError ? <p class="text-sm text-red-800 dark:text-red-300">{uploadError}</p> : null}
          {signature ? (
            <img
              src={signature.url}
              alt="Your cleaned signature"
              class="max-h-24 self-start rounded border border-stone-200 bg-[conic-gradient(#e7e5e4_25%,#fafaf9_0_50%,#e7e5e4_0_75%,#fafaf9_0)] bg-[length:12px_12px] dark:border-stone-700"
            />
          ) : null}
        </div>
      )}
      {signature ? (
        <>
          <RangeInput
            label="Size"
            min={0.08}
            max={0.7}
            step={0.01}
            value={width}
            format={(value) => `${Math.round(value * 100)}% of page width`}
            onChange={setWidth}
          />
          <SegmentedControl<'one' | 'all'>
            label="Place on"
            value={everyPage ? 'all' : 'one'}
            options={[
              { value: 'one', label: `Page ${page + 1} only` },
              { value: 'all', label: `All ${pageCount} pages` },
            ]}
            onChange={(next) => setEveryPage(next === 'all')}
          />
        </>
      ) : null}
    </SingleFileTool>
  );
}
