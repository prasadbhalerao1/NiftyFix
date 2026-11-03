export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

/** Largest rectangle with the target aspect ratio that fits inside `source`, centred. */
export function centredCropForAspect(source: Size, aspect: number): Rect {
  if (!(aspect > 0) || !(source.width > 0) || !(source.height > 0)) {
    throw new RangeError('Sizes and aspect ratio must be positive.');
  }
  const sourceAspect = source.width / source.height;
  const width = sourceAspect > aspect ? source.height * aspect : source.width;
  const height = sourceAspect > aspect ? source.height : source.width / aspect;
  return {
    x: (source.width - width) / 2,
    y: (source.height - height) / 2,
    width,
    height,
  };
}

/** Clamp a crop rectangle inside the source bounds without changing its size where possible. */
export function clampRect(rect: Rect, bounds: Size): Rect {
  const width = Math.min(rect.width, bounds.width);
  const height = Math.min(rect.height, bounds.height);
  return {
    width,
    height,
    x: Math.min(Math.max(0, rect.x), bounds.width - width),
    y: Math.min(Math.max(0, rect.y), bounds.height - height),
  };
}

/** Pixels needed for a physical size at a given DPI (e.g. 3.5 cm at 200 DPI → 276 px). */
export function cmToPixels(centimetres: number, dpi: number): number {
  return Math.round((centimetres / 2.54) * dpi);
}

/** How much the crop will be enlarged to reach the output size (> 1 means upscaling). */
export function upscaleFactor(crop: Size, output: Size): number {
  return Math.max(output.width / crop.width, output.height / crop.height);
}
