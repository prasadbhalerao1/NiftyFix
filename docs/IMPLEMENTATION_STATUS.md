# Implementation status

**Last updated:** 4 Nov 2026 · **Milestones:** 0 ✅ · 1 ✅ · 2 ✅ · 3 ✅ (beta) · 4–6 not started

## Verified end-to-end flow

Open site → Form Photo Resizer → upload photo → set exact dimensions → set KB range → process locally (worker) → verify → download. Proven by Playwright in Chromium, Firefox, WebKit and mobile Chrome; the downloaded file is re-parsed in Node to confirm dimensions, byte range and DPI independently of the UI.

## Completed

| Component                        | Notes                                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo (pnpm 10 + Turborepo 2) | 13 workspace packages; strict TS; shared base config                                                                                                                                                                                            |
| `@niftyfix/tool-sdk`             | Manifest/content/processor/result contracts, closed error codes, magic-byte sniffing, KB conventions                                                                                                                                            |
| `@niftyfix/registry` + codegen   | Lookup by id/path/category, related tools, search index, indexability; build-time validation                                                                                                                                                    |
| `@niftyfix/runtime`              | Worker pool (queue, cancel, timeout, crash isolation), `JobRunner` main-thread fallback, `executeJob`, file validation, filenames, downloads, ZIP, object-URL registry                                                                          |
| `@niftyfix/constraints`          | Quality solver for byte ranges (honest failure states), crop geometry                                                                                                                                                                           |
| `@niftyfix/engine-image`         | Header dims (JPEG/PNG/WebP/GIF/BMP) without decoding, JPEG DPI read/write, decode/resize/encode with canvas fallback                                                                                                                            |
| `@niftyfix/ui`                   | Button, Dropzone, CropBox, NumberInput, SelectInput, TextInput, SegmentedControl, RangeInput, ProgressBar, ErrorView, ValidationReport, BeforeAfter, Panel, FactList                                                                            |
| `@niftyfix/portal-specs`         | Versioned schema with source/verification fields + validation; **0 verified records** (see Known issues)                                                                                                                                        |
| `@niftyfix/analytics-schema`     | Strict frame→parent message parser (no free-text fields)                                                                                                                                                                                        |
| Tool frame app                   | Separate origin, strict CSP + `_headers`, lazy manifest/UI/processor loading, height sync, events                                                                                                                                               |
| Site app                         | Home (search), category pages, tool pages from one route, Forms hub, About, Contact, Privacy (draft), Terms (draft), Security, Licences, Privacy verification, 404, sitemap.xml, robots.txt, canonical/OG/BreadcrumbList/WebApplication JSON-LD |
| Form Photo Resizer (beta)        | Crop with locked aspect (pointer + keyboard), exact px, min/max KB with safe/1000/1024 conventions, JPEG/PNG/WebP, DPI, background for transparency, quality floor, file name, validation report, cancel                                        |
| Gates                            | `check:tools`, `check:boundaries` (8 rules, verified to catch planted violations), `check:budgets`, ESLint + jsx-a11y strict, Prettier, `pnpm audit`                                                                                            |
| CI                               | `.github/workflows/ci.yml` runs every gate + e2e on 3 engines (not yet run on GitHub — no remote)                                                                                                                                               |
| Scaffolder                       | `pnpm new-tool` verified: creates a typechecking draft tool; gate blocks it until content is real                                                                                                                                               |
| Fixtures                         | Self-generated: portrait/large JPEG, transparent PNG, WebP, EXIF-rotated, PNG-named-.jpg; malicious: truncated, random, disguised PDF, PNG bomb, HEIC, empty                                                                                    |

## Tests executed (4 Nov 2026, local Windows machine)

| Suite                                                                                    | Result                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit (Vitest)                                                                            | **93 passed**, 0 failed (tool-sdk 19, runtime 25, constraints 17, engine-image 10, registry 7, tools 6, portal-specs 5, analytics-schema 4)                                          |
| E2E (Playwright)                                                                         | **103 passed**, 1 skipped (WebKit keyboard: Tab-to-button is a macOS setting), 0 failed — Chromium, Firefox, WebKit, Pixel 7                                                         |
| Visual review                                                                            | Desktop + mobile screenshots of home, empty, editing, result reviewed; fixed: result/error rendered off-screen on phones (now revealed, incl. Safari via a numeric `reveal` message) |
| Accessibility (axe, WCAG 2.2 AA, inside the frame for empty/editing/result/error states) | 0 serious/critical violations in all 4 browsers                                                                                                                                      |
| Typecheck                                                                                | 11/11 tasks clean                                                                                                                                                                    |
| Lint / format / boundaries / tools gate / audit                                          | All passing (audit with 7 documented Astro exceptions — ADR 0003)                                                                                                                    |

## Measured performance (production build, 4 Nov 2026)

| Measure                                    | Value                                                                                                          | Budget |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------ |
| Home JS (gzip)                             | 0.5 kB                                                                                                         | 15 kB  |
| Tool page parent JS (gzip)                 | 0.9 kB                                                                                                         | 15 kB  |
| Site CSS (gzip)                            | 6.1 kB                                                                                                         | 15 kB  |
| Frame shell (entry + CSS, gzip)            | 18.0 kB                                                                                                        | 50 kB  |
| Photo resizer UI chunk (gzip)              | 9.4 kB                                                                                                         | 35 kB  |
| Photo resizer processor (gzip)             | 6.7 kB                                                                                                         | 80 kB  |
| Lighthouse mobile (slow 4G, 4× CPU) — Home | Perf 100 · A11y 100 · BP 100 · SEO 100 · LCP 1.0 s · TBT 0 ms · CLS 0 · 12 KiB                                 | —      |
| Lighthouse — Tool page                     | Perf 100 · A11y 100 · BP 100 · SEO 66 (intentional `noindex` for beta) · LCP 1.4 s · TBT 0 ms · CLS 0 · 47 KiB | —      |

Lab measurements only. **Not yet measured:** field Core Web Vitals, processing time on real low-end Android, peak memory.

## Known issues / bugs

1. **Astro 6 advisories (launch-blocking).** Fixed only in Astro 7, which needs Node ≥ 22.23.4 (machine has 22.17.1). Not reachable in our static build; see ADR 0003.
2. **No verified portal presets.** Official notices could not be verified; third-party sources conflict and report SSC/UPSC moved to live photo capture.
3. **Main-thread fallback** (old Safari / Playwright WebKit): heavy work can briefly freeze the frame UI; cancellation is cooperative.
4. Native browser JPEG encoders are used (no MozJPEG yet), so files at a given quality are larger than they could be; the size solver compensates by lowering quality.
5. WebP output fails with a clear message on browsers that cannot encode WebP (older Safari).
6. Astro files are not covered by ESLint (no `eslint-plugin-astro` yet); `astro check` covers types.

## Missing dependencies / environment

- Node ≥ 22.23.4 for Astro 7.
- No git remote; CI workflow untested on GitHub.
- No real devices tested; no Cloudflare account or domains configured.

## Next tasks (in order)

1. Upgrade Node → Astro 7 / Vite 8 / Preact (as supported); remove audit exceptions.
2. Portal spec research: 10–15 official notices → `PORTAL_SPECS` records; portal preset picker in the UI.
3. Signature Resizer (background whitening, threshold, auto-crop) on the same engine.
4. Compress Image (batch + ZIP via runtime queue; jSquash MozJPEG/WebP encoders, lazy per codec).
5. PDF engine (pdf.js, cantoo pdf-lib, vetted qpdf-wasm) → Merge/Split/Organize/JPG↔PDF.
6. Real-device baseline (low-end Android, iPhone SE), Lighthouse CI in GitHub Actions, error monitoring with scrubbing.
7. Cloudflare deployment on two registrable domains; re-run egress tests in production.
