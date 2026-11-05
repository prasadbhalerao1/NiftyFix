import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Application portals usually reject a photo for one of four reasons: wrong pixel dimensions, a file that is too large, a file that is too small, or the wrong format. This tool fixes all four in one pass and then measures the file it produced, so you can see each requirement pass or fail before you upload.',
  howTo: [
    'Choose your photo (JPEG, PNG, WebP, AVIF, BMP or GIF).',
    'Enter the width and height in pixels exactly as your form states them, or pick a common size.',
    'Drag the frame so your face is centred; use the slider or the corner handle to zoom.',
    'Enter the minimum and/or maximum file size in KB if the form gives them.',
    'Select "Prepare photo", review the validation report, then download.',
  ],
  options: [
    {
      name: 'Width and height (px)',
      description:
        'The exact pixel size of the output. The crop frame is locked to this shape, so your photo is never stretched.',
    },
    {
      name: 'Minimum and maximum size (KB)',
      description:
        'The tool searches for the highest JPEG or WebP quality whose file size lands inside this range, then confirms the final byte count.',
    },
    {
      name: 'KB means',
      description:
        'Forms rarely say whether 1 KB is 1000 or 1024 bytes. "Safe" keeps the file inside the limit under both readings: the maximum uses 1000 bytes per KB and the minimum uses 1024.',
    },
    {
      name: 'Format',
      description:
        'JPEG is what almost every form asks for. PNG is lossless, so its size cannot be tuned to a KB range. WebP is smaller but accepted by fewer portals.',
    },
    {
      name: 'DPI',
      description:
        'Only some forms ask for it. It is stored in the JPEG header and does not change the pixels or file quality.',
    },
    {
      name: 'Lowest quality allowed',
      description:
        'The size search never goes below this. If your limit cannot be met above it, you get an explanation instead of a blurry file.',
    },
    {
      name: 'File name',
      description:
        'Some portals reject names with spaces or brackets. Set a plain name such as "photo" if needed.',
    },
  ],
  limits: [
    'iPhone HEIC photos are not supported yet. On iPhone, share the photo as JPEG or set Camera → Formats → Most Compatible.',
    'The validation report checks published technical requirements only: dimensions, size, format, extension and DPI. Portals can run extra checks (face position, background colour, glasses, or a live photo taken in the portal) that no file tool can guarantee.',
    'Some portals (for example recent SSC and UPSC cycles, according to applicant reports) capture the photograph live instead of accepting an upload. Check your notice first.',
    'If the selected area is much smaller than the output size, the photo is enlarged and may look soft; the result shows a warning when this happens.',
    'Very large images (over 50 megapixels on phones, 100 megapixels on computers) are rejected to protect your device’s memory.',
  ],
  faqs: [
    {
      question: 'Is my photo uploaded anywhere?',
      answer:
        'No. Processing runs in your browser inside an isolated frame that is not allowed to make network connections to other sites. You can check this yourself; see the privacy verification page.',
    },
    {
      question: 'Why does the result say my size limit cannot be reached?',
      answer:
        'A maximum that is too small for the pixel dimensions forces quality below the lowest level you allowed. A minimum that is too large means the photo cannot get bigger without adding meaningless data, which we never do. The message tells you which case applies and what to change.',
    },
    {
      question: 'What does "3.5 × 4.5 cm" mean in pixels?',
      answer:
        'Pixels depend on DPI: 3.5 × 4.5 cm is 276 × 354 px at 200 DPI and 413 × 531 px at 300 DPI. If your form gives centimetres and a DPI, use the matching common size; if it gives pixels, enter them directly.',
    },
    {
      question: 'Will the portal accept my photo?',
      answer:
        'If every row of the validation report passes, the file meets the technical requirements you entered. Acceptance also depends on rules the portal may not publish, so we cannot promise it.',
    },
  ],
  variants: [
    {
      slug: 'resize-photo-to-20kb',
      preset: 'max-20kb',
      label: 'Under 20 KB',
      h1: 'Resize a photo to 20 KB',
      seoTitle: 'Resize photo to 20KB online, free | NiftyFix',
      seoDescription:
        'Reduce a photo to under 20 KB for online application forms, at the exact pixel size you need. Free and private: your photo stays on your device.',
      intro:
        'A 20 KB limit is tight for a photo, so the tool finds the highest quality that still fits and shows the exact final size. The maximum is already set to 20 KB; enter the pixel size your form asks for, position your face, and download.',
      faqs: [
        {
          question: 'Will my photo look blurry at 20 KB?',
          answer:
            'At the small pixel sizes forms ask for (a few hundred pixels wide), 20 KB is usually enough for a clear face. If the form asks for a large size and a small file, the tool lowers quality only as far as the "Lowest quality allowed" setting lets it, and tells you if it cannot fit.',
        },
      ],
    },
    {
      slug: 'resize-photo-to-50kb',
      preset: 'max-50kb',
      label: 'Under 50 KB',
      h1: 'Resize a photo to 50 KB',
      seoTitle: 'Resize photo to 50KB online, free | NiftyFix',
      seoDescription:
        'Make a photo smaller than 50 KB at the pixel size your form needs. Crop, resize and compress in one step. Free, nothing is uploaded.',
      intro:
        'Many forms cap the photo at 50 KB. The maximum is already set: choose your photo, enter the width and height in pixels from the form, centre your face, and the tool produces a JPEG under 50 KB at the best quality that fits.',
    },
    {
      slug: 'resize-photo-to-100kb',
      preset: 'max-100kb',
      label: 'Under 100 KB',
      h1: 'Resize a photo to 100 KB',
      seoTitle: 'Resize photo to 100KB online, free | NiftyFix',
      seoDescription:
        'Compress a photo to under 100 KB without making it look blurry. Set exact pixel dimensions and crop in one step. Free and private.',
      intro:
        'With a 100 KB limit there is room for a sharp photo at most form sizes. The maximum is already set to 100 KB; choose your photo and set the dimensions, and the tool keeps as much quality as fits, then confirms the final size before you upload.',
    },
  ],
});
