# Implementation status

## Sprint 3 (4 Nov 2026) — PDF workspace, catalogue, theme

| Area             | Outcome                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PDF tools (beta) | **Merge PDF, Split PDF, Extract PDF Pages, Rotate PDF, Add Page Numbers, Watermark PDF, JPG to PDF, Flatten PDF**, all on-device, output re-opened and verified (ADR 0005)                                           |
| PDF engine       | `@niftyfix/engine-pdf` on `@cantoo/pdf-lib` 2.11.1; 17 unit tests                                                                                                                                                    |
| Catalogue        | 18 categories, 401 unique planned tools in `packages/registry/src/planned.ts`; every category hub lists ready and coming-soon tools; scope in `docs/tool-catalogue-v3.md`                                            |
| Theme            | Light/dark toggle, saved per browser, forwarded to the tool frame                                                                                                                                                    |
| Fixes            | Dark-mode drop zone was unreadable on hover; **AVIF uploads were rejected as damaged** in the Photo and Signature Resizers                                                                                           |
| Tests            | Unit: all packages pass. E2E: 287 passed, 1 skipped (WebKit Tab key), across Chromium, Firefox, WebKit, Pixel 7, before the final site-test update; PDF tools 14 × 4 browsers, Merge 5 × 4, axe scans of PDF layouts |
| Not done         | Organize PDF (needs page thumbnails, pdf.js), PDF to JPG, Compress PDF, Protect/Unlock (engine review), metadata editor, Devanagari text in stamps, real-device testing                                              |

---

**Last updated:** 4 Nov 2026 (end of sprint 2) · **Tools:** 2 (both beta) · **Milestones:** 0 ✅ · 1 ✅ · 2 ✅ · 3 ✅ (beta) · 4–6 not started

## Verified end-to-end flows

- **Form Photo Resizer:** open site → upload photo → crop (locked aspect) → exact pixels → KB range → process in a worker → verify → download.
- **Signature Resizer:** open site → upload signature photo/scan → auto-crop → live cleaned/original preview → ink mode and cleanup → fit/fill into exact pixels → KB range or transparent PNG → verify → download.

Both are proven by Playwright in Chromium, Firefox, WebKit and mobile Chrome (Pixel 7 emulation). The downloaded file is re-parsed in Node (dimensions, bytes, format), and for signatures also decoded and measured independently (paper whiteness at the border, ink coverage, alpha).

## Sprint 2 summary

| Phase                     | Outcome                                                                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Security upgrade      | Node 22.17.1 → **22.23.4** (`.nvmrc`), Astro 6.4.8 → **7.4.5**, Vite → **8.3.5**, ESLint 9 → **10.14.0**. All audit exceptions removed; `pnpm audit --prod`: **no known vulnerabilities**. ADR 0003 resolved. |
| B — Remote CI             | Private repo `prasadbhalerao1/Tools`. First GitHub Actions run (Ubuntu): **success in 5 m 51 s**, all gates and e2e on 3 engines. Runbook: `docs/runbooks/github-setup.md`.                                   |
| C — Real-device test plan | `docs/testing/REAL_DEVICE_TEST_PLAN.md` written. **Not executed**: no physical devices have been tested.                                                                                                      |
| D — Signature Resizer     | Built on the shared SDK, registry, runtime, image pipeline, output-spec form, job lifecycle and result panel (no duplicated pipeline). Status **beta**.                                                       |
| E — Documentation         | This file, ADR 0002 (versions), ADR 0003 (resolved), ADR 0004 (sprint-2 architecture), README, device plan.                                                                                                   |

## Completed

| Component                       | Notes                                                                                                                                                                                                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo (pnpm 10.33 + Turbo 2) | 13 workspace packages; strict TS 6.0.3; shared base config                                                                                                                                                                                                                                   |
| `@niftyfix/tool-sdk`            | Contracts, closed error codes, magic-byte sniffing, KB conventions; **new:** shared output spec (`validateOutputSpec`, `resolveOutputSpec`, `outputSpecEntries`, `CropRectSchema`), `describeByteRange`                                                                                      |
| `@niftyfix/registry` + codegen  | Lookup by id/path/category, related tools, search index, indexability                                                                                                                                                                                                                        |
| `@niftyfix/runtime`             | Worker pool, `JobRunner` main-thread fallback, `executeJob`, file validation, filenames (**new:** `resolveOutputName`), downloads, ZIP, object-URL registry                                                                                                                                  |
| `@niftyfix/constraints`         | Quality solver (never pads), crop geometry; **new:** `expandToAspect`                                                                                                                                                                                                                        |
| `@niftyfix/engine-image`        | Header dims, JPEG DPI, decode/resize/encode; **new:** `pipeline` (`readSafeHeader`, `exportImage`, `verifyImageOutput`) shared by both tools; `enhance` (lighting flattening by morphological closing, edge-aware paper whitening, ink modes, transparency, legibility check, ink auto-crop) |
| `@niftyfix/ui`                  | Components as before; **new:** `OutputSpecForm`, `ImageResultPanel`, `ProcessingPanel`, `useToolJob`, `loadImageSource`, `CheckboxInput`, free-aspect `CropBox` with a pixel size label                                                                                                      |
| Form Photo Resizer (beta)       | Refactored onto the shared pipeline/UI; behaviour unchanged (all previous e2e still pass)                                                                                                                                                                                                    |
| **Signature Resizer (beta)**    | `/forms/signature-resizer/`: see the feature list below                                                                                                                                                                                                                                      |
| Fixtures                        | **New:** 10 synthetic signatures in `fixtures/signatures/` (white/black, blue ink, thin pen, thick marker, uneven lighting, hand shadow, grey paper, JPEG noise, low resolution, transparent PNG); deterministic, existing fixtures regenerate byte-identical                                |

### Signature Resizer features

Auto-crop to the ink (connected components, specks ignored) and manual crop (free aspect, or locked to the output in Fill mode) · live preview of the current crop with **Cleaned / Original** compare · ink mode Colour / Grayscale / Black & white with a threshold slider · even out lighting and shadows · background cleanup, brightness, contrast · **Reset to safe defaults** and **No cleanup** (edits are settings, never applied to the original) · legibility warnings in the preview and repeated in the result (strokes lost, nothing visible, background still dark) · Fit inside / Fill placement · exact width × height · JPEG or PNG · min/max KB with the safe/1000/1024 conventions and the quality solver · transparent PNG · DPI · file name · progress and cancel · before/after · independent validation report · download. **No portal presets** (none verified).

## Tests executed (4 Nov 2026)

| Suite                                  | Result                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit (Vitest 5.1.0)                    | **128 passed**, 0 failed: engine-image 29, runtime 27, tool-sdk 25, constraints 20, tools 11, registry 7, portal-specs 5, analytics-schema 4                                                           |
| E2E (Playwright 1.64.1), local Windows | **195 passed**, 1 skipped (WebKit Tab-to-button: a macOS setting), 0 failed. Chromium, Firefox, WebKit, Pixel 7                                                                                        |
| E2E on GitHub Actions (Ubuntu)         | Shared pipeline commit `ad6cc84`: **success** (5 m 51 s). Signature Resizer + docs `979bcb4`: **success** (7 m 6 s).                                                                                   |
| Signature difficult inputs             | 10 fixtures × 4 browsers: exact 400 × 150, ≤ 20 KB, border ≥ 97 % white, ink 0.4–30 %; plus KB window 10–20 KB, refuse-to-pad, transparent PNG alpha, fill aspect lock, 4 malicious files, 12 MP photo |
| Accessibility (axe, WCAG 2.2 AA)       | 0 serious/critical in all 4 browsers: 5 site pages; photo tool empty/editing/result/error; signature tool empty/editing with warning and advanced options/result                                       |
| Visual review                          | Desktop 1366 px and phone 390 px screenshots of every signature state; see "UI review" below                                                                                                           |
| Gates                                  | format, lint (0 warnings), check-tools, check-boundaries, typecheck, budgets: all pass. `pnpm audit --prod`: no known vulnerabilities                                                                  |

### Failures found and fixed during sprint 2

1. **Grey line along a hard shadow edge** (e2e `hand-shadow.jpg` border 0.967 < 0.97; visible in the preview). The blurred background estimate smeared across the edge. Replaced by a morphological closing on an edge-padded image (ADR 0004 §3); unit test with a diagonal edge.
2. **False "strokes are disappearing" warning at default settings** on the shadow image, caused by the same band inflating the ink reference. Fixed by (1).
3. **Auto-crop kept the whole width** on the shadow image (the edge counted as ink). Fixed by (1).
4. **"Crop size: 100 %"** shown while the crop was clearly not the whole image. The slider now shows the crop in source pixels.
5. Test-harness bug: the e2e pixel analysis used `OffscreenCanvas`, which WebKit's page context lacks; it now uses a DOM canvas.
6. Speck test for auto-crop: row/column heuristic replaced with connected components.

## UI review (sprint 2)

Reviewed: signature tool empty, editing, advanced options, result, on desktop and phone. No horizontal overflow at 390 px; validation table fits; result is revealed on phones.
Open polish items (not blocking): before/after tiles are square, so wide signatures sit in a lot of checkerboard; "Black & white" wraps to two lines at 390 px.

## Measured performance (production build)

| Measure                                    | Sprint 1 | Sprint 2    | Budget |
| ------------------------------------------ | -------- | ----------- | ------ |
| Home JS (gzip)                             | 0.5 kB   | 0.4 kB      | 15 kB  |
| Tool page parent JS (gzip)                 | 0.9 kB   | 1.0 kB      | 15 kB  |
| Site CSS (gzip)                            | 6.1 kB   | 6.3 kB      | 15 kB  |
| Frame shell (entry + static imports + CSS) | 18.0 kB  | **27.5 kB** | 50 kB  |
| Photo resizer UI chunk                     | 9.4 kB   | 3.2 kB      | 35 kB  |
| Photo resizer processor                    | 6.7 kB   | 5.7 kB      | 80 kB  |
| Signature resizer UI chunk                 | —        | 6.1 kB      | 35 kB  |
| Signature resizer processor                | —        | 8.2 kB      | 80 kB  |

The shell grew because the bundler hoists modules shared by two or more lazy tools (crop box, validation report, input validation, result panel) into the entry. Tool-specific code stays lazy (the enhancement engine and size solver are not in the shell). Photo Resizer total (shell + UI): 27.4 → 30.7 kB, the +3.3 kB being the shared components it now uses; the Signature Resizer adds only 6.1 + 8.2 kB on top.
Lighthouse was not re-run this sprint. **Not yet measured:** field Core Web Vitals, processing time and peak memory on real low-end phones.

## Known issues

1. **No verified portal presets.** Official notices not verified; no SSC/UPSC presets created.
2. **No real devices tested.** Plan written, not executed.
3. **Main-thread fallback** (Playwright WebKit / older Safari): heavy work can briefly freeze the frame; cancellation is cooperative. Signature tests pass there, but the 12 MP case has not been timed on a real iPhone.
4. Signature cleanup is tested on **synthetic** fixtures. Lined/squared paper is not removed (documented in the tool's Limits), and real phone photos may need tuning.
5. Native browser JPEG encoders (no MozJPEG yet).
6. WebP output unavailable on browsers that cannot encode it (clear message).
7. Astro files not covered by ESLint (`astro check` covers types).
8. Dev-only advisory GHSA-g3hv-75wg-m249 (minimatch via ESLint tooling); not shipped (ADR 0003).
9. Branch protection on `main` requires the `verify` CI check and blocks force pushes and deletion, but is not enforced for admins (direct pushes by the owner still bypass it).

## Next tasks (in order)

1. Execute the real-device test plan (low-end Android, iPhone SE/Safari) for both tools; tune cleanup on real signature photos.
2. UI polish pass: before/after tiles follow the output aspect; compact segmented labels at phone width.
3. Compress Image (batch + ZIP via the runtime queue; MozJPEG/WebP encoders lazy per codec).
4. PDF engine → Merge / Split / Organize / JPG↔PDF.
5. Portal spec research from official notices only → preset picker.
6. Lighthouse CI and an error monitor with scrubbing; Cloudflare deployment on two registrable domains.
