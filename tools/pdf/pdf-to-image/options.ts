import * as v from 'valibot';
import { FileNameSchema, PageSelectionSchema } from '@niftyfix/tool-sdk';

export const DPI_CHOICES = [72, 150, 300] as const;
export const MAX_IMAGES = 300;

/** Options cross the worker boundary, so they are validated there with this schema. */
export const PdfToImageOptions = v.object({
  format: v.picklist(['jpeg', 'png']),
  dpi: v.picklist(DPI_CHOICES),
  pages: PageSelectionSchema,
  fileName: FileNameSchema,
});

export type PdfToImageOptions = v.InferOutput<typeof PdfToImageOptions>;
