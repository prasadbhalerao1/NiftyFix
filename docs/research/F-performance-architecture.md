# Deliverable F — Performance Architecture

All numbers below are **budgets/targets we set**, not measurements. Thresholds for Core Web Vitals come from web.dev (verified 4 Nov 2026): **LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile**, segmented mobile/desktop.

## 1. Why the site won't slow down at 200 tools

| Growth vector | Mechanism that keeps cost flat |
|---|---|
| More tool pages | Each page is static HTML; build time grows linearly, runtime cost per page is unchanged |
| More tools in nav/search | Homepage ships **no tool list JS**; search index is a separate lazily fetched JSON (~1 kB per 10 tools gz est.), loaded on first focus of the search box |
| More processing libraries | Libraries are reachable only via `import()` inside the frame's worker; Astro/Vite emits separate chunks; CI fails if a shared entry imports an engine (Doc J rules) |
| More shared UI | Shared UI used by islands is code-split per island; a budget per island entry is enforced by `size-limit` |
| More analytics/ads | Third-party scripts are confined to the parent page, loaded after LCP + idle, with fixed-size slots |

## 2. Budgets

### 2.1 Page-level (field, p75, mobile, measured via CrUX/RUM)
| Page type | LCP | INP | CLS | Parent JS (gz, excl. ads) | HTML (gz) |
|---|---|---|---|---|---|
| Homepage | ≤ 1.8 s | ≤ 150 ms | ≤ 0.05 | ≤ 15 kB | ≤ 30 kB |
| Category page | ≤ 1.8 s | ≤ 150 ms | ≤ 0.05 | ≤ 10 kB | ≤ 40 kB |
| Tool landing page (before interaction) | ≤ 2.0 s | ≤ 200 ms | ≤ 0.05 | ≤ 10 kB parent + frame ≤ 45 kB | ≤ 40 kB |

Lab gate (Lighthouse CI, Moto G Power emulation, Slow 4G): Performance ≥ 90 on all three page types; regression > 5 points fails CI.

### 2.2 Tool frame (the island) — initial load, before a file is chosen
| Tier | Frame JS (gz) | Examples |
|---|---|---|
| Light | ≤ 35 kB | text, dev, calculators, generators |
| Standard | ≤ 50 kB | image/PDF/media tools (UI only; engines not yet loaded) |
| Custom UI | ≤ 80 kB | PDF organiser (thumbnails grid), cropper |

### 2.3 Engines (lazy; downloaded on first file selection, or prefetched on drag-enter/hover of the dropzone)
| Engine bundle | Budget (transfer, compressed) | Notes |
|---|---|---|
| text/data/dev | ≤ 60 kB | CodeMirror only for tools that need an editor |
| image (native path) | ≤ 30 kB | `createImageBitmap` + OffscreenCanvas |
| image codec (each, jSquash) | ≤ 400 kB each, loaded per codec | AVIF encoder is the largest — load only when AVIF selected |
| pdf structure (pdf-lib fork) | ≤ 250 kB | |
| pdf render (pdf.js + worker) | ≤ 600 kB | only for thumbnails/raster/text |
| qpdf-wasm | ≤ 1.5 MB | only protect/unlock/repair |
| media (Mediabunny core) | ≤ 150 kB | WebCodecs does the heavy work |
| ffmpeg.wasm fallback | ≤ 12 MB, **explicit "download engine (12 MB)" step** | never auto-loaded on mobile data |
| OCR (tesseract core + 1 language) | ≤ 5 MB, user-visible progress | language packs cached by SW |

Budgets are enforced in CI by `size-limit` against built artifacts; raising a budget requires an ADR line in the PR.

### 2.4 Processing performance targets (benchmarked on the reference device matrix, §5)
| Job | Mid-range Android (e.g., 6 GB RAM, 2023 SoC) | Desktop (8-core, 2022) |
|---|---|---|
| JPEG 12 MP → 1600 px WebP, single | ≤ 1.5 s | ≤ 0.4 s |
| Target-size solve (12 MP → ≤ 100 KB JPEG) | ≤ 3 s | ≤ 1 s |
| Batch 50 phone photos resize+compress | ≤ 90 s | ≤ 25 s |
| Merge 5 PDFs (50 pages total) | ≤ 2 s | ≤ 0.5 s |
| PDF → JPG 20 pages @150 DPI | ≤ 15 s | ≤ 4 s |
| Extract audio from 5-min 1080p MP4 (no re-encode) | ≤ 5 s | ≤ 2 s |
| Compress 60-s 1080p clip → 720p ≤ 8 MB (WebCodecs) | ≤ 60 s | ≤ 15 s |
| OCR 1 A4 page (eng, 300 DPI) | ≤ 8 s | ≤ 3 s |
| UI responsiveness during any job | INP ≤ 200 ms (all processing off main thread) | same |

These are initial targets. Phase 1 benchmarks will replace them with measured baselines; then CI guards against > 20% regression.

### 2.5 Memory targets
- Peak frame memory ≤ device budget (low class: 512 MB; mid: 1 GB; high: 2 GB) — enforced by **preflight rejection**, not by hoping.
- Image decode guard: reject > 100 MP (and > 40 MP on low-class devices) before decode.
- Batch never holds more than `concurrency × 2` decoded images; outputs streamed into ZIP.

### 2.6 Server (Phase 3)
- API p95 ≤ 150 ms (job create/status); queue wait p95 ≤ 30 s; processing failure rate ≤ 1% excluding invalid input; job cost tracked per tool (Doc I).

## 3. Specific techniques (and where they apply)

| Technique | Where | Detail |
|---|---|---|
| Zero-JS content pages | Parent pages | Astro static; interactive bits (search box, theme toggle) are tiny islands `client:idle` |
| Island hydration timing | Tool frame | Frame loads `loading="eager"` (it's the main content), with dropzone server-rendered as static HTML inside the frame so it paints before JS |
| Speculative engine prefetch | Frame | `dragenter`, pointer hover over dropzone, or focus on file input ⇒ `import()` engine; `<link rel=modulepreload>` not used for engines (too eager) |
| Workers everywhere | Frame | Main thread only renders; `postMessage` with transferables |
| Progressive results | Image/PDF | Show first output while the batch continues; thumbnails rendered at low res first |
| Virtualized lists | Batch queue > 50 items, PDF thumbnails > 100 pages | `@tanstack/virtual` or minimal custom |
| Image optimization (our own assets) | Site | Astro `<Image>` → AVIF/WebP, explicit width/height |
| Fonts | Site | 1 variable font, subset, self-hosted, swap |
| Ads | Parent | Load after `requestIdleCallback` post-LCP; fixed min-height containers; no ads above the fold on mobile tool pages; no sticky ads covering tool controls |
| Caching | All | Doc E ADR-10 |
| Back/forward cache | Parent + frame | Avoid `unload` handlers; close workers on `pagehide` |

## 4. Network behaviour
- First visit to a tool page: HTML (≤ 40 kB) + CSS (≤ 15 kB) + frame HTML/JS (≤ 50 kB) ≈ **≤ 110 kB** before ads.
- Repeat visit: HTML revalidation only; all hashed assets from browser cache.
- Engines fetched once and cached by the browser (immutable); OCR/ffmpeg also via Service Worker for offline reuse.
- No runtime CDN third-party for engines (unlike BentoPDF's jsDelivr loads) — integrity, privacy and CSP.

## 5. Benchmarking methodology
1. **Device matrix:** low (2–3 GB Android Go-class), mid (6 GB Android), iPhone SE (2nd/3rd gen) Safari, recent iPhone, Windows laptop (Chrome/Edge/Firefox), MacBook (Safari/Chrome).
2. **Fixture corpus** (Doc K) with fixed hashes; benchmarks run 5×, report median and p90, discard the first (warm-up) run.
3. **Lab CWV:** Lighthouse CI per PR on 6 representative URLs; **field CWV:** CrUX (via PageSpeed API) weekly + Cloudflare RUM daily.
4. **Processing benchmarks:** Playwright scripts executing tools in real browsers via `page.evaluate`, timing from `tool_start` to `tool_success` events, nightly on CI runners + weekly on real devices.
5. **Memory:** `performance.measureUserAgentSpecificMemory()` in Chromium (requires cross-origin isolation — therefore only in a dedicated benchmark build), plus OS-level observation on devices.
6. **Bundle reports:** `rollup-plugin-visualizer` artifacts per build; `size-limit` gate.
7. **Competitor benchmark:** Doc A §6 protocol, quarterly.
