import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { expandToAspect, type Rect, type Size } from '@niftyfix/constraints';
import { DEFAULT_ENHANCE, NO_ENHANCE, type EnhanceSettings } from '@niftyfix/engine-image';
import { downloadBlob, ObjectUrlRegistry } from '@niftyfix/runtime';
import {
  fileInput,
  parseKbPreset,
  toSerializedError,
  type SerializedToolError,
} from '@niftyfix/tool-sdk';
import {
  Button,
  CheckboxInput,
  CropBox,
  Dropzone,
  ErrorView,
  ImageResultPanel,
  loadImageSource,
  OutputSpecForm,
  Panel,
  ProcessingPanel,
  RangeInput,
  SegmentedControl,
  useToolJob,
  type ImageSource,
  type ToolUiProps,
} from '@niftyfix/ui';
import { detectSignature, SignaturePreview, useLoadedImage } from './preview';
import {
  DEFAULT_SETTINGS,
  toOptions,
  validateSettings,
  type Placement,
  type SignatureSettings,
} from './settings';

const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.avif,.bmp,.gif,image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif';

const percent = (value: number): string => `${Math.round(value * 100)}%`;
const signedPercent = (value: number): string =>
  `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`;

export default function SignatureResizer({ manifest, device, run, report, preset }: ToolUiProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const [source, setSource] = useState<ImageSource | null>(null);
  // Intent pages such as "signature 10 to 20 KB" open with that size range filled in.
  const [settings, setSettings] = useState<SignatureSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...parseKbPreset(preset),
  }));
  const [crop, setCrop] = useState<Rect | null>(null);
  const [autoCropped, setAutoCropped] = useState<boolean | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [inputError, setInputError] = useState<SerializedToolError | null>(null);
  const job = useToolJob<Size>({ run, report }, urls.current);
  const { phase } = job;
  const image = useLoadedImage(source?.url ?? '');

  useEffect(() => () => urls.current.revokeAll(), []);

  const errors = useMemo(() => validateSettings(settings), [settings]);
  const outputAspect =
    settings.width && settings.height && !errors.width && !errors.height
      ? settings.width / settings.height
      : null;
  const lockedAspect = settings.placement === 'fill' ? outputAspect : null;

  const fullImage = (size: Size): Rect => ({ x: 0, y: 0, ...size });
  const shapeCrop = (rect: Rect, size: Size): Rect =>
    lockedAspect ? expandToAspect(rect, lockedAspect, size) : rect;

  // Auto-crop to the signature when an image is loaded.
  useEffect(() => {
    if (!source || !image || image.src !== source.url) return;
    const detected = detectSignature(image);
    setAutoCropped(detected !== null);
    setCrop(shapeCrop(detected ?? fullImage(source.size), source.size));
  }, [image, source]);

  // Keep the crop shape in step with the placement / output shape.
  useEffect(() => {
    if (source && crop && lockedAspect) setCrop(expandToAspect(crop, lockedAspect, source.size));
  }, [lockedAspect]);

  const update = (patch: Partial<SignatureSettings>): void => {
    setSettings((current) => ({ ...current, ...patch }));
    if (phase.kind === 'done' || phase.kind === 'failed') job.reset();
  };
  const updateEnhance = (patch: Partial<EnhanceSettings>): void =>
    update({ enhance: { ...settings.enhance, ...patch } });

  const choose = async (files: File[]): Promise<void> => {
    const file = files[0];
    if (!file) return;
    setInputError(null);
    try {
      const next = await loadImageSource(file, fileInput(manifest), device, urls.current);
      if (source) urls.current.revoke(source.url);
      job.reset();
      setCrop(null);
      setAutoCropped(null);
      setSource(next);
      report('file_selected');
    } catch (error) {
      setInputError(toSerializedError(error));
    }
  };

  const start = (): void => {
    if (!source || !crop || Object.keys(errors).length > 0) return;
    const options = toOptions(settings, crop);
    void job.start(source.file, options, { width: options.width, height: options.height });
  };

  if (!source) {
    return (
      <div class="flex flex-col gap-4">
        <Dropzone
          accept={ACCEPT}
          title="Choose a signature photo or scan"
          detail={`JPEG, PNG, WebP, AVIF, BMP or GIF · up to ${device === 'high' ? 60 : 30} MB · stays on your device`}
          onFiles={(files) => void choose(files)}
        />
        {inputError ? <ErrorView error={inputError} /> : null}
      </div>
    );
  }

  const canRun = crop !== null && Object.keys(errors).length === 0 && !job.busy;
  const enhance = settings.enhance;

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
              disabled={job.busy}
              onClick={() => {
                urls.current.revoke(source.url);
                job.reset();
                setSource(null);
                setCrop(null);
              }}
            >
              Choose another image
            </Button>
          </div>
          {source.warning ? (
            <p class="mb-3 text-sm text-amber-800 dark:text-amber-300">{source.warning}</p>
          ) : null}
          {autoCropped === false ? (
            <p class="mb-3 text-sm text-amber-800 dark:text-amber-300" data-testid="autocrop-none">
              No signature was detected automatically. Drag the frame around it.
            </p>
          ) : null}
          {crop ? (
            <>
              <CropBox
                imageUrl={source.url}
                image={source.size}
                aspect={lockedAspect}
                crop={crop}
                onChange={setCrop}
                hint="Drag the frame around your signature. Use the corner handle or this slider to resize."
              />
              <div class="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  data-testid="autocrop"
                  onClick={() => {
                    if (!image) return;
                    const detected = detectSignature(image);
                    setAutoCropped(detected !== null);
                    if (detected) setCrop(shapeCrop(detected, source.size));
                  }}
                >
                  Auto-crop to signature
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCrop(shapeCrop(fullImage(source.size), source.size))}
                >
                  Use whole image
                </Button>
              </div>
            </>
          ) : (
            <p class="text-sm text-stone-600 dark:text-stone-400">Loading image…</p>
          )}
        </Panel>

        {image && crop ? (
          <Panel title="Cleanup">
            <div class="flex flex-col gap-4">
              <SegmentedControl
                label="Preview"
                value={showOriginal ? 'original' : 'cleaned'}
                options={[
                  { value: 'cleaned', label: 'Cleaned' },
                  { value: 'original', label: 'Original' },
                ]}
                onChange={(view) => setShowOriginal(view === 'original')}
              />
              <SignaturePreview
                image={image}
                crop={crop}
                enhance={enhance}
                showOriginal={showOriginal}
              />
              <SegmentedControl
                label="Ink"
                value={enhance.mode}
                options={[
                  { value: 'color', label: 'Colour' },
                  { value: 'grayscale', label: 'Grayscale' },
                  { value: 'blackwhite', label: 'Black & white' },
                ]}
                onChange={(mode) => updateEnhance({ mode })}
              />
              <CheckboxInput
                label="Even out lighting and shadows"
                checked={enhance.flatten}
                onChange={(flatten) => updateEnhance({ flatten })}
                hint="Removes grey paper, uneven light and hand shadows."
                testId="flatten"
              />
              <RangeInput
                label="Background cleanup"
                min={0}
                max={1}
                step={0.05}
                value={enhance.whiten}
                format={percent}
                onChange={(whiten) => updateEnhance({ whiten })}
                hint="Higher makes the paper whiter but can thin faint strokes."
              />
              {enhance.mode === 'blackwhite' ? (
                <RangeInput
                  label="Threshold"
                  min={0.1}
                  max={0.95}
                  step={0.05}
                  value={enhance.threshold}
                  format={percent}
                  onChange={(threshold) => updateEnhance({ threshold })}
                  hint="Pixels darker than this become black. Lower values drop faint strokes."
                />
              ) : null}
              <RangeInput
                label="Brightness"
                min={-0.5}
                max={0.5}
                step={0.05}
                value={enhance.brightness}
                format={signedPercent}
                onChange={(brightness) => updateEnhance({ brightness })}
              />
              <RangeInput
                label="Contrast"
                min={-0.5}
                max={1}
                step={0.05}
                value={enhance.contrast}
                format={signedPercent}
                onChange={(contrast) => updateEnhance({ contrast })}
              />
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  data-testid="reset-cleanup"
                  onClick={() =>
                    update({ enhance: { ...DEFAULT_ENHANCE, transparent: enhance.transparent } })
                  }
                >
                  Reset to safe defaults
                </Button>
                <Button
                  variant="ghost"
                  data-testid="no-cleanup"
                  onClick={() => update({ enhance: { ...NO_ENHANCE, transparent: false } })}
                >
                  No cleanup (keep original)
                </Button>
              </div>
            </div>
          </Panel>
        ) : null}

        {phase.kind === 'processing' ? (
          <ProcessingPanel handle={phase.handle} progress={phase.progress} stage={phase.stage} />
        ) : null}

        {phase.kind === 'failed' ? (
          <ErrorView error={phase.error} onRetry={start} focusOnMount />
        ) : null}

        {phase.kind === 'done' ? (
          <ImageResultPanel
            result={phase.result}
            url={phase.url}
            size={phase.meta}
            original={{ url: source.url, ...source.size, bytes: source.file.size }}
            subject="signature"
            disclaimer="Checks cover the technical requirements you entered. Portals may also judge the signature itself."
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
            start();
          }}
        >
          <SegmentedControl<Placement>
            label="Placement"
            value={settings.placement}
            options={[
              { value: 'fit', label: 'Fit inside' },
              { value: 'fill', label: 'Fill' },
            ]}
            onChange={(placement) => update({ placement })}
          />
          <p class="-mt-3 text-xs text-stone-600 dark:text-stone-400">
            {settings.placement === 'fit'
              ? 'The whole signature is scaled into the box with white margins.'
              : 'The crop frame takes the output shape and fills it edge to edge.'}
          </p>

          <OutputSpecForm
            value={settings}
            errors={errors}
            onChange={(patch) => update(patch as Partial<SignatureSettings>)}
            formats={['jpeg', 'png']}
            fileNamePlaceholder="signature"
            advanced={
              <CheckboxInput
                label="Transparent background (PNG only)"
                checked={enhance.transparent}
                onChange={(transparent) =>
                  update({
                    enhance: { ...enhance, transparent },
                    ...(transparent ? { format: 'png' } : {}),
                  })
                }
                hint={
                  errors.transparent ??
                  'Removes the paper. Most portals want a normal JPEG instead.'
                }
                testId="transparent"
              />
            }
          />

          <Button type="submit" size="lg" fullWidth disabled={!canRun} data-testid="prepare">
            {job.busy ? 'Preparing…' : 'Prepare signature'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
