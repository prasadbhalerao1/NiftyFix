/**
 * Architectural boundaries (docs/research/J-folder-structure.md). Run in CI:
 * `pnpm check:boundaries`. Paths are repo-relative after workspace resolution.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make load order and lazy loading unpredictable.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'tool-sdk-is-a-leaf',
      severity: 'error',
      comment: 'The SDK defines contracts only; it must not depend on other workspace code.',
      from: { path: '^packages/tool-sdk/' },
      to: { path: '^(packages/(?!tool-sdk/)|apps/|tools/)' },
    },
    {
      name: 'shared-packages-never-import-tools-or-apps',
      severity: 'error',
      comment: 'Shared packages must not depend on individual tools or applications.',
      from: { path: '^packages/' },
      to: { path: '^(tools/|apps/)' },
    },
    {
      name: 'engines-never-import-ui-or-runtime',
      severity: 'error',
      from: { path: '^packages/engines/' },
      to: { path: '^packages/(ui|runtime|registry)/' },
    },
    {
      name: 'metadata-imports-sdk-only',
      severity: 'error',
      comment:
        'Manifests and content are imported by the static site; they must never pull in processing code.',
      from: { path: '^tools/[^/]+/[^/]+/(manifest|content)\\.ts$' },
      to: { path: '^(?!packages/tool-sdk/)', pathNot: '^node_modules/' },
    },
    {
      name: 'tools-are-independent',
      severity: 'error',
      comment: 'A tool may not import another tool. Share code through packages/.',
      from: { path: '^tools/([^/]+/[^/]+)/' },
      to: { path: '^tools/[^/]+/[^/]+/', pathNot: '^tools/$1/' },
    },
    {
      name: 'site-never-loads-processing-code',
      severity: 'error',
      comment:
        'The static site may read tool metadata only — never engines, runtime, processors or tool UIs.',
      from: { path: '^apps/site/' },
      to: {
        path: '^(packages/(engines|runtime|constraints)/|tools/[^/]+/[^/]+/(processor|ui|options|settings)\\.tsx?$|tools/loaders\\.ts$)',
      },
    },
    {
      name: 'processors-never-import-ui',
      severity: 'error',
      from: { path: '^tools/[^/]+/[^/]+/processor\\.ts$' },
      to: { path: '^(packages/ui/|tools/[^/]+/[^/]+/ui\\.tsx$|node_modules/preact)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|\\.astro|test|e2e)/|\\.test\\.ts$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.mjs'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
