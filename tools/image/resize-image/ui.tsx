import { useEffect, useState } from 'preact/hooks';
import {
  CheckboxInput,
  imageDisplaySize,
  NumberInput,
  SelectInput,
  SingleFileTool,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { ResizeImageOptions } from './options';
import { fromPixels, proportional, resolveSize, type Size, type Unit } from './settings';

type Fit = ResizeImageOptions['fit'];
type Format = ResizeImageOptions['format'];

export default function ResizeImage(props: ToolUiProps) {
  const [source, setSource] = useState<Size | null>(null);
  // The "resize image in cm" page opens in centimetres.
  const [unit, setUnit] = useState<Unit>(props.preset === 'unit-cm' ? 'cm' : 'px');
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [percent, setPercent] = useState<number | null>(50);
  const [dpi, setDpi] = useState<number | null>(300);
  const [keep, setKeep] = useState(true);
  const [fit, setFit] = useState<Fit>('cover');
  const [format, setFormat] = useState<Format>('auto');

  const onFileChange = async (file: File | null): Promise<void> => {
    setSource(file ? await imageDisplaySize(file) : null);
  };
  // A new file starts from its own size, in the current unit. An effect, because the unit
  // may change while the image is still loading.
  useEffect(() => {
    if (source && unit !== 'percent') {
      setWidth(fromPixels(source.width, unit, dpi ?? 300));
      setHeight(fromPixels(source.height, unit, dpi ?? 300));
    }
  }, [source]);

  const changeUnit = (next: Unit): void => {
    if (source && next !== 'percent') {
      // Carry the current size over, so switching units never loses what was typed.
      const current = resolveSize({ unit, width, height, percent, dpi }, source);
      const pixels = 'error' in current ? source : current;
      setWidth(fromPixels(pixels.width, next, dpi ?? 300));
      setHeight(fromPixels(pixels.height, next, dpi ?? 300));
    }
    setUnit(next);
  };

  const changeWidth = (value: number | null): void => {
    setWidth(value);
    if (keep && source && value !== null && value > 0)
      setHeight(proportional(value, source.width, source.height, unit));
  };
  const changeHeight = (value: number | null): void => {
    setHeight(value);
    if (keep && source && value !== null && value > 0)
      setWidth(proportional(value, source.height, source.width, unit));
  };

  const size = source ? resolveSize({ unit, width, height, percent, dpi }, source) : null;
  const error = size && 'error' in size ? size.error : null;
  const physical = unit === 'cm' || unit === 'in';
  const options: ResizeImageOptions | null =
    size && !('error' in size)
      ? {
          ...size,
          fit: keep || unit === 'percent' ? 'stretch' : fit,
          format,
          ...(physical && dpi !== null ? { dpi } : {}),
          fileName: '',
        }
      : null;
  const unitLabel = unit === 'px' ? 'px' : unit;

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose an image"
      settingsTitle="New size"
      actionLabel="Resize image"
      busyLabel="Resizing…"
      successMessage="Your image is resized."
      disclaimer="The new file was decoded again to confirm its pixel dimensions and format."
      options={options}
      onFileChange={(file) => void onFileChange(file)}
    >
      {source ? (
        <p class="text-sm text-stone-600 dark:text-stone-400" data-testid="source-size">
          Original: {source.width} × {source.height} px
        </p>
      ) : null}
      <SelectInput<Unit>
        label="Resize by"
        value={unit}
        options={[
          { value: 'px', label: 'Pixels' },
          { value: 'percent', label: 'Percentage' },
          { value: 'cm', label: 'Centimetres' },
          { value: 'in', label: 'Inches' },
        ]}
        onChange={changeUnit}
        testId="unit"
      />
      {unit === 'percent' ? (
        <NumberInput
          label="Percentage of original size"
          value={percent}
          min={1}
          max={1000}
          suffix="%"
          error={error ?? undefined}
          onChange={setPercent}
          testId="percent"
        />
      ) : (
        <>
          <div class="grid grid-cols-2 gap-3">
            <NumberInput
              label="Width"
              value={width}
              min={0}
              step={unit === 'px' ? 1 : 0.01}
              suffix={unitLabel}
              onChange={changeWidth}
              testId="width"
            />
            <NumberInput
              label="Height"
              value={height}
              min={0}
              step={unit === 'px' ? 1 : 0.01}
              suffix={unitLabel}
              onChange={changeHeight}
              testId="height"
            />
          </div>
          {error ? (
            <p class="text-sm text-red-700 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          {physical ? (
            <NumberInput
              label="DPI"
              value={dpi}
              min={1}
              max={2400}
              hint="Pixels per inch for printing. 300 is usual; forms sometimes ask for 200."
              onChange={setDpi}
              testId="dpi"
            />
          ) : null}
          <CheckboxInput
            label="Keep proportions"
            checked={keep}
            onChange={(next) => {
              setKeep(next);
              if (next && source && width !== null && width > 0)
                setHeight(proportional(width, source.width, source.height, unit));
            }}
            testId="keep-proportions"
          />
          {keep ? null : (
            <SelectInput<Fit>
              label="If the shape changes"
              value={fit}
              options={[
                { value: 'cover', label: 'Fill and crop the edges' },
                { value: 'contain', label: 'Fit inside and add borders' },
                { value: 'stretch', label: 'Stretch to fit' },
              ]}
              onChange={setFit}
              testId="fit"
            />
          )}
        </>
      )}
      {options ? (
        <p class="text-sm text-stone-600 dark:text-stone-400" data-testid="output-size">
          New size: {options.width} × {options.height} px
        </p>
      ) : null}
      <SelectInput<Format>
        label="Format"
        value={format}
        options={[
          { value: 'auto', label: 'Same as original' },
          { value: 'jpeg', label: 'JPG' },
          { value: 'webp', label: 'WebP' },
          { value: 'png', label: 'PNG' },
        ]}
        onChange={setFormat}
      />
    </SingleFileTool>
  );
}
