/**
 * Scaffold a new tool:  pnpm new-tool <category> <slug> "<Tool name>"
 * Creates tools/<category>/<slug>/ with a manifest, content, processor and UI,
 * then regenerates the registry. No other file needs editing.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORY_IDS, isCategoryId } from '@niftyfix/tool-sdk';
import { TOOLS_DIR, writeRegistry } from './lib/tools';

const [category, slug, name] = process.argv.slice(2);

function fail(message: string): never {
  console.error(
    `${message}\nUsage: pnpm new-tool <category> <slug> "<Tool name>"\nCategories: ${CATEGORY_IDS.join(', ')}`,
  );
  process.exit(1);
}

if (!category || !slug || !name) fail('Missing arguments.');
if (!isCategoryId(category)) fail(`Unknown category "${category}".`);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
  fail(`Slug "${slug}" must be lowercase words joined by hyphens.`);
const dir = join(TOOLS_DIR, category, slug);
if (existsSync(dir)) fail(`tools/${category}/${slug} already exists.`);

const files: Record<string, string> = {
  'manifest.ts': `import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: '${category}.${slug}',
  version: 1,
  slug: '${slug}',
  category: '${category}',
  status: 'draft',
  name: '${name}',
  h1: '${name}',
  tagline: 'TODO: one sentence describing the outcome this tool produces.',
  seoTitle: '${name} | NiftyFix',
  seoDescription: 'TODO: 70–160 characters describing exactly what this tool does and where it runs.',
  searchAliases: [],
  input: { kind: 'files', formats: ['jpeg'], maxBytes: { mobile: 30_000_000, desktop: 60_000_000 }, maxFiles: 1 },
  output: { formats: ['jpeg'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: [],
});
`,
  'content.ts': `import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro: '',
  howTo: [],
  options: [],
  limits: [],
  faqs: [],
});
`,
  'processor.ts': `import * as v from 'valibot';
import { defineProcessor, ToolError } from '@niftyfix/tool-sdk';

export default defineProcessor({
  options: v.object({}),
  async run() {
    throw new ToolError('UNKNOWN', 'This tool is not implemented yet.');
  },
});
`,
  'ui.tsx': `import { Dropzone, type ToolUiProps } from '@niftyfix/ui';

export default function Tool({ manifest }: ToolUiProps) {
  return <Dropzone accept="" title={manifest.name} detail="" onFiles={() => undefined} />;
}
`,
};

mkdirSync(dir, { recursive: true });
for (const [file, source] of Object.entries(files)) writeFileSync(join(dir, file), source);
writeRegistry();
console.log(`Created tools/${category}/${slug} (status: draft, hidden from the site).
Next: implement processor.ts and ui.tsx, write content.ts, add tests, then run \`pnpm check:tools\`.`);
