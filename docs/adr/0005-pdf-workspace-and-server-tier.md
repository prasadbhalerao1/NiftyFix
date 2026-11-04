# ADR 0005 — PDF workspace, and the plan for server-side tools

**Date:** 4 Nov 2026 · **Status:** Accepted (PDF workspace) · Proposed (server tier, paywall)

## 1. PDF engine

- **Library:** `@cantoo/pdf-lib` 2.11.1 (MIT), the maintained fork of `pdf-lib`. Upstream `pdf-lib` has had no release since 2021; a parser of untrusted files must be maintained. Its dependencies `culori`, `node-html-better-parser` and `html-entities` have open version ranges; the lockfile pins exact versions and `pnpm audit --prod` runs in CI.
- **Rendering** (thumbnails, PDF to JPG, text extraction) will use `pdfjs-dist` 6.x (Apache-2.0), pinned to a release at least two weeks old. 6.5.438 was three days old on 4 Nov 2026, so it was not added yet.
- **Where it runs:** inside the worker pool, like the image engine. A pathological file costs at most the job timeout and cannot freeze the page.
- **Untrusted input:** `loadPdf` maps every failure to an actionable error: damaged, `PASSWORD_PROTECTED`, no pages, or `TOO_MANY_PAGES` (2000-page ceiling; file size is capped per device in each manifest).
- **Verification:** every output is saved, then re-opened from its bytes by a fresh parser and checked (format, structure, page count, per-page rotation, extension). Split also re-reads its ZIP and verifies every part before packaging.
- **Fonts:** stamped text (page numbers, watermarks) uses the standard Latin fonts. The library silently prints garbage for other scripts, so text is checked against the font's character set and refused with a clear message. Devanagari and other scripts need an embedded Unicode font (follow-up; font size and licence to be chosen).

## 2. Shared building blocks

- **Multi-file jobs:** the runtime protocol carries an ordered file list; processors declare `inputs: { min, max }`, enforced before `run`. `defineProcessor` (one file) and `defineMultiFileProcessor`.
- **UI:** `SingleFileTool` (one file in, one out), `FileQueue` + `useFileQueue` (ordered, keyboard-accessible, per-file validation), `PageSelection` (live syntax check via the lightweight `@niftyfix/engine-pdf/pages` entry), `FileResultPanel`.
- **Preloading:** a tool UI calls `preload()` once files are chosen; an idle worker imports the processor so the engine downloads while the user adjusts settings.

## 3. Bundle budget

A PDF processor is ~244 kB gzip, almost all of it the engine, against the 80 kB processor budget set for image tools. PDF processors get an explicit **260 kB** budget (`ENGINE_PROCESSOR_BUDGETS.pdf` in `scripts/check-budgets.ts`) rather than a raised general budget. Justification: it loads in the worker, never on the page; the engine chunk is shared and cached across all PDF tools; preloading hides the download. Follow-up: stub the SVG/HTML drawing dependencies we do not use (estimated 40–50 kB saving).

## 4. Server tier (proposed — not built)

Most of the catalogue runs in the browser and needs no backend. Tools labelled `server` or `ai` in `packages/registry/src/planned.ts` (Word/Office conversion, website screenshots, signature requests, transcription, background removal) need one. Proposed design, to be confirmed before the first such tool:

| Concern    | Proposal                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compute    | Separate service from the static site and the tool frame. Office conversion needs LibreOffice in a container (e.g. Cloudflare Containers or Cloud Run); light endpoints on Cloudflare Workers. |
| Uploads    | Browser uploads straight to object storage (Cloudflare R2) with short-lived presigned URLs; the API never streams large files through itself.                                                  |
| Retention  | Objects deleted automatically (lifecycle rule) within 1 hour; deletion on job completion; no file content in logs.                                                                             |
| Safety     | Per-tool size/page limits enforced server-side, sandboxed converters with timeouts and no network, malware scanning before conversion, rate limits per IP and per account.                     |
| Secrets    | Platform secret store (e.g. `wrangler secret`). A `.env.example` listing variable **names only** is added with the first service that needs one; `.env` files are git-ignored.                 |
| Privacy UX | Server tools are labelled and ask for consent before upload; the tool frame's network egress test is extended to allow only the upload endpoint, for those tools only.                         |

No secrets, storage or server exist yet, so no `.env` file was added.

## 5. Paywall (proposed — later)

- Limits can be enforced reliably only where work happens on our servers. Browser tools run on the user's device; any client-side "3 free uses" counter can be bypassed. So the paywall should meter **server and AI tools** (they also carry the real cost) and **premium capabilities** such as large batches, very large files or saved presets.
- Basic browser tools stay free: they cost nothing to run and are what ranks in search and brings visitors.
- Needs accounts and payments (India: UPI-capable provider), decided when the server tier exists.
