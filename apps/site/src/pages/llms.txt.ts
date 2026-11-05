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
    '> Free online tools that prepare photos, signatures and PDFs to meet exact upload requirements (pixel size, KB range, format), then verify the result. Every tool runs in the browser: files are never uploaded. Built for Indian application, exam and government portals, and usable anywhere.',
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
