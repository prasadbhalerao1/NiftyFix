import {
  encodePng,
  orientPixels,
  readImageHeader,
  readJpegOrientation,
  setJpegOrientation,
  type Pixels,
} from '@niftyfix/engine-image';
import {
  displayOrientation,
  extractImages,
  isolateImages,
  joinStrips,
  readPdf,
  selectPages,
  type ExtractedImage,
  type JoinedImage,
} from '@niftyfix/engine-pdf';
import { readZip, sanitizeBaseName, zipFiles } from '@niftyfix/runtime';
import {
  defineProcessor,
  formatBytes,
  isToolError,
  ToolError,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import { ExtractImagesOptions, MAX_IMAGES, MAX_PIXELS } from './options';

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

async function digest(data: Uint8Array): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data as BufferSource));
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** One picture to save: a single image, or pieces joined into one. */
type Picture = { page: number; image: ExtractedImage } | { page: number; joined: JoinedImage };

/** The orientation every placement agrees on; null when unknown or they disagree. */
function orientationOf(
  placements: ExtractedImage['placements'],
  rotation: (page: number) => number,
): number | null {
  const all = new Set(placements.map((p) => displayOrientation(p.matrix, rotation(p.page))));
  const [only] = all;
  return all.size === 1 && only !== undefined ? only : null;
}

/** Copy each piece's rows into one picture; null if a piece is missing. */
function assemble(group: JoinedImage, pixels: ReadonlyMap<string, Pixels>): Pixels | null {
  const { width, height, parts } = group;
  const data = new Uint8ClampedArray(width * height * 4);
  for (const part of parts) {
    const piece = pixels.get(part.key);
    if (!piece) return null;
    for (let row = 0; row < piece.height; row += 1) {
      data.set(
        piece.data.subarray(row * piece.width * 4, (row + 1) * piece.width * 4),
        ((part.y + row) * width + part.x) * 4,
      );
    }
  }
  return { data, width, height };
}

export default defineProcessor({
  options: ExtractImagesOptions,
  async run(input, options, { progress, signal }) {
    progress(0.02, 'Reading the PDF');
    let doc;
    try {
      doc = await readPdf(input, undefined, options.password);
    } catch (error) {
      if (isToolError(error) && error.code === 'PASSWORD_PROTECTED' && !options.password) {
        throw new ToolError('PASSWORD_PROTECTED', 'This PDF is protected with a password.', {
          hint: 'Type its password in "PDF password" and try again. It stays on your device.',
        });
      }
      throw error;
    }
    const pages = selectPages(options.pages, doc.getPageCount());
    const rotation = (page: number): number => doc.getPage(page).getRotation().angle;
    progress(0.08, 'Finding images');
    const report = extractImages(doc, { minSide: options.minSide, pages }, signal);

    if (report.images.length === 0) {
      throw new ToolError(
        'INVALID_OPTIONS',
        report.tiny > 0
          ? `No images to save: ${plural(report.tiny, 'small image was', 'small images were')} skipped.`
          : 'No images were found on the chosen pages.',
        {
          hint:
            report.tiny > 0
              ? 'Set "Skip small images" to "Keep all" and try again.'
              : 'Scanned or drawn pages may not store separate pictures. Use PDF to JPG to save whole pages as images.',
        },
      );
    }
    if (report.images.length > MAX_IMAGES) {
      throw new ToolError(
        'INVALID_OPTIONS',
        `This PDF has ${report.images.length} images; up to ${MAX_IMAGES} can be saved at once.`,
        { hint: 'Choose fewer pages, for example 1-50.' },
      );
    }

    // Pieces drawn once, edge to edge on the same page, become one picture.
    const joined: JoinedImage[] = [];
    if (options.joinPieces) {
      for (const page of pages) {
        const tiles = report.images.flatMap(({ key, width, height, placements }) => {
          const [only] = placements;
          return placements.length === 1 && only?.page === page
            ? [{ key, width, height, matrix: only.matrix }]
            : [];
        });
        joined.push(...joinStrips(tiles));
      }
    }
    const groupOf = new Map(
      joined.flatMap((group) => group.parts.map((part) => [part.key, group] as const)),
    );
    const byKey = new Map(report.images.map((image) => [image.key, image]));
    const pictures: Picture[] = [];
    const added = new Set<JoinedImage>();
    for (const image of report.images) {
      const group = groupOf.get(image.key);
      if (!group) pictures.push({ page: image.page, image });
      else if (!added.has(group)) {
        added.add(group);
        pictures.push({ page: image.page, joined: group });
      }
    }

    // Full decoders for everything else, and for JPEG pieces, which must become pixels to join.
    const pixels = new Map<string, Pixels>();
    for (const image of report.images) {
      if (image.kind === 'rgba') {
        pixels.set(image.key, { data: image.rgba, width: image.width, height: image.height });
      }
    }
    const large = (image: ExtractedImage): boolean => image.width * image.height > MAX_PIXELS;
    const needed = report.images.filter(
      (image) =>
        (image.kind === 'decode' || (image.kind === 'jpeg' && groupOf.has(image.key))) &&
        !large(image),
    );
    let tooLarge = report.images.filter((image) => image.kind === 'decode' && large(image)).length;
    let failed = 0;
    if (needed.length > 0) {
      progress(0.12, 'Decoding images');
      const isolated = await isolateImages(
        doc,
        needed.map((image) => image.ref),
      );
      // pdf.js loads only when a PDF has such images; most photos never need it.
      const { decodePageImage, openForRendering } = await import('@niftyfix/engine-pdf/render');
      const { doc: decoder, close } = await openForRendering(isolated, {
        assetOrigin: globalThis.location.origin,
        rawImages: true,
      });
      try {
        for (const [index, image] of needed.entries()) {
          signal.throwIfAborted();
          progress(
            0.12 + (0.4 * index) / needed.length,
            `Decoding image ${index + 1} of ${needed.length}`,
          );
          const decoded = await decodePageImage(decoder, index);
          if (decoded?.width === image.width && decoded.height === image.height) {
            pixels.set(image.key, decoded);
          } else {
            failed += 1;
          }
        }
      } finally {
        await close();
      }
    }

    const stem = options.fileName.trim() || sanitizeBaseName(input.name);
    const files: { name: string; blob: Blob }[] = [];
    const seen = new Set<string>();
    const perPage = new Map<number, number>();
    let duplicates = 0;
    let wrongSize = 0;
    let turned = 0;
    for (const [order, picture] of pictures.entries()) {
      signal.throwIfAborted();
      progress(
        0.55 + (0.35 * order) / pictures.length,
        `Saving image ${order + 1} of ${pictures.length}`,
      );
      // A joined picture is turned like its pieces (they are all drawn upright).
      const placements =
        'image' in picture
          ? picture.image.placements
          : (byKey.get(picture.joined.parts[0]?.key ?? '')?.placements ?? []);
      const orientation = options.asShown ? orientationOf(placements, rotation) : null;
      let bytes: Uint8Array;
      let expected: { width: number; height: number };
      let extension: 'jpg' | 'png';
      if ('image' in picture && picture.image.kind === 'jpeg') {
        // Original bytes; at most the EXIF orientation tag changes.
        const { image } = picture;
        bytes = image.bytes;
        if (orientation !== null && readJpegOrientation(bytes) !== orientation) {
          bytes = setJpegOrientation(bytes, orientation);
        }
        expected = { width: image.width, height: image.height };
        extension = 'jpg';
      } else {
        const source =
          'image' in picture
            ? (pixels.get(picture.image.key) ?? null)
            : picture.joined.width * picture.joined.height <= MAX_PIXELS
              ? assemble(picture.joined, pixels)
              : null;
        if (!source) {
          if ('joined' in picture && picture.joined.width * picture.joined.height > MAX_PIXELS) {
            tooLarge += 1;
          }
          continue;
        }
        const oriented = orientPixels(source, orientation ?? 1);
        bytes = encodePng(oriented);
        expected = { width: oriented.width, height: oriented.height };
        extension = 'png';
      }
      // The same picture stored twice (a logo on every page) is saved once.
      const hash = await digest(bytes);
      if (seen.has(hash)) {
        duplicates += 1;
        continue;
      }
      seen.add(hash);
      if (orientation !== null && orientation !== 1) turned += 1;
      // Measure the saved file itself, not the size the PDF claims.
      const header = readImageHeader(bytes.subarray(0, 256 * 1024));
      if (header?.width !== expected.width || header.height !== expected.height) wrongSize += 1;
      const number = (perPage.get(picture.page) ?? 0) + 1;
      perPage.set(picture.page, number);
      files.push({
        name: `${stem}-page-${picture.page + 1}-image-${number}.${extension}`,
        blob: new Blob([bytes as BlobPart], {
          type: extension === 'jpg' ? 'image/jpeg' : 'image/png',
        }),
      });
    }

    const pieces = joined.reduce((sum, group) => sum + group.parts.length, 0);
    const damaged = failed + report.broken;
    const warnings = [
      damaged > 0
        ? `${plural(damaged, 'image is', 'images are')} damaged in the PDF and could not be read.`
        : '',
      tooLarge > 0
        ? `${plural(tooLarge, 'image is', 'images are')} over ${MAX_PIXELS / 1_000_000} megapixels, too large to open in a browser.`
        : '',
    ].filter(Boolean);
    const facts = [
      { label: 'Images', value: String(files.length) },
      ...(joined.length > 0
        ? [{ label: 'Joined from pieces', value: `${pieces} pieces into ${joined.length}` }]
        : []),
      ...(turned > 0 ? [{ label: 'Turned as on the page', value: String(turned) }] : []),
      ...(duplicates > 0 ? [{ label: 'Repeats skipped', value: String(duplicates) }] : []),
      ...(report.tiny > 0 ? [{ label: 'Small images skipped', value: String(report.tiny) }] : []),
    ];
    const sizeCheck: VerificationCheck = {
      id: 'dimensions',
      label: 'Each image keeps its full stored resolution',
      required: 'Every stored pixel',
      actual: wrongSize === 0 ? 'Every stored pixel' : `${wrongSize} image(s) differ`,
      status: wrongSize === 0 ? 'pass' : 'fail',
    };

    if (files.length === 0) {
      throw new ToolError('CORRUPT_INPUT', warnings.join(' ') || 'No image could be saved.', {
        hint: 'Use PDF to JPG to save those pages as pictures instead.',
      });
    }
    if (files.length === 1) {
      const [only] = files;
      if (!only) throw new ToolError('UNKNOWN', 'No image was saved.');
      return {
        blob: only.blob,
        fileName: only.name,
        format: only.name.endsWith('.jpg') ? 'jpeg' : 'png',
        bytes: only.blob.size,
        facts: [...facts, { label: 'Size', value: formatBytes(only.blob.size) }],
        verification: [sizeCheck],
        warnings,
      };
    }

    progress(0.93, 'Packaging the ZIP');
    const zip = await zipFiles(files);
    const entries = await readZip(zip);
    return {
      blob: zip,
      fileName: `${stem}-images.zip`,
      format: 'zip',
      bytes: zip.size,
      facts: [...facts, { label: 'ZIP size', value: formatBytes(zip.size) }],
      verification: [
        sizeCheck,
        {
          id: 'parts',
          label: 'Images in ZIP',
          required: String(files.length),
          actual: String(entries.length),
          status: entries.length === files.length ? 'pass' : 'fail',
        },
      ],
      warnings,
    };
  },
});
