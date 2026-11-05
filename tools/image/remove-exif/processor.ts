import {
  HEADER_PROBE_BYTES,
  readImageHeader,
  readMetadata,
  stripMetadata,
  type MetadataFormat,
} from '@niftyfix/engine-image';
import { resolveOutputName } from '@niftyfix/runtime';
import {
  defineProcessor,
  FILE_FORMATS,
  formatBytesExact,
  ToolError,
  type OutputFact,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import { RemoveExifOptions } from './options';

const isMetadataFormat = (format: string): format is MetadataFormat =>
  format === 'jpeg' || format === 'png' || format === 'webp';

/** Opens in the browser's own decoder: proof the file is still a working image. */
async function decodes(bytes: Uint8Array, mime: string): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(new Blob([bytes.slice().buffer], { type: mime }));
    bitmap.close();
    return true;
  } catch {
    return false;
  }
}

export default defineProcessor({
  options: RemoveExifOptions,
  async run(input, options, context) {
    context.progress(0.1, 'Reading metadata');
    const bytes = new Uint8Array(await input.blob.arrayBuffer());
    const header = readImageHeader(bytes.subarray(0, HEADER_PROBE_BYTES));
    if (header === null || !isMetadataFormat(header.format)) {
      throw new ToolError('UNSUPPORTED_FORMAT', 'Choose a JPG, PNG or WebP image.');
    }
    const { format } = header;
    const before = readMetadata(bytes, format);

    context.progress(0.4, 'Removing metadata');
    const output = stripMetadata(bytes, format);
    const after = readMetadata(output, format);
    const outHeader = readImageHeader(output.subarray(0, HEADER_PROBE_BYTES));

    context.progress(0.7, 'Verifying');
    const fileName = resolveOutputName(
      input.name,
      options.fileName,
      'clean',
      FILE_FORMATS[format].extensions[0],
    );
    const opens = await decodes(output, FILE_FORMATS[format].mime);
    const verification: VerificationCheck[] = [
      {
        id: 'location',
        label: 'Location (GPS)',
        required: 'none',
        actual: after.hasLocation ? 'still present' : 'none',
        status: after.hasLocation ? 'fail' : 'pass',
      },
      {
        id: 'details',
        label: 'Camera, time and other details',
        required: 'none',
        actual: after.items.length === 0 ? 'none' : `${after.items.length} left`,
        status: after.items.length === 0 ? 'pass' : 'fail',
      },
      {
        id: 'other',
        label: 'XMP, IPTC, comments and text',
        required: 'none',
        actual: after.kinds.filter((kind) => kind !== 'EXIF').join(', ') || 'none',
        status: after.kinds.some((kind) => kind !== 'EXIF') ? 'fail' : 'pass',
      },
      {
        id: 'image',
        label: 'Image',
        required: `${header.width} × ${header.height} px, opens normally`,
        actual: outHeader
          ? `${outHeader.width} × ${outHeader.height} px, ${opens ? 'opens normally' : 'does not open'}`
          : 'unreadable',
        status:
          outHeader?.width === header.width &&
          outHeader.height === header.height &&
          outHeader.format === format &&
          opens
            ? 'pass'
            : 'fail',
      },
    ];

    const warnings: string[] = [];
    if (before.kinds.length === 0) {
      warnings.push('This image had no metadata to remove. The file is unchanged.');
    }
    if (after.orientation !== 1) {
      warnings.push(
        'The rotation tag was kept on its own, so the photo still shows the right way up. It holds no personal information.',
      );
    }
    const facts: OutputFact[] = [
      { label: 'Removed', value: before.kinds.join(', ') || 'nothing (there was none)' },
      ...before.items.map((item) => ({ label: `Removed: ${item.label}`, value: item.value })),
      {
        label: 'File size',
        value: `${formatBytesExact(input.bytes)} → ${formatBytesExact(output.length)}`,
      },
    ];

    context.progress(1, 'Done');
    return {
      blob: new Blob([output.slice().buffer], { type: FILE_FORMATS[format].mime }),
      fileName,
      format,
      bytes: output.length,
      facts,
      verification,
      warnings,
    };
  },
});
