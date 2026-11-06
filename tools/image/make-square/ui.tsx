import { useEffect, useState } from 'preact/hooks';
import { NumberInput, SegmentedControl, SingleFileTool, type ToolUiProps } from '@niftyfix/ui';
import type { MakeSquareOptions } from './options';

type Fill = 'white' | 'black' | 'custom' | 'blur';

/** A live CSS preview of the frame, so the result is visible before saving. */
function Preview({
  file,
  shape,
  borderPercent,
  background,
}: {
  file: File;
  shape: MakeSquareOptions['shape'];
  borderPercent: number;
  background: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (url === null) return null;
  return (
    <div class="flex h-64 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-900">
      <div
        class="relative flex max-h-56 max-w-56 items-center justify-center overflow-hidden"
        style={{
          aspectRatio: shape === 'square' ? '1 / 1' : undefined,
          padding: `${Math.min(borderPercent, 50) * 0.9}%`,
          background: background ?? undefined,
          height: shape === 'square' ? '14rem' : undefined,
        }}
        data-testid="square-preview"
      >
        {background === null ? (
          <img
            src={url}
            alt=""
            aria-hidden="true"
            class="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
          />
        ) : null}
        <img
          src={url}
          alt="How the result will look"
          class="relative max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}

export default function MakeSquare(props: ToolUiProps) {
  const [shape, setShape] = useState<MakeSquareOptions['shape']>(
    props.preset === 'border' ? 'border' : 'square',
  );
  const [borderPercent, setBorderPercent] = useState<number | null>(
    props.preset === 'border' ? 5 : 0,
  );
  const [fill, setFill] = useState<Fill>(props.preset === 'blur' ? 'blur' : 'white');
  const [custom, setCustom] = useState('#f97316');

  const colour = fill === 'black' ? '#000000' : fill === 'custom' ? custom : '#ffffff';
  const borderValid = borderPercent !== null && borderPercent >= 0 && borderPercent <= 50;
  const needsBorder = shape === 'border' && borderPercent === 0;
  const options: MakeSquareOptions | null =
    borderValid && !needsBorder
      ? {
          shape,
          borderPercent: borderPercent ?? 0,
          fill: fill === 'blur' ? 'blur' : 'colour',
          colour,
          fileName: '',
        }
      : null;

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose an image"
      settingsTitle="Shape and background"
      actionLabel="Save image"
      busyLabel="Saving…"
      successMessage={
        shape === 'square'
          ? 'Your square image is ready, with nothing cropped.'
          : 'Your border is added.'
      }
      disclaimer="The new file was decoded again to confirm its pixel dimensions and format."
      options={options}
      preview={(file) => (
        <Preview
          file={file}
          shape={shape}
          borderPercent={borderPercent ?? 0}
          background={fill === 'blur' ? null : colour}
        />
      )}
    >
      <SegmentedControl
        label="Shape"
        value={shape}
        options={[
          { value: 'square', label: 'Make square' },
          { value: 'border', label: 'Add border' },
        ]}
        onChange={(value) => {
          setShape(value);
          if (value === 'border' && borderPercent === 0) setBorderPercent(5);
        }}
      />
      <NumberInput
        label={shape === 'square' ? 'Extra space around the photo' : 'Border size'}
        suffix="%"
        value={borderPercent}
        min={0}
        max={50}
        step={1}
        hint="A share of the photo's longer side."
        error={
          !borderValid
            ? 'Between 0 and 50%.'
            : needsBorder
              ? 'Choose a border above 0%.'
              : undefined
        }
        onChange={setBorderPercent}
        testId="border"
      />
      <SegmentedControl<Fill>
        label="Background"
        value={fill}
        options={[
          { value: 'white', label: 'White' },
          { value: 'black', label: 'Black' },
          { value: 'blur', label: 'Blurred' },
          { value: 'custom', label: 'Colour' },
        ]}
        onChange={setFill}
      />
      {fill === 'custom' ? (
        <label class="flex items-center justify-between gap-3 text-sm font-medium">
          Background colour
          <input
            type="color"
            class="h-11 w-16 rounded border border-stone-300"
            value={custom}
            onInput={(event) => setCustom(event.currentTarget.value)}
            data-testid="colour"
          />
        </label>
      ) : null}
    </SingleFileTool>
  );
}
