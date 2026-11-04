import { describe, expect, it } from 'vitest';
import type { ToolContent, ToolManifest, ToolVariant } from '@niftyfix/tool-sdk';
import { CATEGORY_IDS, isCategoryId } from '@niftyfix/tool-sdk';
import {
  createRegistry,
  PLANNED_TOOLS,
  toolPath,
  validateEntries,
  variantPath,
  type ToolEntry,
} from '../src';

const content: ToolContent = {
  intro:
    'A sufficiently long introduction that explains what this specific tool does for the user and why.',
  howTo: ['One', 'Two', 'Three'],
  options: [],
  limits: ['A limit'],
  faqs: [
    { question: 'Q1', answer: 'A1' },
    { question: 'Q2', answer: 'A2' },
  ],
};

function entry(
  category: ToolManifest['category'],
  slug: string,
  overrides: Partial<ToolManifest> = {},
): ToolEntry {
  return {
    dir: `${category}/${slug}`,
    content,
    manifest: {
      id: `${category}.${slug}`,
      version: 1,
      slug,
      category,
      status: 'live',
      name: slug,
      h1: slug,
      tagline: 'Tagline',
      seoTitle: `${slug} | NiftyFix`,
      seoDescription:
        'A description that is long enough to satisfy the minimum length rule for meta tags.',
      searchAliases: ['alias phrase'],
      input: { kind: 'files', formats: ['jpeg'], maxBytes: { mobile: 1, desktop: 2 }, maxFiles: 1 },
      output: { formats: ['jpeg'] },
      execution: 'browser',
      privacy: 'on-device',
      engine: 'image',
      capabilities: {
        batch: false,
        cancellable: true,
        progress: 'determinate',
        verifiesOutput: true,
      },
      related: [],
      ...overrides,
    },
  };
}

const variant = (slug: string, overrides: Partial<ToolVariant> = {}): ToolVariant => ({
  slug,
  preset: 'target-200kb',
  label: '200 KB',
  h1: `${slug} heading`,
  seoTitle: `${slug} | NiftyFix`,
  seoDescription:
    'A description that is long enough to satisfy the minimum length rule for meta tags.',
  intro:
    'An introduction written for this intent: what the target means, who asks for it, and how the tool reaches it without losing readability.',
  ...overrides,
});

const withVariants = (base: ToolEntry, variants: ToolVariant[]): ToolEntry => ({
  ...base,
  content: { ...base.content, variants },
});

describe('validateEntries', () => {
  it('accepts consistent entries', () => {
    expect(
      validateEntries([
        entry('image', 'compress-image'),
        entry('forms', 'photo-resizer', { related: ['image.compress-image'] }),
      ]),
    ).toEqual([]);
  });

  it('reports duplicates, broken relations, bad slugs and directory mismatches', () => {
    const problems = validateEntries([
      entry('image', 'compress-image'),
      entry('image', 'compress-image'),
      entry('forms', 'Bad_Slug'),
      {
        ...entry('pdf', 'merge-pdf', { related: ['pdf.nope', 'pdf.merge-pdf'] }),
        dir: 'pdf/merge',
      },
    ]);
    expect(problems.join('\n')).toMatch(/duplicate id "image.compress-image"/);
    expect(problems.join('\n')).toMatch(/duplicate route/);
    expect(problems.join('\n')).toMatch(/slug "Bad_Slug"/);
    expect(problems.join('\n')).toMatch(/directory must be "pdf\/merge-pdf"/);
    expect(problems.join('\n')).toMatch(/related tool "pdf.nope" does not exist/);
    expect(problems.join('\n')).toMatch(/lists itself as related/);
  });

  it('enforces SEO and content quality minimums', () => {
    const thin = {
      ...entry('text', 'word-counter', { seoTitle: 'x'.repeat(70), seoDescription: 'short' }),
      content: { ...content, faqs: [], intro: 'Too short.' },
    };
    const problems = validateEntries([thin]).join('\n');
    expect(problems).toMatch(/seoTitle/);
    expect(problems).toMatch(/seoDescription/);
    expect(problems).toMatch(/faqs/);
    expect(problems).toMatch(/intro/);
  });
});

describe('variant validation', () => {
  it('accepts distinct intent pages', () => {
    const tool = withVariants(entry('pdf', 'compress-pdf'), [variant('compress-pdf-to-200kb')]);
    expect(validateEntries([tool])).toEqual([]);
  });

  it('rejects routes taken by a tool or another variant, in either order', () => {
    const tool = withVariants(entry('pdf', 'compress-pdf'), [
      variant('merge-pdf'),
      variant('compress-pdf-to-200kb'),
      variant('compress-pdf-to-200kb', { seoTitle: 'Other title | NiftyFix' }),
    ]);
    const before = validateEntries([entry('pdf', 'merge-pdf'), tool]).join('\n');
    const after = validateEntries([tool, entry('pdf', 'merge-pdf')]).join('\n');
    expect(before).toMatch(/variant "merge-pdf" duplicate route/);
    expect(before).toMatch(/variant "compress-pdf-to-200kb" duplicate route/);
    expect(after).toMatch(/duplicate route "\/pdf\/merge-pdf\/"/);
  });

  it('enforces SEO, unique titles, presets and a substantive intro', () => {
    const tool = withVariants(entry('pdf', 'compress-pdf'), [
      variant('a-page', {
        seoTitle: 'compress-pdf | NiftyFix',
        intro: 'Thin.',
        preset: 'Bad Preset',
      }),
    ]);
    const problems = validateEntries([tool]).join('\n');
    expect(problems).toMatch(/repeats another page's title/);
    expect(problems).toMatch(/intro is too short/);
    expect(problems).toMatch(/preset must be/);
  });

  it('publishes variants of live tools only', () => {
    const registry = createRegistry([
      withVariants(entry('pdf', 'compress-pdf'), [variant('compress-pdf-to-200kb')]),
      withVariants(entry('pdf', 'crop-pdf', { status: 'beta' }), [variant('resize-pdf-to-a4')]),
    ]);
    const pages = registry.variantPages();
    expect(pages.map((p) => variantPath(p.entry.manifest, p.variant))).toEqual([
      '/pdf/compress-pdf-to-200kb/',
    ]);
  });
});

describe('createRegistry', () => {
  const registry = createRegistry([
    entry('forms', 'photo-resizer', { status: 'beta', related: ['image.compress-image'] }),
    entry('image', 'compress-image'),
    entry('pdf', 'merge-pdf', { status: 'draft' }),
  ]);

  it('hides drafts and indexes only live tools', () => {
    expect(registry.tools.map((t) => t.manifest.id)).toEqual([
      'forms.photo-resizer',
      'image.compress-image',
    ]);
    expect(registry.indexable().map((t) => t.manifest.id)).toEqual(['image.compress-image']);
    expect(registry.byId('pdf.merge-pdf')).toBeUndefined();
  });

  it('looks up by path and category, and lists active categories in order', () => {
    expect(registry.byPath('forms', 'photo-resizer')?.manifest.id).toBe('forms.photo-resizer');
    expect(registry.inCategory('image')).toHaveLength(1);
    expect(registry.activeCategories()).toEqual(['forms', 'image']);
  });

  it('resolves related tools and builds a search index', () => {
    expect(registry.related('forms.photo-resizer').map((t) => t.manifest.id)).toEqual([
      'image.compress-image',
    ]);
    const record = registry.searchIndex().find((r) => r.id === 'forms.photo-resizer');
    expect(record).toMatchObject({ path: '/forms/photo-resizer/', category: 'Form-ready' });
    expect(record?.terms).toContain('alias phrase');
  });

  it('builds canonical paths with trailing slashes', () => {
    expect(toolPath({ category: 'pdf', slug: 'merge-pdf' })).toBe('/pdf/merge-pdf/');
  });
});

describe('catalogue', () => {
  const planned = [
    { category: 'pdf' as const, slug: 'merge-pdf', name: 'Merge PDF', mode: 'browser' as const },
    { category: 'pdf' as const, slug: 'split-pdf', name: 'Split PDF', mode: 'browser' as const },
  ];

  it('places built tools in roadmap order and keeps the rest as planned', () => {
    const registry = createRegistry(
      [entry('pdf', 'split-pdf'), entry('pdf', 'extra-tool')],
      planned,
    );
    const items = registry.catalogue('pdf');
    expect(items.map((item) => item.kind)).toEqual(['planned', 'built', 'built']);
    expect(items[1]?.kind === 'built' && items[1].entry.manifest.slug).toBe('split-pdf');
    expect(items[2]?.kind === 'built' && items[2].entry.manifest.slug).toBe('extra-tool');
  });

  it('never lists a draft tool as built', () => {
    const registry = createRegistry([entry('pdf', 'merge-pdf', { status: 'draft' })], planned);
    expect(registry.catalogue('pdf')[0]?.kind).toBe('planned');
  });

  it('roadmap has no duplicate tools: every slug and every name appears once', () => {
    const slugs = new Map<string, string>();
    const names = new Map<string, string>();
    for (const tool of PLANNED_TOOLS) {
      const where = `${tool.category}/${tool.slug}`;
      // Unique across categories, not just within one: two pages for the same
      // job would compete with each other in search.
      expect(slugs.get(tool.slug), `slug "${tool.slug}" in ${where}`).toBeUndefined();
      slugs.set(tool.slug, where);
      const name = tool.name.toLowerCase();
      expect(names.get(name), `name "${tool.name}" in ${where}`).toBeUndefined();
      names.set(name, where);
      expect(tool.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(isCategoryId(tool.category)).toBe(true);
    }
  });

  it('every category has at least one tool', () => {
    for (const id of CATEGORY_IDS) {
      expect(
        PLANNED_TOOLS.some((tool) => tool.category === id),
        id,
      ).toBe(true);
    }
  });
});
