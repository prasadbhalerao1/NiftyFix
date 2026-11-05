import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { centredCropForAspect, type Rect, type Size } from '@niftyfix/constraints';
import { SIZE_TEMPLATES } from '@niftyfix/portal-specs';
import { downloadBlob, ObjectUrlRegistry } from '@niftyfix/runtime';
import {
  fileInput,
  parseKbPreset,
  toSerializedError,
  type SerializedToolError,
} from '@niftyfix/tool-sdk';
import {
  Button,
  CropBox,
  cx,
  Dropzone,
  ErrorView,
  ImageResultPanel,
  loadImageSource,
  OutputSpecForm,
  Panel,
  ProcessingPanel,
  useToolJob,
  type ImageSource,
  type ToolUiProps,
} from '@niftyfix/ui';
import { DEFAULT_SETTINGS, toOptions, validateSettings, type PhotoSettings } from './settings';

const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.avif,.bmp,.gif,image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif';

export default function PhotoResizer({ manifest, device, run, report, preset }: ToolUiProps) {
  const urls = useRef(new ObjectUrlRegistry());
  const [source, setSource] = useState<ImageSource | null>(null);
  // Intent pages such as "resize photo to 50 KB" open with that size limit filled in.
  const [settings, setSettings] = useState<PhotoSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...parseKbPreset(preset),
  }));
  const [crop, setCrop] = useState<Rect | null>(null);
  const [inputError, setInputError] = useState<SerializedToolError | null>(null);
  const job = useToolJob<Size>({ run, report }, urls.current);
  const { phase } = job;

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
    if (phase.kind === 'done' || phase.kind === 'failed') job.reset();
  };

  const choose = async (files: File[]): Promise<void> => {
    const file = files[0];
    if (!file) return;
    setInputError(null);
    try {
      const next = await loadImageSource(file, fileInput(manifest), device, urls.current);
      if (source) urls.current.revoke(source.url);
      job.reset();
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
          title="Choose a photo"
          detail={`JPEG, PNG, WebP, AVIF, BMP or GIF · up to ${device === 'high' ? 60 : 30} MB · stays on your device`}
          onFiles={(files) => void choose(files)}
        />
        {inputError ? <ErrorView error={inputError} /> : null}
      </div>
    );
  }

  const canRun = crop !== null && Object.keys(errors).length === 0 && !job.busy;

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
            <p class="text-sm text-stone-600 dark:text-stone-400">
              Enter valid dimensions to position the crop.
            </p>
          )}
        </Panel>

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
            subject="photo"
            disclaimer="Checks cover the technical requirements you entered. Portals may also check things like face position, background or a live photo."
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
                        ? 'border-brand-700 bg-brand-50 text-brand-900 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-100'
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

          <OutputSpecForm
            value={settings}
            errors={errors}
            onChange={update}
            formats={['jpeg', 'png', 'webp']}
            fileNamePlaceholder="photo"
            advanced={
              settings.format === 'jpeg' ? (
                <label class="flex items-center justify-between gap-3 text-sm font-medium">
                  Background for transparent areas
                  <input
                    type="color"
                    class="h-11 w-16 rounded border border-stone-300"
                    value={settings.background}
                    onInput={(event) => update({ background: event.currentTarget.value })}
                  />
                </label>
              ) : null
            }
          />

          <Button type="submit" size="lg" fullWidth disabled={!canRun} data-testid="prepare">
            {job.busy ? 'Preparing…' : 'Prepare photo'}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
