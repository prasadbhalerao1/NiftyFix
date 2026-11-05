import { useEffect, useState } from 'preact/hooks';
import { centredCropForAspect, type Rect, type Size } from '@niftyfix/constraints';
import {
  CheckboxInput,
  CropBox,
  imageDisplaySize,
  NumberInput,
  SelectInput,
  SingleFileTool,
  type ToolUiProps,
} from '@niftyfix/ui';
import { bestLayout, type SizeMm } from './layout';
import type { PhotoSheetOptions } from './options';

/** Photo sizes from the verified passport specifications (see packages/portal-specs). */
const PHOTOS: Record<string, { label: string; size: SizeMm }> = {
  '35x45': { label: '3.5 × 4.5 cm (Indian and UK passport)', size: { width: 35, height: 45 } },
  '51x51': { label: '2 × 2 inch (US passport and visa)', size: { width: 50.8, height: 50.8 } },
};

const SHEETS: Record<string, { label: string; size: SizeMm }> = {
  '4x6': { label: '4 × 6 inch photo paper', size: { width: 101.6, height: 152.4 } },
  '5x7': { label: '5 × 7 inch photo paper', size: { width: 127, height: 177.8 } },
  a4: { label: 'A4 paper', size: { width: 210, height: 297 } },
};

export default function PhotoSheetMaker(props: ToolUiProps) {
  const [photoId, setPhotoId] = useState(props.preset === 'us-2x2' ? '51x51' : '35x45');
  const [sheetId, setSheetId] = useState(props.preset === 'a4' ? 'a4' : '4x6');
  const photo = PHOTOS[photoId]?.size ?? { width: 35, height: 45 };
  const sheet = SHEETS[sheetId]?.size ?? { width: 101.6, height: 152.4 };
  const fits = bestLayout(sheet, photo).positions.length;
  const [copies, setCopies] = useState<number | null>(null);
  const [cutLines, setCutLines] = useState(true);
  const [image, setImage] = useState<{ url: string; size: Size } | null>(null);
  const [crop, setCrop] = useState<Rect | null>(null);
  useEffect(() => () => (image ? URL.revokeObjectURL(image.url) : undefined), [image]);

  const aspect = photo.width / photo.height;
  useEffect(
    () => setCrop(image ? centredCropForAspect(image.size, aspect) : null),
    [image, aspect],
  );
  // A different sheet or photo size starts again from "as many as fit".
  useEffect(() => setCopies(null), [fits]);

  const onFileChange = async (file: File | null): Promise<void> => {
    const size = file ? await imageDisplaySize(file) : null;
    setImage(file && size ? { url: URL.createObjectURL(file), size } : null);
  };

  const count = copies ?? fits;
  const copiesError =
    !Number.isInteger(count) || count < 1 || count > fits ? `Enter 1 to ${fits}.` : null;
  const options: PhotoSheetOptions | null =
    crop && copiesError === null && fits > 0
      ? {
          crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
          photo,
          sheet,
          copies: count,
          cutLines,
          fileName: '',
        }
      : null;

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose a photo"
      settingsTitle="Sheet"
      actionLabel="Make sheet"
      busyLabel="Making sheet…"
      successMessage="Your sheet is ready to print."
      disclaimer="Print at 100% or actual size, never “fit to page”, or the photos will come out the wrong size. Measure one photo after printing."
      options={options}
      onFileChange={(file) => void onFileChange(file)}
      preview={() =>
        image && crop ? (
          <CropBox
            imageUrl={image.url}
            image={image.size}
            aspect={aspect}
            crop={crop}
            onChange={setCrop}
            hint="Frame the photo. Every copy on the sheet uses this frame. For a passport photo with a head guide, make it in the Passport Photo Maker first, then bring it here."
          />
        ) : null
      }
    >
      <SelectInput
        label="Photo size"
        value={photoId}
        options={Object.entries(PHOTOS).map(([value, { label }]) => ({ value, label }))}
        onChange={setPhotoId}
        testId="photo-size"
      />
      <SelectInput
        label="Paper"
        value={sheetId}
        options={Object.entries(SHEETS).map(([value, { label }]) => ({ value, label }))}
        onChange={setSheetId}
        testId="sheet-size"
      />
      <NumberInput
        label="Copies"
        value={count}
        min={1}
        max={fits}
        hint={`Up to ${fits} fit on this paper.`}
        error={copiesError ?? undefined}
        onChange={setCopies}
        testId="copies"
      />
      <CheckboxInput label="Cutting guides" checked={cutLines} onChange={setCutLines} />
    </SingleFileTool>
  );
}
