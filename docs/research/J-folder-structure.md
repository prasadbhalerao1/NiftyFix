# Deliverable J — Repository Structure & Dependency Boundaries

**Decision:** one **pnpm + Turborepo monorepo**. Reasons: shared types between site, frame, engines and (later) server; atomic changes across a tool's manifest/content/processor; one CI. Not a polyrepo (version-skew pain across 100 tools) and not one flat app (no enforceable boundaries).

## 1. Layout

```
/
├─ apps/
│  ├─ site/                    # Astro: parent pages (www). Layouts, category/tool/forms/guide pages,
│  │  ├─ src/pages/            #   [category]/[tool].astro – ONE dynamic route renders every tool page
│  │  ├─ src/layouts/          #   from registry metadata + the tool's content.mdx
│  │  ├─ src/seo/              #   metadata, JSON-LD, sitemap, robots, redirects (all from registry)
│  │  └─ src/ads/              #   ad slots + CMP loader (ONLY place ad code may exist)
│  ├─ frame/                   # Vite multi-entry app for the sandboxed tool origin (run.<brand>-cdn.com)
│  │  ├─ src/entry.ts          #   boots runtime, reads toolId from path, lazy-loads tool UI
│  │  └─ src/csp/              #   per-privacy-class headers (generated _headers)
│  └─ api/                     # (Phase 3) Cloudflare Worker: jobs, presign, rate limits
│
├─ services/
│  └─ processor/               # (Phase 3) Go runner + Dockerfiles per engine (libreoffice, ffmpeg)
│
├─ packages/
│  ├─ tool-sdk/                # Types & helpers: ToolManifest, Processor, ToolResult, ToolError,
│  │                           #   ErrorCode union, defineTool(), option-schema helpers. ZERO deps.
│  ├─ registry/                # codegen: globs tools/**/manifest.ts → registry.generated.ts,
│  │                           #   search-index.json, sitemap input, redirect map; validation rules
│  ├─ runtime/                 # frame runtime: worker pool, job queue/batch, cancellation, OPFS
│  │                           #   scratch, verification display model, ZIP download, pipelines,
│  │                           #   parent<->frame messaging, safe analytics events
│  ├─ ui/                      # Preact components: Dropzone, FileList, BatchQueue, OptionsForm
│  │                           #   (schema-driven), ResultPanel, BeforeAfter, ProgressBar, ErrorView
│  ├─ constraints/             # target-size/dimension solver + verifiers
│  ├─ engines/
│  │  ├─ image/  pdf/  media/  ocr/  text/  data/  archive/
│  │  │   (each: src/, wasm/ (vendored, hashed), test/, LICENSES/)
│  ├─ portal-specs/            # versioned JSON dataset of form rules + source URLs + verified dates
│  ├─ analytics-schema/        # closed event types (no free-text fields)
│  └─ config/                  # tsconfig bases, eslint flat config, size-limit budgets, boundaries rules
│
├─ tools/                      # ONE FOLDER PER TOOL (the unit of work)
│  ├─ image/
│  │  └─ compress-image/
│  │     ├─ manifest.ts        # ToolManifest (metadata, options schema, lazy loaders)
│  │     ├─ content.en.mdx     # page copy: how-to, options explained, limits, example, FAQs
│  │     ├─ process.ts         # Processor (runs in worker) — imports engines only
│  │     ├─ ui.tsx             # OPTIONAL custom UI (else schema form)
│  │     ├─ process.test.ts    # unit/property tests against fixtures
│  │     ├─ e2e.spec.ts        # Playwright: happy path, failure path, network-egress assertion
│  │     └─ fixtures.json      # references into /fixtures by hash + expected results
│  ├─ pdf/merge-pdf/ ...
│  └─ forms/photo-resizer/ ...
│
├─ fixtures/                   # shared binary corpus (Git LFS): images/, pdf/, media/, text/, malicious/
│  └─ MANIFEST.json            # hash, source, licence of each fixture, what edge case it covers
├─ content/
│  ├─ guides/                  # long-form guides (few)
│  └─ keyword-briefs/          # one per tool (Doc H §8)
├─ docs/
│  ├─ research/                # this pack
│  ├─ adr/                     # one file per architecture decision
│  └─ runbooks/                # incident, cost alert, takedown, security disclosure
├─ scripts/
│  ├─ new-tool.ts              # scaffolder
│  └─ check-tools.ts           # registry lint (also runs in CI)
├─ infra/                      # wrangler configs, R2 lifecycle, Queues, Containers (Phase 3), DNS
└─ .github/workflows/
```

## 2. Dependency rules (enforced by dependency-cruiser in CI)

```
tool-sdk          → (nothing)
analytics-schema  → tool-sdk
engines/*         → tool-sdk, (their own vendored wasm)          ✗ ui, runtime, apps, tools, other engines*
constraints       → tool-sdk, engines/image, engines/pdf, engines/media (types + encode fns only)
runtime           → tool-sdk, analytics-schema, engines/archive  ✗ other engines (loaded dynamically by tools)
ui                → tool-sdk                                     ✗ engines, runtime internals
registry          → tool-sdk, tools/**/manifest.ts (+ content frontmatter)  ✗ process.ts, ui.tsx
tools/*/manifest  → tool-sdk                                     ✗ engines (only via `load.processor` dynamic import)
tools/*/process   → tool-sdk, engines/*, constraints             ✗ ui, runtime, other tools
tools/*/ui        → tool-sdk, ui                                 ✗ engines (talks to runtime via typed props)
apps/site         → registry, ui (static render only), analytics-schema, portal-specs   ✗ runtime, engines, tools/*/process
apps/frame        → runtime, ui, registry, tools/* (dynamic import only)
apps/api, services/processor → tool-sdk (shared job/option types)
```
`*` An engine needing another (e.g., `pdf` uses `image` encoders for recompression) declares it in an allowlist in `packages/config/boundaries.ts` — reviewed explicitly.

**Circular dependencies** are blocked by dependency-cruiser's `no-circular` rule and by the strictly layered graph above (sdk → engines → constraints → tools → apps).

**Keeping tool-specific dependencies out of unrelated pages:**
1. `apps/site` cannot import `process.ts`/`ui.tsx` (rule) and only reads `manifest.ts`, whose `load.*` fields are `() => import()` thunks — the codegen strips them from `registry.generated.ts` so the site bundle never even sees those paths.
2. `apps/frame` imports each tool's UI/processor dynamically ⇒ separate chunks per tool and per engine.
3. `size-limit` budgets per entry (Doc F); a CI script asserts that the **home/category bundles contain no module from `packages/engines/**`** (checked via the Rollup manifest).
4. Heavy third-party packages are dependencies **of the engine package only**, never of `apps/*`.

## 3. Adding tool #101 (documented process)
1. `pnpm new-tool --category image --slug image-to-ascii --engine image` → scaffolds `tools/image/image-to-ascii/` with manifest, content, process, tests from templates.
2. Fill `manifest.ts` (ids, i18n strings, input spec, options schema, privacy class, related tools, resource weight).
3. Implement `process.ts` using existing engine functions. If a new capability is needed, add it to the engine package with its own tests (separate PR preferred).
4. Add fixtures (or reference existing ones) + expected results in `fixtures.json`; write `process.test.ts` and `e2e.spec.ts` from templates (the e2e template already includes the network-egress assertion and mobile viewport run).
5. Write `content.en.mdx` + `content/keyword-briefs/image-to-ascii.md`.
6. `pnpm check-tools` (registry lint: unique id/slug, related ids exist, i18n complete, budgets declared, content sections present, no forbidden imports).
7. Open PR → CI runs only affected tasks (Turborepo) + global gates. Merge with `status: 'beta'` (noindex) → acceptance checklist (Doc K §4) → flip to `live`.

**No file outside `tools/image/image-to-ascii/` changes** unless an engine capability was added. Nav, search, sitemap, category page, related links, structured data all update from the registry.

## 4. Testing layout
| Level | Location | Runs |
|---|---|---|
| Engine unit/property tests | `packages/engines/*/test` | Vitest (node + browser mode for WASM) |
| Tool processor tests vs fixtures | `tools/**/process.test.ts` | Vitest browser mode (Chromium) |
| Tool e2e (UI, download, errors, egress, a11y via axe) | `tools/**/e2e.spec.ts` | Playwright: Chromium, WebKit, Firefox; mobile emulation |
| Site pages (SEO, links, metadata, a11y) | `apps/site/test` | Playwright + HTML validators |
| Visual regression (key templates) | `apps/site/test/visual` | Playwright screenshots |
| Benchmarks | `bench/` | nightly |
