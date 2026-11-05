/**
 * Read and remove photo metadata without touching the image data: EXIF
 * (camera, time, GPS location), XMP, IPTC, comments and text chunks. Pure
 * byte work, so it runs anywhere (worker, main thread, Node tests).
 *
 * JPEG: metadata segments are dropped; the image stream is copied byte for
 * byte. A sideways photo keeps a minimal EXIF block holding only its
 * orientation, so it still displays upright. PNG: text, time and EXIF
 * chunks are dropped. WebP: EXIF and XMP chunks are dropped and the header
 * flags updated.
 */

export interface MetadataItem {
  label: string;
  value: string;
}

export interface MetadataReport {
  /** Kinds of metadata present, e.g. "EXIF", "XMP", "IPTC", "Comment", "Text". */
  kinds: string[];
  /** Readable EXIF fields, most identifying first. */
  items: MetadataItem[];
  hasLocation: boolean;
  /** EXIF orientation (1 = upright). */
  orientation: number;
}

const ascii = (bytes: Uint8Array, start: number, length: number): string =>
  String.fromCharCode(...bytes.subarray(start, Math.min(bytes.length, start + length)));

// ---------------------------------------------------------------- EXIF (TIFF)

const TAGS: Record<number, string> = {
  0x010f: 'Camera maker',
  0x0110: 'Camera model',
  0x0131: 'Software',
  0x0132: 'Modified',
  0x013b: 'Artist',
  0x8298: 'Copyright',
  0x9003: 'Taken',
  0xa431: 'Camera serial number',
  0xa434: 'Lens',
  0xa420: 'Image ID',
};
const EXIF_IFD = 0x8769;
const GPS_IFD = 0x8825;
const ORIENTATION = 0x0112;

interface Entry {
  tag: number;
  type: number;
  count: number;
  /** Absolute offset of the value (inline or pointed to). */
  at: number;
}

const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

/** Parse a TIFF block (the body of an EXIF segment or chunk). Never throws on bad data. */
function parseTiff(bytes: Uint8Array, tiff: number, end: number): MetadataReport {
  const report: MetadataReport = { kinds: ['EXIF'], items: [], hasLocation: false, orientation: 1 };
  if (tiff + 8 > end) return report;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return report;
  const little = order === 0x4949;
  const u16 = (at: number): number => (at + 2 <= end ? view.getUint16(at, little) : 0);
  const u32 = (at: number): number => (at + 4 <= end ? view.getUint32(at, little) : 0);

  const readIfd = (offset: number): Entry[] => {
    const ifd = tiff + offset;
    if (offset === 0 || ifd + 2 > end) return [];
    const entries: Entry[] = [];
    const count = Math.min(u16(ifd), 500);
    for (let i = 0; i < count; i += 1) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > end) break;
      const type = u16(entry + 2);
      const n = u32(entry + 4);
      const size = (TYPE_SIZE[type] ?? 1) * n;
      entries.push({
        tag: u16(entry),
        type,
        count: n,
        at: size <= 4 ? entry + 8 : tiff + u32(entry + 8),
      });
    }
    return entries;
  };
  const text = (e: Entry): string =>
    ascii(bytes, e.at, Math.min(e.count, end - e.at))
      .replace(/\0.*$/s, '')
      .trim();
  const rational = (at: number): number => {
    const denominator = u32(at + 4);
    return denominator === 0 ? 0 : u32(at) / denominator;
  };

  const ifd0 = readIfd(u32(tiff + 4));
  const pointer = (tag: number): number => {
    const entry = ifd0.find((e) => e.tag === tag);
    return entry ? u32(entry.at) : 0;
  };
  const exif = readIfd(pointer(EXIF_IFD));
  const gps = readIfd(pointer(GPS_IFD));

  for (const e of [...ifd0, ...exif]) {
    if (e.tag === ORIENTATION) report.orientation = u16(e.at) || 1;
    const label = TAGS[e.tag];
    if (label && e.type === 2) {
      const value = text(e);
      if (value) report.items.push({ label, value });
    }
  }

  // GPS: latitude (2) and longitude (4) as degrees, minutes, seconds; refs N/S (1), E/W (3).
  const find = (tag: number): Entry | undefined => gps.find((e) => e.tag === tag);
  const lat = find(2);
  const lon = find(4);
  if (lat && lon && lat.type === 5 && lon.type === 5 && lat.count >= 3 && lon.count >= 3) {
    const degrees = (e: Entry): number =>
      rational(e.at) + rational(e.at + 8) / 60 + rational(e.at + 16) / 3600;
    const latRef = find(1);
    const lonRef = find(3);
    const sign = (ref: Entry | undefined, negative: string): number =>
      ref && ascii(bytes, ref.at, 1) === negative ? -1 : 1;
    const latitude = degrees(lat) * sign(latRef, 'S');
    const longitude = degrees(lon) * sign(lonRef, 'W');
    if (latitude !== 0 || longitude !== 0) {
      report.hasLocation = true;
      report.items.unshift({
        label: 'Location (GPS)',
        value: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      });
    }
  } else if (gps.length > 0) {
    report.hasLocation = true;
    report.items.unshift({ label: 'Location (GPS)', value: 'present' });
  }
  return report;
}

/** A minimal EXIF segment body holding only an orientation, so a sideways photo stays upright. */
function orientationOnlyExif(orientation: number): Uint8Array {
  // "Exif" and two zero bytes, a big-endian TIFF header, IFD0 with one SHORT entry, no next IFD.
  // prettier-ignore
  return new Uint8Array([
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
    0x00, 0x01,
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);
}

// ---------------------------------------------------------------- JPEG

interface Segment {
  marker: number;
  start: number;
  end: number;
}

/** Metadata segments before the image data; null if this is not a well-formed JPEG. */
function jpegSegments(bytes: Uint8Array): { segments: Segment[]; scan: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const segments: Segment[] = [];
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xff) {
      offset += 1; // fill byte
      continue;
    }
    if (marker === 0xda) return { segments, scan: offset };
    const length = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    if (length < 2 || offset + 2 + length > bytes.length) return null;
    segments.push({ marker, start: offset, end: offset + 2 + length });
    offset += 2 + length;
  }
  return null;
}

const isExif = (bytes: Uint8Array, s: Segment): boolean =>
  s.marker === 0xe1 && ascii(bytes, s.start + 4, 4) === 'Exif';
const isXmp = (bytes: Uint8Array, s: Segment): boolean =>
  s.marker === 0xe1 && ascii(bytes, s.start + 4, 28).startsWith('http://ns.adobe.com/');
/** APP1 (EXIF, XMP), APP13 (IPTC/Photoshop) and comments. ICC colour profiles (APP2) are kept. */
const isJpegMetadata = (bytes: Uint8Array, s: Segment): boolean =>
  s.marker === 0xe1 || s.marker === 0xed || s.marker === 0xfe;

function readJpeg(bytes: Uint8Array): MetadataReport {
  const parsed = jpegSegments(bytes);
  const report: MetadataReport = { kinds: [], items: [], hasLocation: false, orientation: 1 };
  if (!parsed) return report;
  for (const s of parsed.segments) {
    if (isExif(bytes, s)) {
      const exif = parseTiff(bytes, s.start + 10, s.end);
      report.items.push(...exif.items);
      report.hasLocation ||= exif.hasLocation;
      report.orientation = exif.orientation;
      if (!report.kinds.includes('EXIF')) report.kinds.push('EXIF');
    } else if (isXmp(bytes, s)) report.kinds.push('XMP');
    else if (s.marker === 0xed) report.kinds.push('IPTC');
    else if (s.marker === 0xfe) report.kinds.push('Comment');
  }
  return report;
}

function stripJpeg(bytes: Uint8Array): Uint8Array {
  const parsed = jpegSegments(bytes);
  if (!parsed) return bytes;
  const { orientation } = readJpeg(bytes);
  const parts: Uint8Array[] = [bytes.subarray(0, 2)];
  const kept = parsed.segments.filter((s) => !isJpegMetadata(bytes, s));
  // The orientation goes right after JFIF (APP0) if there is one, as viewers expect.
  const app0 = kept.findIndex((s) => s.marker === 0xe0);
  kept.forEach((s, i) => {
    if (i === 0 && app0 === -1) parts.push(...orientationSegment(orientation));
    parts.push(bytes.subarray(s.start, s.end));
    if (i === app0) parts.push(...orientationSegment(orientation));
  });
  if (kept.length === 0) parts.push(...orientationSegment(orientation));
  parts.push(bytes.subarray(parsed.scan));
  return concat(parts);
}

function orientationSegment(orientation: number): Uint8Array[] {
  if (orientation === 1) return [];
  const body = orientationOnlyExif(orientation);
  const length = body.length + 2;
  return [new Uint8Array([0xff, 0xe1, length >> 8, length & 0xff]), body];
}

// ---------------------------------------------------------------- PNG

const PNG_METADATA = new Set(['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME']);

function pngChunks(bytes: Uint8Array): { type: string; start: number; end: number }[] | null {
  if (bytes.length < 8 || bytes[0] !== 0x89 || ascii(bytes, 1, 3) !== 'PNG') return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: { type: string; start: number; end: number }[] = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) return null;
    const type = ascii(bytes, offset + 4, 4);
    chunks.push({ type, start: offset, end });
    offset = end;
    if (type === 'IEND') break;
  }
  return chunks;
}

function readPng(bytes: Uint8Array): MetadataReport {
  const report: MetadataReport = { kinds: [], items: [], hasLocation: false, orientation: 1 };
  for (const chunk of pngChunks(bytes) ?? []) {
    if (chunk.type === 'eXIf') {
      const exif = parseTiff(bytes, chunk.start + 8, chunk.end - 4);
      report.items.push(...exif.items);
      report.hasLocation ||= exif.hasLocation;
      if (!report.kinds.includes('EXIF')) report.kinds.push('EXIF');
    } else if (PNG_METADATA.has(chunk.type) && !report.kinds.includes('Text')) {
      report.kinds.push('Text');
    }
  }
  return report;
}

function stripPng(bytes: Uint8Array): Uint8Array {
  const chunks = pngChunks(bytes);
  if (!chunks) return bytes;
  return concat([
    bytes.subarray(0, 8),
    ...chunks.filter((c) => !PNG_METADATA.has(c.type)).map((c) => bytes.subarray(c.start, c.end)),
  ]);
}

// ---------------------------------------------------------------- WebP

function webpChunks(bytes: Uint8Array): { type: string; start: number; end: number }[] | null {
  if (bytes.length < 12 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP')
    return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: { type: string; start: number; end: number }[] = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const size = view.getUint32(offset + 4, true);
    const end = offset + 8 + size + (size % 2);
    if (end > bytes.length + 1) return null;
    chunks.push({ type: ascii(bytes, offset, 4), start: offset, end: Math.min(end, bytes.length) });
    offset = end;
  }
  return chunks;
}

function readWebp(bytes: Uint8Array): MetadataReport {
  const report: MetadataReport = { kinds: [], items: [], hasLocation: false, orientation: 1 };
  for (const chunk of webpChunks(bytes) ?? []) {
    if (chunk.type === 'EXIF') {
      // Some writers keep the JPEG-style "Exif\0\0" prefix.
      const tiff = ascii(bytes, chunk.start + 8, 4) === 'Exif' ? chunk.start + 14 : chunk.start + 8;
      const exif = parseTiff(bytes, tiff, chunk.end);
      report.items.push(...exif.items);
      report.hasLocation ||= exif.hasLocation;
      report.kinds.push('EXIF');
    } else if (chunk.type === 'XMP ') report.kinds.push('XMP');
  }
  return report;
}

function stripWebp(bytes: Uint8Array): Uint8Array {
  const chunks = webpChunks(bytes);
  if (!chunks) return bytes;
  const kept = chunks.filter((c) => c.type !== 'EXIF' && c.type !== 'XMP ');
  const body = concat(kept.map((c) => bytes.subarray(c.start, c.end)));
  const out = concat([bytes.subarray(0, 12), body]);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  view.setUint32(4, out.length - 8, true);
  // VP8X flags: clear EXIF (0x08) and XMP (0x04).
  if (ascii(out, 12, 4) === 'VP8X') out[20] = (out[20] ?? 0) & ~0x0c;
  return out;
}

// ---------------------------------------------------------------- shared

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export type MetadataFormat = 'jpeg' | 'png' | 'webp';

export function readMetadata(bytes: Uint8Array, format: MetadataFormat): MetadataReport {
  return format === 'jpeg' ? readJpeg(bytes) : format === 'png' ? readPng(bytes) : readWebp(bytes);
}

/** The same image with metadata removed. The image data itself is copied unchanged. */
export function stripMetadata(bytes: Uint8Array, format: MetadataFormat): Uint8Array {
  return format === 'jpeg'
    ? stripJpeg(bytes)
    : format === 'png'
      ? stripPng(bytes)
      : stripWebp(bytes);
}
