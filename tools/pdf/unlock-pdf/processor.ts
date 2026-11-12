import {
  finishPdf,
  loadPdf,
  MAX_PDF_PAGES,
  readProtection,
  removeProtection,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, isToolError, ToolError } from '@niftyfix/tool-sdk';
import { UnlockPdfOptions } from './options';

export default defineProcessor({
  options: UnlockPdfOptions,
  async run(input, options, { progress }) {
    progress(0.05, 'Reading the PDF');
    const bytes = new Uint8Array(await input.blob.arrayBuffer());
    const limits = { maxPages: MAX_PDF_PAGES };
    // First without a password: files that only restrict printing or copying open this way.
    let opensWithoutPassword = true;
    let doc;
    try {
      doc = await loadPdf(bytes, limits);
    } catch (error) {
      if (!isToolError(error) || error.code !== 'PASSWORD_PROTECTED') throw error;
      opensWithoutPassword = false;
      if (!options.password) {
        throw new ToolError('PASSWORD_PROTECTED', 'This PDF needs its password to open.', {
          hint: 'Type the password in "PDF password" and try again. It stays on your device.',
        });
      }
      doc = await loadPdf(bytes, { ...limits, password: options.password });
    }
    const protection = readProtection(bytes, opensWithoutPassword);
    if (!protection) {
      throw new ToolError(
        'INVALID_OPTIONS',
        'This PDF has no password or restrictions to remove.',
        {
          hint: 'It already opens, prints and copies freely in any PDF reader.',
        },
      );
    }
    progress(0.4, 'Removing the password');
    removeProtection(doc);
    progress(0.7, 'Saving and checking');
    const removed = [
      ...(protection.openPassword ? ['open password'] : []),
      ...(protection.restricted ? ['print, copy and edit restrictions'] : []),
    ];
    const output = await finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, 'unlocked', 'pdf'),
      pages: doc.getPageCount(),
      inputBytes: input.bytes,
      facts: [{ label: 'Removed', value: removed.join(' and ') || 'encryption' }],
    });
    // Independently: the saved bytes must carry no encryption at all.
    const saved = new Uint8Array(await output.blob.arrayBuffer());
    const left = readProtection(saved, true);
    return {
      ...output,
      verification: [
        ...output.verification,
        {
          id: 'unlocked',
          label: 'Password and restrictions removed',
          required: 'No encryption',
          actual: left ? 'Still encrypted' : 'No encryption',
          status: left ? 'fail' : 'pass',
        },
      ],
    };
  },
});
