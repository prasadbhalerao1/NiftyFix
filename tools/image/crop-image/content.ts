import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Remove the edges you do not want: a cluttered background, other people, a screenshot border. Crop freely, or lock the frame to a shape such as square for a profile picture, 16:9 for a slide, or passport-photo proportions. The pixels you keep are copied as they are, not resized, so the crop is as sharp as the original.',
  howTo: [
    'Choose an image (JPG, PNG, WebP, AVIF, BMP or GIF).',
    'Pick a shape, or leave it on Free.',
    'Drag the frame over the part you want; resize it with the corner handle or the slider. Arrow keys move it too.',
    'Select "Crop image", check the report, then download.',
  ],
  options: [
    {
      name: 'Shape',
      description:
        'Free lets you set any width and height. The other shapes lock the frame: Square (1:1), Landscape (4:3), Portrait (3:4), Wide (16:9), Story (9:16) and Passport photo (3.5 × 4.5).',
    },
    {
      name: 'Crop size',
      description:
        'Shown under the image: the size of the frame in pixels, which is exactly the size of the cropped image.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 4000 × 3000 px group photo',
    settings: 'Square, frame around one face',
    output: 'A sharp square JPG, for example 1200 × 1200 px, ready for a profile picture',
  },
  limits: [
    'Cropping does not change the pixel size of what you keep. To make it a specific size, use Resize Image afterwards, or the Form Photo Resizer, which does both.',
    'JPG images are saved again at high quality (95%).',
    'Location and camera details (EXIF) are removed from the cropped image.',
  ],
  faqs: [
    {
      question: 'Does cropping reduce quality?',
      answer:
        'No. The pixels inside the frame are copied one to one. JPG files are saved again at 95% quality, which is visually the same.',
    },
    {
      question: 'Is my image uploaded?',
      answer: 'No. Cropping happens in your browser, on your device.',
    },
  ],
});
