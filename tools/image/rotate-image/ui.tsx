import { useEffect, useState } from 'preact/hooks';
import { Button, CheckboxInput, SingleFileTool, type ToolUiProps } from '@niftyfix/ui';
import type { RotateImageOptions } from './options';

type Turn = RotateImageOptions['turn'];

/** The chosen image with the pending rotation and flips applied by CSS, so the result is visible before saving. */
function Preview({
  file,
  turn,
  flipH,
  flipV,
}: {
  file: File;
  turn: Turn;
  flipH: boolean;
  flipV: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (url === null) return null;
  // Same order as the processor: rotate, then mirror as seen.
  const transform = `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1}) rotate(${turn}deg)`;
  return (
    <div class="flex h-64 items-center justify-center overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-900">
      <img
        src={url}
        alt="How the result will look"
        class="max-h-48 max-w-48 object-contain transition-transform duration-200 motion-reduce:transition-none"
        style={{ transform }}
        data-testid="rotate-preview"
      />
    </div>
  );
}

export default function RotateImage(props: ToolUiProps) {
  const [turn, setTurn] = useState<Turn>(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const rotate = (by: 90 | 270): void => setTurn(((turn + by) % 360) as Turn);
  const changed = turn !== 0 || flipH || flipV;
  const options: RotateImageOptions | null = changed
    ? { turn, flipHorizontal: flipH, flipVertical: flipV, fileName: '' }
    : null;

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose an image"
      settingsTitle="Rotate and flip"
      actionLabel="Save image"
      busyLabel="Saving…"
      successMessage="Your image is turned the right way."
      disclaimer="The new file was decoded again to confirm its pixel dimensions and format."
      options={options}
      preview={(file) => <Preview file={file} turn={turn} flipH={flipH} flipV={flipV} />}
    >
      <div class="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => rotate(270)} data-testid="rotate-left">
          ↺ Left
        </Button>
        <Button variant="secondary" onClick={() => rotate(90)} data-testid="rotate-right">
          ↻ Right
        </Button>
      </div>
      <p class="text-sm text-stone-600 dark:text-stone-400" data-testid="turn">
        {turn === 0 ? 'Not rotated' : `Rotated ${turn}° clockwise`}
      </p>
      <CheckboxInput
        label="Flip left to right (mirror)"
        checked={flipH}
        onChange={setFlipH}
        testId="flip-horizontal"
      />
      <CheckboxInput
        label="Flip top to bottom"
        checked={flipV}
        onChange={setFlipV}
        testId="flip-vertical"
      />
      {changed ? null : (
        <p class="text-sm text-stone-600 dark:text-stone-400">Choose a rotation or a flip.</p>
      )}
    </SingleFileTool>
  );
}
