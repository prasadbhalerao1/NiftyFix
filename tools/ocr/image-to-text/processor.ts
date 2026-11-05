import { decodeImage, encodeCanvas, renderCropped } from '@niftyfix/engine-image/browser';
import { readSafeHeader } from '@niftyfix/engine-image/pipeline';
import { OCR_LANGUAGES, recognizeText } from '@niftyfix/engine-ocr';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, ToolError, type OutputFact } from '@niftyfix/tool-sdk';
import manifest from './manifest';
import { ImageToTextOptions, LOW_CONFIDENCE } from './options';

/** Larger photos are scaled down: more pixels only slow the reader without improving it. */
const MAX_SIDE = 5000;

export default defineProcessor({
  options: ImageToTextOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading image');
    await readSafeHeader(input.blob, manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY);
    // Decode with the photo's own rotation applied (Tesseract ignores EXIF), then hand
    // over a lossless PNG of exactly what the user sees.
    const bitmap = await decodeImage(input.blob);
    let image: Blob;
    try {
      const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);
      const canvas = renderCropped(
        bitmap,
        { x: 0, y: 0, width: bitmap.width, height: bitmap.height },
        width,
        height,
        '#ffffff',
      );
      image = await encodeCanvas(canvas, 'png', 1);
    } finally {
      bitmap.close();
    }

    const result = await recognizeText(image, {
      languages: options.languages,
      assetOrigin: self.location.origin,
      signal: context.signal,
      onProgress: (fraction, stage) =>
        context.progress(
          stage === 'Reading text' ? 0.35 + fraction * 0.6 : 0.05 + fraction * 0.3,
          stage,
        ),
    });
    if (result.text === '') {
      throw new ToolError('TARGET_UNREACHABLE', 'No text was found in this image.', {
        hint: 'Use a sharper, well-lit photo taken straight on, and check the right languages are selected.',
      });
    }

    const text = `${result.text}\n`;
    const bytes = new TextEncoder().encode(text);
    // Read the file back as strict UTF-8, as any program opening it would.
    let valid = true;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      valid = false;
    }
    const words = result.text.split(/\s+/u).filter(Boolean).length;
    const unsure = result.lines.filter((line) => line.confidence < LOW_CONFIDENCE);
    const confidence = Math.round(result.confidence);
    const warnings: string[] = [];
    if (unsure.length > 0) {
      warnings.push(
        `${unsure.length} of ${result.lines.length} lines may contain mistakes. Check: ${unsure
          .slice(0, 3)
          .map((line) => `"${line.text.slice(0, 40)}"`)
          .join(', ')}${unsure.length > 3 ? ' and more' : ''}.`,
      );
    }
    if (confidence < 70) {
      warnings.push(
        'The reader was unsure of much of this image. A sharper photo, taken straight on in even light, usually reads far better.',
      );
    }
    const facts: OutputFact[] = [
      {
        label: 'Languages',
        value: options.languages.map((id) => OCR_LANGUAGES[id]).join(', '),
      },
      { label: 'Found', value: `${words} words on ${result.lines.length} lines` },
      { label: 'Average confidence', value: `${confidence}%` },
    ];

    context.progress(1, 'Done');
    return {
      blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
      fileName: resolveOutputName(input.name, options.fileName, 'text', 'txt'),
      format: 'txt',
      bytes: bytes.length,
      facts,
      verification: [
        {
          id: 'text',
          label: 'Text found',
          required: 'some text',
          actual: `${words} words`,
          status: 'pass',
        },
        {
          id: 'encoding',
          label: 'Text file',
          required: 'valid UTF-8',
          actual: valid ? 'valid UTF-8' : 'invalid',
          status: valid ? 'pass' : 'fail',
        },
        {
          id: 'accuracy',
          label: 'Accuracy',
          required: 'proofread',
          actual: `${confidence}% average confidence`,
          status: 'not-checked',
          note: 'OCR can misread characters. Compare important details (names, numbers) with the image.',
        },
      ],
      warnings,
    };
  },
});
