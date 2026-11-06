import type { APIRoute } from 'astro';
import { toolPath, variantPath } from '@niftyfix/registry';
import { CATEGORIES } from '@niftyfix/tool-sdk';
import { absoluteUrl, registry, SITE_NAME } from '../data/registry';

/**
 * /llms.txt (llmstxt.org): a plain-text map of the site for AI assistants,
 * generated from the registry so it always matches the live tools.
 */
export const GET: APIRoute = () => {
  const live = registry.indexable();
  const lines = [
    `# ${SITE_NAME}`,
    '',
    '> Free online tools for photos, images, signatures and PDFs: compress to a KB limit, resize, convert, crop, merge, split and more, then verify the result. Every tool runs in the browser: files are never uploaded. Built for Indian application, exam and government portals, and usable anywhere.',
    '',
    'Key facts:',
    '',
    '- Free, with no sign-up, no daily limit and no watermark added.',
    "- Files are processed on the user's device inside the browser and never sent to a server.",
    '- Each tool checks the file it produced (pixel size, KB size, format) and reports every requirement as passed or failed.',
    '- Size-target pages such as "compress image to 50 KB" or "compress PDF to 200 KB" open with that limit already set.',
    '- Works on phones and computers in current Chrome, Edge, Firefox and Safari.',
    '',
    `Full text of every tool page (how to use, options, limits, FAQs): ${absoluteUrl('/llms-full.txt')}`,
    '',
    ...registry
      .activeCategories()
      .flatMap((id) => [
        `## ${CATEGORIES[id].h1}`,
        '',
        ...live
          .filter((entry) => entry.manifest.category === id)
          .map(
            ({ manifest }) =>
              `- [${manifest.name}](${absoluteUrl(toolPath(manifest))}): ${manifest.tagline}`,
          ),
        '',
      ]),
    '## Ready-made presets',
    '',
    ...registry
      .variantPages()
      .map(
        ({ entry, variant }) =>
          `- [${variant.h1}](${absoluteUrl(variantPath(entry.manifest, variant))})`,
      ),
    '',
    '## About',
    '',
    `- [All tools](${absoluteUrl('/tools/')}): the full catalogue, including planned tools`,
    `- [Photo and signature size for exam forms (UPSC, SSC, NEET, IBPS), from official notices](${absoluteUrl('/exam-photo-signature-size/')})`,
    `- [How to verify our privacy](${absoluteUrl('/privacy-verification/')})`,
    `- [About](${absoluteUrl('/about/')})`,
    `- [Privacy policy](${absoluteUrl('/privacy/')})`,
    `- [Terms of use](${absoluteUrl('/terms/')})`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
