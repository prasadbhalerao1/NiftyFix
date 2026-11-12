import { useEffect, useRef, useState } from 'preact/hooks';
import { tonePixels, type ToneSettings } from '@niftyfix/engine-pdf/tone';
import {
  CheckboxInput,
  RangeInput,
  SegmentedControl,
  SelectInput,
  SingleFileTool,
  TextInput,
  usePdfPreview,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { GrayscalePdfOptions } from './options';

type Mode = GrayscalePdfOptions['mode'];
type Method = GrayscalePdfOptions['method'];

const METHOD_OPTIONS: { value: Method; label: string }[] = [
  { value: 'luminance', label: 'Luminance (standard)' },
  { value: 'rec709', label: 'Luminance (HD, Rec. 709)' },
  { value: 'average', label: 'Average of red, green and blue' },
  { value: 'lightness', label: 'Lightness' },
  { value: 'red', label: 'Red channel (removes red ink and stamps)' },
  { value: 'green', label: 'Green channel' },
  { value: 'blue', label: 'Blue channel (removes blue pen)' },
];

const percent = (value: number): string => `${value > 0 ? '+' : ''}${value}%`;

/** Page 1 drawn small, then toned with the same rules the converter uses. */
function TonePreview({
  file,
  settings,
  dither,
  password,
}: {
  file: File;
  settings: ToneSettings;
  dither: boolean;
  password: string;
}) {
  const { preview } = usePdfPreview(file, password);
  const source = useRef<HTMLCanvasElement | null>(null);
  const target = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!preview) return;
    const canvas = document.createElement('canvas');
    source.current = canvas;
    void preview.render(0, canvas, 320).then(() => setReady(true));
  }, [preview]);

  useEffect(() => {
    const from = source.current;
    const to = target.current;
    if (!ready || !from || !to) return;
    const context = from.getContext('2d');
    const out = to.getContext('2d');
    if (!context || !out) return;
    const { width, height } = from;
    const pixels = context.getImageData(0, 0, width, height);
    const toned = tonePixels(pixels.data, width, height, settings, dither);
    const image = out.createImageData(width, height);
    for (let p = 0; p < width * height; p += 1) {
      let rgb: number[];
      if (toned.bits === 1) {
        const rowBytes = (width + 7) >> 3;
        const x = p % width;
        const y = Math.floor(p / width);
        const bit = ((toned.data[y * rowBytes + (x >> 3)] ?? 0) >> (7 - (x & 7))) & 1;
        rgb = [bit * 255, bit * 255, bit * 255];
      } else if (toned.channels === 1) {
        const g = toned.data[p] ?? 0;
        rgb = [g, g, g];
      } else rgb = [...toned.data.subarray(p * 3, p * 3 + 3)];
      image.data.set([...rgb, 255], p * 4);
    }
    to.width = width;
    to.height = height;
    out.putImageData(image, 0, 0);
  }, [ready, JSON.stringify(settings), dither]);

  return (
    <figure class="flex flex-col items-center gap-2" data-testid="tone-preview">
      <canvas
        ref={target}
        aria-label="Preview of page 1"
        class="max-h-80 max-w-full bg-white shadow-sm ring-1 ring-stone-200 dark:ring-stone-700"
      />
      <figcaption class="text-xs text-stone-600 dark:text-stone-400">
        Preview of page 1. In the file, text stays sharp and selectable.
      </figcaption>
    </figure>
  );
}

export default function GrayscalePdf(props: ToolUiProps) {
  const [mode, setMode] = useState<Mode>('gray');
  const [method, setMethod] = useState<Method>('luminance');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [threshold, setThreshold] = useState(50);
  const [strength, setStrength] = useState(100);
  const [dither, setDither] = useState(false);
  const [password, setPassword] = useState('');
  const options: GrayscalePdfOptions = {
    mode,
    method,
    brightness,
    contrast,
    threshold,
    strength,
    dither,
    password,
    fileName: '',
  };
  const settings: ToneSettings = {
    method,
    brightness: brightness / 100,
    contrast: contrast / 100,
    mode,
    threshold: threshold / 100,
    strength: mode === 'gray' ? strength / 100 : 1,
  };

  return (
    <SingleFileTool
      {...props}
      accept=".pdf,application/pdf"
      chooseTitle="Choose a PDF"
      settingsTitle="Colour"
      actionLabel="Convert PDF"
      busyLabel="Converting…"
      successMessage="Your PDF is converted. Text is still text."
      disclaimer="The saved file was opened again and every page, drawing, gradient and image in it was checked for colour."
      options={options}
      preview={(file) => (
        <TonePreview file={file} settings={settings} dither={dither} password={password} />
      )}
    >
      <SegmentedControl<Mode>
        label="Mode"
        value={mode}
        options={[
          { value: 'gray', label: 'Grayscale' },
          { value: 'black-text', label: 'Black text' },
          { value: 'bw', label: 'Black & white' },
        ]}
        onChange={setMode}
      />
      <SelectInput<Method>
        label="Gray from"
        value={method}
        options={METHOD_OPTIONS}
        onChange={setMethod}
      />
      <RangeInput
        label="Brightness"
        value={brightness}
        min={-100}
        max={100}
        step={5}
        format={percent}
        onChange={setBrightness}
      />
      <RangeInput
        label="Contrast"
        value={contrast}
        min={-100}
        max={100}
        step={5}
        format={percent}
        onChange={setContrast}
      />
      {mode === 'bw' ? (
        <>
          <RangeInput
            label="Black below"
            value={threshold}
            min={5}
            max={95}
            step={5}
            format={(v) => `${v}% gray`}
            hint="Raise it to keep faint lines and pencil; lower it to drop background shading."
            onChange={setThreshold}
          />
          <CheckboxInput
            label="Dither photos"
            hint="Shows photos with dots instead of solid black and white areas."
            checked={dither}
            onChange={setDither}
          />
        </>
      ) : null}
      {mode === 'gray' ? (
        <RangeInput
          label="Colour removed"
          value={strength}
          min={0}
          max={100}
          step={5}
          format={(v) => `${v}%`}
          hint="Below 100% keeps a little colour; 100% is true grayscale for black-only printing."
          onChange={setStrength}
        />
      ) : null}
      <TextInput
        label="PDF password (only if it has one)"
        type="password"
        value={password}
        onChange={setPassword}
        hint="The converted copy keeps the same password."
        testId="pdf-password"
      />
    </SingleFileTool>
  );
}
