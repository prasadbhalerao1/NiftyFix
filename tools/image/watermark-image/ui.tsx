import { useState } from 'preact/hooks';
import {
  CheckboxInput,
  RangeInput,
  SelectInput,
  SingleFileTool,
  TextInput,
  type ToolUiProps,
} from '@niftyfix/ui';
import type { WatermarkImageOptions } from './options';

type Position = WatermarkImageOptions['position'];
type Colour = WatermarkImageOptions['colour'];

export default function WatermarkImage(props: ToolUiProps) {
  const [text, setText] = useState('© Your name');
  const [position, setPosition] = useState<Position>('bottom-right');
  const [size, setSize] = useState(5);
  const [opacity, setOpacity] = useState(0.6);
  const [colour, setColour] = useState<Colour>('white');
  const [diagonal, setDiagonal] = useState(true);
  const textError =
    text.trim() === ''
      ? 'Enter the watermark text.'
      : text.length > 100
        ? 'Up to 100 characters.'
        : null;
  const options: WatermarkImageOptions | null =
    textError === null ? { text, position, size, opacity, colour, diagonal, fileName: '' } : null;
  const spread = position === 'center' || position === 'tile';

  return (
    <SingleFileTool
      {...props}
      accept="image/jpeg,image/png,image/webp,image/avif,image/bmp,image/gif"
      chooseTitle="Choose an image"
      settingsTitle="Watermark"
      actionLabel="Add watermark"
      busyLabel="Adding watermark…"
      successMessage="Your watermark is added."
      disclaimer="The new file was decoded again to confirm its pixel dimensions and format."
      options={options}
    >
      <TextInput
        label="Text"
        value={text}
        error={textError ?? undefined}
        onChange={setText}
        testId="watermark-text"
      />
      <SelectInput<Position>
        label="Position"
        value={position}
        options={[
          { value: 'bottom-right', label: 'Bottom right corner' },
          { value: 'bottom-left', label: 'Bottom left corner' },
          { value: 'top-right', label: 'Top right corner' },
          { value: 'top-left', label: 'Top left corner' },
          { value: 'center', label: 'Centre' },
          { value: 'tile', label: 'Repeated across the image' },
        ]}
        onChange={(next) => {
          setPosition(next);
          // Larger and fainter suits text across the image; smaller suits a corner.
          if (next === 'center' || next === 'tile') {
            setSize(next === 'tile' ? 6 : 10);
            setOpacity(0.3);
          }
        }}
        testId="position"
      />
      <SelectInput<Colour>
        label="Colour"
        value={colour}
        options={[
          { value: 'white', label: 'White' },
          { value: 'black', label: 'Black' },
          { value: 'grey', label: 'Grey' },
          { value: 'red', label: 'Red' },
        ]}
        onChange={setColour}
      />
      <RangeInput
        label="Text size"
        min={2}
        max={30}
        step={1}
        value={size}
        format={(value) => `${value}%`}
        onChange={setSize}
        hint="Of the image's shorter side."
      />
      <RangeInput
        label="Opacity"
        min={0.05}
        max={1}
        step={0.05}
        value={opacity}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={setOpacity}
      />
      {spread ? <CheckboxInput label="Diagonal" checked={diagonal} onChange={setDiagonal} /> : null}
    </SingleFileTool>
  );
}
