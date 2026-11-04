import type { APIRoute } from 'astro';
import { registry } from '../data/registry';

/** The site search index, fetched by the search box the first time it is used. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(registry.searchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
