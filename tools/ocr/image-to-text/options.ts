import * as v from 'valibot';
import { OCR_LANGUAGE_IDS } from '@niftyfix/engine-ocr/assets';
import { FileNameSchema } from '@niftyfix/tool-sdk';

/** Options cross the worker boundary, so they are validated there with this schema. */
export const ImageToTextOptions = v.object({
  /** One to three languages; each adds a download the first time and some reading time. */
  languages: v.pipe(v.array(v.picklist(OCR_LANGUAGE_IDS)), v.minLength(1), v.maxLength(3)),
  fileName: FileNameSchema,
});

export type ImageToTextOptions = v.InferOutput<typeof ImageToTextOptions>;

/** Lines Tesseract is less sure of than this (0 to 100) are listed for proofreading. */
export const LOW_CONFIDENCE = 60;
