import { describe, expect, it } from 'vitest';
import type { ToolContent, ToolManifest } from '@niftyfix/tool-sdk';
import { createRegistry, toolPath, validateEntries, type ToolEntry } from '../src';

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
