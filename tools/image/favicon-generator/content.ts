import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'This favicon generator turns your logo, an SVG, or a letter or emoji into the complete set of icons a website needs today: favicon.ico (16, 32 and 48 px), PNG favicons, the 180 px Apple touch icon, 192 and 512 px Android icons, a padded maskable icon, an SVG favicon when you start from SVG or text, the site.webmanifest, and the HTML tags to paste into your page. You see how it looks in a browser tab and on phone home screens, and every file is checked before you download the ZIP.',
  howTo: [
    'Choose your logo (square, at least 512 px is best), or type a letter or emoji.',
    'Set padding, background and shape, and watch the previews.',
    'Add your site name and theme colour.',
    'Download favicons.zip, upload the files to your site root, and paste the HTML into <head>.',
  ],
  options: [
    {
      name: 'Padding',
      description:
        'Space around the artwork. Logos that touch the edges look cramped in tabs; 6 to 12% usually looks right.',
    },
    {
      name: 'Background and shape',
      description:
        'Transparent keeps your logo as it is. A colour with square, rounded or circle corners makes a solid app-style icon. The Apple and maskable icons always get a solid background, because iPhones show transparent areas as black and Android crops icons into its own shapes.',
    },
    {
      name: 'Name and theme colour',
      description:
        'Written into site.webmanifest and the theme-color tag: the name appears when your site is installed as an app, and the colour tints the browser bar on phones.',
    },
  ],
  example: {
    title: 'Example',
    input: 'logo.png, 1024 × 1024 px',
    settings: '8% padding, transparent background',
    output: 'favicons.zip with 10 files and the HTML tags',
  },
  limits: [
    'Detailed logos lose detail at 16 px; a simple mark or a single letter reads best in a tab.',
  ],
  faqs: [
    {
      question: 'Which favicon files do I really need?',
      answer:
        'favicon.ico for browsers and search engines that ask for it, an SVG or 32 px PNG for sharp tabs, the 180 px Apple touch icon for iPhones, and the manifest with 192 and 512 px icons for Android and installed apps. This tool makes all of them.',
    },
    {
      question: 'Where do I put the files?',
      answer:
        'In the root folder of your website (next to index.html), then paste the HTML tags into the <head> of every page. On WordPress, Shopify and similar, use the "site icon" setting and upload the 512 px PNG.',
    },
    {
      question: 'What is a maskable icon?',
      answer:
        'An Android icon with extra margin, so the phone can crop it into a circle, squircle or other shape without cutting off your logo. The preview shows it in a circle.',
    },
    {
      question: 'Can I convert PNG to ICO with this?',
      answer:
        'Yes. Choose the PNG and download: favicon.ico in the ZIP holds 16, 32 and 48 px versions, each stored as PNG with full transparency.',
    },
    {
      question: 'Is my logo uploaded?',
      answer:
        'No. Every icon is drawn in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
});
