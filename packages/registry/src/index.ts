import {
  CATEGORIES,
  CATEGORY_IDS,
  isCategoryId,
  type CategoryId,
  type ToolContent,
  type ToolManifest,
} from '@niftyfix/tool-sdk';

/** One tool as collected by the generated index (metadata and content only — never code). */
export interface ToolEntry {
  /** Directory under tools/, e.g. "forms/photo-resizer". */
  dir: string;
  manifest: ToolManifest;
  content: ToolContent;
}

export interface SearchRecord {
  id: string;
  name: string;
  path: string;
  category: string;
  terms: string;
}

export interface Registry {
  readonly tools: readonly ToolEntry[];
  byId(id: string): ToolEntry | undefined;
  byPath(category: string, slug: string): ToolEntry | undefined;
  inCategory(category: CategoryId): readonly ToolEntry[];
  /** Categories that have at least one published tool, in canonical order. */
  activeCategories(): readonly CategoryId[];
  related(id: string): readonly ToolEntry[];
  searchIndex(): readonly SearchRecord[];
  /** Tools that may be indexed by search engines (status 'live'). */
  indexable(): readonly ToolEntry[];
}

export const toolPath = (manifest: Pick<ToolManifest, 'category' | 'slug'>): string =>
  `/${manifest.category}/${manifest.slug}/`;

export const categoryPath = (category: CategoryId): string => `/${category}/`;

/** Published = visible on the site. Drafts are hidden; betas are visible but not indexed. */
export const isPublished = (entry: ToolEntry): boolean => entry.manifest.status !== 'draft';

export function createRegistry(entries: readonly ToolEntry[]): Registry {
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
    searchIndex: () =>
      tools.map(({ manifest }) => ({
        id: manifest.id,
        name: manifest.name,
        path: toolPath(manifest),
        category: CATEGORIES[manifest.category].name,
        terms: [manifest.name, manifest.tagline, ...manifest.searchAliases].join(' ').toLowerCase(),
      })),
    indexable: () => tools.filter((entry) => entry.manifest.status === 'live'),
  };
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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
    if (m.seoTitle.length > 65)
      problems.push(`${where} seoTitle is ${m.seoTitle.length} chars (max 65)`);
    if (m.seoDescription.length < 70 || m.seoDescription.length > 160) {
      problems.push(`${where} seoDescription is ${m.seoDescription.length} chars (70–160)`);
    }
    if (m.h1.trim() === '' || m.name.trim() === '' || m.tagline.trim() === '')
      problems.push(`${where} name, h1 and tagline are required`);
    if (m.input.formats.length === 0) problems.push(`${where} input.formats must not be empty`);
    if (m.input.maxBytes.mobile > m.input.maxBytes.desktop)
      problems.push(`${where} mobile size limit exceeds desktop limit`);
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
  }
  return problems;
}
