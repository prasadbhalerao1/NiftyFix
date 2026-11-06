import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'A signature photographed on a phone usually comes out grey, shadowed and far too large. Portals then reject it for its size, its dimensions, or a dirty background. This tool crops the signature, evens out the lighting, whitens the paper while keeping thin pen strokes, and produces exact pixels inside your KB range, with a report that measures the final file.',
  howTo: [
    'Sign on plain white paper with a dark pen, then photograph or scan it in good, even light.',
    'Choose the image. The tool crops to the signature automatically; drag the frame or its corner to adjust.',
    'Check the live preview. Switch between "Cleaned" and "Original" to compare, and adjust the cleanup sliders if strokes look faint.',
    'Enter the width and height in pixels and the minimum and/or maximum size in KB exactly as your form states them.',
    'Select "Prepare signature", review the validation report, then download.',
  ],
  options: [
    {
      name: 'Even out lighting and shadows',
      description:
        'Estimates the brightness of the paper across the photo and divides it out, so a shadow from your hand or a lamp on one side does not turn into a grey patch.',
    },
    {
      name: 'Background cleanup',
      description:
        'How firmly near-white paper is pushed to pure white. Higher values give a cleaner background but can thin out light pen strokes; the preview warns you if strokes start to disappear.',
    },
    {
      name: 'Ink: Colour, Grayscale or Black & white',
      description:
        'Colour keeps blue ink blue. Grayscale removes colour. Black & white uses a hard threshold: the crispest result, but the setting most likely to break very thin strokes, so it is never the default.',
    },
    {
      name: 'Fit inside or fill',
      description:
        '"Fit inside" scales the whole signature into the output box and adds white margins, so nothing is cut off. "Fill" locks the crop frame to the output shape and fills it edge to edge.',
    },
    {
      name: 'Minimum and maximum size (KB)',
      description:
        'The tool searches for the highest JPEG quality whose size lands inside this range and then confirms the exact byte count. PNG is lossless, so its size cannot be tuned.',
    },
    {
      name: 'Transparent background',
      description:
        'PNG only. Removes the paper entirely and keeps the ink, for documents you will place a signature onto. Most portals want an ordinary JPEG instead.',
    },
  ],
  limits: [
    'No cleanup can recover strokes that the camera did not capture: very light pencil, glare or a blurred photo will stay faint. Retake the photo in better light.',
    'Lined, squared or printed paper leaves lines behind; sign on plain paper when you can.',
    'The validation report checks published technical requirements only: dimensions, size, format, extension and DPI. A portal may also judge the signature itself (for example, whether it matches your handwriting elsewhere).',
    'NiftyFix has not yet verified any portal’s official signature specification, so there are no portal presets. Always use the numbers in your notice.',
    'iPhone HEIC photos are not supported yet; share the photo as JPEG instead.',
  ],
  faqs: [
    {
      question: 'Will cleaning the background make my signature look different?',
      answer:
        'Only the paper should change. Compare "Cleaned" and "Original" in the preview before you prepare the file; if strokes look thinner, lower Background cleanup or switch from Black & white to Colour or Grayscale. You can reset to the safe defaults at any time.',
    },
    {
      question:
        'My form says the signature must be in black ink. Can this tool change blue ink to black?',
      answer:
        'Grayscale and Black & white produce a dark grey or black signature from blue ink. Whether a portal accepts a converted signature is up to the portal; if the notice requires black ink, signing in black ink is the safest choice.',
    },
    {
      question: 'Why does the tool say my size limit cannot be reached?',
      answer:
        'A very small maximum for large dimensions can force quality below the lowest level you allowed; a minimum larger than the clean image means the file cannot grow without adding meaningless data, which we never do. The message tells you which case applies and what to change.',
    },
    {
      question: 'Is my signature uploaded anywhere?',
      answer:
        'No. Processing runs in your browser inside an isolated frame that cannot connect to other sites. See the privacy verification page to check this yourself.',
    },
  ],
  variants: [
    {
      slug: 'ssc-signature-size',
      preset: 'spec-ssc-cgl-2026-signature',
      label: 'SSC signature',
      h1: 'SSC signature size: JPEG, 10 to 20 KB (and why there is no photo upload)',
      seoTitle: 'SSC CGL 2026 signature size: 10 to 20 KB, live photo | NiftyFix',
      seoDescription:
        'SSC CGL 2026 asks for a JPEG signature of 10 to 20 KB, about 6 x 2 cm. There is no photo upload: the photo is taken live. Make your signature free.',
      intro:
        'The SSC CGL 2026 notice asks for a scanned signature as a JPEG between 10 KB and 20 KB, about 6.0 cm wide by 2.0 cm high; blurred or tiny signatures are rejected. That KB range is filled in below. There is no photo to upload: the application takes your photo live through the camera, and applications that capture an old photo are rejected. Sit facing the camera without a cap, mask or glasses, and look the same on exam day. Source: the SSC notice of the Combined Graduate Level Examination, 2026 on ssc.gov.in.',
      faqs: [
        {
          question: 'What is the SSC photo size in KB?',
          answer:
            'For CGL 2026 there is none to meet: you do not upload a photo. The application captures it live with your camera. Sizes such as 20 to 50 KB on other websites are from the old upload process.',
        },
      ],
    },
    {
      slug: 'upsc-signature-size',
      preset: 'spec-upsc-2026-signature',
      label: 'UPSC triple signature',
      h1: 'UPSC triple signature: size, format and how to make it',
      seoTitle: 'UPSC triple signature size: 20 to 100 KB, JPG | NiftyFix',
      seoDescription:
        'Make the UPSC triple signature: sign three times one below the other in black ink, one JPG of 20 to 100 KB, 350 to 500 pixels. Free and private.',
      intro:
        'UPSC asks for a triple signature: sign three times, one below the other, in black ink on plain white paper with clear gaps between them, and scan all three as one image. Save it as a JPG named "signature", between 20 KB and 100 KB, with image dimensions of 350 to 500 pixels. Photograph your sheet below; the KB range is already filled in, and the tool cleans the paper to white. Source: the UPSC instructions for uploading the photo and signature on upsconline.nic.in.',
    },
    {
      slug: 'ibps-po-signature-size',
      preset: 'spec-ibps-po-2026-signature',
      label: 'IBPS PO and Clerk signature',
      h1: 'IBPS PO and Clerk signature size: 140 x 60 px, 10 to 20 KB',
      seoTitle: 'IBPS PO and Clerk signature size: 140x60 px, 10-20 KB | NiftyFix',
      seoDescription:
        'Make your signature for the IBPS PO/MT-XVI or Clerk (CSA-XVI) form: black ink on white, 140 x 60 pixels, 10 to 20 KB, JPG. Free and private.',
      intro:
        'The IBPS PO/MT-XVI and Clerk (CSA-XVI) notices ask you to sign on white paper with a black ink pen and upload it as a JPG of 140 x 60 pixels (preferred) between 10 KB and 20 KB; the PO notice adds that it must not be in capital letters. These numbers are filled in below: take a photo of your signature, and the tool cleans the background and fits the size. Sources: the official IBPS CRP PO/MT-XVI notification (30 June 2026, Annexure III) and the CRP CSA-XVI notification (1 August 2026) on ibps.in.',
    },
    {
      slug: 'signature-resize-10-to-20kb',
      preset: '10-to-20kb',
      label: '10–20 KB',
      h1: 'Resize a signature to 10–20 KB',
      seoTitle: 'Signature resize 10 to 20 KB online, free | NiftyFix',
      seoDescription:
        'Resize a scanned or photographed signature to between 10 and 20 KB at the pixel size your form needs. Cleans the background too. Free, private.',
      intro:
        'Forms that ask for a signature between 10 and 20 KB reject files that are too small as well as too large. The range is already set: choose a photo of your signature, enter the pixel size the form gives, and the tool lands the file inside 10–20 KB and shows the exact size.',
      faqs: [
        {
          question: 'Why is my signature rejected for being too small?',
          answer:
            'A plain signature on white paper compresses very well, so it often ends up under the minimum. The tool raises quality until the file is above 10 KB, using 1024 bytes per KB for the minimum so it passes either way a portal counts.',
        },
      ],
    },
    {
      slug: 'signature-resize-10-to-50kb',
      preset: '10-to-50kb',
      label: '10–50 KB',
      h1: 'Resize a signature to 10–50 KB',
      seoTitle: 'Signature resize 10 to 50 KB online, free | NiftyFix',
      seoDescription:
        'Get a signature image between 10 and 50 KB at exact pixel dimensions, with a clean white background. Free, and nothing is uploaded.',
      intro:
        'A 10–50 KB range is easy to meet once the background is clean: the tool whitens the paper, darkens the ink, and keeps the file inside the range. The range is already set; choose your signature photo and enter the pixel size your form asks for.',
    },
  ],
});
