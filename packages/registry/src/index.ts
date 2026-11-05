import {
  CATEGORIES,
  CATEGORY_IDS,
  isCategoryId,
  type CategoryId,
  type ToolContent,
  type ToolManifest,
  type ToolVariant,
} from '@niftyfix/tool-sdk';
import { PLANNED_TOOLS, type PlannedTool } from './planned';
import type { SearchRecord } from './search';

export { PLANNED_TOOLS, type ExecutionMode, type PlannedTool } from './planned';

/** One tool as collected by the generated index (metadata and content only, never code). */
export interface ToolEntry {
  /** Directory under tools/, e.g. "forms/photo-resizer". */
  dir: string;
  manifest: ToolManifest;
  content: ToolContent;
}

export { queryTokens, searchRecords, type SearchRecord } from './search';

export interface Registry {
  readonly tools: readonly ToolEntry[];
  byId(id: string): ToolEntry | undefined;
  byPath(category: string, slug: string): ToolEntry | undefined;
  inCategory(category: CategoryId): readonly ToolEntry[];
  /** Categories that have at least one published tool, in canonical order. */
  activeCategories(): readonly CategoryId[];
  related(id: string): readonly ToolEntry[];
  /** Built tools, intent pages of live tools, and planned tools (unlinked), for site search. */
  searchIndex(): readonly SearchRecord[];
  /** Tools that may be indexed by search engines (status 'live'). */
  indexable(): readonly ToolEntry[];
  /**
   * Every tool in a category for its hub page: built tools in their roadmap
   * position, planned ones as "coming soon", built tools not on the roadmap last.
   */
  catalogue(category: CategoryId): readonly CatalogueItem[];
  /** Intent pages of live tools (variants of drafts and betas are not published). */
  variantPages(): readonly VariantPage[];
}

/** A search-intent page: a tool opened with a preset under its own URL. */
export interface VariantPage {
  entry: ToolEntry;
  variant: ToolVariant;
}

export type CatalogueItem =
  { kind: 'built'; entry: ToolEntry } | { kind: 'planned'; tool: PlannedTool };

export const toolPath = (manifest: Pick<ToolManifest, 'category' | 'slug'>): string =>
  `/${manifest.category}/${manifest.slug}/`;

export const variantPath = (
  manifest: Pick<ToolManifest, 'category'>,
  variant: Pick<ToolVariant, 'slug'>,
): string => `/${manifest.category}/${variant.slug}/`;

export const categoryPath = (category: CategoryId): string => `/${category}/`;

/** Published = visible on the site. Drafts are hidden; betas are visible but not indexed. */
export const isPublished = (entry: ToolEntry): boolean => entry.manifest.status !== 'draft';

export function createRegistry(
  entries: readonly ToolEntry[],
  planned: readonly PlannedTool[] = PLANNED_TOOLS,
): Registry {
  const tools = entries.filter(isPublished);
  const ids = new Map(tools.map((entry) => [entry.manifest.id, entry]));
  const paths = new Map(tools.map((entry) => [toolPath(entry.manifest), entry]));

  return {
    tools,
    byId: (id) => ids.get(id),
    byPath: (category, slug) => paths.get(`/${category}/${slug}/`),
    inCategory: (category) => tools.filter((entry) => entry.manifest.category === category),
    activeCategories: () =>
      CATEGORY_IDS.filter((id) => tools.some((entry) => entry.manifest.category === id)),
    related: (id) =>
      (ids.get(id)?.manifest.related ?? [])
        .map((relatedId) => ids.get(relatedId))
        .filter((entry): entry is ToolEntry => entry !== undefined),
    searchIndex: () => {
      const built = new Set(tools.map((entry) => toolPath(entry.manifest)));
      const terms = (...parts: readonly string[]): string => parts.join(' ').toLowerCase();
      return [
        ...tools.map(({ manifest }): SearchRecord => ({
          kind: 'tool',
          id: manifest.id,
          name: manifest.name,
          path: toolPath(manifest),
          category: CATEGORIES[manifest.category].name,
          terms: terms(manifest.name, manifest.tagline, ...manifest.searchAliases),
        })),
        ...tools
          .filter((entry) => entry.manifest.status === 'live')
          .flatMap(({ manifest, content }) =>
            (content.variants ?? []).map((variant): SearchRecord => ({
              kind: 'intent',
              id: `${manifest.id}/${variant.slug}`,
              name: variant.h1,
              path: variantPath(manifest, variant),
              category: manifest.name,
              terms: terms(
                variant.h1,
                variant.label,
                variant.slug.replaceAll('-', ' '),
                manifest.name,
              ),
            })),
          ),
        ...planned
          .filter((tool) => !built.has(`/${tool.category}/${tool.slug}/`))
          .map((tool): SearchRecord => ({
            kind: 'planned',
            id: `${tool.category}.${tool.slug}`,
            name: tool.name,
            category: CATEGORIES[tool.category].name,
            terms: terms(tool.name, tool.slug.replaceAll('-', ' '), CATEGORIES[tool.category].name),
          })),
      ];
    },
    indexable: () => tools.filter((entry) => entry.manifest.status === 'live'),
    catalogue: (category) => {
      const built = tools.filter((entry) => entry.manifest.category === category);
      const bySlug = new Map(built.map((entry) => [entry.manifest.slug, entry]));
      const items: CatalogueItem[] = planned
        .filter((tool) => tool.category === category)
        .map((tool) => {
          const entry = bySlug.get(tool.slug);
          return entry ? { kind: 'built', entry } : { kind: 'planned', tool };
        });
      const listed = new Set(items.flatMap((item) => (item.kind === 'built' ? [item.entry] : [])));
      for (const entry of built) if (!listed.has(entry)) items.push({ kind: 'built', entry });
      return items;
    },
    variantPages: () =>
      tools
        .filter((entry) => entry.manifest.status === 'live')
        .flatMap((entry) => (entry.content.variants ?? []).map((variant) => ({ entry, variant }))),
  };
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function checkSeo(
  where: string,
  { seoTitle, seoDescription }: { seoTitle: string; seoDescription: string },
): string[] {
  const problems: string[] = [];
  if (seoTitle.length > 65) problems.push(`${where} seoTitle is ${seoTitle.length} chars (max 65)`);
  if (seoDescription.length < 70 || seoDescription.length > 160)
    problems.push(`${where} seoDescription is ${seoDescription.length} chars (70–160)`);
  return problems;
}

/**
 * Build-time checks. Returns every problem found (empty array = valid) so CI
 * can print them all at once.
 */
export function validateEntries(entries: readonly ToolEntry[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const paths = new Set<string>();
  const allIds = new Set(entries.map((entry) => entry.manifest.id));

  for (const { dir, manifest: m, content: c } of entries) {
    const where = `[${dir}]`;
    if (!isCategoryId(m.category)) problems.push(`${where} unknown category "${m.category}"`);
    if (!SLUG.test(m.slug))
      problems.push(`${where} slug "${m.slug}" must be lowercase words joined by hyphens`);
    if (dir !== `${m.category}/${m.slug}`)
      problems.push(`${where} directory must be "${m.category}/${m.slug}"`);
    if (m.id !== `${m.category}.${m.slug}`)
      problems.push(`${where} id must be "${m.category}.${m.slug}"`);
    if (ids.has(m.id)) problems.push(`${where} duplicate id "${m.id}"`);
    ids.add(m.id);
    const path = toolPath(m);
    if (paths.has(path)) problems.push(`${where} duplicate route "${path}"`);
    paths.add(path);
    if (!(Number.isInteger(m.version) && m.version >= 1))
      problems.push(`${where} version must be a positive integer`);
    problems.push(...checkSeo(where, m));
    if (m.h1.trim() === '' || m.name.trim() === '' || m.tagline.trim() === '')
      problems.push(`${where} name, h1 and tagline are required`);
    if (m.input.kind === 'files') {
      if (m.input.formats.length === 0) problems.push(`${where} input.formats must not be empty`);
      if (m.input.maxBytes.mobile > m.input.maxBytes.desktop)
        problems.push(`${where} mobile size limit exceeds desktop limit`);
    }
    for (const relatedId of m.related) {
      if (relatedId === m.id) problems.push(`${where} lists itself as related`);
      else if (!allIds.has(relatedId))
        problems.push(`${where} related tool "${relatedId}" does not exist`);
    }
    if (c.intro.length < 80) problems.push(`${where} content.intro is too short to be useful`);
    if (c.howTo.length < 3) problems.push(`${where} content.howTo needs at least 3 steps`);
    if (c.limits.length < 1) problems.push(`${where} content.limits must state at least one limit`);
    if (c.faqs.length < 2)
      problems.push(`${where} content.faqs needs at least 2 tool-specific questions`);
    const titles = new Set([m.seoTitle]);
    for (const v of c.variants ?? []) {
      const at = `${where} variant "${v.slug}"`;
      if (!SLUG.test(v.slug)) problems.push(`${at} slug must be lowercase words joined by hyphens`);
      if (v.preset !== undefined && !SLUG.test(v.preset))
        problems.push(`${at} preset must be lowercase words joined by hyphens`);
      const variantRoute = variantPath(m, v);
      if (paths.has(variantRoute)) problems.push(`${at} duplicate route "${variantRoute}"`);
      paths.add(variantRoute);
      problems.push(...checkSeo(at, v));
      if (titles.has(v.seoTitle)) problems.push(`${at} seoTitle repeats another page's title`);
      titles.add(v.seoTitle);
      if (v.h1.trim() === '' || v.label.trim() === '')
        problems.push(`${at} h1 and label are required`);
      if (v.intro.length < 120)
        problems.push(`${at} intro is too short: say what is specific to this intent`);
    }
  }
  return problems;
}
