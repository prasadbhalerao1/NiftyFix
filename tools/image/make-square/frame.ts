import type { MakeSquareOptions } from './options';

export interface Frame {
  width: number;
  height: number;
  /** Where the whole, unstretched image sits inside the frame. */
  image: { x: number; y: number; width: number; height: number };
  /** Below 1 when the result was shrunk to stay inside the canvas limit. */
  scale: number;
}

/** Safari on iPhone refuses canvases over 16.7 million pixels. */
export const MAX_FRAME_PIXELS = 16_000_000;

/** The output size and where the image goes: nothing is cropped or stretched. */
export function planFrame(
  source: { width: number; height: number },
  options: Pick<MakeSquareOptions, 'shape' | 'borderPercent'>,
): Frame {
  const border = Math.round((Math.max(source.width, source.height) * options.borderPercent) / 100);
  const side = Math.max(source.width, source.height) + 2 * border;
  const width = options.shape === 'square' ? side : source.width + 2 * border;
  const height = options.shape === 'square' ? side : source.height + 2 * border;
  const scale = Math.min(1, Math.sqrt(MAX_FRAME_PIXELS / (width * height)));
  const fit = (value: number): number => Math.max(1, Math.round(value * scale));
  const frameWidth = fit(width);
  const frameHeight = fit(height);
  const imageWidth = fit(source.width);
  const imageHeight = fit(source.height);
  return {
    width: frameWidth,
    height: frameHeight,
    image: {
      x: Math.round((frameWidth - imageWidth) / 2),
      y: Math.round((frameHeight - imageHeight) / 2),
      width: imageWidth,
      height: imageHeight,
    },
    scale,
  };
}
