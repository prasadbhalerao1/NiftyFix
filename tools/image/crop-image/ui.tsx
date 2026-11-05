import { useEffect, useState } from 'preact/hooks';
import { centredCropForAspect, type Rect, type Size } from '@niftyfix/constraints';
import {
  CropBox,
  imageDisplaySize,
  SelectInput,
  SingleFileTool,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { CropImageOptions } from './options';

type Shape = 'free' | 'original' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3.5:4.5';

const RATIOS: Record<Exclude<Shape, 'free' | 'original'>, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '3.5:4.5': 3.5 / 4.5,
};

const aspectOf = (shape: Shape, image: Size): number | null =>
  shape === 'free' ? null : shape === 'original' ? image.width / image.height : RATIOS[shape];

/** Start with most of the image selected, in the chosen shape. */
function startingCrop(image: Size, aspect: number | null): Rect {
  if (aspect !== null) return centredCropForAspect(image, aspect);
  const inset = 0.05;
  return {
    x: image.width * inset,
    y: image.height * inset,
    width: image.width * (1 - 2 * inset),
    height: image.height * (1 - 2 * inset),
  };
}

export default function CropImage(props: ToolUiProps) {
  const [image, setImage] = useState<{ url: string; size: Size } | null>(null);
  const [shape, setShape] = useState<Shape>('free');
  const [crop, setCrop] = useState<Rect | null>(null);
  useEffect(() => () => (image ? URL.revokeObjectURL(image.url) : undefined), [image]);

  const onFileChange = async (file: File | null): Promise<void> => {
    const size = file ? await imageDisplaySize(file) : null;
    setImage(file && size ? { url: URL.createObjectURL(file), size } : null);
  };
  // Start the frame once the image is known, in the shape chosen by then
  // (the user may pick a shape while the image is still loading).
  useEffect(
    () => setCrop(image ? startingCrop(image.size, aspectOf(shape, image.size)) : null),
    [image],
  );

  const changeShape = (next: Shape): void => {
    setShape(next);
    if (image) setCrop(startingCrop(image.size, aspectOf(next, image.size)));
  };

  const options: CropImageOptions | null = crop
    ? { crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height }, fileName: '' }
    : null;

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose an image"
      settingsTitle="Crop"
      actionLabel="Crop image"
      busyLabel="Cropping…"
      successMessage="Your image is cropped."
      disclaimer="The new file was decoded again to confirm its pixel dimensions and format."
      options={options}
      onFileChange={(file) => void onFileChange(file)}
      preview={() =>
        image && crop ? (
          <CropBox
            imageUrl={image.url}
            image={image.size}
            aspect={aspectOf(shape, image.size)}
            crop={crop}
            onChange={setCrop}
            hint="Drag the frame to move it. Use the corner handle or the slider to resize."
          />
        ) : null
      }
    >
      <SelectInput<Shape>
        label="Shape"
        value={shape}
        options={[
          { value: 'free', label: 'Free' },
          { value: 'original', label: 'Same as original' },
          { value: '1:1', label: 'Square (1:1)' },
          { value: '4:3', label: 'Landscape (4:3)' },
          { value: '3:4', label: 'Portrait (3:4)' },
          { value: '16:9', label: 'Wide (16:9)' },
          { value: '9:16', label: 'Story (9:16)' },
          { value: '3.5:4.5', label: 'Passport photo (3.5 × 4.5)' },
        ]}
        onChange={changeShape}
        testId="shape"
      />
    </SingleFileTool>
  );
}
