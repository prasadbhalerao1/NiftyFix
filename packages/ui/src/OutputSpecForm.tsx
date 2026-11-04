import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import type { ImageOutputFormat, OutputSpecDraft, OutputSpecErrors } from '@niftyfix/tool-sdk';
import { NumberInput, RangeInput, SegmentedControl, SelectInput, TextInput } from './fields';

const FORMAT_LABELS: Record<ImageOutputFormat, string> = { jpeg: 'JPEG', png: 'PNG', webp: 'WebP' };

export interface OutputSpecFormProps {
  value: OutputSpecDraft;
  errors: OutputSpecErrors;
  onChange(patch: Partial<OutputSpecDraft>): void;
  formats: readonly ImageOutputFormat[];
  /** e.g. "photo", "signature". */
  fileNamePlaceholder: string;
  /** Tool-specific controls rendered inside the advanced section. */
  advanced?: ComponentChildren;
}

/** The upload-requirements fields shared by image tools: pixels, KB range, format, and advanced options. */
export function OutputSpecForm({
  value,
  errors,
  onChange,
  formats,
  fileNamePlaceholder,
  advanced,
}: OutputSpecFormProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div class="grid grid-cols-2 gap-3">
        <NumberInput
          label="Width"
          suffix="px"
          value={value.width}
          error={errors.width}
          onChange={(width) => onChange({ width })}
          testId="width"
        />
        <NumberInput
          label="Height"
          suffix="px"
          value={value.height}
          error={errors.height}
          onChange={(height) => onChange({ height })}
          testId="height"
        />
        <NumberInput
          label="Min size"
          suffix="KB"
          step={0.1}
          placeholder="none"
          value={value.minKb}
          error={errors.minKb}
          onChange={(minKb) => onChange({ minKb })}
          testId="min-kb"
        />
        <NumberInput
          label="Max size"
          suffix="KB"
          step={0.1}
          placeholder="none"
          value={value.maxKb}
          error={errors.maxKb}
          onChange={(maxKb) => onChange({ maxKb })}
          testId="max-kb"
        />
      </div>

      <SegmentedControl
        label="Format"
        value={value.format}
        options={formats.map((format) => ({ value: format, label: FORMAT_LABELS[format] }))}
        onChange={(format) => onChange({ format })}
      />

      <button
        type="button"
        class="self-start text-sm font-medium text-brand-800 underline-offset-4 hover:underline dark:text-brand-300"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide advanced options' : 'Advanced options'}
      </button>

      {open ? (
        <div class="flex flex-col gap-4">
          <SelectInput
            label="KB means"
            value={value.convention}
            options={[
              { value: 'safe', label: 'Safe (meets 1000 and 1024)' },
              { value: 'kb1000', label: '1 KB = 1000 bytes' },
              { value: 'kib1024', label: '1 KB = 1024 bytes' },
            ]}
            onChange={(convention) => onChange({ convention })}
          />
          {value.format === 'jpeg' ? (
            <NumberInput
              label="DPI"
              placeholder="not set"
              value={value.dpi}
              error={errors.dpi}
              onChange={(dpi) => onChange({ dpi })}
              hint="Only if your form asks for it."
              testId="dpi"
            />
          ) : null}
          {value.format !== 'png' ? (
            <RangeInput
              label="Lowest quality allowed"
              min={0.1}
              max={0.9}
              step={0.05}
              value={value.qualityFloor}
              format={(quality) => `${Math.round(quality * 100)}%`}
              onChange={(qualityFloor) => onChange({ qualityFloor })}
            />
          ) : null}
          {advanced}
          <TextInput
            label="File name"
            placeholder={`e.g. ${fileNamePlaceholder}`}
            value={value.fileName}
            error={errors.fileName}
            onChange={(fileName) => onChange({ fileName })}
            hint="Leave empty to keep your original name."
            testId="file-name"
          />
        </div>
      ) : null}
    </>
  );
}
