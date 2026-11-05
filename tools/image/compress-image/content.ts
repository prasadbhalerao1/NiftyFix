import { defineContent, type ToolVariant } from '@niftyfix/tool-sdk';

/** One intent page per common form limit: the target is filled in when the page opens. */
function sizePage(
  kb: number,
  intro: string,
  faq: { question: string; answer: string },
): ToolVariant {
  return {
    slug: `compress-image-to-${kb}kb`,
    preset: `target-${kb}kb`,
    label: `${kb} KB`,
    h1: `Compress an image to ${kb} KB`,
    seoTitle: `Compress image to ${kb}KB online, free | NiftyFix`,
    seoDescription: `Reduce a JPG, PNG or WebP photo to under ${kb} KB for online forms. The result is checked before you download. Free, nothing uploaded.`,
    intro,
    faqs: [faq],
  };
}

export default defineContent({
  intro:
    'Photos from a phone are often 3 to 8 MB, while forms, email and chat apps ask for far less. This tool re-encodes your image at a lower quality, and only when a size limit cannot be met that way does it make the image smaller in pixels too. It then measures the file it produced. If your image was already as small as it can sensibly be, you get your original back rather than a bigger file.',
  howTo: [
    'Choose an image (JPG, PNG, WebP, AVIF, BMP or GIF), or up to 50 at once: each gets the same settings, and they download together as a ZIP.',
    'Pick a level (Recommended suits most photos) or choose Target size and enter the limit.',
    'Select "Compress image", check the report, then download.',
  ],
  options: [
    {
      name: 'Less, Recommended, Strong',
      description:
        'How much quality is traded for size. Less is close to the original; Recommended is hard to tell apart on a screen; Strong also limits very large photos to 2048 px on the long side.',
    },
    {
      name: 'Target size',
      description:
        'Enter a limit in KB or MB. The tool finds the highest quality that fits; if even low quality is too big, it reduces the pixel size step by step and tells you the new dimensions.',
    },
    {
      name: 'Format',
      description:
        'Same as original keeps JPG and WebP, and saves other formats as JPG (or WebP when the image has transparent areas, so they stay transparent). You can also choose JPG, WebP or PNG yourself. PNG is lossless, so it only gets smaller by reducing pixels.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 4.2 MB, 4000 × 3000 px phone photo',
    settings: 'Target size: 100 KB',
    output: 'About 95 KB as a JPG, around 1600 × 1200 px, sharp on screen',
  },
  limits: [
    'Location and camera details (EXIF) are removed from compressed images. If your file is returned unchanged because it was already small, its original details remain.',
    'Very small limits on large, detailed photos need fewer pixels; check the result still shows what the form needs.',
    'Animated GIFs become a single still image.',
    'HEIC photos from iPhones are not supported yet; share them as JPG (most iPhones do this automatically when you upload or email).',
  ],
  faqs: [
    {
      question: 'Is my photo uploaded anywhere?',
      answer:
        'No. Compression runs inside your browser on your own device. The image is never sent to our servers or anyone else.',
    },
    {
      question: 'Why is my image not getting smaller?',
      answer:
        'Images that were already saved at a low quality have little left to remove. In that case the tool tells you and returns the original file. Choosing Target size with a smaller limit will reduce the pixel size instead.',
    },
    {
      question: 'What is the difference from the Form Photo Resizer?',
      answer:
        'This tool keeps your whole image and only makes the file smaller. The Form Photo Resizer also crops to exact pixel dimensions and a minimum and maximum KB range, as exam and job forms often require.',
    },
  ],
  variants: [
    sizePage(
      20,
      'Some forms ask for photos and scans of 20 KB or less. The target is already set to 20 KB: choose your image and the tool finds the best quality that fits, reducing the pixel size if needed and telling you the final dimensions.',
      {
        question: 'Will a 20 KB photo still look clear?',
        answer:
          'For a passport-style photo or a signature, yes: 20 KB is enough at the sizes forms display. A wide scene or a document photo may need its pixels reduced to fit, so check that the text is still readable.',
      },
    ),
    sizePage(
      50,
      '50 KB is a common limit on exam and job application forms. The target is already set to 50 KB: choose your image and get a JPG that fits, with every check measured on the file itself.',
      {
        question: 'My form says between 20 KB and 50 KB. Will this work?',
        answer:
          'This tool only sets a maximum. For a minimum and maximum together, plus exact pixel dimensions, use the Form Photo Resizer, which never pads a file to reach a minimum.',
      },
    ),
    sizePage(
      100,
      '100 KB keeps a photo clear on screen while fitting most upload limits. The target is already set to 100 KB: choose your image and the tool finds the highest quality under the limit.',
      {
        question: 'Do I need to resize my photo first?',
        answer:
          'No. If quality alone cannot reach 100 KB, the tool reduces the pixel size for you and shows the new dimensions in the report.',
      },
    ),
    sizePage(
      200,
      '200 KB is enough for a sharp photo at full screen size, and fits most email, chat and document-upload limits. The target is already set to 200 KB.',
      {
        question: 'Will the image dimensions change?',
        answer:
          'Usually not for typical phone photos at 200 KB; quality is reduced first. Very large photos may be scaled down, and the report shows the exact result.',
      },
    ),
  ],
});
