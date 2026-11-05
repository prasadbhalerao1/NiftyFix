import type { APIRoute } from 'astro';
import { toolPath, variantPath } from '@niftyfix/registry';
import { CATEGORIES, FILE_FORMATS } from '@niftyfix/tool-sdk';
import { absoluteUrl, registry, SITE_NAME } from '../data/registry';

/**
 * /llms-full.txt: the full text of every live tool page in one Markdown file,
 * so an AI assistant can read what each tool does, how to use it and its
 * limits in a single fetch. Generated from the same content as the pages.
 */
export const GET: APIRoute = () => {
  const lines: string[] = [
    `# ${SITE_NAME}: full tool reference`,
    '',
    `> ${SITE_NAME} (${absoluteUrl('/')}) is a free website of file tools for photos, images, signatures and PDFs. Every tool runs in the browser, so files are processed on the user's device and never uploaded. There is no sign-up, no daily limit and no watermark. Each tool checks the file it produced (for example pixel size, KB size and format) and reports every requirement as passed or failed. Built for Indian application, exam and government portals, and usable anywhere.`,
    '',
    `Short index: ${absoluteUrl('/llms.txt')}`,
    '',
  ];

  for (const category of registry.activeCategories()) {
    lines.push(`## ${CATEGORIES[category].h1}`, '');
    for (const { manifest, content } of registry
      .indexable()
      .filter((entry) => entry.manifest.category === category)) {
      const formats = (ids: readonly (keyof typeof FILE_FORMATS)[]): string =>
        ids.map((id) => FILE_FORMATS[id].label).join(', ');
      lines.push(
        `### ${manifest.name}`,
        '',
        `URL: ${absoluteUrl(toolPath(manifest))}`,
        '',
        manifest.tagline,
        '',
        content.intro,
        '',
        ...(manifest.input.kind === 'files'
          ? [
              `Accepts: ${formats(manifest.input.formats)}. Produces: ${formats(manifest.output.formats)}.`,
              '',
            ]
          : []),
        'How to use it:',
        ...content.howTo.map((step, index) => `${index + 1}. ${step}`),
        '',
        'Options:',
        ...content.options.map((option) => `- ${option.name}: ${option.description}`),
        '',
        'Limits:',
        ...content.limits.map((limit) => `- ${limit}`),
        '',
      );
      const variants = content.variants ?? [];
      if (variants.length > 0) {
        lines.push(
          'Ready-made pages:',
          ...variants.map(
            (variant) =>
              `- ${variant.h1}: ${absoluteUrl(variantPath(manifest, variant))}. ${variant.intro}`,
          ),
          '',
        );
      }
      const faqs = [...content.faqs, ...variants.flatMap((variant) => variant.faqs ?? [])];
      if (faqs.length > 0) {
        lines.push(
          'Questions:',
          ...faqs.flatMap((faq) => [`- Q: ${faq.question}`, `  A: ${faq.answer}`]),
          '',
        );
      }
    }
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
