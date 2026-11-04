import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'A signature photographed on a phone usually comes out grey, shadowed and far too large. Portals then reject it for its size, its dimensions, or a dirty background. This tool crops the signature, evens out the lighting, whitens the paper while keeping thin pen strokes, and produces exact pixels inside your KB range — with a report that measures the final file.',
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
        'Colour keeps blue ink blue. Grayscale removes colour. Black & white uses a hard threshold — the crispest result, but the setting most likely to break very thin strokes, so it is never the default.',
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
});
