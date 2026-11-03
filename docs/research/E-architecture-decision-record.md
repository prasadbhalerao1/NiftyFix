# Deliverable E — Technical Architecture Decision Record

**Status:** Proposed for review · **Date:** 4 Nov 2026
**Drivers (from the brief, in priority order):** correctness → performance → UX → maintainability → 100+ tools → SEO → monetization → operational efficiency.

---

## 0. Architecture in one picture

```
                     ┌──────────────────────── Cloudflare edge (static, cached) ────────────────────────┐
 Browser             │                                                                                   │
 ┌───────────────────┴──────────────┐        ┌──────────────────────────────────────────────┐          │
 │ PARENT PAGE  (www.<brand>.com)   │        │ TOOL FRAME  (run.<brand>-cdn.com, sandboxed)  │          │
 │ Astro static HTML: H1, how-to,   │ iframe │ Preact island: dropzone, options, queue,     │          │
 │ limits, FAQ, related tools, ads, │◄──────►│ results, downloads                           │          │
 │ consent (CMP), analytics beacon  │ post-  │   │ postMessage(job)                          │          │
 │ ~0–15 kB JS                      │ Message│   ▼                                           │          │
 │                                  │ (meta  │ Worker pool ── engine modules (lazy, hashed): │          │
 │ Ads/3rd-party JS live ONLY here  │  only) │   image(jSquash/native) pdf(pdf.js, pdf-lib,  │          │
 └──────────────────────────────────┘        │   qpdf) media(Mediabunny→ffmpeg fallback)     │          │
                                             │   ocr(tesseract) text/data(pure TS)           │          │
                                             │ CSP: connect-src 'self'; no 3rd-party scripts │          │
                                             │ Files: Blob/OPFS in this origin only          │          │
                                             └──────────────────────────────┬───────────────┘          │
                                                                            │ ONLY for tools whose      │
                                                                            │ manifest says "server",   │
                                                                            │ after explicit consent    │
 Phase 3+                                                                   ▼                           │
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
 │ api.<brand>.com (Worker): rate-limit → presigned R2 PUT → enqueue job (Queues) → status polling  │   │
 │ processor (Containers): pulls job → sandboxed native engine (LibreOffice/ffmpeg) → R2 → delete   │   │
 └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
                     └───────────────────────────────────────────────────────────────────────────────────┘
```

---

## ADR-01 — Frontend framework: **Astro 6 (static output) + Preact islands**

**Context.** Each tool page is ~90% static, indexable content plus exactly one interactive widget. 100–200 such pages. SEO and CWV matter. Interactivity is heavy *inside* the widget but not elsewhere.

| Option | Baseline JS on a content page | Fit for "static page + 1 widget" | SEO/SSG | Notes |
|---|---|---|---|---|
| **Astro 6 + islands** | ~0 kB unless an island is used | **Exact fit** — `client:visible`/`client:idle` per island | Static HTML by default | MIT; team acquired by Cloudflare (16 Jan 2026), pledged to stay open & multi-host. Astro 6: stable CSP API, Fonts API, Vite Environment API dev server. Validated by Bundle (Astro+Svelte) and LocalPDF (Astro) |
| Next.js 16 (App Router) | React runtime + router on every page (tens of kB gz) | Over-provisioned; RSC helps, but client components still hydrate React | Excellent | Cache Components/PPR are server-oriented; reported (3P, unverified) that Cache Components don't support static export. Used by ATools/FreeTools. Best if we needed lots of dynamic/personalized pages — we don't |
| SvelteKit | Small runtime | Good | Good | Smaller hiring pool; fine alternative |
| React + Vite SPA | Whole app shell | Poor | Needs prerender plugin | Rejected: SEO + JS cost |

**Decision.** Astro 6, `output: 'static'` (no SSR at launch). Islands in **Preact** (≈4 kB runtime, React-compatible API and skills; `preact/compat` if a React-only lib is unavoidable). Svelte is an equally valid choice; Preact chosen for team familiarity with React patterns.

**Consequences.** Tool UIs must be written as self-contained islands. Shared UI is a Preact component library. No React Server Components.

---

## ADR-02 — The tool runs in a sandboxed cross-origin frame

**Problem.** (a) Ad and analytics scripts in the same document can read the DOM — pasted text, filenames, rendered previews. "Your files never leave your device" is then not technically guaranteed. (b) We want a strict CSP for tool code, but ad networks need permissive CSP.

**Decision.** Each tool page embeds `<iframe src="https://run.<brand>-cdn.com/t/<toolId>@<hash>/" sandbox="allow-scripts allow-downloads allow-same-origin allow-forms allow-modals" allow="clipboard-write">`:
- The frame origin serves **only static assets**. CSP: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' blob: data:; frame-ancestors https://www.<brand>.com`.
- File selection, drag-drop, paste, processing and download all happen **inside** the frame. The parent never receives file bytes, names or text.
- Parent ↔ frame messages are typed and limited to: frame height, `tool_started/succeeded/failed` events with **coarse, non-identifying** metrics (tool id, duration bucket, size bucket, error code), and deep-link options.
- Server-mode tools (Phase 3) get a different CSP that also allows `connect-src https://api.<brand>.com https://<r2-upload-host>` and show a consent step first.
- Using a *separate registrable domain* (`<brand>-cdn.com`) rather than a subdomain avoids cookie/storage sharing and keeps ad cookies out.

**Trade-offs.** +1 network round trip (mitigated: `preconnect`, tiny frame HTML, same CDN); iframe height management; keyboard focus handoff needs care; Google may not attribute iframe content to the page — **fine**, because indexable content is in the parent.

**Validation spike (Phase 1 exit criterion):** LCP of a tool page with frame ≤ budget (Doc F); keyboard-only completion works; e2e test proves no request leaves the frame origin during processing.

---

## ADR-03 — No cross-origin isolation; no SharedArrayBuffer by default

**Context.** Multithreaded WASM (ffmpeg.wasm-mt, LibreOffice WASM) needs `SharedArrayBuffer` → COOP `same-origin` + COEP. `COEP: credentialless` is unsupported in Safari through 27.2 (caniuse); `require-corp` breaks third-party ad iframes/scripts that don't send CORP. BentoPDF documents that its Office conversion *requires* SAB.

**Decision.** Pages and frames are **not** cross-origin isolated. Engines must run single-threaded or use browser-native acceleration (WebCodecs, native image decode/encode). Parallelism comes from **multiple dedicated workers** each processing different files (batch parallelism), not shared-memory threads.
**Exception path (later, if justified):** a separate ad-free "Pro workspace" origin that *is* isolated, for multithreaded engines.

---

## ADR-04 — Tool definition system: manifest / UI / processor split

**Principle:** the thing the site imports at build time (manifest + content) must never import processing code. Processing code is reachable only through dynamic `import()` inside the worker.

```ts
// packages/tool-sdk/src/types.ts  (conceptual; final API set in Phase 1)

export type Category = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'developer'
  | 'data' | 'ocr' | 'calculator' | 'generator' | 'file' | 'forms';

export type ExecutionMode = 'browser' | 'server' | 'hybrid';
export type PrivacyClass =
  | 'on-device'           // bytes never leave the frame; enforced by CSP
  | 'server-ephemeral'    // uploaded with consent; deleted ≤ 1 h after completion
  | 'third-party';        // a named external processor; explicit consent

export interface FileSpec {
  mime: string[];             // validated against magic bytes, not just extension
  extensions: string[];
  maxBytes: { desktop: number; mobile: number };   // device-class limits
  maxCount: number;           // batch limit
  maxPixels?: number;         // decompression-bomb guard for images
  maxPages?: number;          // PDFs
  maxDurationSec?: number;    // media
}

export interface ToolManifest<O = unknown> {
  id: string;                 // stable, never reused: 'image.compress'
  version: number;            // bump on behaviour change affecting output
  slug: string;               // 'compress-image'
  category: Category;
  status: 'draft' | 'beta' | 'live' | 'deprecated';
  i18n: Record<string, {      // per-locale strings; 'en' required
    name: string; h1: string; seoTitle: string; seoDescription: string;
    shortDescription: string; searchAliases: string[]; // task-language synonyms
  }>;
  input: { kind: 'files'; spec: FileSpec } | { kind: 'text'; maxChars: number } | { kind: 'none' };
  output: { mime: string[]; naming: string };        // e.g. '{name}-{w}x{h}.{ext}'
  execution: ExecutionMode;
  privacy: PrivacyClass;
  engine: EngineId;           // 'image' | 'pdf' | 'media' | ... (for budgets & preloading)
  options: OptionsSchema<O>;  // Valibot schema: validation + defaults + form generation + URL serialisation
  presets?: Array<{ id: string; label: string; options: Partial<O> }>;
  capabilities: {
    batch: boolean; pipelineIn: string[]; pipelineOut: string[];
    cancellable: boolean; progress: 'none' | 'indeterminate' | 'determinate';
    targetSize?: boolean;     // uses the constraint engine
  };
  resources: { weight: 'light' | 'medium' | 'heavy'; peakMemoryFactor: number }; // × input size
  related: string[];          // tool ids → internal links
  load: {                     // the ONLY references to code, as lazy loaders
    ui: () => Promise<{ default: ToolUI<O> }>;            // optional custom UI
    processor: () => Promise<{ default: Processor<O> }>;  // resolved inside the worker only
  };
}

export interface ProcessingContext {
  signal: AbortSignal;
  progress(fraction: number, label?: string): void;
  device: { class: 'low' | 'mid' | 'high'; memoryBudgetBytes: number };
  scratch: ScratchStore;      // OPFS-backed temporary storage, auto-cleaned
  log(event: SafeLogEvent): void;   // typed; cannot carry file content
}

export interface ToolResult {
  outputs: Array<{ blob: Blob; name: string; mime: string; bytes: number;
                   facts: Record<string, string | number | boolean> }>; // dims, pages, duration…
  verification: Array<{ check: string; passed: boolean; detail?: string }>; // e.g. 'bytes ≤ 102400'
  warnings: WarningCode[];
}

export class ToolError extends Error {
  constructor(public code: ErrorCode,          // closed union: 'INPUT_CORRUPT', 'ENCRYPTED_PDF',
              public userMessage: MessageKey,  //   'TARGET_UNREACHABLE', 'OUT_OF_MEMORY', ...
              public retryable: boolean,
              public details?: SafeDetails) { super(code); }
}

export type Processor<O> = (input: ToolInput, options: O, ctx: ProcessingContext)
  => Promise<ToolResult>;          // one item; batch is orchestrated by the runtime
```

**Rules**
1. `processor` is per-item. **Batch, retries, concurrency, ZIP, cancellation, progress aggregation, verification display, downloads are runtime features**, not tool code.
2. Simple tools ship **no custom UI**: the runtime renders a form from the options schema (labels from i18n). Complex tools (PDF organiser, crop) provide `ui`.
3. Errors are a **closed union of codes** mapped to localized messages. No raw exception text reaches users.
4. `version` bumps when output changes; analytics/error dashboards segment by `id@version`.
5. **Registration = adding a folder.** A codegen step (`pnpm registry:build`) globs `tools/**/manifest.ts`, validates them (unique ids/slugs, related ids exist, i18n complete, budgets declared), and emits `registry.generated.ts` (metadata only) + search index + sitemap input. No edits to shared files are needed to add a tool.

**Why a schema library (Valibot):** one definition gives runtime validation (options from URL hash are untrusted), defaults, generated forms and typed options. Valibot over Zod for tree-shaken size (Zod 4 Mini is an acceptable alternative; decide in the Phase 1 spike by measured bundle size).

---

## ADR-05 — Shared engines (packages) rather than per-tool libraries

| Engine package | Contents | Used by |
|---|---|---|
| `engine-image` | decode (native `createImageBitmap`, HEIC path), resize (OffscreenCanvas high-quality; wasm-vips later if needed), encode (native → jSquash MozJPEG/WebP/AVIF/OxiPNG per need), EXIF read/strip, orientation fix | all image + form tools, image→PDF, OCR preprocessing |
| `engine-pdf` | pdf.js (render/text), pdf-lib fork (structure ops), qpdf-wasm (encrypt/decrypt/linearize/repair), image-recompression walker | all PDF tools |
| `engine-media` | Mediabunny (WebCodecs) demux/mux/transcode/trim; capability probe; ffmpeg.wasm single-thread fallback (separately loaded) | video/audio tools |
| `engine-ocr` | tesseract.js + preprocessing (deskew, threshold — Doc B evidence), language-pack loader | OCR tools |
| `engine-text`, `engine-data` | pure TS: diff, case, CSV (PapaParse), YAML, JSON, hashing (Web Crypto) | text/dev/data |
| `engine-archive` | fflate (zip write, streaming), zip.js (read) with bomb guards | batch download, ZIP tools |
| `constraints` | target-size/dimension solver + verifier (ADR-06) | image/PDF/video compress, form tools |

Each engine exposes small, stable functions; heavy WASM is lazy-loaded *inside* the engine by capability (`await loadEncoder('avif')`). Engines never import UI.

---

## ADR-06 — Constraint engine (exact-output processing)

```
solve(input, constraints = {maxBytes, minBytes?, width?, height?, fit, format, dpi?, qualityFloor},
      strategy = [quality ↓ (binary search, 7 iterations max) → scale ↓ (geometric 0.9 steps) → chroma/grayscale (if allowed)])
→ best candidate satisfying all constraints, or closest candidate + 'TARGET_UNREACHABLE' + reason
```
- Byte accounting uses **1 KB = 1000 bytes by default with a 2% safety margin**, displayed explicitly ("97.8 KB = 97,812 bytes"); KiB toggle available. (Doc B: portals differ.)
- **Verification after encode** is mandatory: re-decode, check dimensions, bytes, format, DPI metadata. The result panel shows every check.
- Monotonicity assumption (quality↑ ⇒ bytes↑) is not guaranteed; the solver keeps the best feasible candidate seen, not the last.
- Min-KB constraints (some portals reject files that are *too small*) are satisfied by raising quality first, then (if allowed) padding metadata — flagged to the user.

---

## ADR-07 — Runtime: workers, memory, cancellation, cleanup

- **Worker pool** sized `min(navigator.hardwareConcurrency - 1, deviceClass.max)`: low = 1, mid = 2, high = 4. One job item per worker at a time.
- **Preflight** before processing: estimate peak memory (`pixels × 4 × factor` for images; `bytes × manifest.peakMemoryFactor` otherwise) vs. device budget (`navigator.deviceMemory` where available, else UA heuristics: iOS Safari conservative). Over budget ⇒ block with a clear message instead of crashing the tab.
- **Transferables** for ArrayBuffers (no copies); **Blobs/OPFS** for intermediates > 64 MB; streams for ZIP output (`fflate` streaming to a `WritableStream` / File System Access API where supported).
- **Cancellation:** cooperative via `AbortSignal` between steps; a WASM call that cannot be interrupted ⇒ **terminate the worker** and replace it. Same on timeout (per-item soft limit from manifest weight).
- **Crash containment:** worker `error`/`messageerror` ⇒ item marked failed with `ENGINE_CRASHED`, other items continue; repeated crash ⇒ lower concurrency to 1 and retry once.
- **Cleanup:** every object URL is tracked and revoked on item removal/page hide; OPFS scratch directory per session deleted on start-up and on `pagehide`.
- **Pipelines:** a pipeline is `Array<{toolId, options}>`; compatible when `out` MIME of step *n* ∈ `pipelineIn` of step *n+1*. Intermediates stay as Blobs in the frame. Pipelines serialize to the URL hash (CyberChef-style) — never the files.

---

## ADR-08 — What runs where

| Workload | Where | Why |
|---|---|---|
| Text, developer, data, calculators, generators | Browser, main-thread-free (worker for anything O(n) on large input; regex with timeout) | Trivial cost; instant |
| Images (all launch tools) | Browser workers | Native + WASM codecs are fast; no upload |
| PDF structural (merge/split/organize/protect/unlock/page numbers/watermark/extract text) | Browser | pdf-lib/qpdf/pdf.js are sufficient |
| PDF compression | Browser (permissive DIY engine) → re-evaluate with MuPDF licence | Doc C §5 |
| Video/audio ≤ device limits (e.g. ≤ 500 MB desktop / ≤ 150 MB mobile — to be benchmarked) | Browser (Mediabunny/WebCodecs) | Hardware encoders; zero server cost |
| OCR (images, PDFs ≤ ~30 pages) | Browser (tesseract.js) | Cost; privacy |
| Office ↔ PDF, large/long video, bulk OCR beyond device limits | **Server (Phase 3)**, consent + `server-ephemeral` | Browser can't do it reliably without SAB/huge downloads |
| AI (background removal, transcription, upscaling) | Browser with ONNX/Transformers.js when model licence permits; otherwise defer | Server GPU cost unjustified by ad RPM |

---

## ADR-09 — Backend (Phase 3, only when server tools ship)

| Component | Choice | Alternatives considered |
|---|---|---|
| API edge | **Cloudflare Worker (TypeScript)**: auth-less job API, Turnstile on suspicious traffic, rate limiting (per IP /24 + per fingerprint-free token), presigned R2 URLs | Node/Fastify on a VM (more ops); FastAPI (Python adds a second language with no benefit at this layer) |
| Queue | **Cloudflare Queues** (at-least-once; idempotent job ids) | Redis/BullMQ on a VM (needs ops); SQS |
| Object storage | **R2** — $0.015/GB-month, free egress, 10 GB free (V) | S3 (egress cost) |
| Processor | **Cloudflare Containers** (standard-2: 1 vCPU / 6 GiB, $0.000020/vCPU-s + $0.0000025/GiB-s; scale to zero) running a small **Go** runner that wraps native binaries | Hetzner dedicated vCPU (from €43.49/mo, V) once load is steady — cheaper at constant utilisation; Fly.io/Cloud Run similar |
| Job state | Durable Object per job (status, progress, expiry) — no SQL database needed | Postgres (unnecessary until accounts exist) |
| Why Go for the runner | Static binary, tiny image, good process/timeout control, low memory overhead | Node (fine, larger image); Rust (slower to build) |

**Job lifecycle:** `POST /jobs` (tool id, options, declared size) → 201 + presigned PUT (expires 10 min, max size enforced by signature) → client uploads → `POST /jobs/{id}/start` → queue → processor downloads to tmpfs, runs engine under limits, uploads result, sets status → client polls `GET /jobs/{id}` (or SSE) → presigned GET (expires 15 min) → **delete input immediately after processing, output 60 min after completion** (scheduled cleanup via cron Worker every 10 min; R2 lifecycle rule at 1 day as backstop). Idempotency: job id is a ULID; processors check status before work; results are written under job id so retries overwrite rather than duplicate.

**Isolation & limits per job:** container per job type; non-root; read-only root FS; tmpfs scratch sized to 3× input cap; **no outbound network** except R2; `timeout` + `ulimit -v`/cgroup memory; one job per container instance at a time so one large file can only kill its own instance; input caps enforced *before* upload (signed size) and again on download.

---

## ADR-10 — Hosting, CDN and caching

| Asset | Cache layer | Policy |
|---|---|---|
| HTML (tool, category, home) | Edge (static assets) + browser | `Cache-Control: public, max-age=0, must-revalidate` + ETag (deploys must show instantly; static asset requests are free on Workers static assets — V) |
| Hashed JS/CSS/WASM/fonts (`/_assets/*.{hash}.*`) | Edge + browser | `public, max-age=31536000, immutable` |
| Frame HTML (`/t/<toolId>@<hash>/`) | Edge + browser | immutable (hash in path) |
| OCR language data, codec WASM | Edge + **Service Worker (Cache API)** after first use | immutable; SW caches on demand only (no precache of heavy engines) |
| Search index (JSON, per locale) | Edge + browser | hashed, immutable |
| API responses (job status) | **Never cached** | `no-store` |
| Presigned URLs, user outputs | **Never cached** | `no-store`, `private` |
| Anything containing user content | **Never cached anywhere, never logged** | — |

**Fonts:** one variable font subset, self-hosted (Astro Fonts API), `font-display: swap`, preload only the Latin subset used above the fold; system font stack acceptable.

---

## ADR-11 — Observability without user content

- **Product analytics:** Cloudflare Web Analytics (RUM incl. CWV) + custom events to **Workers Analytics Engine** from the parent page: `tool_view`, `tool_start`, `tool_success`, `tool_fail{code}`, `download`, with `toolId@version`, device class, size **bucket**, duration bucket. Never: filenames, text, hashes of content, exact sizes, URLs with options containing user text.
- **Errors:** Sentry (or self-hosted GlitchTip) in the frame with `beforeSend` scrubbing; breadcrumbs disabled for DOM/console; only `ToolError.code` + stack of our code.
- **SEO:** Search Console + Bing Webmaster Tools (Doc H).
- **Server (Phase 3):** structured logs with job id, tool id, durations, exit codes; no filenames.

---

## ADR-12 — Monorepo & tooling

pnpm workspaces + Turborepo (task caching), TypeScript strict, ESLint (flat config) + `eslint-plugin-boundaries`/dependency-cruiser for layer rules, Prettier, Vitest (unit, node + browser mode), Playwright (e2e on Chromium/WebKit/Firefox + mobile emulation, plus real-device runs via a device cloud before release), `size-limit` per entry, Lighthouse CI, Renovate, OSV-Scanner, CycloneDX SBOM, license allowlist gate. Details in Docs J and K.

---

## Decisions explicitly deferred (and their triggers)

| Deferred | Introduce when |
|---|---|
| Server processing stack (ADR-09) | First server tool approved in Phase 3 |
| Database (Postgres) | Accounts/saved presets/premium exist |
| Accounts & payments | Validated premium demand (Doc I) |
| i18n beyond English (+ Hindi for form tools) | Search Console shows non-English demand or form-tool launch |
| Cross-origin isolated workspace | A multithreaded engine is essential and WebCodecs alternatives fail |
| wasm-vips / magick-wasm | Native resize quality or format coverage proves insufficient in fixtures |
