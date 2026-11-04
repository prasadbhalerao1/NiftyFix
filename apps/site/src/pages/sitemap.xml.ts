import type { APIRoute } from 'astro';
import { categoryPath, toolPath, variantPath } from '@niftyfix/registry';
import { absoluteUrl, registry } from '../data/registry';

/** Only indexable pages: live tools and their intent pages, categories with a live tool, and evergreen pages. */
export const GET: APIRoute = () => {
  const live = registry.indexable();
  const categories = [...new Set(live.map((tool) => tool.manifest.category))];
  const paths = [
    '/',
    '/tools/',
    '/about/',
    '/security/',
    '/privacy-verification/',
    '/licenses/',
    ...categories.map(categoryPath),
    ...live.map((tool) => toolPath(tool.manifest)),
    ...registry.variantPages().map(({ entry, variant }) => variantPath(entry.manifest, variant)),
  ];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => `  <url><loc>${absoluteUrl(path)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
