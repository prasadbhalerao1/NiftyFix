# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NiftyFix (https://niftyfix.in) is an India-first, free, browser-only file tools site. Files never leave the user's device. Read [CONTEXT.md](CONTEXT.md) for the full handoff (owner rules, how to add a tool, roadmap); this file is the short version.

## Owner rules (enforced or non-negotiable)

- No em dashes (U+2014) anywhere: code, copy, docs, commits. `pnpm check:tools` fails on one.
- No blue, purple, violet, pink or navy, and no gradients. Warm stone neutrals plus orange (`brand`) only.
- Commits: small and verified, no Co-Authored-By or AI attribution trailer. Leave `git status` clean and pushed.
- Deploy only when the owner says "deploy" (`pnpm deploy:cloudflare`), then `pnpm build` to restore the local build. Wait for CI to pass first.
- Never delete, move or reformat a file the owner wrote without asking (e.g. `bigads.md`, docs).
- Never invent exam or portal specs: a `packages/portal-specs` record needs an official notice as its source.
- One tool per job (no near-duplicate tools); each real search intent is a `variants` entry in the tool's `content.ts`, not a new tool. Exam presets go in the exam picker; a dedicated page only for big national exams, and tell the owner before adding pages.
- Dependencies pinned exactly and at least two weeks old.
- The tool frame stays on its workers.dev origin; never a niftyfix.in subdomain.

## Commands

```sh
pnpm install
pnpm dev                       # site http://localhost:4321, tool frame http://127.0.0.1:4322
pnpm new-tool <category> <slug> "<Name>"   # scaffold; use the slug from packages/registry/src/planned.ts
pnpm registry                  # regenerate tools/registry.generated.ts (committed)

# Gates, in CI order
pnpm format:check && pnpm lint && pnpm check:tools && pnpm check:boundaries && pnpm typecheck && pnpm test && pnpm build && pnpm check:budgets

# Unit tests (Vitest) for one package or one file
pnpm --filter @niftyfix/tools exec vitest run image/make-square
pnpm --filter @niftyfix/engine-pdf exec vitest run

# E2E (Playwright) runs against production builds: run pnpm build first
pnpm exec playwright test e2e/make-square.spec.ts --project=chromium
pnpm exec playwright test e2e/make-square.spec.ts --project=webkit   # always check WebKit too
pnpm e2e                       # all projects: chromium, firefox, webkit, mobile-chrome
```

Package names: `@niftyfix/site`, `@niftyfix/tool-frame`, `@niftyfix/tools` (the `tools/` folder), `@niftyfix/{tool-sdk,registry,runtime,constraints,ui,portal-specs,analytics-schema}`, `@niftyfix/engine-{image,pdf,ocr}`.

CI (`.github/workflows/ci.yml`) runs the gates plus one e2e job per browser project; the single required check is `verify`. A push to main is not blocked by CI and deploys do not wait for it, so check the run yourself.

## Architecture

Two apps on two origins:

- `apps/site`: Astro static site, almost no JS. Every tool page, intent page, category hub, sitemap, `search.json` and `llms.txt` is generated from the tool registry; adding a tool needs no site edit. It embeds the tool in a sandboxed cross-origin iframe.
- `apps/tool-frame`: Preact app with a strict CSP (`style-src 'self'`, no network). Loads tool UIs and processors lazily via `tools/loaders.ts` (one chunk per tool) and runs processors in a worker pool (`packages/runtime`).

A tool is a folder `tools/<category>/<slug>/`:

- `manifest.ts` and `content.ts`: metadata and SEO copy read by the static site. They may import only `@niftyfix/tool-sdk`. `content.ts` `variants` (slug, preset, h1, seoTitle up to 65 chars, seoDescription 70 to 160, intro, faqs) become separate intent URLs; the UI receives the variant's `preset` as `props.preset`.
- `options.ts`: valibot schema.
- `processor.ts`: `defineProcessor` (one file) or `defineMultiFileProcessor({ inputs: { min, max } })`. Runs in a worker; must verify its output and report failures honestly, never pad to hit a size.
- `ui.tsx`: built from `@niftyfix/ui` (`SingleFileTool`, `useFileQueue`/`FileQueue`/`useToolJob`, `SegmentedControl`, `SelectInput`, `NumberInput`, `CheckboxInput`).
- Pure logic goes in its own file with a `*.test.ts` next to it (e.g. `layout.ts`, `frame.ts`).

Boundaries enforced by `pnpm check:boundaries` (`.dependency-cruiser.cjs`): tools never import other tools; the site never imports engines, runtime, constraints, processors or UIs; processors never import UI or Preact; engines never import ui, runtime or registry; tool-sdk is a leaf.

Shared engines (reuse, never add a second pipeline):

- `packages/engines/image`: `decodeImage` (EXIF-upright), `createCanvas`, `exportImage`, `verifyImageOutput`, `sameFormatAs`, `webpOrPng`. Keep canvases under about 16M pixels (iOS Safari limit).
- `packages/engines/pdf`: the only place that imports `@cantoo/pdf-lib`. `readPdf`, `finishPdf` (re-opens and verifies), `placePagesOnSheets`, `extractImages`, `PAPER_SIZES`.
- `packages/constraints`: target-KB quality solver. KB convention: max = KB x 1000 bytes, min = KB x 1024.
- `packages/runtime`: `zipFiles`/`readZip`, downloads, file validation.
- `packages/portal-specs`: verified exam photo and signature specs; `specPresetSettings` turns a `spec-<id>` preset into resizer settings.

Other places a new tool usually touches: `apps/site/src/data/local-names.ts` (Hindi, Marathi and Hinglish search names) and a new `e2e/<slug>.spec.ts` (upload a fixture or generated file, run, download, re-check the result in Node; see `e2e/pdf-helpers.ts`, `e2e/helpers.ts`, and use `recordProblems` to catch CSP errors).

## Gotchas

- WebKit logs a CSP error for any native `<select>` under `style-src 'self'`; `recordProblems` ignores that exact message in WebKit only. Any other CSP error is a real inline style.
- `SegmentedControl` needs an explicit generic (`<Fill>`) for union value types.
- `tools/registry.generated.ts` must be regenerated and committed when tools change; `check:tools` fails if stale.
- Size budgets in `scripts/check-budgets.ts` can be raised only deliberately, in their own commit, with the reason.
