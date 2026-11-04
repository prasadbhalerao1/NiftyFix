import { unzipSync, zipSync } from 'fflate';
import { uniqueFileNames } from './filenames';

/** Trigger a download and release the object URL afterwards. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Revoke after the click has been handled; immediate revocation cancels downloads in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Store-only ZIP (outputs are already compressed images/PDFs; recompressing wastes CPU). */
export async function zipFiles(files: readonly { name: string; blob: Blob }[]): Promise<Blob> {
  const names = uniqueFileNames(files.map((file) => file.name));
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (const [index, file] of files.entries()) {
    const name = names[index] ?? file.name;
    entries[name] = [new Uint8Array(await file.blob.arrayBuffer()), { level: 0 }];
  }
  const zipped = zipSync(entries);
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}

/** Read a ZIP back (for verifying what a tool produced): entry names and bytes, in order. */
export async function readZip(blob: Blob): Promise<{ name: string; bytes: Uint8Array }[]> {
  const entries = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  return Object.entries(entries).map(([name, bytes]) => ({ name, bytes }));
}

/** Tracks object URLs created for previews so they are always revoked. */
export class ObjectUrlRegistry {
  private readonly urls = new Set<string>();

  create(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revoke(url: string | null | undefined): void {
    if (url && this.urls.delete(url)) URL.revokeObjectURL(url);
  }

  revokeAll(): void {
    for (const url of this.urls) URL.revokeObjectURL(url);
    this.urls.clear();
  }
}
