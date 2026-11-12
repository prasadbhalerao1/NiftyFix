/**
 * Read the EXIF orientation tag (0x0112) of a JPEG without decoding it.
 * Phone cameras store sideways photos unrotated with this tag set; any tool
 * that copies JPEG bytes as they are (e.g. into a PDF) must check it.
 * Returns 1 (upright) when the tag is absent or the data is malformed.
 */
export function readJpegOrientation(bytes: Uint8Array): number {
  const found = findOrientation(bytes);
  if (!found || found.at === null) return 1;
  const value = new DataView(bytes.buffer, bytes.byteOffset).getUint16(found.at, found.little);
  return value >= 1 && value <= 8 ? value : 1;
}

/**
 * Return a copy of the JPEG that viewers show with EXIF `orientation` (1 to 8)
 * applied. Lossless: only the tag changes (or a small EXIF block is added);
 * the compressed picture is untouched.
 */
export function setJpegOrientation(bytes: Uint8Array, orientation: number): Uint8Array {
  if (!Number.isInteger(orientation) || orientation < 1 || orientation > 8) {
    throw new RangeError('Orientation must be an integer from 1 to 8.');
  }
  const found = findOrientation(bytes);
  if (found && found.at !== null) {
    const out = bytes.slice();
    new DataView(out.buffer).setUint16(found.at, orientation, found.little);
    return out;
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new RangeError('Not a JPEG file.');
  // A minimal big-endian EXIF block with one entry: orientation (SHORT).
  const app1 = Uint8Array.of(
    ...[0xff, 0xe1, 0x00, 0x22],
    ...[0x45, 0x78, 0x69, 0x66, 0x00, 0x00],
    ...[0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08],
    ...[0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00],
    ...[0x00, 0x00, 0x00, 0x00],
  );
  // After a JFIF APP0 if there is one (it must stay first), otherwise right after SOI.
  const jfif =
    bytes[2] === 0xff && bytes[3] === 0xe0 ? 2 + 2 + ((bytes[4] ?? 0) << 8) + (bytes[5] ?? 0) : 2;
  const out = new Uint8Array(bytes.length + app1.length);
  out.set(bytes.subarray(0, jfif), 0);
  out.set(app1, jfif);
  out.set(bytes.subarray(jfif), jfif + app1.length);
  return out;
}

/**
 * Where the orientation value sits: `at` is its byte offset, or null when the
 * first EXIF block has no orientation entry. Null when there is no EXIF block
 * (or the JPEG is malformed).
 */
function findOrientation(bytes: Uint8Array): { at: number | null; little: boolean } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1] ?? 0;
    // Start of scan or end of image: no more metadata segments.
    if (marker === 0xda || marker === 0xd9) return null;
    const length = view.getUint16(offset + 2);
    if (length < 2) return null;
    const start = offset + 4;
    if (
      marker === 0xe1 &&
      start + 14 <= bytes.length &&
      String.fromCharCode(...bytes.subarray(start, start + 4)) === 'Exif'
    ) {
      return orientationInTiff(view, start + 6, Math.min(bytes.length, offset + 2 + length));
    }
    offset += 2 + length;
  }
  return null;
}

function orientationInTiff(
  view: DataView,
  tiff: number,
  end: number,
): { at: number | null; little: boolean } | null {
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const little = order === 0x4949;
  const u16 = (at: number): number => (at + 2 <= end ? view.getUint16(at, little) : 0);
  const u32 = (at: number): number => (at + 4 <= end ? view.getUint32(at, little) : 0);
  const ifd = tiff + u32(tiff + 4);
  const count = u16(ifd);
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) return null;
    // A SHORT value sits in the first two bytes of the value field.
    if (u16(entry) === 0x0112) return { at: entry + 8, little };
  }
  return { at: null, little };
}
