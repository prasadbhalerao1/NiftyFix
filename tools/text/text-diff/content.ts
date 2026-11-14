import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Paste the original text on the left and the changed text on the right, or open two files: every added, removed and changed line is shown at once, side by side or as a unified diff, with the exact words that changed highlighted inside each line. Ignore case or spacing to hide differences that do not matter, compare JSON by its content regardless of key order, and download the result as a standard .patch file. Nothing is uploaded or saved, so it is safe for code, contracts and private notes.',
  howTo: [
    'Paste or open the original on the left and the changed version on the right.',
    'Read the result: green lines were added, red removed, and highlighted words changed.',
    'Turn on "Ignore case" or "Ignore spaces" if needed, or switch to JSON.',
    'Download a .patch file if you want to keep or apply the changes.',
  ],
  options: [
    {
      name: 'Side by side or unified',
      description:
        'Side by side shows both versions next to each other with line numbers. Unified shows one column with - and + lines, like git and code review tools.',
    },
    {
      name: 'Ignore case and spaces',
      description:
        'Treat "Hello" and "hello", or lines that differ only in indentation and spacing, as the same.',
    },
    {
      name: 'JSON',
      description:
        'Formats both sides and sorts their keys first, so only real differences in values and structure are shown.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Two versions of a price list',
    settings: 'Side by side',
    output: '"price: 100" changed to "price: 120" on line 2, with "100" and "120" highlighted',
  },
  limits: [
    'Very large texts with many changes fall back to a simpler line comparison to stay fast.',
  ],
  faqs: [
    {
      question: 'How do I compare two texts for differences?',
      answer:
        'Paste one into each box. Differences appear instantly: added lines in green, removed in red, and the changed words highlighted.',
    },
    {
      question: 'Is my text saved or shared?',
      answer:
        'No. Unlike sites that store comparisons on their servers, everything here happens in your browser and disappears when you close the page.',
    },
    {
      question: 'Can I compare JSON with keys in a different order?',
      answer:
        'Yes. Choose JSON: both sides are formatted with sorted keys, so reordered keys do not count as changes.',
    },
  ],
  variants: [
    {
      slug: 'json-diff',
      preset: 'json',
      label: 'JSON diff',
      h1: 'JSON diff: compare two JSON documents',
      seoTitle: 'JSON Diff: compare two JSON files online, free | NiftyFix',
      seoDescription:
        'Compare two JSON documents by content: keys are sorted and formatted first, so only real changes in values and structure show. Private, free.',
      intro:
        'Paste two JSON documents, such as API responses or config files. Both are formatted and their keys sorted, so the comparison shows only real changes: values that differ, keys added or removed, and items in arrays. Invalid JSON is pointed out with the parser’s message.',
      faqs: [
        {
          question: 'How do I compare two JSON files online?',
          answer:
            'Paste or open the two files, one on each side. Both are formatted and their keys sorted first, so only real differences show: changed values, added or removed keys, and changed array items.',
        },
      ],
    },
  ],
});
