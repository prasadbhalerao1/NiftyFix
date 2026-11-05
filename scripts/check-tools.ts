/**
 * CI gate for the tool catalogue. Fails on: missing tool files, a stale
 * generated registry, invalid manifests/content, metadata files importing
 * code, and invalid portal specifications.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateEntries, type ToolEntry } from '@niftyfix/registry';
import { PORTAL_SPECS, validatePortalSpecs } from '@niftyfix/portal-specs';
import {
  discoverToolDirs,
  GENERATED_FILE,
  renderRegistry,
  requiredFiles,
  TOOLS_DIR,
} from './lib/tools';

const problems: string[] = [];
const dirs = discoverToolDirs();

for (const dir of dirs) {
  for (const file of requiredFiles(dir)) {
    if (!existsSync(join(TOOLS_DIR, dir, file))) problems.push(`[${dir}] missing ${file}`);
  }
  // Metadata must stay importable by the static site without pulling in processing code.
  for (const file of ['manifest.ts', 'content.ts']) {
    const path = join(TOOLS_DIR, dir, file);
    if (!existsSync(path)) continue;
    const imports = [...readFileSync(path, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
      (m) => m[1],
    );
    for (const specifier of imports) {
      if (specifier !== '@niftyfix/tool-sdk')
        problems.push(`[${dir}] ${file} may only import @niftyfix/tool-sdk (found "${specifier}")`);
    }
  }
}

const expected = renderRegistry(dirs);
const actual = existsSync(GENERATED_FILE) ? readFileSync(GENERATED_FILE, 'utf8') : '';
if (actual !== expected)
  problems.push('tools/registry.generated.ts is out of date: run `pnpm registry`');

const { TOOL_ENTRIES } = (await import(pathToFileURL(GENERATED_FILE).href)) as {
  TOOL_ENTRIES: readonly ToolEntry[];
};
problems.push(...validateEntries(TOOL_ENTRIES));
problems.push(...validatePortalSpecs(PORTAL_SPECS));

// House style: no em dashes in anything we write or show (owner decision, 2026-11-05).
const SOURCE_ROOTS = [
  'apps/site/src',
  'apps/site/public',
  'apps/tool-frame/src',
  'tools',
  'packages',
  'scripts',
  'e2e',
];
const TEXT_FILE = /\.(ts|tsx|astro|js|css|html|json)$/;
const EM_DASH = String.fromCharCode(0x2014);
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'dist') return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : TEXT_FILE.test(entry.name) ? [path] : [];
  });
for (const file of SOURCE_ROOTS.filter((root) => existsSync(root)).flatMap(walk)) {
  if (readFileSync(file, 'utf8').includes(EM_DASH)) {
    problems.push(`${file} contains an em dash: use a comma, colon or parentheses`);
  }
}

if (problems.length > 0) {
  console.error(
    `check-tools found ${problems.length} problem(s):\n${problems.map((p) => `  ✗ ${p}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(
  `check-tools: ${dirs.length} tool(s), ${PORTAL_SPECS.length} portal spec(s), all checks passed`,
);
