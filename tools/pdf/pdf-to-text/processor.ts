import * as v from 'valibot';
import { describePages, selectPages } from '@niftyfix/engine-pdf/pages';
import { openForRendering, pageText } from '@niftyfix/engine-pdf/render';
import { resolveOutputName } from '@niftyfix/runtime';
import {
  defineProcessor,
  FileNameSchema,
  formatBytes,
  PageSelectionSchema,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';

export default defineProcessor({
  options: v.object({
    pages: PageSelectionSchema,
    markers: v.boolean(),
    fileName: FileNameSchema,
  }),
  async run(input, options, { progress, signal }) {
    progress(0.02, 'Reading the PDF');
    const { doc, close } = await openForRendering(new Uint8Array(await input.blob.arrayBuffer()), {
      assetOrigin: globalThis.location.origin,
    });
    try {
      const pages = selectPages(options.pages, doc.numPages);
      const parts: string[] = [];
      const empty: number[] = [];
      for (const [order, index] of pages.entries()) {
        signal.throwIfAborted();
        progress(0.05 + (0.9 * order) / pages.length, `Page ${index + 1}`);
        const text = await pageText(doc, index);
        if (text.trim() === '') empty.push(index);
        parts.push(options.markers ? `--- Page ${index + 1} ---\n${text}` : text);
      }
      const content = `${parts.join('\n\n').trimEnd()}\n`;
      // UTF-8 with a BOM so Windows Notepad shows Hindi and other scripts correctly.
      const blob = new Blob(['﻿', content], { type: 'text/plain;charset=utf-8' });
      // Verify what will be downloaded: decode the bytes back and compare.
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(await blob.arrayBuffer());
      const characters = content.replace(/\s/g, '').length;
      const verification: VerificationCheck[] = [
        {
          id: 'encoding',
          label: 'Valid UTF-8 text',
          required: 'UTF-8',
          actual: decoded === content ? 'UTF-8' : 'Mismatch',
          status: decoded === content ? 'pass' : 'fail',
        },
        {
          id: 'pages',
          label: 'Pages with text',
          required: `${pages.length}`,
          actual: `${pages.length - empty.length}`,
          status: empty.length === 0 ? 'pass' : 'not-checked',
          ...(empty.length > 0 ? { note: 'Scanned pages have no text layer.' } : {}),
        },
      ];
      return {
        blob,
        fileName: resolveOutputName(input.name, options.fileName, 'text', 'txt'),
        format: 'txt',
        bytes: blob.size,
        facts: [
          { label: 'Pages read', value: String(pages.length) },
          { label: 'Characters', value: characters.toLocaleString('en-IN') },
          { label: 'File size', value: formatBytes(blob.size) },
        ],
        verification,
        warnings:
          empty.length === pages.length
            ? [
                'No text was found. This PDF looks like a scan (pictures of pages); it needs OCR to turn the images into text.',
              ]
            : empty.length > 0
              ? [
                  `No text on page${empty.length === 1 ? '' : 's'} ${describePages(empty)}: probably scanned. Those pages need OCR.`,
                ]
              : [],
      };
    } finally {
      await close();
    }
  },
});
