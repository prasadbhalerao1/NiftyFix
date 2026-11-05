/**
 * Performance budgets measured on production build output (gzip sizes).
 * Budgets come from docs/research/F-performance-architecture.md. Raising one
 * requires a recorded decision. Run after `pnpm build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { discoverToolDirs, isInteractive, ROOT } from './lib/tools';

const KB = 1000;
const BUDGETS = {
  sitePageJs: 15 * KB,
  siteCss: 15 * KB,
  frameShell: 50 * KB,
  toolUi: 35 * KB,
  toolProcessor: 80 * KB,
};
/**
 * Processors built on a heavyweight engine get their own, explicit ceiling
 * instead of a raised general one (ADR 0005). Keyed by tool category.
 * PDF: @cantoo/pdf-lib is ~240 kB gzip; it loads in the worker, is cached
 * across every PDF tool and is preloaded when files are chosen. Raised from
 * 260 to 270 kB (Nov 2026): JPG to PDF also bundles the shared image helpers,
 * which grew with the image tools.
 */
const ENGINE_PROCESSOR_BUDGETS: Record<string, number> = {
  pdf: 270 * KB,
};
/**
 * Processors that render PDF pages load pdf.js (display layer ~129 kB + parser
 * ~366 kB gzip), detected from the bundle itself (ADR 0005). Worker-side only,
 * cached across tools, preloaded when a file is chosen.
 */
const PDF_RENDER_PROCESSOR_BUDGET = 520 * KB;
/** Chunks that bring pdf.js: the library itself, or the engine modules it is bundled into. */
const USES_PDFJS = /pdfjs-dist|engines\/pdf\/src\/(render|preview)\.ts/;
/** UIs that show page thumbnails load the pdf.js display layer (its parser runs in its own worker file). */
const PDF_PREVIEW_UI_BUDGET = 180 * KB;
/** Strings that only appear in processing code; none may reach a site page. */
const ENGINE_MARKERS = ['convertToBlob', 'createImageBitmap', 'OffscreenCanvas'];

const SITE = join(ROOT, 'apps/site/dist');
const FRAME = join(ROOT, 'apps/tool-frame/dist');
const problems: string[] = [];
const rows: [string, number, number][] = [];

const gz = (path: string): number => gzipSync(readFileSync(path)).length;
function measure(label: string, bytes: number, budget: number): void {
  rows.push([label, bytes, budget]);
  if (bytes > budget) problems.push(`${label}: ${bytes} B gzip exceeds budget ${budget} B`);
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

if (!existsSync(SITE) || !existsSync(FRAME)) {
  console.error('Build output missing. Run `pnpm build` first.');
  process.exit(1);
}

// Site: JavaScript referenced by each page, and no processing code anywhere.
for (const page of htmlFiles(SITE)) {
  const html = readFileSync(page, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => m[1] ?? '')
    .filter(
      (src) => !src.startsWith('https://') && !src.startsWith('http://') && !src.startsWith('//'),
    )
    .map((src) => join(SITE, src));
  const total = scripts.reduce((sum, script) => sum + gz(script), 0);
  measure(`site ${relative(SITE, page).replaceAll('\\', '/')} JS`, total, BUDGETS.sitePageJs);
  for (const script of scripts) {
    const source = readFileSync(script, 'utf8');
    for (const marker of ENGINE_MARKERS) {
      if (source.includes(marker))
        problems.push(
          `site script ${relative(SITE, script)} contains processing code ("${marker}")`,
        );
    }
  }
}
for (const css of readdirSync(join(SITE, '_astro')).filter((name) => name.endsWith('.css'))) {
  measure(`site ${css}`, gz(join(SITE, '_astro', css)), BUDGETS.siteCss);
}

// Frame: shell (entry + its static imports + CSS), then each tool's lazy chunks.
interface Chunk {
  file: string;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
  isEntry?: boolean;
}
const manifest = JSON.parse(readFileSync(join(FRAME, '.vite/manifest.json'), 'utf8')) as Record<
  string,
  Chunk
>;
/**
 * Chunks a key loads. With dynamic, an engine's own lazy imports count too
 * (e.g. the pdf.js parser, awaited on every run). Lazy imports of other tools
 * (the loader maps in tools/loaders.ts) are navigation, not cost, and are skipped.
 */
const ENGINE_LAZY = /(^|\/)(node_modules|packages\/engines)\//;
const closure = (key: string, dynamic = false, seen = new Set<string>()): Set<string> => {
  const chunk = manifest[key];
  if (!chunk || seen.has(key)) return seen;
  seen.add(key);
  for (const dependency of chunk.imports ?? []) closure(dependency, dynamic, seen);
  if (dynamic) {
    for (const dependency of chunk.dynamicImports ?? []) {
      if (ENGINE_LAZY.test(dependency)) closure(dependency, dynamic, seen);
    }
  }
  return seen;
};
const size = (keys: Iterable<string>, exclude = new Set<string>()): number => {
  let total = 0;
  for (const key of keys) {
    if (exclude.has(key)) continue;
    const chunk = manifest[key];
    if (!chunk) continue;
    total += gz(join(FRAME, chunk.file));
    for (const css of chunk.css ?? []) total += gz(join(FRAME, css));
  }
  return total;
};

const entryKey = Object.keys(manifest).find((key) => manifest[key]?.isEntry);
if (!entryKey) throw new Error('No entry in frame manifest');
const shell = closure(entryKey);
measure('frame shell (entry + CSS)', size(shell), BUDGETS.frameShell);

for (const dir of discoverToolDirs()) {
  const ui = `../../tools/${dir}/ui.tsx`;
  const processor = `../../tools/${dir}/processor.ts`;
  if (manifest[ui]) {
    // Engine chunks a UI loads lazily (pdf.js for page previews) are real cost too.
    const keys = closure(ui, true);
    measure(
      `tool ${dir} UI (lazy)`,
      size(keys, shell),
      [...keys].some((key) => USES_PDFJS.test(key)) ? PDF_PREVIEW_UI_BUDGET : BUDGETS.toolUi,
    );
  } else problems.push(`tool ${dir}: ui.tsx not found in frame build manifest`);
  // The worker bundles the same processor separately; the lazily loaded copy is a faithful size proxy.
  if (manifest[processor])
    measure(
      `tool ${dir} processor (lazy)`,
      size(closure(processor, true), shell),
      [...closure(processor, true)].some((key) => USES_PDFJS.test(key))
        ? PDF_RENDER_PROCESSOR_BUDGET
        : (ENGINE_PROCESSOR_BUDGETS[dir.split('/')[0] ?? ''] ?? BUDGETS.toolProcessor),
    );
  else if (!isInteractive(dir))
    problems.push(`tool ${dir}: processor.ts not found in frame build manifest`);
}

const pad = (text: string, width: number): string => text.padEnd(width);
console.log(`${pad('Budget item', 52)} ${pad('gzip', 10)} budget`);
for (const [label, bytes, budget] of rows) {
  console.log(
    `${pad(label, 52)} ${pad(`${(bytes / KB).toFixed(1)} kB`, 10)} ${(budget / KB).toFixed(0)} kB${bytes > budget ? '  ✗' : ''}`,
  );
}
if (problems.length > 0) {
  console.error(
    `\n${problems.length} budget problem(s):\n${problems.map((p) => `  ✗ ${p}`).join('\n')}`,
  );
  process.exit(1);
}
console.log('\nAll performance budgets met.');
