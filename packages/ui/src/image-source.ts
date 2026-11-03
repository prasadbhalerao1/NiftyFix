import { HEADER_PROBE_BYTES, readImageHeader } from '@niftyfix/engine-image';
import { validateFile, type DeviceClass, type ObjectUrlRegistry } from '@niftyfix/runtime';
import { FILE_FORMATS, ToolError, type FileInputSpec } from '@niftyfix/tool-sdk';

export interface ImageSource {
  file: File;
  /** Object URL for previews (owned by the caller's registry). */
  url: string;
  /** Displayed size, after EXIF orientation. */
  size: { width: number; height: number };
  /** Shown to the user, e.g. a PNG named ".jpg". */
  warning: string | null;
}

function displaySize(url: string): Promise<{ width: number; height: number }> {
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

/**
 * Validate an image chosen by the user and prepare it for preview: content
 * signature, device size limit, header dimensions against the device pixel
 * limit (before any decode), then the displayed size. Throws ToolError.
 */
export async function loadImageSource(
  file: File,
  spec: FileInputSpec,
  device: DeviceClass,
  urls: ObjectUrlRegistry,
): Promise<ImageSource> {
  const validated = await validateFile(file, spec, device);
  const header = readImageHeader(
    new Uint8Array(await file.slice(0, HEADER_PROBE_BYTES).arrayBuffer()),
  );
  if (header === null) throw new ToolError('CORRUPT_INPUT', 'This image is damaged or incomplete.');
  const limit = spec.maxPixels;
  const maxPixels = limit
    ? device === 'high'
      ? limit.desktop
      : limit.mobile
    : Number.POSITIVE_INFINITY;
  if (header.width * header.height > maxPixels) {
    throw new ToolError(
      'TOO_MANY_PIXELS',
      `This image is ${header.width} × ${header.height} px, too large for this device.`,
      { hint: 'Use a smaller copy of the image.' },
    );
  }
  const url = urls.create(file);
  try {
    const size = await displaySize(url);
    const warning = validated.extensionMismatch
      ? `This file is really a ${FILE_FORMATS[header.format].label} even though its name ends differently. That is fine; the output will have the correct extension.`
      : null;
    return { file, url, size, warning };
  } catch (error) {
    urls.revoke(url);
    throw error;
  }
}
