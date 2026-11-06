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
      slug: 'mpsc-photo-size',
      preset: 'spec-mpsc-photo',
      label: 'MPSC photo',
      h1: 'MPSC photo and signature size: under 50 KB, 10-character file name',
      seoTitle: 'MPSC photo and signature size: max 50 KB, JPG | NiftyFix',
      seoDescription:
        'MPSC online form sizes from mpsconline.gov.in: photo 3.5 x 4.5 cm, signature 3.5 x 1.5 cm, each a JPG under 50 KB with a file name of 10 characters. Free.',
      intro:
        'The MPSC Online Application System asks for a recent colour passport size photo, 3.5 cm wide by 4.5 cm high, and a signature 3.5 cm wide by 1.5 cm high, each as a JPG of at most 50 KB. The rule that catches many applicants is the file name: at most 10 characters, so rename a phone file such as IMG_20260611_123456.jpg to something like photo.jpg (set the file name below). The image must not carry a watermark, stamp or scanning app name. The 50 KB limit is filled in; for the signature, choose MPSC in the Signature Resizer. Source: Instructions for filling the application form, mpsconline.gov.in.',
      faqs: [
        {
          question: 'Why does MPSC reject my photo file?',
          answer:
            'Check three things: the file is a JPG, it is 50 KB or less, and its name has at most 10 characters. Phone photo names are usually longer, so rename the file before uploading.',
        },
      ],
    },
    {
      slug: 'upsc-photo-size',
      preset: 'spec-upsc-2026-photo',
      label: 'UPSC photo',
      h1: 'UPSC photo size: JPG, 20 to 200 KB, face 3/4 of the photo',
      seoTitle: 'UPSC photo size 2026: 20 to 200 KB, 3/4 face rule | NiftyFix',
      seoDescription:
        'Make your UPSC application photo: colour JPG of 20 to 200 KB, plain white background, face covering 3/4 of the photo, as UPSC instructs. Free, private.',
      intro:
        'UPSC asks for a recent colour photo as a JPG between 20 KB and 200 KB, on a plain white background, saved with the file name "photo". The rule that rejects most photos is face coverage: your face must fill at least 75% (3/4) of the picture, looking straight at the camera with both ears visible. Crop tight around your face below; the KB range is already filled in. You also capture a live photo, which UPSC matches with this one, so use a recent photo. Source: the UPSC instructions for uploading the photo and signature on upsconline.nic.in.',
      faqs: [
        {
          question: 'Why was my UPSC photo rejected for face coverage?',
          answer:
            'UPSC needs the face to cover at least 3/4 of the photo. A normal passport photo with shoulders and space around the head is often too loose; crop closer so your face fills most of the frame, keeping both ears in.',
        },
      ],
    },
    {
      slug: 'neet-photo-size',
      preset: 'spec-neet-ug-2026-photo',
      label: 'NEET photo',
      h1: 'NEET UG photo and signature size: 10 to 200 KB',
      seoTitle: 'NEET UG 2026 photo size and signature size (KB) | NiftyFix',
      seoDescription:
        'NEET UG 2026 upload sizes from the NTA bulletin: photo 10 to 200 KB, signature 10 to 100 KB, JPG; documents as PDF 50 to 300 KB. Resize free.',
      intro:
        'The NEET (UG) 2026 Information Bulletin asks for a recent passport size photo, colour or black and white, JPG, between 10 KB and 200 KB, on a white background with your face (without mask) filling 80% of the picture and both ears visible. It gives no pixel size, so keep the photo sharp and only fit the KB range, which is filled in below. The signature is a JPG of 10 KB to 100 KB. Certificates are PDFs of 50 KB to 300 KB. You also capture a live photo with your camera while filling the form. Source: the NEET (UG) 2026 Information Bulletin linked from neet.nta.nic.in.',
      faqs: [
        {
          question: 'What size is the NEET fingers and thumb impression?',
          answer:
            'The 2026 bulletin is not consistent: it says 10 KB to 200 KB in one place and 50 KB to 300 KB in another (both JPG). A file between 50 KB and 200 KB satisfies both.',
        },
        {
          question: 'Is the NEET signature 4 to 30 KB?',
          answer:
            'Not in the 2026 bulletin. It says the signature should be a JPG between 10 KB and 100 KB. Older figures still appear on many websites.',
        },
      ],
    },
    {
      slug: 'ibps-po-photo-size',
      preset: 'spec-ibps-po-2026-photo',
      label: 'IBPS PO photo',
      h1: 'IBPS PO photo size: 200 x 230 px, 20 to 50 KB',
      seoTitle: 'IBPS PO 2026 photo size: 200x230 px, 20 to 50 KB | NiftyFix',
      seoDescription:
        'Resize your photo for the IBPS PO/MT-XVI form: 200 x 230 pixels, 20 to 50 KB, JPG, as the official notice states. Thumb and declaration sizes too. Free.',
      intro:
        'The IBPS PO/MT-XVI notice asks for a recent colour passport-style photo, 200 x 230 pixels (preferred), 20 KB to 50 KB, JPG, on a light, preferably white, background. These numbers are filled in below. You will also take a live photo with your webcam or phone during registration, so look the same in both. The same notice sets the left thumb impression at 240 x 240 px, 20 to 50 KB, and the handwritten declaration at 800 x 400 px, 50 to 100 KB, both at 200 DPI. Source: the official IBPS CRP PO/MT-XVI notification (30 June 2026, Annexure III) on ibps.in.',
      faqs: [
        {
          question: 'Do I still upload a photo if IBPS takes a live photo?',
          answer:
            'Yes. The notice asks for both: an uploaded photo (200 x 230 px, 20 to 50 KB) and a live photo captured through your webcam or phone while you register.',
        },
        {
          question: 'Can I make the thumb impression and declaration here?',
          answer:
            'Yes. Scan or photograph them on white paper, then set 240 x 240 px and 20 to 50 KB for the thumb, or 800 x 400 px and 50 to 100 KB for the declaration, with 200 DPI.',
        },
      ],
    },
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
