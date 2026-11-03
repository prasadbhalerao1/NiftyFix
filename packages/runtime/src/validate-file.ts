import {
  extensionOf,
  FILE_FORMATS,
  formatBytes,
  sniffFormat,
  ToolError,
  type FileFormatId,
  type FileInputSpec,
} from '@niftyfix/tool-sdk';
import type { DeviceClass } from './device';

export interface ValidatedFile {
  file: File;
  format: FileFormatId;
  /** True when the extension does not match the detected content (e.g. a PNG named .jpg). */
  extensionMismatch: boolean;
}

const SNIFF_BYTES = 64;

/**
 * Validate a user-selected file against a tool's input spec using its
 * content signature. The extension and browser-reported MIME type are never
 * trusted on their own.
 */
export async function validateFile(
  file: File,
  spec: FileInputSpec,
  device: DeviceClass,
): Promise<ValidatedFile> {
  const limit = device === 'high' ? spec.maxBytes.desktop : spec.maxBytes.mobile;
  if (file.size === 0) {
    throw new ToolError('CORRUPT_INPUT', 'This file is empty.');
  }
  if (file.size > limit) {
    throw new ToolError(
      'FILE_TOO_LARGE',
      `This file is ${formatBytes(file.size)}. The limit on this device is ${formatBytes(limit)}.`,
      {
        hint: 'Use a smaller file, or try on a computer, which allows larger files.',
      },
    );
  }
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  const format = sniffFormat(head);
  const accepted = spec.formats.map((id) => FILE_FORMATS[id].label).join(', ');
  if (format === 'heic' && !spec.formats.includes('heic')) {
    throw new ToolError('UNSUPPORTED_FORMAT', 'HEIC photos (from iPhone) are not supported yet.', {
      hint: 'On iPhone, set Settings → Camera → Formats → Most Compatible, or share the photo as JPEG.',
    });
  }
  if (format === null || !spec.formats.includes(format)) {
    throw new ToolError(
      'UNSUPPORTED_FORMAT',
      `This file is not a supported type. Supported: ${accepted}.`,
    );
  }
  const extension = extensionOf(file.name);
  const extensions: readonly string[] = FILE_FORMATS[format].extensions;
  return { file, format, extensionMismatch: extension !== '' && !extensions.includes(extension) };
}

export function validateFileCount(count: number, spec: FileInputSpec): void {
  if (count > spec.maxFiles) {
    throw new ToolError(
      'TOO_MANY_FILES',
      spec.maxFiles === 1
        ? 'Please choose one file.'
        : `You can process up to ${spec.maxFiles} files at once.`,
    );
  }
}
