/**
 * File formats the platform knows how to identify by content (magic bytes).
 * Extensions and MIME types reported by the browser are hints only; the
 * signature decides.
 */
export const FILE_FORMATS = {
  jpeg: { label: 'JPEG', mime: 'image/jpeg', extensions: ['jpg', 'jpeg'] },
  png: { label: 'PNG', mime: 'image/png', extensions: ['png'] },
  webp: { label: 'WebP', mime: 'image/webp', extensions: ['webp'] },
  gif: { label: 'GIF', mime: 'image/gif', extensions: ['gif'] },
  bmp: { label: 'BMP', mime: 'image/bmp', extensions: ['bmp'] },
  avif: { label: 'AVIF', mime: 'image/avif', extensions: ['avif'] },
  heic: { label: 'HEIC', mime: 'image/heic', extensions: ['heic', 'heif'] },
  pdf: { label: 'PDF', mime: 'application/pdf', extensions: ['pdf'] },
  zip: { label: 'ZIP', mime: 'application/zip', extensions: ['zip'] },
  // Output only: plain text has no signature to detect.
  txt: { label: 'Text', mime: 'text/plain', extensions: ['txt'] },
} as const satisfies Record<string, { label: string; mime: string; extensions: readonly string[] }>;

export type FileFormatId = keyof typeof FILE_FORMATS;

const ascii = (bytes: Uint8Array, start: number, length: number): string =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/** Identify a file format from its first bytes (at least 32 bytes recommended). */
export function sniffFormat(bytes: Uint8Array): FileFormatId | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 3) === 'PNG' &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return 'webp';
  }
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a')) {
    return 'gif';
  }
  if (bytes.length >= 2 && ascii(bytes, 0, 2) === 'BM') {
    return 'bmp';
  }
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === '%PDF-') {
    return 'pdf';
  }
  if (bytes.length >= 4 && ascii(bytes, 0, 4) === 'PK\x03\x04') {
    return 'zip';
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4);
    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'heim', 'heis'].includes(brand)) {
      return 'heic';
    }
  }
  return null;
}

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}
