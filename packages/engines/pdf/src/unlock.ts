import {
  PDFDict,
  PDFInvalidObject,
  PDFName,
  PDFRawStream,
  PDFRef,
  type PDFDocument,
} from '@cantoo/pdf-lib';

export interface Protection {
  /** A password was needed to open the file. */
  openPassword: boolean;
  /** Printing, copying or editing was restricted. */
  restricted: boolean;
}

/**
 * Leave an opened (decrypted) document with no protection at all. pdf-lib
 * drops the trailer's /Encrypt on load, but keeps the old cross-reference
 * stream (which still names it) and the encryption dictionary as ordinary
 * objects; a reader that finds them treats the new file as encrypted.
 */
export function removeProtection(doc: PDFDocument): void {
  const { context } = doc;
  for (const [ref, object] of context.enumerateIndirectObjects()) {
    if (object instanceof PDFInvalidObject) {
      // pdf-lib keeps an old cross-reference stream it could not read as raw bytes.
      const raw = new Uint8Array(object.sizeInBytes());
      object.copyBytesInto(raw, 0);
      const text = new TextDecoder('latin1').decode(raw);
      if (/\/Encrypt/.test(text)) {
        // It still knows the document information dictionary, which the new trailer lost.
        const info = /\/Info\s+(\d+)\s+(\d+)\s+R/.exec(text);
        if (info && !context.trailerInfo.Info) {
          context.trailerInfo.Info = PDFRef.of(Number(info[1]), Number(info[2]));
        }
        context.delete(ref);
      }
      continue;
    }
    const dict =
      object instanceof PDFRawStream ? object.dict : object instanceof PDFDict ? object : null;
    if (!dict) continue;
    const type = dict.get(PDFName.of('Type'));
    // Old cross-reference and object streams are rebuilt on save; stale copies still name the encryption.
    const stale =
      type === PDFName.of('XRef') ||
      type === PDFName.of('ObjStm') ||
      (dict.has(PDFName.of('Root')) && dict.has(PDFName.of('Encrypt')));
    const security =
      dict.get(PDFName.of('Filter')) === PDFName.of('Standard') &&
      dict.has(PDFName.of('O')) &&
      dict.has(PDFName.of('U'));
    if (stale || security) context.delete(ref);
  }
}

/**
 * What protects a PDF, read from its bytes without decrypting: the /Encrypt
 * dictionary's presence, and its permission flags (/P). Null when there is
 * no encryption.
 */
export function readProtection(
  bytes: Uint8Array,
  opensWithoutPassword: boolean,
): Protection | null {
  const text = new TextDecoder('latin1').decode(bytes);
  if (!/\/Encrypt\s/.test(text)) return null;
  const flags = /\/P\s+(-?\d+)/.exec(text);
  // Bits 3 (print), 4 (modify), 5 (copy), 6 (annotate), 9 (fill forms), 10 (extract), 11 (assemble), 12 (print well).
  const p = flags ? Number(flags[1]) : -1;
  const needed = [3, 4, 5, 6, 9, 10, 11, 12].map((bit) => 1 << (bit - 1));
  return {
    openPassword: !opensWithoutPassword,
    restricted: needed.some((bit) => (p & bit) === 0),
  };
}
