import { useEffect, useState } from 'preact/hooks';
import { centredCropForAspect, type Rect, type Size } from '@niftyfix/constraints';
import {
  CropBox,
  imageDisplaySize,
  SelectInput,
  SingleFileTool,
  type ToolUiProps,
} from '@niftyfix/ui';
import { describeByteRange } from '@niftyfix/tool-sdk';
import type { PassportPhotoOptions } from './options';
import { PHOTO_TARGETS, type PhotoTarget } from './specs';

/**
 * A dashed oval where the head should sit. With a stated head height it is drawn
 * at the middle of the allowed range; otherwise it is only a centring guide.
 */
function HeadGuide({ target }: { target: PhotoTarget }) {
  const height = target.head ? (target.head.min + target.head.max) / 2 : 0.62;
  // Faces sit slightly above the middle in every specification's sample photos.
  const top = Math.max(0.04, 0.46 - height / 2);
  const width = (height * target.height * 0.74) / target.width;
  return (
    <span
      class="absolute rounded-[50%] border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgb(0_0_0/0.35)]"
      style={{
        top: `${top * 100}%`,
        height: `${height * 100}%`,
        left: `${((1 - width) / 2) * 100}%`,
        width: `${width * 100}%`,
      }}
      data-testid="head-guide"
    />
  );
}

export default function PassportPhotoMaker(props: ToolUiProps) {
  const [targetId, setTargetId] = useState(
    () =>
      PHOTO_TARGETS.find((target) => target.spec.id === props.preset)?.spec.id ??
      PHOTO_TARGETS[0]?.spec.id ??
      '',
  );
  const target = PHOTO_TARGETS.find((candidate) => candidate.spec.id === targetId);
  const [image, setImage] = useState<{ url: string; size: Size } | null>(null);
  const [crop, setCrop] = useState<Rect | null>(null);
  useEffect(() => () => (image ? URL.revokeObjectURL(image.url) : undefined), [image]);

  const aspect = target ? target.width / target.height : 1;
  // A new image, or a different shape, starts with the largest centred frame.
  useEffect(
    () => setCrop(image ? centredCropForAspect(image.size, aspect) : null),
    [image, aspect],
  );

  const onFileChange = async (file: File | null): Promise<void> => {
    const size = file ? await imageDisplaySize(file) : null;
    setImage(file && size ? { url: URL.createObjectURL(file), size } : null);
  };

  const options: PassportPhotoOptions | null =
    target && crop
      ? {
          crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
          width: target.width,
          height: target.height,
          format: 'jpeg',
          ...(target.minBytes === undefined ? {} : { minBytes: target.minBytes }),
          ...(target.maxBytes === undefined ? {} : { maxBytes: target.maxBytes }),
          ...(target.dpi === undefined ? {} : { dpi: target.dpi }),
          qualityFloor: 0.4,
          background: '#ffffff',
          quality: 0.95,
          fileName: '',
        }
      : null;

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose a photo"
      settingsTitle="Photo type"
      actionLabel="Make photo"
      busyLabel="Making photo…"
      successMessage="Your photo matches the size rules."
      disclaimer="Size, file size, format and DPI were measured on the file. Background, lighting and expression cannot be checked automatically: compare with the official rules before you submit."
      options={options}
      onFileChange={(file) => void onFileChange(file)}
      preview={() =>
        image && crop && target ? (
          <CropBox
            imageUrl={image.url}
            image={image.size}
            aspect={aspect}
            crop={crop}
            onChange={setCrop}
            overlay={<HeadGuide target={target} />}
            hint="Move and zoom the frame so your head fills the dashed oval: top of the hair at its top, chin at its bottom."
          />
        ) : null
      }
    >
      <SelectInput
        label="Document"
        value={targetId}
        options={PHOTO_TARGETS.map((candidate) => ({
          value: candidate.spec.id,
          label: candidate.label,
        }))}
        onChange={setTargetId}
        testId="photo-type"
      />
      {target ? (
        <dl
          class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm"
          data-testid="photo-spec"
        >
          {target.printSize ? (
            <>
              <dt class="text-stone-600 dark:text-stone-400">Print size</dt>
              <dd>{target.printSize}</dd>
            </>
          ) : null}
          <dt class="text-stone-600 dark:text-stone-400">File</dt>
          <dd>
            {target.width} × {target.height} px JPG
            {target.dpi ? `, ${target.dpi} DPI` : ''}
            {target.minBytes !== undefined || target.maxBytes !== undefined
              ? `, ${describeByteRange(target)}`
              : ''}
          </dd>
          {target.spec.headHeightMm ? (
            <>
              <dt class="text-stone-600 dark:text-stone-400">Head</dt>
              <dd>
                {target.spec.headHeightMm.min} to {target.spec.headHeightMm.max} mm, chin to top of
                head
              </dd>
            </>
          ) : null}
          {target.spec.background ? (
            <>
              <dt class="text-stone-600 dark:text-stone-400">Background</dt>
              <dd>{target.spec.background}</dd>
            </>
          ) : null}
          <dt class="text-stone-600 dark:text-stone-400">Source</dt>
          <dd class="break-words">
            {new URL(target.spec.source.url).hostname}, checked{' '}
            {new Date(target.spec.verifiedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </dd>
        </dl>
      ) : null}
      <p class="text-sm text-stone-600 dark:text-stone-400">
        This tool does not change the background. Take the photo against a plain, light wall in even
        light.
      </p>
    </SingleFileTool>
  );
}
