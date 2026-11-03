import type { APIRoute } from 'astro';
import { categoryPath, toolPath } from '@niftyfix/registry';
import { absoluteUrl, registry } from '../data/registry';

/** Only indexable pages: live tools, categories with a live tool, and evergreen pages. */
export const GET: APIRoute = () => {
  const live = registry.indexable();
  const categories = [...new Set(live.map((tool) => tool.manifest.category))];
  const paths = [
    '/',
    '/about/',
    '/security/',
    '/privacy-verification/',
    '/licenses/',
    ...categories.map(categoryPath),
    ...live.map((tool) => toolPath(tool.manifest)),
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
