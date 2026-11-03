# Deliverable C — Open-Source Technology Audit

**Data source:** GitHub REST API (stars, open issues, last push, archived, detected license) queried 4 Nov 2026; README/LICENSE pages fetched the same day. "Last push" = most recent push to any branch, not necessarily a release.

> **Not legal advice.** Every row marked ⚖️ needs review by a lawyer before use in a closed-source commercial product.

---

## 1. Full-application suites (reference / possible reuse)

| Repo | License (detected / stated) | ★ | Open issues | Last push | Stack | Verdict |
|---|---|---|---|---|---|---|
| [GoogleChromeLabs/squoosh](https://github.com/GoogleChromeLabs/squoosh) | Apache-2.0 | 26.1k | 262 | 2026-10-22 | TS, Preact, WASM codecs | **Reuse codecs via jSquash**; study compare-slider UX. Don't fork the app (single-image design; batch #1259 open since 2022) |
| [gchq/CyberChef](https://github.com/gchq/CyberChef) | Apache-2.0 (+Crown Copyright) | 36.3k | 599 | 2026-11-02 | JS | **Adopt the concept** (recipes, URL-encoded pipelines). Code is operation-heavy legacy JS; don't fork |
| [iib0011/omni-tools](https://github.com/iib0011/omni-tools) | MIT | 10.6k | 94 | 2026-10-24 | React, MUI, Vite | Reference for tool scaffolding (`script:create:tool`). MUI is heavy for our budgets; don't fork |
| [CorentinTh/it-tools](https://github.com/CorentinTh/it-tools) | GPL-3.0 ⚖️ | 41.1k | 862 | 2026-10-27 | Vue, Vite, UnoCSS | **Reference only.** Study per-tool folder + generator; GPL incompatible with closed code |
| [alam00000/bentopdf](https://github.com/alam00000/bentopdf) | AGPL-3.0 ⚖️ / **$79 lifetime commercial** | 16.2k | 161 | 2026-11-03 | Vite, TS, vanilla legacy | **Strongest browser-PDF reference.** Commercial licence is a real option to evaluate (§5) |
| [Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) | MIT **except** proprietary dirs (`app/proprietary/`, `engine/`, SaaS/desktop/cloud paths) ⚖️ | 95.7k | 510 | 2026-11-03 | Java/Spring + TS frontend, LibreOffice, server | Reference for server-side PDF operations list and LibreOffice orchestration. Not a browser architecture |
| [aak1247/atools](https://github.com/aak1247/atools) | AGPL-3.0 (README; API: NOASSERTION) ⚖️ | 47 | 0 | 2026-10-20 | Next.js 16, FFmpeg.wasm, PWA | **Reference** for per-tool `tool.json` + codegen + `check:tools` CI lint. Don't copy code |
| [firstlinkai/omnitools](https://github.com/firstlinkai/omnitools) (FreeTools) | MIT | **0** | 0 | 2026-10-02 | Next.js 15, React 19, Tailwind 4 | Low traction. Skim registry/sitemap generation only |
| [3141roy/personal-toolkit](https://github.com/3141roy/personal-toolkit) (Bundle) | MIT | 3 | 1 | 2026-10-24 | Astro + Svelte islands, Workers | **Architecture validation** for Astro-islands + CSP `connect-src 'self'` |
| [mithun-srinivas/DoxDock](https://github.com/mithun-srinivas/DoxDock) | MIT | 36 | 48 | 2026-10-04 | React, Vite, pdf-lib | Reference for offline PWA + "no runtime network" invariant |
| [punq/simpletoolkit](https://github.com/punq/simpletoolkit) | MIT | 1 | 0 | **2025-11-21** | TS | Stale ~1 year. Accessibility ideas only |
| [wanglingtech/Velyxora](https://github.com/wanglingtech/Velyxora) | AGPL-3.0-only (README; API: NOASSERTION) ⚖️ | 1 | 7 | 2026-09-27 | React, Node, native binaries | Reference for honest hybrid capability reporting |

**Overall conclusion:** **Do not fork any suite.** None matches our performance budgets and architecture (sandboxed frame, manifest/processor split, constraint engine), and the strongest code (BentoPDF, IT Tools, ATools) is copyleft. Build our own shell; reuse **libraries** (§2) and, where justified, buy a **commercial engine licence** (§5).

---

## 2. Processing libraries (candidate dependencies)

### 2.1 Images
| Library | License | ★ / last push | Use | Notes |
|---|---|---|---|---|
| [jamsinclair/jSquash](https://github.com/jamsinclair/jSquash) | Apache-2.0 (codecs carry their own: mozjpeg = IJG/BSD-style, libwebp BSD, libavif BSD, oxipng MIT) | 741 / 2026-01-05 | **Primary encoders** (MozJPEG, WebP, AVIF, OxiPNG, JXL) in workers, per-codec lazy loading | Derived from Squoosh; worker-friendly. Check each codec's licence in SBOM |
| Browser-native `createImageBitmap` / `OffscreenCanvas` / `convertToBlob` | — | — | **Decode + resize + fast JPEG/WebP/PNG encode** | Free, fast, zero bundle. Quality knobs limited; use native first, jSquash when quality/target-size matters |
| [kleisauke/wasm-vips](https://github.com/kleisauke/wasm-vips) | MIT wrapper; **libvips LGPL-2.1** ⚖️ | 892 / 2026-10-25 | High-quality resize (Lanczos), TIFF, large images via streaming | LGPL in a WASM bundle: dynamic-linking analogue unclear → legal review. Defer; use only if native resize quality insufficient |
| [dlemstra/magick-wasm](https://github.com/dlemstra/magick-wasm) | Apache-2.0 (ImageMagick licence) | 902 / 2026-11-03 | Exotic formats (ICO, BMP, TIFF, PSD read) | Large bundle; load only for rare formats |
| [hoppergee/heic-to](https://github.com/hoppergee/heic-to) | API: NOASSERTION; uses **libheif (LGPL-3.0)** + HEVC decoder ⚖️ | 360 / 2026-10-27 | HEIC→JPG/PNG in non-Safari browsers | **Legal review: LGPL + HEVC patents.** Safari decodes HEIC natively — use native path first |
| [alexcorvi/heic2any](https://github.com/alexcorvi/heic2any) | MIT wrapper (libheif inside) ⚖️ | 896 / **2024-04-11** | — | Stale; avoid |
| [Donaldcwl/browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) | MIT | 1.7k / **2024-03-08** | — | Stale; our constraint engine replaces it |
| [imgly/background-removal-js](https://github.com/imgly/background-removal-js) | **AGPL-3.0** ⚖️ | 7.4k / 2025-07-18 | — | **Avoid** in closed product. Background removal needs a permissively licensed model (check each model's licence — several popular ones are non-commercial) |

### 2.2 PDF
| Library | License | ★ / last push | Use | Notes |
|---|---|---|---|---|
| [mozilla/pdf.js](https://github.com/mozilla/pdf.js) | Apache-2.0 | 54.1k / 2026-11-03 | **Render thumbnails/pages, text extraction** | Mature, active. Large (~1 MB+ worker) — lazy |
| [Hopding/pdf-lib](https://github.com/Hopding/pdf-lib) | MIT | 8.7k / **2024-07-17** | — | **Unmaintained** (318 open issues). No encryption support |
| [cantoo-scribe/pdf-lib](https://github.com/cantoo-scribe/pdf-lib) | MIT | 358 / 2026-09-11 | **Merge/split/reorder/rotate/page numbers/watermark/forms** | Maintained fork. Small community → pin + own tests |
| qpdf compiled to WASM (several community builds; qpdf itself Apache-2.0) | Apache-2.0 | (build-dependent) | **Encrypt/decrypt (protect/unlock), linearize, object-stream compression, repair** | BentoPDF bundles `qpdf-wasm`. Vet a build or compile our own (reproducible) |
| [ArtifexSoftware/mupdf.js](https://github.com/ArtifexSoftware/mupdf.js) | **AGPL-3.0 / commercial (Artifex)** ⚖️ | 609 / 2026-07-01 | Best-quality render, image recompression, redaction, text editing | **Best engine for PDF compression + true redaction**; requires commercial licence for closed use |
| Ghostscript (ghostpdl) | **AGPL-3.0 / commercial (Artifex)** ⚖️ | mirror | Gold-standard PDF compression, PDF/A | Server or WASM; licence needed. BentoPDF loads it from CDN to keep it out of its own source |
| [embedpdf/embed-pdf-viewer](https://github.com/embedpdf/embed-pdf-viewer) (PDFium WASM) | API: NOASSERTION (PDFium is BSD-3/Apache) ⚖️ | 4.6k / 2026-11-03 | Alternative renderer/editor | Verify the repo's licence file before use |
| [pdfcpu/pdfcpu](https://github.com/pdfcpu/pdfcpu) | Apache-2.0 | 8.9k / 2026-11-02 | Server-side PDF ops (Go); could compile to WASM (Go→WASM is large) | Good server option if we go Go-based |

### 2.3 Audio/Video
| Library | License | ★ / last push | Use | Notes |
|---|---|---|---|---|
| [Vanilagy/mediabunny](https://github.com/Vanilagy/mediabunny) | **MPL-2.0** (file-level copyleft: modified Mediabunny files must stay open; our code unaffected) | 7.4k / 2026-11-03 | **Primary**: demux/mux MP4/WebM/MKV/MP3/WAV/OGG…, trim, convert, compress via WebCodecs (hardware-accelerated where available) | Vendor benchmark: 804 vs 12 fps vs ffmpeg.wasm for a resize/convert task; Remotion's independent test also shows large gaps. Depends on WebCodecs codec availability per browser |
| [ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) | MIT wrapper; **core built with `--enable-gpl`, x264, x265, libvpx, lame…** ⚖️ | 17.9k / 2026-09-29 | **Fallback only** for formats WebCodecs can't decode/encode (e.g., legacy AVI/WMV, some audio) | Shipping it = distributing GPL binaries (must offer corresponding source) + H.264/HEVC patent exposure. Build a custom **LGPL core without x264/x265** if possible. Multithread core needs SharedArrayBuffer (unavailable in our non-isolated pages) → single-thread only |
| WebCodecs (browser) | — | — | Encode/decode | caniuse (via search): Safari 26.0+ full, Firefox desktop 130+ (not Android), Chrome 94+. **AAC encode absent in Firefox** (3P). Feature-detect per codec with `isConfigSupported` |
| Web Audio API / MediaRecorder | — | — | Volume, silence detection, recording | Free, native |

### 2.4 OCR / ML
| Library | License | Use | Notes |
|---|---|---|---|
| [naptha/tesseract.js](https://github.com/naptha/tesseract.js) | Apache-2.0 (Tesseract Apache-2.0; traineddata Apache-2.0) | Image/PDF OCR in browser | Language data downloads are multi-MB per language — lazy, cached via service worker. API metadata query failed (encoding) — verify activity manually |
| Transformers.js / ONNX Runtime Web | Apache-2.0 (models vary ⚖️) | Background removal, transcription (Whisper), upscaling | **Model licences vary — several are non-commercial.** Long-term only |

### 2.5 Data, text, archives, misc
| Library | License | ★ / last push | Use |
|---|---|---|---|
| [101arrowz/fflate](https://github.com/101arrowz/fflate) | MIT | 3.1k / 2026-05-16 | **ZIP creation (streaming), gzip** — small (8 kB) |
| [gildas-lormeau/zip.js](https://github.com/gildas-lormeau/zip.js) | BSD-3-Clause | 3.9k / 2026-10-22 | **Unzip** with streams, encryption, large files |
| [Stuk/jszip](https://github.com/Stuk/jszip) | MIT **or** GPL-3.0 (dual; choose MIT) | 10.4k / 2026-09-09 | Not needed if fflate + zip.js |
| [mholt/PapaParse](https://github.com/mholt/PapaParse) | MIT | 13.6k / 2026-10-27 | CSV parsing, streaming, workers |
| SheetJS CE | Apache-2.0 ⚖️ (distribution moved to SheetJS CDN; npm version outdated) | — | XLSX read/write — verify current distribution terms |
| [kpdecker/jsdiff](https://github.com/kpdecker/jsdiff) | BSD-3-Clause | 9.2k / 2026-10-30 | Text diff |
| [sindresorhus/file-type](https://github.com/sindresorhus/file-type) | MIT | 4.3k / 2026-10-29 | **Magic-byte validation** (shared input validation) |
| [cure53/DOMPurify](https://github.com/cure53/DOMPurify) | Apache-2.0 / MPL-2.0 | 17.5k / 2026-11-01 | Sanitize SVG/HTML/Markdown output |
| [soldair/node-qrcode](https://github.com/soldair/node-qrcode) | MIT | 8.2k / **2024-08-23** | Stale-ish; consider [nuintun/qrcode](https://github.com/nuintun/qrcode) (MIT, active) for encode+decode |
| [zxing-js/library](https://github.com/zxing-js/library) | Apache-2.0 | 2.9k / 2026-10-17 | Barcode/QR decoding; or native `BarcodeDetector` where available |
| CodeMirror 6 | MIT | (repo `codemirror/dev` archived → moved) | Lightweight code editor for JSON/regex tools. **Prefer over Monaco** (Monaco is MB-scale) |
| [lovell/sharp](https://github.com/lovell/sharp) | Apache-2.0 (libvips LGPL inside prebuilt binaries ⚖️) | 32.8k / 2026-10-29 | Server-side images if ever needed |
| [pyodide/pyodide](https://github.com/pyodide/pyodide) | MPL-2.0 | 14.9k / 2026-11-03 | Avoid: large runtime; only if a Python-only engine becomes essential |

---

## 3. License compatibility matrix (closed-source, ad-funded web service)

| License | Ship in browser bundle (= distribution) | Run on our server only | Obligations | Risk |
|---|---|---|---|---|
| MIT / BSD / ISC | ✅ | ✅ | Keep notices (third-party notices page) | Low |
| Apache-2.0 | ✅ | ✅ | Notices + NOTICE file; patent clause | Low |
| MPL-2.0 (Mediabunny, Pyodide) | ✅ | ✅ | Publish source of *modified MPL files* only | Low |
| LGPL-2.1/3.0 (libvips, libheif, LAME) ⚖️ | ⚠️ | ✅ (unmodified, separate process) | Allow relinking/replacement; in a WASM bundle this needs care (separately loaded `.wasm` module + source offer is the common approach) | Medium |
| GPL-3.0 (IT Tools, ffmpeg.wasm GPL core) ⚖️ | ❌ for our code; ⚠️ separate GPL module with source offer may be "aggregate" — **legal opinion required** | ✅ unmodified CLI binary in separate process | Source of the GPL component + licence text | High |
| AGPL-3.0 (BentoPDF, ATools, MuPDF, Ghostscript, imgly) ⚖️ | ❌ | ❌ if modified and network-served; unmodified CLI-only use still needs opinion | Full corresponding source of the combined work | **High — buy commercial licence or avoid** |
| Codec patents (H.264, HEVC, AAC) ⚖️ | Prefer browser WebCodecs (browser vendor's licence) over shipping our own encoders | Server encoders: check patent pool exposure per country | — | Medium |

**Rule we adopt:** permissive-only in the browser bundle by default. Anything else needs a recorded decision (ADR) and, for ⚖️, legal sign-off. CI enforces it with a license allowlist (`license-checker`/SBOM gate).

---

## 4. Per-project answers to the brief's ten questions (main candidates)

| Q | Squoosh/jSquash | CyberChef | OmniTools | IT Tools | BentoPDF | Mediabunny | pdf.js | pdf-lib fork |
|---|---|---|---|---|---|---|---|---|
| Reuse whole? | No | No | No | No (GPL) | No (AGPL) / maybe via commercial | n/a lib | n/a lib | n/a lib |
| Reuse components? | **Yes** (jSquash codecs) | Ideas, some ops | UI ideas | Ideas | Via commercial licence | **Yes** | **Yes** | **Yes** |
| Adapt architecture? | Worker+WASM codec pattern | Recipe model | Generator script | Generator + registry | Engine selection per tool | — | — | — |
| License OK commercially? | ✅ | ✅ (notices) | ✅ | ❌ | ⚖️ | ✅ | ✅ | ✅ |
| Dependencies differ? | Yes — per codec | Some | MUI etc. | — | AGPL CDN engines | No heavy deps | — | — |
| Actively maintained? | Low activity | Yes | Yes | Yes | Yes (very) | Yes | Yes | Fork yes; upstream no |
| Production-ready? | Codecs yes | Yes | Self-host grade | Yes | Yes | Yes (young) | Yes | Yes with tests |
| Limitations | No batch/target | Technical UX | Heavy UI lib | Dev-only | Legacy code, CDN AGPL | WebCodecs gaps | Big bundle | No encryption |
| Learn from code | Codec workers, compare UI | Operation interface, recipe serialization | Tool templates | Tool conventions | Breadth of PDF ops, edge cases | WebCodecs pipeline | Worker setup | Page ops |
| Avoid copying | Single-image UX | Dense UI | MUI weight | Code (GPL) | Code (AGPL), CDN-loaded engines (breaks strict CSP + privacy claim) | — | — | — |

---

## 5. Build vs. buy for the hardest engine (PDF compression & redaction)

| Option | Quality | Licence cost | Effort | Privacy/CSP fit |
|---|---|---|---|---|
| A. Permissive DIY: pdf-lib fork walks image XObjects → decode → downscale → re-encode with jSquash MozJPEG → replace; qpdf for object streams; pdf.js raster mode for scanned docs | Good for image-heavy PDFs; weak for fonts/vector-heavy | $0 | **High** (colour spaces, SMasks, JBIG2/CCITT, inline images) | ✅ |
| B. MuPDF commercial licence (WASM) | Excellent; also true redaction, text extraction | **Unknown — request quote from Artifex** | Medium | ✅ (self-hosted wasm) |
| C. BentoPDF commercial ($79 lifetime) + Hyper Compress ($99/yr if used outside their tools) | Good (per their claims, NV) | Low | Low–Medium; but their app is a competitor product and code quality has legacy parts | ⚠️ default config loads AGPL engines from CDN — must self-host |
| D. Server Ghostscript (commercial licence) | Excellent | Quote needed | Medium + server cost | ❌ upload required |

**Recommendation:** Start with **A** for launch (limited, honest scope: "best for scanned and photo-heavy PDFs"), in parallel request a **MuPDF commercial quote (B)**. Decide by end of Phase 2 using fixture benchmarks (size reduction % and legibility on a 40-PDF corpus).

---

## 6. Security notes from the audit
- OmniTools #377 reported ReDoS via user regex (bigads.md) → all regex tools run in a worker with a timeout and terminate-on-overrun.
- Stirling #3283 (tracking pixel after opt-out) and OmniTools #301 (third-party analytics with document fingerprint) → automated network-egress tests per tool (Doc K).
- BentoPDF loads engines from jsDelivr at runtime → supply-chain + privacy risk; **we self-host every WASM asset with SRI-equivalent integrity (hash-named files) and CSP**.
- Pin all versions; Renovate with grouped weekly updates; `npm audit`/OSV scanning in CI; SBOM (CycloneDX) per release.
