import { useState } from 'preact/hooks';
import { RangeInput, SegmentedControl, SingleFileTool, type ToolUiProps } from '@niftyfix/ui';
import type { ImageOutputFormat } from '@niftyfix/tool-sdk';
import type { ConvertImageOptions } from './options';

/** Format pages such as "PNG to JPG" open with their target format chosen ("to-jpeg"). */
const presetFormat = (preset: string | undefined): ImageOutputFormat | null =>
  preset === 'to-jpeg' || preset === 'to-png' || preset === 'to-webp'
    ? (preset.slice(3) as ImageOutputFormat)
    : null;

export default function ConvertImage(props: ToolUiProps) {
  const [format, setFormat] = useState<ImageOutputFormat>(
    () => presetFormat(props.preset) ?? 'jpeg',
  );
  const [quality, setQuality] = useState(0.92);
  const options: ConvertImageOptions = { format, quality, background: '#ffffff', fileName: '' };
  const label = format === 'jpeg' ? 'JPG' : format === 'png' ? 'PNG' : 'WebP';

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose an image"
      settingsTitle="Convert to"
      actionLabel={`Convert to ${label}`}
      busyLabel="Converting…"
      successMessage={`Your ${label} is ready.`}
      disclaimer="The new file was decoded again to confirm its format and pixel dimensions."
      options={options}
    >
      <SegmentedControl<ImageOutputFormat>
        label="Format"
        value={format}
        options={[
          { value: 'jpeg', label: 'JPG' },
          { value: 'png', label: 'PNG' },
          { value: 'webp', label: 'WebP' },
        ]}
        onChange={setFormat}
      />
      {format === 'png' ? (
        <p class="text-sm text-stone-600 dark:text-stone-400">
          PNG is lossless: every pixel is kept exactly, and transparency is preserved. Files are
          larger than JPG for photos.
        </p>
      ) : (
        <RangeInput
          label="Quality"
          value={quality}
          min={0.5}
          max={1}
          step={0.01}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={setQuality}
          hint={
            format === 'jpeg'
              ? 'About 90% looks the same as the original. Transparent areas become white.'
              : 'About 90% looks the same as the original. Transparency is kept.'
          }
        />
      )}
    </SingleFileTool>
  );
}
