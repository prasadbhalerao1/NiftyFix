import { PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf, readMetadata, removeAllMetadata, savePdf } from '../src';

describe('removeAllMetadata', () => {
  it('clears the Info fields and the XMP metadata stream, without stamping a producer', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    doc.setTitle('Salary slip');
    doc.setAuthor('A. Person');
    doc.setKeywords(['private']);
    doc.catalog.set(
      PDFName.of('Metadata'),
      doc.context.register(doc.context.stream('<x:xmpmeta>A. Person</x:xmpmeta>')),
    );
    const loaded = await loadPdf(await doc.save(), { maxPages: 10 });
    removeAllMetadata(loaded);
    const bytes = await savePdf(loaded, { stampProducer: false });
    const reopened = await loadPdf(bytes, { maxPages: 10 });
    expect(readMetadata(reopened)).toEqual({
      title: '',
      author: '',
      subject: '',
      keywords: '',
      creator: '',
    });
    expect(reopened.getProducer() ?? '').toBe('');
    expect(reopened.catalog.get(PDFName.of('Metadata'))).toBeUndefined();
    // The name must be gone from the raw bytes, not just from the fields.
    expect(new TextDecoder('latin1').decode(bytes).includes('A. Person')).toBe(false);
  });
});
