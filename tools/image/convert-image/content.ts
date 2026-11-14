import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To convert an image, choose it, pick JPG, PNG or WebP and download the converted file. Some forms accept only JPG, some apps want PNG, and many websites save images as WebP or AVIF that older software cannot open. The conversion runs in your browser, and the file you download is checked to really be in that format, not just renamed.',
  howTo: [
    'Choose an image (JPG, PNG, WebP, AVIF, BMP or GIF), or up to 50 at once: each gets the same settings, and they download together as a ZIP.',
    'Pick the format you need: JPG, PNG or WebP.',
    'For JPG and WebP, adjust the quality if you like (92% is the default).',
    'Select "Convert", check the report, then download.',
  ],
  options: [
    {
      name: 'JPG',
      description:
        'Accepted almost everywhere, including government and exam portals. Small files for photos. Has no transparency, so see-through areas are filled with white.',
    },
    {
      name: 'PNG',
      description:
        'Lossless and keeps transparency. Best for screenshots, logos and graphics with text; photos become large files.',
    },
    {
      name: 'WebP',
      description:
        'Smaller than JPG at the same quality and keeps transparency. Supported by all current browsers, but some older apps and portals do not accept it.',
    },
    {
      name: 'Quality',
      description:
        'For JPG and WebP. Around 90% looks the same as the original; lower values make smaller files. To reach a specific KB limit, use Compress Image.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 1.8 MB PNG screenshot with a transparent background',
    settings: 'JPG, quality 92%',
    output: 'A 300 to 400 KB JPG with a white background, same pixel size',
  },
  limits: [
    'HEIC photos from iPhones cannot be opened by most browsers yet, so they are not supported. iPhones usually convert to JPG automatically when you upload or email a photo.',
    'Animated GIFs become a single still image (the first frame).',
    'Location and camera details (EXIF) are not copied into the converted file.',
    'Converting a JPG to PNG does not restore detail lost to JPG compression; it only changes the container.',
  ],
  faqs: [
    {
      question: 'How do I convert PNG to JPG without losing quality?',
      answer:
        'Set Quality to 90 or more: at that level a photo looks the same as the PNG. JPG has no transparency, so see-through areas become white; keep PNG or choose WebP if you need them.',
    },
    {
      question: 'How do I convert an image to JPG on iPhone or Mac?',
      answer:
        'Open this page in Safari, choose the image and pick JPG. There is nothing to install, and the image never leaves the device.',
    },
    {
      question: 'Is my image uploaded?',
      answer:
        'No. The conversion runs in your browser, on your device. Nothing is sent to our servers.',
    },
    {
      question: 'Can I just rename a file from .png to .jpg?',
      answer:
        'Renaming does not change the data inside, and many portals check the real format and reject it. This tool re-encodes the image and then confirms the format from the file itself.',
    },
  ],
  variants: [
    {
      slug: 'png-to-jpg',
      preset: 'to-jpeg',
      label: 'PNG to JPG',
      h1: 'Convert PNG to JPG',
      seoTitle: 'PNG to JPG converter online, free | NiftyFix',
      seoDescription:
        'Convert PNG images to JPG in your browser. Transparent areas become white; quality is adjustable. Free, and nothing is uploaded.',
      intro:
        'Forms and portals that ask for JPG reject PNG files, and PNG photos are often several times larger. This page converts to JPG: choose your PNG and download a real JPG, with transparent areas filled with white.',
      faqs: [
        {
          question: 'Why is my JPG much smaller than the PNG?',
          answer:
            'PNG stores every pixel exactly, which suits graphics but makes photos large. JPG compresses photos very efficiently; at 92% quality the difference is hard to see.',
        },
      ],
    },
    {
      slug: 'jpg-to-png',
      preset: 'to-png',
      label: 'JPG to PNG',
      h1: 'Convert JPG to PNG',
      seoTitle: 'JPG to PNG converter online, free | NiftyFix',
      seoDescription:
        'Convert JPG or JPEG images to PNG in your browser, at the same pixel size. Free, and your image never leaves your device.',
      intro:
        'Some apps, editors and print services ask for PNG. This page converts to PNG: choose your JPG and download a lossless PNG at exactly the same pixel size.',
      faqs: [
        {
          question: 'Will converting to PNG improve quality?',
          answer:
            'No. PNG keeps the image exactly as it is now, so nothing more is lost, but it cannot bring back detail the JPG already discarded. Expect a larger file.',
        },
      ],
    },
    {
      slug: 'webp-to-jpg',
      preset: 'to-jpeg',
      label: 'WebP to JPG',
      h1: 'Convert WebP to JPG',
      seoTitle: 'WebP to JPG converter online, free | NiftyFix',
      seoDescription:
        'Convert WebP images saved from websites into JPG files any app or portal accepts. Free, in your browser, nothing uploaded.',
      intro:
        'Images saved from websites are often WebP, which many forms, older apps and photo printers do not accept. This page converts them to JPG, the format accepted almost everywhere.',
      faqs: [
        {
          question: 'Why do images I save from websites end up as WebP?',
          answer:
            'Websites use WebP because it is smaller than JPG at the same quality. Your browser saves the file as the site sent it.',
        },
      ],
    },
    {
      slug: 'webp-to-png',
      preset: 'to-png',
      label: 'WebP to PNG',
      h1: 'Convert WebP to PNG',
      seoTitle: 'WebP to PNG converter online, free | NiftyFix',
      seoDescription:
        'Convert WebP images to PNG and keep transparent backgrounds. Free, in your browser, nothing uploaded.',
      intro:
        'Logos, stickers and icons saved from websites are often WebP with a transparent background. This page converts them to PNG, which keeps the transparency and opens in every editor.',
      faqs: [
        {
          question: 'Is the transparent background kept?',
          answer: 'Yes. PNG supports transparency, so see-through areas stay see-through.',
        },
      ],
    },
    {
      slug: 'jpg-to-webp',
      preset: 'to-webp',
      label: 'JPG to WebP',
      h1: 'Convert JPG to WebP',
      seoTitle: 'JPG to WebP converter online, free | NiftyFix',
      seoDescription:
        'Convert JPG and PNG images to WebP for smaller, faster web pages. Adjustable quality. Free, in your browser, nothing uploaded.',
      intro:
        'WebP images are typically 25 to 35% smaller than JPG at the same visible quality, so web pages load faster. This page converts to WebP with adjustable quality.',
      faqs: [
        {
          question: 'Will every visitor be able to see WebP images?',
          answer:
            'Yes, in all current browsers. Some older desktop apps and upload portals still do not accept WebP; keep the JPG for those.',
        },
      ],
    },
    {
      slug: 'avif-to-jpg',
      preset: 'to-jpeg',
      label: 'AVIF to JPG',
      h1: 'Convert AVIF to JPG',
      seoTitle: 'AVIF to JPG converter online, free | NiftyFix',
      seoDescription:
        'Open AVIF images and save them as JPG for apps, forms and printers that need it. Free, in your browser, nothing uploaded.',
      intro:
        'AVIF is a newer image format some websites and phones use, and many apps cannot open it yet. This page converts AVIF to JPG, which opens everywhere.',
      faqs: [
        {
          question: 'My browser says it cannot read the AVIF file. Why?',
          answer:
            'AVIF needs a recent browser: Chrome, Edge and Firefox from 2021 onwards, or Safari 16.4 or later. Update your browser, or try another one on the same device.',
        },
      ],
    },
  ],
});
