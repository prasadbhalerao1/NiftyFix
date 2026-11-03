# NiftyFix

Upload-ready file tools: produce the exact file a form or app requires — right pixels, right size range, right format — and **verify** it. Files are processed on the user's device inside an isolated frame.

Status: platform foundation + first flagship tool (**Form Photo Resizer**, beta). See [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

## Quick start

Requirements: Node ≥ 22.12 (≥ 22.23.4 for the planned Astro 7 upgrade), pnpm 10.

```sh
pnpm install
pnpm dev            # site → http://localhost:4321, tool frame → http://127.0.0.1:4322
```

Open http://localhost:4321/forms/photo-resizer/.

## Commands

| Command                                    | What it does                                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                 | Site and tool frame dev servers (two origins)                                                                              |
| `pnpm build`                               | Production builds + Cloudflare `_headers` for both apps                                                                    |
| `pnpm test`                                | Unit tests (Vitest) in every package                                                                                       |
| `pnpm e2e`                                 | End-to-end tests (Playwright: Chromium, Firefox, WebKit, mobile Chrome) against production builds — run `pnpm build` first |
| `pnpm typecheck`                           | TypeScript (strict) + `astro check`                                                                                        |
| `pnpm lint`                                | ESLint incl. strict jsx-a11y                                                                                               |
| `pnpm check:tools`                         | Tool catalogue gate: files present, registry fresh, manifests/content valid, metadata imports SDK only                     |
| `pnpm check:boundaries`                    | Architectural dependency rules (dependency-cruiser)                                                                        |
| `pnpm check:budgets`                       | Gzip budgets per page, frame shell and tool (after build)                                                                  |
| `pnpm new-tool <category> <slug> "<Name>"` | Scaffold a tool (draft)                                                                                                    |
| `pnpm registry`                            | Regenerate `tools/registry.generated.ts`                                                                                   |
| `pnpm fixtures`                            | Regenerate the synthetic test corpus                                                                                       |
| `pnpm ci`                                  | Everything CI runs                                                                                                         |

## Architecture

```
apps/site         Astro static site (SEO pages, ~0 JS). Embeds tools in a sandboxed cross-origin iframe.
apps/tool-frame   Preact app on a separate origin: tool UIs, worker pool, strict CSP, no network.
packages/
  tool-sdk        Contracts: manifest, content, processor, result, verification, errors, formats
  registry        Pure registry functions (lookup, validation, search index, paths)
  runtime         Worker pool, job runner (+ main-thread fallback), file validation, downloads, ZIP
  constraints     Target-size quality solver, crop geometry
  engines/image   Header parsing, JPEG DPI, decode/resize/encode (browser)
  ui              Preact components (Dropzone, CropBox, ValidationReport, …)
  portal-specs    Verified portal requirements (schema + data; currently none verified)
  analytics-schema  Strict parent ↔ frame message protocol (no free-text fields)
tools/<category>/<slug>/   One folder per tool: manifest, content, options, processor, ui, tests
e2e/              Playwright tests · fixtures/  synthetic test files · scripts/  generators & gates
```

Key properties, each enforced by a test or CI gate:

- The site never loads processing code; a tool's code loads only when that tool opens.
- Files never leave the tool frame; the frame cannot connect to other origins (CSP + e2e egress test).
- Every result reports measured verification of each requested requirement; failures are explained, never padded or faked.

Design and research: [docs/research/](docs/research/00-README.md) · decisions: [docs/adr/](docs/adr/) · UI rules: [docs/design/ui-principles.md](docs/design/ui-principles.md) · security: [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md).

## Adding a tool

1. `pnpm new-tool image compress-image "Compress Image"` — creates `tools/image/compress-image/` (status `draft`, hidden).
2. Implement `processor.ts` with existing engines (add engine capabilities in `packages/engines/*` with tests).
3. Build `ui.tsx` from `@niftyfix/ui` components; write real, tool-specific `content.ts`.
4. Add unit tests and an e2e spec (happy path, failures, egress, mobile, keyboard).
5. `pnpm check:tools && pnpm check:boundaries && pnpm ci`, set `status: 'beta'`, then `'live'` after the acceptance checklist.

No file outside the tool's folder needs editing: navigation, category pages, routes, sitemap and structured data come from the registry.
