import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { centredCropForAspect, type Rect, type Size } from '@niftyfix/constraints';
import { HEADER_PROBE_BYTES, readImageHeader } from '@niftyfix/engine-image';
import { SIZE_TEMPLATES } from '@niftyfix/portal-specs';
import { downloadBlob, ObjectUrlRegistry, validateFile, type JobHandle } from '@niftyfix/runtime';
import {
  allChecksPassed,
  FILE_FORMATS,
  ToolError,
  toSerializedError,
  type ProcessedFile,
  type SerializedToolError,
} from '@niftyfix/tool-sdk';
import {
  BeforeAfter,
  Button,
  CropBox,
  cx,
  Dropzone,
  ErrorView,
  FactList,
  NumberInput,
  Panel,
  ProgressBar,
  RangeInput,
  SegmentedControl,
  SelectInput,
  TextInput,
  useFocusOnMount,
  ValidationReport,
  type ToolUiProps,
} from '@niftyfix/ui';
import { DEFAULT_SETTINGS, toOptions, validateSettings, type PhotoSettings } from './settings';

interface Source {
  file: File;
  url: string;
  size: Size;
  warning: string | null;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'processing'; handle: JobHandle; progress: number; stage: string }
  | { kind: 'done'; result: ProcessedFile; url: string; size: Size }
  | { kind: 'failed'; error: SerializedToolError };

const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.avif,.bmp,.gif,image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif';

function loadImageSize(url: string): Promise<Size> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () =>
      reject(
        new ToolError(
          'CORRUPT_INPUT',
          'Your browser could not display this image. It may be damaged.',
        ),
      );
    image.src = url;
  });
}

export default function PhotoResizer({ manifest, device, run, report }: ToolUiProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const [source, setSource] = useState<Source | null>(null);
  const [settings, setSettings] = useState<PhotoSettings>(DEFAULT_SETTINGS);
  const [crop, setCrop] = useState<Rect | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [inputError, setInputError] = useState<SerializedToolError | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => () => urls.current.revokeAll(), []);

  const errors = useMemo(() => validateSettings(settings), [settings]);
  const aspect =
    settings.width && settings.height && !errors.width && !errors.height
      ? settings.width / settings.height
      : null;

  // Re-centre the crop whenever the photo or the output shape changes.
  useEffect(() => {
    if (source && aspect) setCrop(centredCropForAspect(source.size, aspect));
  }, [source, aspect]);

  const update = (patch: Partial<PhotoSettings>): void => {
    setSettings((current) => ({ ...current, ...patch }));
    if (phase.kind === 'done' || phase.kind === 'failed') resetResult();
  };

  const resetResult = (): void => {
    if (phase.kind === 'done') urls.current.revoke(phase.url);
    setPhase({ kind: 'idle' });
  };

  const choose = async (files: File[]): Promise<void> => {
    const file = files[0];
    if (!file) return;
    setInputError(null);
    try {
      const validated = await validateFile(file, manifest.input, device);
      const header = readImageHeader(
        new Uint8Array(await file.slice(0, HEADER_PROBE_BYTES).arrayBuffer()),
      );
      if (header === null)
        throw new ToolError('CORRUPT_INPUT', 'This image is damaged or incomplete.');
      const limit = manifest.input.maxPixels;
      const maxPixels = limit
        ? device === 'high'
          ? limit.desktop
          : limit.mobile
        : Number.POSITIVE_INFINITY;
      if (header.width * header.height > maxPixels) {
        throw new ToolError(
          'TOO_MANY_PIXELS',
          `This image is ${header.width} × ${header.height} px, too large for this device.`,
          {
            hint: 'Use a smaller copy of the photo.',
          },
        );
      }
      const url = urls.current.create(file);
      const size = await loadImageSize(url).catch((error: unknown) => {
        urls.current.revoke(url);
        throw error;
      });
      const extensionWarning = validated.extensionMismatch
        ? `This file is really a ${FILE_FORMATS[header.format].label} even though its name ends differently. That is fine; the output will have the correct extension.`
        : null;
      if (source) urls.current.revoke(source.url);
      resetResult();
      setSource({ file, url, size, warning: extensionWarning });
      report('file_selected');
    } catch (error) {
      setInputError(toSerializedError(error));
    }
  };

  const start = async (): Promise<void> => {
    if (!source || !crop || Object.keys(errors).length > 0) return;
    const options = toOptions(settings, crop);
    const handle = run(source.file, options, {
      onProgress: (progress, stage) =>
        setPhase((current) =>
          current.kind === 'processing'
            ? { ...current, progress, stage: stage ?? current.stage }
            : current,
        ),
    });
    setPhase({ kind: 'processing', handle, progress: 0, stage: 'Starting' });
    report('tool_start');
    const outcome = await handle.promise;
    if (outcome.ok) {
      setPhase({
        kind: 'done',
        result: outcome.result,
        url: urls.current.create(outcome.result.blob),
        size: { width: options.width, height: options.height },
      });
      if (allChecksPassed(outcome.result.verification)) report('tool_success');
      else report('tool_fail', { code: 'VERIFICATION_FAILED' });
    } else {
      setPhase(
        outcome.error.code === 'CANCELLED'
          ? { kind: 'idle' }
          : { kind: 'failed', error: outcome.error },
      );
      if (outcome.error.code !== 'CANCELLED') report('tool_fail', { code: outcome.error.code });
    }
  };

  if (!source) {
    return (
      <div class="flex flex-col gap-4">
        <Dropzone
          accept={ACCEPT}
          title="Choose a photo"
          detail={`JPEG, PNG, WebP, AVIF, BMP or GIF · up to ${device === 'high' ? 60 : 30} MB · stays on your device`}
          onFiles={(files) => void choose(files)}
        />
        {inputError ? <ErrorView error={inputError} /> : null}
      </div>
    );
  }

  const busy = phase.kind === 'processing';
  const canRun = crop !== null && Object.keys(errors).length === 0 && !busy;

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="flex min-w-0 flex-col gap-4">
        <Panel>
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p class="min-w-0 truncate text-sm" title={source.file.name}>
              <span class="font-medium">{source.file.name}</span>
              <span class="text-stone-600 dark:text-stone-400">
                {' '}
                · {source.size.width} × {source.size.height} px
              </span>
            </p>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                urls.current.revoke(source.url);
                resetResult();
                setSource(null);
                setCrop(null);
              }}
            >
              Choose another photo
            </Button>
          </div>
          {source.warning ? (
            <p class="mb-3 text-sm text-amber-800 dark:text-amber-300">{source.warning}</p>
          ) : null}
          {crop && aspect ? (
            <CropBox
              imageUrl={source.url}
              image={source.size}
              aspect={aspect}
              crop={crop}
              onChange={setCrop}
            />
          ) : (
            <p class="text-sm text-stone-600">Enter valid dimensions to position the crop.</p>
          )}
        </Panel>

        {phase.kind === 'processing' ? (
          <Panel>
            <ProgressBar value={phase.progress} label={phase.stage} />
            <div class="mt-3">
              <Button
                variant="secondary"
                onClick={() => phase.handle.cancel()}
                data-testid="cancel"
              >
                Cancel
              </Button>
            </div>
          </Panel>
        ) : null}

        {phase.kind === 'failed' ? (
          <ErrorView error={phase.error} onRetry={() => void start()} focusOnMount />
        ) : null}

        {phase.kind === 'done' ? (
          <Result
            result={phase.result}
            url={phase.url}
            size={phase.size}
            original={{ url: source.url, ...source.size, bytes: source.file.size }}
            onDownload={() => {
              downloadBlob(phase.result.blob, phase.result.fileName);
              report('download');
            }}
          />
        ) : null}
      </div>

      <Panel title="Requirements" class="h-fit">
        <form
          class="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void start();
          }}
        >
          <div>
            <p class="mb-2 text-sm font-medium">Common sizes</p>
            <div class="flex flex-wrap gap-2" role="group" aria-label="Common sizes">
              {SIZE_TEMPLATES.map((template) => {
                const active =
                  settings.width === template.width &&
                  settings.height === template.height &&
                  settings.dpi === (template.dpi ?? null);
                return (
                  <button
                    key={template.id}
                    type="button"
                    aria-pressed={active}
                    title={template.description}
                    class={cx(
                      'min-h-9 rounded-full border px-3 text-sm',
                      active
                        ? 'border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-100'
                        : 'border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800',
                    )}
                    onClick={() =>
                      update({
                        width: template.width,
                        height: template.height,
                        dpi: template.dpi ?? null,
                      })
                    }
                  >
                    {template.label}
                  </button>
                );
              })}
            </div>
            <p class="mt-2 text-xs text-stone-600 dark:text-stone-400">
              Generic sizes, not any portal’s official rule. Always use the numbers in your notice.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <NumberInput
              label="Width"
              suffix="px"
              value={settings.width}
              error={errors.width}
              onChange={(width) => update({ width })}
              testId="width"
            />
            <NumberInput
              label="Height"
              suffix="px"
              value={settings.height}
              error={errors.height}
              onChange={(height) => update({ height })}
              testId="height"
            />
            <NumberInput
              label="Min size"
              suffix="KB"
              step={0.1}
              placeholder="none"
              value={settings.minKb}
              error={errors.minKb}
              onChange={(minKb) => update({ minKb })}
              testId="min-kb"
            />
            <NumberInput
              label="Max size"
              suffix="KB"
              step={0.1}
              placeholder="none"
              value={settings.maxKb}
              error={errors.maxKb}
              onChange={(maxKb) => update({ maxKb })}
              testId="max-kb"
            />
          </div>

          <SegmentedControl
            label="Format"
            value={settings.format}
            options={[
              { value: 'jpeg', label: 'JPEG' },
              { value: 'png', label: 'PNG' },
              { value: 'webp', label: 'WebP' },
            ]}
            onChange={(format) => update({ format })}
          />

          <button
            type="button"
            class="self-start text-sm font-medium text-teal-800 underline-offset-4 hover:underline dark:text-teal-300"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide advanced options' : 'Advanced options'}
          </button>

          {showAdvanced ? (
            <div class="flex flex-col gap-4">
              <SelectInput
                label="KB means"
                value={settings.convention}
                options={[
                  { value: 'safe', label: 'Safe (meets 1000 and 1024)' },
                  { value: 'kb1000', label: '1 KB = 1000 bytes' },
                  { value: 'kib1024', label: '1 KB = 1024 bytes' },
                ]}
                onChange={(convention) => update({ convention })}
              />
              {settings.format === 'jpeg' ? (
                <NumberInput
                  label="DPI"
                  placeholder="not set"
                  value={settings.dpi}
                  error={errors.dpi}
                  onChange={(dpi) => update({ dpi })}
                  hint="Only if your form asks for it."
                  testId="dpi"
                />
              ) : null}
              {settings.format !== 'png' ? (
                <RangeInput
                  label="Lowest quality allowed"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={settings.qualityFloor}
                  format={(value) => `${Math.round(value * 100)}%`}
                  onChange={(qualityFloor) => update({ qualityFloor })}
                />
              ) : null}
              {settings.format === 'jpeg' ? (
                <label class="flex items-center justify-between gap-3 text-sm font-medium">
                  Background for transparent areas
                  <input
                    type="color"
                    class="h-11 w-16 rounded border border-stone-300"
                    value={settings.background}
                    onInput={(event) => update({ background: event.currentTarget.value })}
                  />
                </label>
              ) : null}
              <TextInput
                label="File name"
                placeholder="e.g. photo"
                value={settings.fileName}
                error={errors.fileName}
                onChange={(fileName) => update({ fileName })}
                hint="Leave empty to keep your original name."
                testId="file-name"
              />
            </div>
          ) : null}

          <Button type="submit" size="lg" fullWidth disabled={!canRun} data-testid="prepare">
            {busy ? 'Preparing…' : 'Prepare photo'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}

function Result({
  result,
  url,
  size,
  original,
  onDownload,
}: {
  result: ProcessedFile;
  url: string;
  size: Size;
  original: { url: string; width: number; height: number; bytes: number };
  onDownload(): void;
}) {
  const passed = allChecksPassed(result.verification);
  // On phones the result renders above the settings panel; bring it into view.
  const statusRef = useFocusOnMount<HTMLParagraphElement>();
  return (
    <Panel>
      <div class="flex flex-col gap-5" data-testid="result">
        <p
          ref={statusRef}
          tabIndex={-1}
          role="status"
          class={cx(
            'rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium',
            passed
              ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200',
          )}
        >
          {passed
            ? 'Your photo meets every requirement you entered.'
            : 'The produced file failed a check below. Please report this; do not upload it.'}
        </p>
        <BeforeAfter
          before={{ ...original, label: 'Original' }}
          after={{ url, label: 'Prepared', ...size, bytes: result.bytes }}
        />
        <ValidationReport checks={result.verification} />
        {result.warnings.map((warning) => (
          <p key={warning} class="text-sm text-amber-800 dark:text-amber-300">
            {warning}
          </p>
        ))}
        <FactList facts={result.facts} />
        <Button
          size="lg"
          fullWidth
          onClick={onDownload}
          data-testid="download"
          variant={passed ? 'primary' : 'secondary'}
        >
          Download {result.fileName}
        </Button>
        <p class="text-xs text-stone-600 dark:text-stone-400">
          Checks cover the technical requirements you entered. Portals may also check things like
          face position, background or a live photo.
        </p>
      </div>
    </Panel>
  );
}
