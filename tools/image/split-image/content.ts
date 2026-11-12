import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To split an image, choose it, pick how many rows and columns you want, and download the pieces as a ZIP. The cut lines and the order of each piece show on the picture before you save. Three special modes cover the common jobs: an Instagram profile grid (three tiles across, 1080 px, numbered in the order to post them), a seamless carousel from a panorama, and a poster printed across several A4 or Letter pages with an overlap for gluing.',
  howTo: [
    'Choose an image.',
    'Pick Grid, Instagram, Carousel or Poster, and set the rows, columns or slides.',
    'Check the cut lines and numbers on the preview.',
    'Select "Split image" (or "Make poster PDF") and download.',
  ],
  options: [
    {
      name: 'Grid',
      description:
        'Equal pieces at the original resolution, with no gaps or lost pixels between them. Named by row and column.',
    },
    {
      name: 'Instagram',
      description:
        'Three tiles across, in square 1:1, portrait 4:5 or the 3:4 shape the profile grid now shows. Each is 1080 px wide and named post-01, post-02 and so on: post them in that order and they line up into one big picture on your profile.',
    },
    {
      name: 'Carousel',
      description:
        'Cuts a wide panorama into slides that join seamlessly when people swipe through the post.',
    },
    {
      name: 'Poster',
      description:
        'Prints one image across several pages as a PDF, with a margin for printers that cannot print to the edge and an overlap so the pages can be glued without gaps.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 4000 × 3000 px holiday photo',
    settings: 'Instagram, 2 rows, portrait 4:5',
    output: 'Six 1080 × 1350 px tiles, post-01 to post-06, forming the photo on your profile',
  },
  limits: [
    'Up to 10 rows and 10 columns.',
    'Instagram and carousel modes crop the picture to fit the tile shape; the dimmed area of the preview is left out.',
  ],
  faqs: [
    {
      question: 'In what order should I post Instagram grid tiles?',
      answer:
        'Post post-01 first and the highest number last. Instagram puts the newest post at the top left, so the picture assembles correctly on your profile.',
    },
    {
      question: 'Which shape should I choose for an Instagram grid?',
      answer:
        'Instagram profiles now show posts as 3:4 rectangles. Choose Profile 3:4 so the grid lines up on your profile; 4:5 and 1:1 also work, with a little of each post hidden on the profile.',
    },
    {
      question: 'How do I print a large image on multiple pages?',
      answer:
        'Choose Poster, set rows and columns (for example 2 × 2 for a poster four pages big), pick A4 or Letter, and print the PDF at 100% scale. Trim the white margins and glue the overlapping strips.',
    },
    {
      question: 'Is my image uploaded?',
      answer:
        'No. It is split in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'instagram-grid-maker',
      preset: 'instagram',
      label: 'Instagram grid maker',
      h1: 'Instagram grid maker: split a photo into 3, 6 or 9 posts',
      seoTitle: 'Instagram Grid Maker: split photo into 3x3 posts, free | NiftyFix',
      seoDescription:
        'Split one photo into an Instagram grid of 3, 6 or 9 posts in 1:1, 4:5 or the new 3:4 profile shape, numbered in posting order. Free, no upload.',
      intro:
        'An Instagram grid turns one big photo into several posts that line up on your profile. It is set to three rows of three: choose a photo, adjust the rows and the post shape (3:4 matches how profiles show posts now), and download 1080 px tiles named in the order to post them.',
      faqs: [
        {
          question: 'Why does my grid look misaligned on my profile?',
          answer:
            'Usually the posts went up in the wrong order or in a different shape. Post the tiles in number order, and use the 3:4 shape so nothing is cut off in the profile view.',
        },
      ],
    },
  ],
});
