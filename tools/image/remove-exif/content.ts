import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Photos from phones and cameras carry hidden details: often the exact place the photo was taken, the date and time, and the phone or camera model, sometimes with its serial number. Anyone you send the file to can read them. This tool shows what your photo contains, then removes it. The picture itself is copied byte for byte, so there is no loss of quality.',
  howTo: [
    'Choose a photo (JPG, PNG or WebP); the details it contains are listed straight away. You can also choose up to 50 photos and clean them all at once.',
    'Select "Remove metadata".',
    'Check the report: location, camera and other details should all show "none". Then download.',
  ],
  options: [
    {
      name: 'What is removed',
      description:
        'EXIF (location, date and time, camera, lens, software, serial numbers), XMP and IPTC (editing and caption details), comments, and text chunks in PNG files.',
    },
    {
      name: 'What is kept',
      description:
        'The picture itself, unchanged, and its colour profile so colours look the same. A sideways phone photo keeps a single rotation tag, so it still shows the right way up; that tag holds nothing personal.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 3.1 MB phone photo with GPS location, date and phone model',
    settings: 'Remove metadata',
    output: 'The same photo, a few KB smaller, with no location, date or camera details',
  },
  limits: [
    'JPG, PNG and WebP only. To clean another format, convert it with Convert Image first (converting also removes metadata).',
    'Only metadata inside the file is removed. Anything visible in the picture itself, such as a street sign, stays.',
    'WhatsApp, Instagram and most social apps usually remove location when you share; email, cloud links and file transfers usually do not.',
  ],
  faqs: [
    {
      question: 'How do I know the location is really gone?',
      answer:
        'After removing, the tool reads the new file again and reports what is left. Location, camera details and other metadata must all show "none" for the check to pass.',
    },
    {
      question: 'Is my photo uploaded to read the metadata?',
      answer:
        'No. The details are read and removed in your browser, on your device. Nothing is sent to our servers.',
    },
  ],
  variants: [
    {
      slug: 'exif-viewer',
      label: 'View EXIF data',
      h1: 'View the EXIF data in a photo',
      seoTitle: 'EXIF viewer: see photo location, camera and date, free | NiftyFix',
      seoDescription:
        'See the hidden EXIF details in a JPG, PNG or WebP: GPS location, date taken, camera and lens. Read on your device, nothing uploaded.',
      intro:
        'Choose a photo to see the details stored inside it: where it was taken (GPS coordinates), when, and with which phone or camera. Everything is read on your device. If you want them gone, remove them with one click.',
      faqs: [
        {
          question: 'Why does my photo show no details?',
          answer:
            'Many apps remove metadata when saving or sharing, and screenshots usually have none. In that case the photo has nothing to reveal.',
        },
      ],
    },
    {
      slug: 'remove-location-from-photo',
      label: 'Remove location',
      h1: 'Remove the location from a photo',
      seoTitle: 'Remove location (GPS) from a photo online, free | NiftyFix',
      seoDescription:
        'Remove the GPS location hidden in a photo before you share it, without changing the picture. Free, and nothing is uploaded.',
      intro:
        'Phone photos often record exactly where they were taken, down to a few metres. Before you email a photo or post it where strangers can download it, remove the location here. The picture stays exactly the same.',
      faqs: [
        {
          question: 'How can I stop my phone saving the location?',
          answer:
            'In your camera app settings, turn off location tags (often called "Location tags" or "Save location"). Photos you already took still contain it, which is what this tool removes.',
        },
      ],
    },
  ],
});
