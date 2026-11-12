import { useEffect, useRef, useState } from 'preact/hooks';
import {
  Button,
  imageDisplaySize,
  RangeInput,
  SegmentedControl,
  SingleFileTool,
  type ToolUiProps,
} from '@niftyfix/ui';
import { findAadhaarNumbers } from './aadhaar';
import { Editor } from './editor';
import type { BlurImageOptions, RedactArea } from './options';

type Style = RedactArea['style'];
type Cover = 'first8' | 'all';

/** Read the image's text (OCR) and return boxes over any Aadhaar numbers. */
async function findNumbers(url: string, cover: Cover, signal: AbortSignal): Promise<RedactArea[]> {
  // Draw it first, so OCR sees the picture the right way up (EXIF orientation applied).
  const element = new Image();
  element.src = url;
  await element.decode();
  const canvas = document.createElement('canvas');
  canvas.width = element.naturalWidth;
  canvas.height = element.naturalHeight;
  canvas.getContext('2d')?.drawImage(element, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return [];
  const { recognizeText } = await import('@niftyfix/engine-ocr');
  const result = await recognizeText(blob, {
    languages: ['eng'],
    assetOrigin: location.origin,
    signal,
  });
  return findAadhaarNumbers(result.lines, cover).map((area) => ({ ...area, style: 'black' }));
}

export default function BlurImage(props: ToolUiProps) {
  const aadhaarPage = props.preset === 'aadhaar';
  const [image, setImage] = useState<{
    url: string;
    size: { width: number; height: number };
  } | null>(null);
  const [boxes, setBoxes] = useState<RedactArea[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [style, setStyle] = useState<Style>('black');
  const [strength, setStrength] = useState(60);
  const [cover, setCover] = useState<Cover>('first8');
  const [finding, setFinding] = useState<'idle' | 'busy' | string>('idle');
  const search = useRef<AbortController | null>(null);
  useEffect(() => () => (image ? URL.revokeObjectURL(image.url) : undefined), [image]);

  const find = async (url: string): Promise<void> => {
    search.current?.abort();
    const controller = new AbortController();
    search.current = controller;
    setFinding('busy');
    try {
      const found = await findNumbers(url, cover, controller.signal);
      setBoxes((current) => [...current, ...found]);
      setFinding(
        found.length > 0
          ? `Covered ${found.length} Aadhaar number${found.length === 1 ? '' : 's'}. Check them, and draw a box over the QR code too.`
          : 'No Aadhaar number found. Draw a box over it yourself.',
      );
    } catch {
      if (!controller.signal.aborted)
        setFinding('The text reader could not run. Draw the boxes yourself.');
    }
  };

  const onFileChange = async (file: File | null): Promise<void> => {
    search.current?.abort();
    setBoxes([]);
    setSelected(null);
    setFinding('idle');
    const size = file ? await imageDisplaySize(file) : null;
    const next = file && size ? { url: URL.createObjectURL(file), size } : null;
    setImage(next);
    if (next && aadhaarPage) void find(next.url);
  };

  const chooseStyle = (next: Style): void => {
    setStyle(next);
    if (selected !== null && boxes[selected]) {
      setBoxes(boxes.map((box, i) => (i === selected ? { ...box, style: next } : box)));
    }
  };

  const options: BlurImageOptions | null =
    boxes.length > 0 ? { boxes, strength, fileName: '' } : null;

  return (
    <SingleFileTool
      {...props}
      accept="image/*"
      chooseTitle="Choose an image"
      settingsTitle="Hide"
      actionLabel="Save image"
      busyLabel="Saving…"
      successMessage="Your image is ready. The covered areas are part of the picture now."
      disclaimer="Solid boxes were checked in the saved file: nothing shows through them. Location and camera data were removed."
      options={options}
      optionsKey={JSON.stringify(options)}
      onFileChange={(file) => void onFileChange(file)}
      preview={() =>
        image ? (
          <Editor
            imageUrl={image.url}
            size={image.size}
            boxes={boxes}
            selected={selected}
            strength={strength}
            newStyle={style}
            onChange={(next, index) => {
              setBoxes(next);
              setSelected(index);
            }}
          />
        ) : null
      }
    >
      <SegmentedControl<Style>
        label={selected === null ? 'New boxes' : `Area ${selected + 1}`}
        value={selected !== null ? (boxes[selected]?.style ?? style) : style}
        options={[
          { value: 'black', label: 'Black' },
          { value: 'white', label: 'White' },
          { value: 'pixelate', label: 'Pixelate' },
          { value: 'blur', label: 'Blur' },
        ]}
        onChange={chooseStyle}
      />
      {boxes.some((box) => box.style === 'pixelate' || box.style === 'blur') ||
      style === 'pixelate' ||
      style === 'blur' ? (
        <RangeInput
          label="Pixelate and blur strength"
          value={strength}
          min={10}
          max={100}
          step={10}
          format={(v) => `${v}%`}
          hint="For numbers and text, black boxes are safest: blur and pixelation can sometimes be undone."
          onChange={setStrength}
        />
      ) : null}
      <div class="flex flex-col gap-2 rounded-[var(--radius-control)] border border-stone-200 p-3 dark:border-stone-700">
        <SegmentedControl<Cover>
          label="Aadhaar numbers"
          value={cover}
          options={[
            { value: 'first8', label: 'Hide first 8 digits' },
            { value: 'all', label: 'Hide all 12' },
          ]}
          onChange={setCover}
        />
        <Button
          variant="secondary"
          disabled={!image || finding === 'busy'}
          onClick={() => image && void find(image.url)}
          data-testid="find-aadhaar"
        >
          {finding === 'busy' ? 'Reading the image…' : 'Find and cover Aadhaar numbers'}
        </Button>
        {finding !== 'idle' && finding !== 'busy' ? (
          <p
            role="status"
            class="text-xs text-stone-700 dark:text-stone-300"
            data-testid="find-status"
          >
            {finding}
          </p>
        ) : null}
      </div>
      {boxes.length > 0 ? (
        <div class="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            disabled={selected === null}
            onClick={() => {
              setBoxes(boxes.filter((_, i) => i !== selected));
              setSelected(null);
            }}
          >
            Remove selected box
          </Button>
          <Button variant="ghost" onClick={() => (setBoxes([]), setSelected(null))}>
            Clear all
          </Button>
        </div>
      ) : (
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Draw at least one box on the picture.
        </p>
      )}
    </SingleFileTool>
  );
}
