/**
 * Read the EXIF orientation tag (0x0112) of a JPEG without decoding it.
 * Phone cameras store sideways photos unrotated with this tag set; any tool
 * that copies JPEG bytes as they are (e.g. into a PDF) must check it.
 * Returns 1 (upright) when the tag is absent or the data is malformed.
 */
export function readJpegOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1] ?? 0;
    // Start of scan or end of image: no more metadata segments.
    if (marker === 0xda || marker === 0xd9) return 1;
    const length = view.getUint16(offset + 2);
    if (length < 2) return 1;
    const start = offset + 4;
    if (
      marker === 0xe1 &&
      start + 14 <= bytes.length &&
      String.fromCharCode(...bytes.subarray(start, start + 4)) === 'Exif'
    ) {
      return orientationFromTiff(view, start + 6, Math.min(bytes.length, offset + 2 + length));
    }
    offset += 2 + length;
  }
  return 1;
}

function orientationFromTiff(view: DataView, tiff: number, end: number): number {
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return 1;
  const little = order === 0x4949;
  const u16 = (at: number): number => (at + 2 <= end ? view.getUint16(at, little) : 0);
  const u32 = (at: number): number => (at + 4 <= end ? view.getUint32(at, little) : 0);
  const ifd = tiff + u32(tiff + 4);
  const count = u16(ifd);
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) return 1;
    if (u16(entry) === 0x0112) {
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}
