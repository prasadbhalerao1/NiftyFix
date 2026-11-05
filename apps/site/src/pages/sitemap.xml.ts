import type { APIRoute } from 'astro';
import { categoryPath, toolPath, variantPath } from '@niftyfix/registry';
import { absoluteUrl, registry } from '../data/registry';
import { lastChanged, newest } from '../seo/lastmod';

/** Evergreen pages and the source file each is built from. */
const PAGES: readonly [path: string, file: string][] = [
  ['/about/', 'about.astro'],
  ['/contact/', 'contact.astro'],
  ['/privacy/', 'privacy.astro'],
  ['/terms/', 'terms.astro'],
  ['/security/', 'security.astro'],
  ['/privacy-verification/', 'privacy-verification.astro'],
  ['/licenses/', 'licenses.astro'],
];

/**
 * Only indexable pages: live tools and their intent pages, categories with a
 * live tool, and evergreen pages. Each carries its last real change, so
 * search engines can find new and updated tools first.
 */
export const GET: APIRoute = () => {
  const live = registry.indexable();
  const toolDate = new Map(
    live.map((tool) => [tool.manifest.id, lastChanged([`tools/${tool.dir}`])] as const),
  );
  const allTools = newest([...toolDate.values()]);
  const categories = [...new Set(live.map((tool) => tool.manifest.category))];

  const toolLastmod = (id: string): string | null => toolDate.get(id) ?? null;
  const url = (path: string, lastmod: string | null) => ({ path, lastmod });

  const urls = [
    url('/', newest([allTools, lastChanged(['apps/site/src/pages/index.astro'])])),
    url('/tools/', allTools),
    ...PAGES.map(([path, file]) => url(path, lastChanged([`apps/site/src/pages/${file}`]))),
    ...categories.map((category) =>
      url(
        categoryPath(category),
        newest(
          live
            .filter((tool) => tool.manifest.category === category)
            .map((tool) => toolLastmod(tool.manifest.id)),
        ),
      ),
    ),
    ...live.map((tool) => url(toolPath(tool.manifest), toolLastmod(tool.manifest.id))),
    ...registry
      .variantPages()
      .map(({ entry, variant }) =>
        url(variantPath(entry.manifest, variant), toolLastmod(entry.manifest.id)),
      ),
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      ({ path, lastmod }) =>
        `  <url><loc>${absoluteUrl(path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
