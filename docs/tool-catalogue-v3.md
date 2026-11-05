# Master Tool Catalogue — Online Utility Platform

**Status:** Product scope proposal  
**Source of truth:** Built from `G-first-100-tools.md`, the current implementation status, and the product decisions recorded in ADR 0002/0003.  
**Planning horizon:** No fixed tool-count target. Count distinct user workflows; consolidate variants and aliases into shared tools.  
**Initial market:** India-first acquisition, English-first product, globally accessible.

> **Consolidated 6 Nov 2026.** The live list is `packages/registry/src/planned.ts` (308 planned tools plus the built ones). Overlapping entries were merged into one tool per user job: for example, the "maker" templates (meme, avatar, collage, flyer, business card, thumbnail, slides) live inside Design Studio; Speech to Text is Transcribe Audio and Video; handwriting is a future AI mode inside Image to Text, not a separate tool. Merged names stay reachable as search-intent pages of the tool that absorbed them. Where this document and `planned.ts` differ, `planned.ts` wins.

> This is a draft product-scope catalogue, not a commitment to ship 100 tools. The original inventory contains entries that need consolidation (format aliases, presets and overlapping workflows). The current beta is Form Photo Resizer; Signature Resizer is next planned. All other items are planned unless explicitly marked otherwise.

---

## 1. Product definition

We are building a fast, browser-first online utility platform. Its scope is determined by useful, distinct jobs users need to complete—not by a target number of tools.

### Primary product promise

**Get the exact file you need. Meet the requirements. Get it done.**

Our strongest initial wedge is file preparation for upload portals: photos, signatures and documents that must satisfy exact dimensions, byte ranges, formats and other published technical requirements. The wider platform then covers common image, PDF, media, text, developer, data, archive, generator and calculator tasks.

### Product principles

1. **Correct output over number of tools.** Every tool must validate its result and explain failures honestly.
2. **Speed by design.** Static pages, small initial bundles, lazy-loaded engines, worker-based processing and no unnecessary server round trips.
3. **Browser-local by default.** All first-wave tools are planned for on-device processing. Server processing is deferred to later phases for jobs that genuinely need it.
4. **One shared platform.** File validation, queues, progress, cancellation, downloads, ZIP creation, errors and verification are shared capabilities.
5. **Distinct user jobs.** Different presets are not automatically different tools. A separate tool/page must satisfy a distinct task or meaningful search intent.
6. **Honest limits.** Do not promise portal acceptance where unpublished checks, facial recognition or human review may be involved.
7. **Privacy as an enforced baseline.** The separate-origin tool frame, restrictive CSP and network-egress tests must support the privacy claims we make.

---

### Tool-counting rule — prevent feature inflation

A **tool** is a coherent workflow that solves a distinct user problem. Do not count any of the following as extra tools by themselves:

| Do not count separately | Example | Correct treatment |
|---|---|---|
| Format pairs | PNG → JPG, WebP → PNG, HEIC → JPG | Supported operations inside Image Converter |
| Payload templates | Wi-Fi QR, vCard QR, WhatsApp QR, email QR | Input templates inside QR Studio |
| Output presets | 1080p, 720p, 9:16, target 25 MB | Settings inside the relevant video workflow |
| Batch/print modes | Bulk QR ZIP, QR print sheet | Advanced modes inside the parent studio |
| Synonyms and SEO aliases | “JPG to PNG” and “JPEG to PNG” | Route aliases/canonicalised search pages, not extra tools |
| Repeated controls | rotate, flip, crop, resize controls reused in a workflow | Shared capabilities unless they solve a genuinely separate job |

**A separate tool is justified only when the user job, workflow, validation, or expected output is materially different.** Separate URLs may be useful for discovery, but a URL is not automatically a separate product/tool. Never add filler to reach 30, 50, 100 or any other round number.

## 2. Category map

The original inventory is a candidate backlog, not a final count. Several entries are now marked for consolidation. A tool belongs to one primary category for scope reporting, even if it uses shared engines or appears in multiple navigation hubs.

| # | Primary category | Tools | What belongs here | Product role |
|---:|---|---:|---|---|
| 1 | Form & Portal Readiness | 3 | Photo, signature and passport/visa upload preparation | **Flagship differentiation**; India-first acquisition |
| 2 | Image Tools | 14 + 2 folded format routes | Compress, resize, convert, crop, metadata, watermark, image composition and image utilities | High-frequency general-purpose tasks; shared image engine |
| 3 | PDF Tools | 22 | Page operations, conversion, security, metadata, repair and document output | Core utility category with broad demand |
| 4 | Video & Audio Tools | 18 | Video compression, trimming, conversion, audio extraction and audio processing | High-value tasks; CPU-intensive, browser capability dependent |
| 5 | OCR & Extraction | 2 | Text extraction from images and searchable PDFs | Document digitisation; resource-intensive |
| 6 | Text Tools | 10 | Text cleanup, comparison, counting, transformation and writing utilities | Fast, lightweight tools and long-tail coverage |
| 7 | Developer Tools | 16 | JSON, JWT, encoding, hashes, regex, formats, timestamps and related utilities | Low-cost, technically useful breadth |
| 8 | Data & Spreadsheet Tools | 3 | CSV, JSON and spreadsheet conversion/inspection | Practical file/data workflows |
| 9 | Generators & Codes | 3 suites | QR Studio, Barcode Studio and Password Generator | Quick, self-contained utility tasks |
| 10 | Calculators | 4 | Video bitrate, aspect ratio, percentage and date calculations | Lightweight utility traffic and cross-links |
| 11 | Archive Tools | 2 | ZIP creation and extraction | Shared batch/download infrastructure |
| | **Total** | **Pending full workflow and duplication audit** | | |

### Cross-category hubs (not additional tools)

These are navigation or workflow groupings, not extra tool counts:

- **Upload Ready:** photo resizer, signature resizer, passport/visa photo maker, PDF compression, image conversion.
- **Image Studio:** image tools and image-related form preparation.
- **PDF Workspace:** PDF merge, split, organize, compress, protect, OCR and conversion.
- **Media Studio:** video and audio utilities.
- **Developer Toolbox:** developer and data utilities.
- **Quick Tools:** text, generators and calculators.

---

## 3. Draft tool inventory — legacy IDs retained pending full audit

### Category 1 — Form & Portal Readiness (3 tools)

Purpose: prepare photographs, signatures and other upload files against user-selected or officially verified portal requirements. The system must record the source and verification date of each official preset. Generic/custom settings must remain available when no official specification is verified.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 8 | **Form Photo Resizer** | Crop and prepare a photo to exact pixel dimensions and a minimum/maximum byte range; format selection, DPI where supported, background handling, filename, before/after preview and a validation report. Presets only from official notices. | Photo → JPEG/PNG/WebP file + validation report | Image engine + constraints engine; browser-local | W1 · **Built, beta** |
| 9 | **Signature Resizer** | Prepare a photographed/scanned signature: crop, auto-crop, remove excess whitespace, tune brightness/contrast/threshold, optional background whitening, exact dimensions and KB range. Preserve thin pen strokes and let users compare/undo processing. | Signature photo/scan → clean image + validation report | Image engine + constraints engine; browser-local | W1 · Next planned |
| 61 | **Passport / Visa Photo Maker** | Prepare country-specific passport/visa photo layouts, dimensions and backgrounds; optional face-position guidance. Face checks must be clearly advisory and model/licence-gated. Never guarantee acceptance by automated portal checks. | Photo → compliant-layout image + checklist | Image engine + optional face-landmark model; browser-local | W3 · Planned; model/spec research required |

### Category 2 — Image Tools (16 tools)

Purpose: common image editing, optimisation and conversion. Use one shared image engine; each tool loads only the codec or capability it needs.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 1 | **Compress Image** | Reduce image bytes with quality/format controls, target KB/byte range, before/after comparison, batch processing, per-file errors and ZIP download. Keep original when output is larger. | JPG/PNG/WebP/AVIF etc. → compressed image(s) | Native Canvas + jSquash codecs when approved; constraints; browser | W1 · Planned |
| 2 | **Resize Image** | Resize by exact pixels or percentage; fit, fill, contain, crop/pad, aspect-ratio lock and common dimension presets. | Image → resized image | createImageBitmap + Canvas/OffscreenCanvas; browser | W1 · Planned |
| 3 | **Convert Image** | Convert between supported formats such as JPG, PNG, WebP and AVIF; preserve transparency where destination supports it. Format-pair pages can share one tool/engine. | Image → image in selected format | Image engine + lazy codecs; browser | W1 · Planned |
| 4 | **Crop Image** | Interactive crop, freeform or fixed aspect ratio, exact output dimensions, rotate/straighten where supported. | Image → cropped image | Image engine + crop geometry; browser | W1 · Planned |
| 5 | **Rotate & Flip Image** | Rotate by 90°/180°/270° or arbitrary angle; horizontal/vertical flip; honour EXIF orientation. | Image → corrected image | Image engine; browser | W1 · Planned |
| 6 | **Folded into Convert Image — HEIC → JPG/PNG** | Format capability/preset only; not a separate tool. Native browser decode first; any fallback is gated by LGPL/HEVC legal review. | HEIC → JPG/PNG | Shared Image Converter; codec-gated | Folded · Not counted |
| 7 | **EXIF Viewer & Remover** | Inspect metadata such as camera, date, orientation and GPS where present; remove selected or all metadata and explain what was stripped. | Image → metadata report and/or cleaned image | Image engine + EXIF parser; browser | W1 · Planned |
| 31 | **Watermark Image** | Add text or image watermark; control position, opacity, scale, tiling and margins; batch-apply settings. | Image(s) → watermarked image(s) | Image engine; browser | W2 · Planned |
| 32 | **Blur / Pixelate Region** | Select areas to blur or pixelate faces, plates or sensitive text; provide clear warning that the operation is destructive. | Image → redacted image | Image engine + selection UI; browser | W2 · Planned |
| 33 | **Favicon Generator** | Generate favicon and web app icon sizes from a source image; export files and HTML/link tags as a ZIP. | Image → ICO/PNG icon set + HTML | Image engine + icon encoder; browser | W2 · Planned |
| 34 | **Folded into Convert Image — SVG → PNG** | Format capability/operation only; not a separate tool. Rasterise to chosen dimensions/background and sanitise untrusted SVG before rendering. | SVG → PNG | Shared Image Converter; browser | Folded · Not counted |
| 35 | **Image Color Picker** | Upload an image and inspect pixel colours; copy HEX/RGB/HSL values and optionally extract a palette. | Image → colour values/palette | Canvas sampling; browser | W2 · Planned |
| 62 | **Make Square / Add Border** | Fit image into square or chosen aspect ratio using padding/background rather than destructive crop; useful for profile pictures and social thumbnails. | Image → padded image | Image engine; browser | W3 · Planned |
| 63 | **Combine Images** | Arrange multiple images side-by-side, vertically or in a grid; choose spacing, background, order and output dimensions. | Multiple images → combined image | Image engine; browser | W3 · Planned |
| 64 | **Image Splitter (Grid)** | Split a large image into equal rows/columns or a custom grid; export files individually or as ZIP. | Image → image tiles/ZIP | Image engine + archive engine; browser | W3 · Planned |
| 66 | **Compress GIF** | Reduce animated GIF size through palette, frame and dimension optimisation; preview animation and verify output size. | GIF → optimised GIF | GIF encoder/optimiser; browser; permissive licence required | W3 · Planned; encoder licence gate |

### Category 3 — PDF Tools (22 tools)

Purpose: perform common PDF operations locally. Preserve text/vector content wherever possible. For compression and repair, report limitations honestly and never return a broken or larger file as a successful optimisation.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 10 | **Merge PDF** | Combine PDFs and optionally images; reorder files/pages, preview thumbnails and export one PDF. | Multiple PDFs/images → PDF | Maintained pdf-lib fork + pdf.js previews; browser | W1 · Planned |
| 11 | **Split PDF** | Extract page ranges, split every page or split by ranges; package multiple outputs in ZIP. | PDF → PDFs/ZIP | PDF engine; browser | W1 · Planned |
| 12 | **Compress PDF** | Reduce PDF size with image recompression and supported structural optimisation; target maximum bytes; scanned/text modes and legibility preview. Keep original if output is larger or quality is unacceptable. | PDF → smaller PDF + report | PDF engine + image engine + constraints; browser; advanced engine gated | W1 · Planned; high complexity |
| 13 | **Organize PDF** | Reorder, delete, rotate and visually select pages. “Rotate PDF”, “delete pages” and “reorder PDF” are presets/intents within this tool, not separate tool counts. | PDF → reorganised PDF | pdf.js + maintained pdf-lib fork; browser | W1 · Planned |
| 14 | **PDF to JPG/PNG** | Render pages as images; choose DPI/scale, page range and output format; ZIP multi-page results. | PDF → JPG/PNG files/ZIP | pdf.js render + image engine; browser | W1 · Planned |
| 15 | **JPG to PDF** | Combine photos/scans into a PDF; choose page size, margins, orientation, fit mode and ordering. | Images → PDF | Image + PDF engines; browser | W1 · Planned |
| 16 | **Add Page Numbers** | Add page numbers with position, style, start value, offsets and skip-first-page options. | PDF → numbered PDF | PDF engine; browser | W1 · Planned |
| 17 | **Protect PDF** | Encrypt a PDF with a user-provided password using supported encryption; explain security limits. | PDF + password → encrypted PDF | qpdf-WASM build after licence/security review; browser | W1 · Planned; engine gate |
| 18 | **Unlock PDF** | Remove encryption from a PDF when the user knows the password and is authorised to do so. No password cracking. | Encrypted PDF + known password → PDF | qpdf-WASM build after licence/security review; browser | W1 · Planned; engine gate |
| 19 | **Extract Text from PDF** | Extract selectable text and preserve reading order as far as possible; detect likely scanned PDFs and link to OCR. | Text-based PDF → TXT | pdf.js text layer; browser | W1 · Planned |
| 36 | **Watermark PDF** | Stamp text or image across selected pages; adjust opacity, position, scale, rotation and page range. | PDF + watermark → PDF | PDF engine; browser | W2 · Planned |
| 37 | **Sign PDF** | Place a visual signature image on selected pages and position/resize it. Clearly distinguish visual signing from cryptographic digital signatures. | PDF + signature image → PDF | PDF engine; browser | W2 · Planned |
| 38 | **Fill PDF Form** | Detect and fill existing AcroForm fields; preserve field values and export. Do not imply that every flat/scanned form is fillable. | Fillable PDF + field values → filled PDF | PDF engine; browser | W2 · Planned |
| 39 | **Flatten PDF** | Flatten supported form fields and annotations into page content for consistent display/printing. Explain loss of editability. | PDF → flattened PDF | PDF engine; browser | W2 · Planned |
| 40 | **Extract Images from PDF** | Extract embedded raster images where possible and export individually or as ZIP. Distinguish embedded images from rendered page screenshots. | PDF → image files/ZIP | PDF engine; browser | W2 · Planned |
| 67 | **Resize / Crop PDF Pages** | Resize pages to A4/Letter or custom dimensions; crop page margins and set per-page or all-page rules. | PDF → resized/cropped PDF | PDF engine; browser | W3 · Planned |
| 68 | **PDF Metadata Editor** | View and edit supported metadata fields such as title, author, subject and keywords; optionally remove metadata. | PDF → PDF + metadata report | PDF engine; browser | W3 · Planned |
| 69 | **Grayscale PDF** | Convert pages to grayscale; preserve vector/text where feasible, with a raster fallback clearly labelled. Verify legibility and resulting size. | PDF → grayscale PDF | PDF engine; browser | W3 · Planned |
| 70 | **Compare PDFs (Text)** | Compare extracted text across two PDF files and highlight additions, removals and changed text; not a pixel-perfect visual diff. | PDF × 2 → text comparison | pdf.js + text diff engine; browser | W3 · Planned |
| 71 | **Repair PDF** | Attempt supported structural repair/rewrite and validate whether pages can be read; never promise recovery of irrecoverably damaged data. | Damaged PDF → repaired PDF or diagnostic | qpdf-WASM build; browser | W3 · Planned; engine gate |
| 72 | **Markdown to PDF** | Render Markdown with safe sanitisation and configurable page size, margins, typography and page breaks. | Markdown → PDF | Markdown renderer + sanitiser + PDF/print pipeline; browser | W3 · Planned |
| 73 | **Word to PDF** | Convert DOC/DOCX to PDF with document layout fidelity. First planned server-side tool, using isolated LibreOffice processing, explicit consent and short retention. | DOC/DOCX → PDF | LibreOffice in isolated server processor; server | W3 · Phase 3; not launch-local |

### Category 4 — Video & Audio Tools (18 tools)

Purpose: local media editing and conversion. Feature-detect codecs before processing. Use Mediabunny/WebCodecs first where supported. No automatic server transcoding at launch; no GPL ffmpeg.wasm build without legal approval.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 20 | **Trim Video** | Set start/end time, preview the segment and export; use keyframe-aware/remux fast path when possible and explain when re-encoding is necessary. | Video → trimmed video | Mediabunny; WebCodecs where needed; browser | W1 · Planned |
| 21 | **Compress Video to Size** | Target output MB/bytes with bitrate estimation and iterative verification; presets for common upload limits only after current platform limits are verified. | Video → compressed MP4/WebM | Mediabunny + WebCodecs + constraints; browser, device-limited | W1 · Planned; high intensity |
| 22 | **Extract Audio from Video** | Extract audio without re-encoding where compatible; otherwise encode only to legally and technically supported formats. | Video → audio | Mediabunny demux/mux + browser codecs; browser | W1 · Planned |
| 23 | **Convert Audio** | Convert supported formats, configure bitrate/sample rate/channels and batch where feasible. | Audio → audio | Mediabunny + Web Audio/available codecs; browser | W1 · Planned |
| 42 | **Convert Video** | Convert between supported video containers/codecs; show browser-supported formats before upload and explain unsupported codec paths. | Video → video | Mediabunny + WebCodecs; browser | W2 · Planned |
| 43 | **Video to GIF** | Extract a segment and convert it to animated GIF or WebP; configure frame rate, dimensions and target size. | Video → GIF/WebP | Mediabunny + permissively licensed GIF encoder; browser | W2 · Planned; encoder gate |
| 44 | **Mute Video** | Remove the audio track without re-encoding when container permits. | Video → muted video | Mediabunny remux; browser | W2 · Planned |
| 45 | **Trim Audio / Ringtone** | Select an audio segment, preview it and export with optional fade in/out. | Audio → trimmed audio | Mediabunny + Web Audio; browser | W2 · Planned |
| 46 | **Volume Booster / Normalize** | Increase/normalise loudness with clipping protection and optional LUFS target; compare before/after. | Audio → processed audio | Web Audio + media encoder; browser | W2 · Planned |
| 74 | **Resize / Crop Video for Social** | Crop or pad to 9:16, 1:1, 4:5, 16:9 and custom aspect ratios; reposition subject and preview. | Video → reframed video | Mediabunny + WebCodecs; browser | W3 · Planned |
| 75 | **Rotate Video** | Correct video orientation and export with metadata rotation or re-encode depending on compatibility. | Video → rotated video | Mediabunny; browser | W3 · Planned |
| 76 | **Merge Videos** | Join multiple compatible clips; inspect codec compatibility and use fast path when possible. | Multiple videos → one video | Mediabunny; browser | W3 · Planned |
| 77 | **Extract Frames / Thumbnail** | Extract a frame at a timestamp or interval; create thumbnail images and optionally ZIP a batch. | Video → image(s) | Mediabunny + image engine; browser | W3 · Planned |
| 78 | **Change Video Speed** | Speed up or slow down a clip with duration preview and audio handling options. | Video → speed-adjusted video | Mediabunny + WebCodecs; browser | W3 · Planned |
| 79 | **Add Audio to Video** | Replace or add a soundtrack, adjust start offset and volume, and export a new video. | Video + audio → video | Mediabunny + WebCodecs; browser | W3 · Planned |
| 80 | **Merge Audio** | Join multiple audio files, set order and optional gaps/fades, then export. | Audio files → merged audio | Mediabunny + Web Audio; browser | W3 · Planned |
| 81 | **Remove Silence** | Detect quiet segments using adjustable thresholds and minimum duration; preview cuts before export. | Audio → trimmed audio | Web Audio analysis + media engine; browser | W3 · Planned |
| 82 | **Voice Recorder** | Record microphone audio with permission, format capability check, pause/resume where supported and download. | Microphone → audio file | MediaRecorder + Web Audio; browser | W3 · Planned |

### Category 5 — OCR & Extraction (2 tools)

Purpose: extract readable text from image-based inputs. This category is distinct from normal PDF text extraction (#19), which does not require OCR.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 30 | **Image to Text (OCR)** | Recognise text in photos/screenshots; language selection, deskew/threshold preprocessing, selection/copy and batch support. | Image → editable text | Tesseract.js + image preprocessing; browser | W1 · Planned; language data lazy-loaded |
| 41 | **OCR PDF (Searchable PDF)** | OCR scanned PDF pages and add a searchable text layer; preserve original page image quality and allow page limits/device warnings. | Scanned PDF → searchable PDF + extracted text | Tesseract.js + pdf.js/PDF engine; browser initially, hybrid later if justified | W2 · Planned; high intensity |

### Category 6 — Text Tools (10 tools)

Purpose: fast text transformations that should load almost instantly and normally require no file upload.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 24 | **Word & Character Counter** | Count words, characters, sentences and paragraphs; show reading time and configurable platform limits. | Text → counts/statistics | Lightweight TypeScript; browser | W1 · Planned |
| 25 | **Text Diff Checker** | Compare two text blocks/files by line, word or character; highlight insertions/deletions and copy/export diff. | Text A + Text B → diff | jsdiff or equivalent; browser | W1 · Planned |
| 47 | **Case Converter** | Convert text to uppercase, lowercase, title, sentence, camelCase, PascalCase, snake_case and kebab-case. | Text → transformed text | Lightweight TypeScript; browser | W2 · Planned |
| 48 | **Remove Duplicate Lines** | Remove duplicate lines with optional case/whitespace normalisation while preserving first-seen order. | Text/list → deduplicated text | Lightweight TypeScript; browser | W2 · Planned |
| 49 | **Sort / Shuffle / Number Lines** | Sort alphabetically/numerically/naturally, shuffle using secure/random options where needed, or number lines. | Text/list → reordered text | Lightweight TypeScript; browser | W2 · Planned |
| 50 | **Find & Replace (Regex)** | Replace literal or regex matches, preview changes and guard against catastrophic regex execution with worker timeouts. | Text → transformed text | Regex engine in worker + timeout; browser | W2 · Planned |
| 51 | **Remove Line Breaks & Extra Spaces** | Clean copied text; collapse whitespace or line breaks with paragraph-preserving modes. | Text → cleaned text | Lightweight TypeScript; browser | W2 · Planned |
| 83 | **Markdown Preview / to HTML** | Live Markdown preview and sanitised HTML export; support common Markdown features. | Markdown → preview/HTML | Markdown parser + DOMPurify; browser | W3 · Planned |
| 84 | **Text to Speech** | Read pasted text aloud using available browser voices; voice/rate/pitch controls and clear browser-support caveats. | Text → speech playback (optional recording where supported) | Web Speech API; browser | W3 · Planned |
| 85 | **Word Frequency / Keyword Density** | Analyse term frequency, phrase frequency and density; filter common stop words and export results. | Text → frequency report | Lightweight TypeScript; browser | W3 · Planned |

### Category 7 — Developer Tools (16 tools)

Purpose: developer-focused utilities for data inspection, encoding, debugging and formatting. Keep these tools lightweight; use a small editor only where needed.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 26 | **JSON Formatter & Validator** | Pretty-print/minify JSON, validate syntax, report line/column errors and handle large input in a worker. | JSON text → formatted/validated JSON | Native JSON + optional CodeMirror; browser | W1 · Planned |
| 27 | **Base64 Encode/Decode** | Encode/decode text and files; support data URIs and image preview on valid decoded data. | Text/file ↔ Base64 | Browser APIs + lightweight TypeScript; browser | W1 · Planned |
| 28 | **JWT Decoder** | Decode JWT header/payload, show claim timestamps and warnings. Explicitly state that decoding does not verify the signature. | JWT → JSON/claims | Base64URL + JSON; browser | W1 · Planned |
| 52 | **URL Encode/Decode** | Encode/decode URL components and query strings; distinguish URI and component operations. | Text ↔ encoded text | Built-in URL APIs; browser | W2 · Planned |
| 53 | **UUID Generator** | Generate UUID v4 and supported v7 values, including bulk generation and copy/download. | Options → UUID list | Web Crypto; browser | W2 · Planned |
| 54 | **Hash / Checksum (Text & File)** | Generate supported hashes for text/files; stream large files where possible; explain cryptographic versus legacy hashes. | Text/file → hash values | Web Crypto + vetted optional hash library; browser | W2 · Planned |
| 55 | **Unix Timestamp Converter** | Convert Unix seconds/milliseconds to human dates and back; show timezone-aware results. | Timestamp ↔ date/time | JavaScript Date/Intl; browser | W2 · Planned |
| 56 | **Regex Tester** | Test patterns and flags against sample text, highlight matches/captures and guard against catastrophic patterns. | Regex + text → matches/report | Worker + timeout/termination; browser | W2 · Planned |
| 57 | **JSON ↔ YAML** | Convert JSON to YAML and YAML to JSON; show parse errors and preserve supported data types. | JSON ↔ YAML | Maintained YAML parser; browser | W2 · Planned |
| 58 | **Color Converter** | Convert HEX, RGB, HSL and OKLCH; include accessible contrast checks. | Colour value → equivalent values/report | Lightweight colour library or implementation; browser | W2 · Planned |
| 65 | **Image to Base64 / Data URI** | Convert an image to a Base64 string or data URI and preview valid decoded data; cap output for memory safety. | Image ↔ Base64/data URI | Image + text engine; browser | W3 · Planned |
| 86 | **Cron Expression Explainer** | Parse cron expressions, explain each field and preview upcoming run times; state supported cron dialect. | Cron expression → explanation/schedule | Cron parser; browser | W3 · Planned |
| 87 | **XML Formatter** | Format, minify and validate XML; show parse errors and line numbers where available. | XML → formatted XML/report | DOMParser/XML serializer; browser | W3 · Planned |
| 88 | **SQL Formatter** | Format SQL with dialect selection and indentation settings; avoid executing SQL. | SQL text → formatted SQL | SQL formatter library; browser | W3 · Planned |
| 89 | **Number Base Converter** | Convert binary, octal, decimal and hexadecimal; support signed/unsigned and large integer caveats. | Number/base → converted values | BigInt + TypeScript; browser | W3 · Planned |
| 90 | **HTML Entity Encode/Decode** | Encode/decode HTML entities and show safe text output; never inject untrusted HTML directly. | Text ↔ entity-encoded text | DOM/Text APIs; browser | W3 · Planned |

### Category 8 — Data & Spreadsheet Tools (3 tools)

Purpose: lightweight data conversion and inspection, with streaming or chunking for larger inputs where feasible.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 59 | **CSV ↔ JSON** | Convert CSV to JSON and JSON to CSV; configure delimiters, headers, quoting and error handling; one engine with distinct landing intents as justified. | CSV ↔ JSON | PapaParse + data engine; browser | W2 · Planned |
| 91 | **Excel (XLSX) to CSV** | Read worksheet data and export selected sheets as CSV; preserve values as faithfully as supported and disclose formula/format limitations. | XLSX → CSV | Spreadsheet parser; browser; dependency/distribution terms must be verified | W3 · Planned; licence review |
| 92 | **CSV Viewer & Cleaner** | Preview large CSVs, choose delimiter, trim cells, remove duplicate rows and export cleaned CSV. | CSV → preview/clean CSV | Streaming CSV parser/PapaParse; browser | W3 · Planned |

### Category 9 — Generators & Codes (3 distinct tool suites)

Purpose: create, inspect and verify machine-readable codes. Payload types and batch options are features inside the relevant studio—not separate tools.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 29 | **QR Studio** | One workspace for static QR creation, payload templates, visual customisation, uploaded-image/camera scanning, safe decoding, generated-code verification, batch CSV export and print sheets. | Text, URL, structured payload, image or camera → QR image / decoded payload / print-ready sheet | QR encoder + decoder; browser | W1 · Planned; scanner folded in from legacy #93 |
| 94 | **Barcode Studio** | One workspace to generate and scan supported 1D barcode symbologies; validate content/check digits and clearly distinguish demo codes from registered retail identifiers. | Text/number or barcode image/camera → barcode image / decoded value | Barcode encoder/decoder; browser | W3 · Planned |
| 95 | **Password Generator** | Generate passwords/passphrases with length, character-set and exclusion rules using cryptographically secure randomness. | Options → password(s) | Web Crypto; browser | W3 · Planned |

### Category 10 — Calculators (4 tools)

Purpose: instant, dependency-light calculators that complement file workflows.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 60 | **Video File Size / Bitrate Calculator** | Estimate bitrate from target file size, duration and audio bitrate; calculate expected file size from bitrate. Link to Compress Video to Size. | Duration/size/bitrate → calculated values | Arithmetic; browser | W2 · Planned |
| 96 | **Aspect Ratio Calculator** | Calculate dimensions from ratio, lock aspect and find matching sizes. Link to image/video resize tools. | Dimensions/ratio → dimensions | Arithmetic; browser | W3 · Planned |
| 97 | **Percentage Calculator** | Calculate percentage, percentage change, increase/decrease and reverse percentage. | Numbers → result | Arithmetic; browser | W3 · Planned |
| 98 | **Age & Date Difference Calculator** | Calculate age and date differences; later support eligibility date calculations with explicit rule sources. | Dates → age/duration | Date arithmetic; browser | W3 · Planned |

### Category 11 — Archive Tools (2 tools)

Purpose: create and extract ZIP files safely. Archive extraction must have strong protections against path traversal, ZIP bombs and resource exhaustion.

| # | Tool | What it does / core features | Input → output | Engine / execution | Wave & status |
|---:|---|---|---|---|---|
| 99 | **Create ZIP** | Package multiple files/folders into ZIP; configure compression where supported and preserve safe relative paths. Used by batch downloads across the platform. | Files/folders → ZIP | fflate or vetted streaming ZIP library; browser | W3 · Planned |
| 100 | **Extract ZIP (Unzip)** | Inspect archive contents, selectively extract files and block path traversal, suspicious expansion ratios and oversized output. | ZIP → files/folder download | zip.js or vetted streaming archive library + bomb guards; browser | W3 · Planned |

---

## 4. Build waves and launch scope

The original roadmap used W1/W2/W3 batches of 30/30/40. Those batch sizes are historical planning labels only. This document now folds duplicate entries into parent workflows; do not add replacements just to preserve round numbers. Reprioritise by user value, evidence, implementation cost and quality.

### W1 — Initial launch candidates (deduplicated; count may be below 30)

1. Compress Image
2. Resize Image
3. Convert Image
4. Crop Image
5. Rotate & Flip Image
7. EXIF Viewer & Remover
8. Form Photo Resizer *(already built, beta)*
9. Signature Resizer *(next planned tool)*
10. Merge PDF
11. Split PDF
12. Compress PDF
13. Organize PDF
14. PDF to JPG/PNG
15. JPG to PDF
16. Add Page Numbers
17. Protect PDF
18. Unlock PDF
19. Extract Text from PDF
20. Trim Video
21. Compress Video to Size
22. Extract Audio from Video
23. Convert Audio
24. Word & Character Counter
25. Text Diff Checker
26. JSON Formatter & Validator
27. Base64 Encode/Decode
28. JWT Decoder
29. QR Studio
30. Image to Text (OCR)

**W1 implementation caveats:** This is no longer a fixed “30 tools” quota. HEIC → JPG is a codec-gated operation inside Convert Image, not a standalone tool. All first-wave workflows are intended to be browser-local at launch, but exact browser/codec support must be feature-detected. Protect/Unlock PDF need a vetted qpdf-WASM build. HEIC fallback is legally gated. Video processing is limited by device memory, codec support and battery/thermal constraints. OCR language data must be lazy-loaded.

### W2 — Next candidates (deduplicated; count may be below 30)

31. Watermark Image; 32. Blur/Pixelate Region; 33. Favicon Generator; 35. Image Color Picker; 36. Watermark PDF; 37. Sign PDF; 38. Fill PDF Form; 39. Flatten PDF; 40. Extract Images from PDF; 41. OCR PDF; 42. Convert Video; 43. Video to GIF; 44. Mute Video; 45. Trim Audio/Ringtone; 46. Volume Booster/Normalize; 47. Case Converter; 48. Remove Duplicate Lines; 49. Sort/Shuffle/Number Lines; 50. Find & Replace (Regex); 51. Remove Line Breaks & Extra Spaces; 52. URL Encode/Decode; 53. UUID Generator; 54. Hash/Checksum; 55. Unix Timestamp Converter; 56. Regex Tester; 57. JSON ↔ YAML; 58. Color Converter; 59. CSV ↔ JSON; 60. Video File Size/Bitrate Calculator.

### W3 — Later candidates (deduplicated; count may be below 40)

61. Passport/Visa Photo Maker; 62. Make Square/Add Border; 63. Combine Images; 64. Image Splitter; 65. Image to Base64/Data URI; 66. Compress GIF; 67. Resize/Crop PDF Pages; 68. PDF Metadata Editor; 69. Grayscale PDF; 70. Compare PDFs (Text); 71. Repair PDF; 72. Markdown to PDF; 73. Word to PDF; 74. Resize/Crop Video for Social; 75. Rotate Video; 76. Merge Videos; 77. Extract Frames/Thumbnail; 78. Change Video Speed; 79. Add Audio to Video; 80. Merge Audio; 81. Remove Silence; 82. Voice Recorder; 83. Markdown Preview/to HTML; 84. Text to Speech; 85. Word Frequency/Keyword Density; 86. Cron Expression Explainer; 87. XML Formatter; 88. SQL Formatter; 89. Number Base Converter; 90. HTML Entity Encode/Decode; 91. Excel to CSV; 92. CSV Viewer & Cleaner; 94. Barcode Studio; 95. Password Generator; 96. Aspect Ratio Calculator; 97. Percentage Calculator; 98. Age & Date Difference Calculator; 99. Create ZIP; 100. Extract ZIP.

**W3 caveat:** Word to PDF is planned as the first server-side tool in Phase 3, with explicit upload consent, isolation, retention and cost controls. It is not part of the initial all-local launch. The initial inventory had 100 numbered entries, but some are now folded: HEIC → JPG and SVG → PNG are operations inside Convert Image; QR scanning is a mode inside QR Studio. The resulting roadmap is intentionally smaller. Do not backfill the count.

---

## 5. Current implementation status

Based on the latest supplied implementation report (4 November 2026):

| Component/tool | Status | Notes |
|---|---|---|
| Monorepo, SDK, registry, runtime, constraints, image engine, shared UI | Built | 13 workspace packages; test and CI gates reported passing locally |
| Tool frame and Astro site shell | Built | Separate-origin sandbox architecture; actual production domain deployment still pending |
| Form Photo Resizer (#8) | **Built — beta** | End-to-end upload → crop → exact dimensions → KB range → local process → verify → download |
| Signature Resizer (#9) | **Next planned** | Reuse the image engine and constraint solver |
| Compress Image (#1) | Planned | Batch UI, ZIP and MozJPEG still deferred |
| Remaining 97 tools | Planned | Must use the shared SDK/runtime and acceptance checklist |
| Official portal presets | Not yet populated | Zero verified records in the supplied status report; do not invent presets |
| Physical-device testing | Not yet complete | Playwright emulation is not a substitute for real phones |
| Astro security upgrade | Launch blocker in supplied status | Upgrade Node/Astro and rerun gates before public launch |
| GitHub remote / Cloudflare deployment | Pending | Local commit exists; remote CI and production deployment not yet verified |

**Important:** a shared engine capability does not mean its corresponding user-facing tool is complete. For example, image dimension parsing and resizing code already used by Form Photo Resizer do not make Compress Image or Resize Image launch-ready.

---

## 6. Long-term backlog — beyond the initial candidate inventory

These are not part of the 100-tool count. They should be added only when licence, quality, demand and operating costs are justified.

| Candidate | Why it is deferred / gate |
|---|---|
| PDF to Word | High fidelity is difficult; must benchmark against real files and consider commercial PDF engine/server processing |
| Excel / PowerPoint to PDF | Server-side LibreOffice, isolation, file retention and operating cost |
| True PDF Redaction | Requires a trustworthy redaction engine; visual white boxes are not secure redaction; MuPDF commercial licence is a candidate |
| PDF/A Conversion | Engine/licensing and conformance validation required |
| Edit Existing PDF Text | Very difficult typography/font/reflow problem; do not market annotation as text editing |
| Translate PDF | Translation cost and layout preservation challenge |
| Remove Background | Model licensing, model size, inference performance and quality evaluation |
| Image Upscaling | Model licensing, large downloads and device performance |
| Audio/Video Transcription | Whisper/model size, language quality and device limits; server GPU cost may be unsuitable for ad-funded use |
| Burn Subtitles | Encoding pipeline and FFmpeg/libass licensing review |
| More country/portal-specific pages | Need verified official specs and ongoing maintenance capacity |
| Image-to-Excel / OCR-to-Spreadsheet | Table recognition quality and output verification required |
| PDF Translation / OCR Translation | High complexity, language coverage and processing cost |

---

## 7. Shared platform capabilities every applicable tool should inherit

These are platform features, not separately counted tools.

### File intake and validation

- Drag-and-drop and file picker.
- Magic-byte/MIME validation; never trust extension alone.
- Device-aware file size, pixel, page and duration limits.
- Multi-file selection where supported.
- Clear preflight message before expensive work.

### Processing lifecycle

- Queue and per-file state.
- Progress where measurable; indeterminate state when it is not.
- Cancel and cleanup.
- Worker crash/timeout isolation.
- Per-file recoverable errors and retry.
- Device-aware concurrency and memory budgets.

### Output and verification

- Actual output byte count and metadata.
- Relevant output checks (dimensions, pages, duration, format, text layer, etc.).
- Before/after preview for lossy or visual operations.
- Keep the original when an optimisation produces a larger or unacceptable result.
- Honest failure if requested constraints cannot be met.
- Safe filenames and collision handling.

### Batch and workflow

- Shared batch queue for compatible tools.
- Per-file progress and error report.
- Retry failed files.
- ZIP download.
- Continue with another tool without unnecessary re-upload where the browser runtime allows it.

### UX, accessibility and discovery

- Consistent empty, editing, processing, success and failure states.
- Keyboard operability and screen-reader labels.
- Mobile-first layouts and large touch targets.
- Search by tool name and task language.
- Related tools and context-sensitive next steps.
- Tool-specific limits and supported formats.

### Trust and privacy

- On-device/server processing label.
- Tool frame has no advertising scripts.
- No file bytes, names or text in parent analytics messages.
- No free-text analytics fields.
- Documented privacy behaviour and automated network-egress tests.

---

## 8. Shared processing engines

Do not build 100 processing implementations. The 100 user-facing tools should reuse a much smaller set of maintained engines.

| Engine | Main responsibilities | Tools served |
|---|---|---|
| `image` | Decode, encode, resize, crop, rotate, metadata, colour, watermark, compositing | 1–9, 31–35, 61–66, 77 |
| `constraints` | Target bytes/ranges, exact dimensions, aspect ratio and verification | 1, 8, 9, 12, 21, 43, 66 and future constrained tools |
| `pdf` | Parse, render, merge, split, edit page order, metadata, encrypt, repair and export | 10–19, 36–40, 41, 67–73 |
| `media` | Demux/mux, trim, convert, encode/decode, audio/video timeline processing | 20–23, 42–46, 60, 74–82 |
| `ocr` | Image/PDF preprocessing, OCR, text layer creation | 30, 41 |
| `text` | Text transformations, counters, diff, regex-safe processing, date and numeric helpers | 24–25, 47–56, 58, 60, 83–90, 96–98 |
| `data` | JSON/YAML/CSV/XML/SQL and spreadsheet parsing/formatting | 26, 57, 59, 87–92 |
| `archive` | ZIP creation/extraction, streaming, path and expansion-ratio guards | 33, 64, 99–100 |
| `codes` | QR/barcode creation and scanning, secure password/UUID generation | 29, 53, 93–95 |

The mapping is deliberately many-to-many: a tool may use multiple engines. The SDK/runtime remains responsible for lifecycle, validation, cancellation, progress, download and error reporting.

---

## 9. Naming, URL and SEO rules

- Every real tool has a stable internal ID and a stable canonical slug.
- A tool may have several search-intent landing pages only when the user intent and page content genuinely differ.
- Dimension/size values such as 20 KB, 50 KB, 100 KB or 200 KB are presets inside a tool, not automatically separate tools/pages.
- Format pairs may have separate landing pages when search intent justifies them, but they share one Convert Image engine/tool.
- Portal-specific pages require verified official source material, unique instructions and a working preset. Do not publish unverified spec pages.
- Do not generate thin doorway pages for every format, size or portal variation.
- Example structure:

```text
/forms/photo-resizer/
/forms/signature-resizer/
/forms/passport-visa-photo-maker/
/forms/ssc/signature/              # only after official specification is verified
/image/compress-image/
/image/convert-image/webp-to-jpg/  # only if distinct intent/content warrants it
/pdf/merge-pdf/
/video/compress-video/
/developer/json-formatter/
```

---

## 10. Definition of done for every tool

A tool is not complete because its screen renders or its happy path works once. It can be marked `live` only when all applicable criteria pass:

- [ ] Distinct user problem and scope documented.
- [ ] Manifest and content are complete.
- [ ] Input validation checks file signatures and limits.
- [ ] Main processing path works with real files.
- [ ] Output is independently verified.
- [ ] Relevant failure and edge cases are tested.
- [ ] Progress/cancellation handled where applicable.
- [ ] Mobile layout and real-device constraints reviewed.
- [ ] Keyboard accessibility reviewed.
- [ ] Worker/runtime cleanup verified.
- [ ] No unexpected network egress for on-device tools.
- [ ] Tool-specific SEO page is useful and accurate.
- [ ] Dependencies and licences are reviewed.
- [ ] Bundle/performance budgets pass.
- [ ] Unit, integration and E2E tests pass.
- [ ] Known limitations are visible to users.

Suggested lifecycle states: `draft` → `alpha` → `beta` → `live` → `deprecated`.

---

## 11. Product scope decisions to keep explicit

1. **Do not treat this inventory as a promise or quota.** Launch only the highest-value workflows that meet the quality bar; the first release may contain fewer or more than 30.
2. **Form Photo Resizer is the first working flagship**, not a proof that portal presets are verified. The current supplied implementation status reports zero official portal-spec records.
3. **Signature Resizer is the next tool**, reusing the already-built image engine and constraints runtime.
4. **Compress Image follows**, with batch/ZIP and better encoders.
5. **PDF tools follow after the PDF engine and licensing choices are validated.**
6. **Word to PDF is server-side and deferred to Phase 3.** It must not be represented as part of the all-browser-local first 30.
7. **Video compression stays browser-local at launch.** Do not create an unbounded server-transcoding cost.
8. **Legal-gated engines remain excluded until approved.** HEIC fallback, GPL-enabled FFmpeg builds, model licences and spreadsheet distribution terms require explicit review.
9. **Portal data is a maintained product asset.** Every published rule needs official source, effective date, verification date and an owner/process for updates.
10. **The catalogue must evolve from user evidence.** Search Console, tool completion, failure reasons, user feedback and real-device benchmarks should influence W2/W3 sequencing.

---

## 12. Immediate engineering sequence

1. Remove the Astro/Node launch blocker and rerun all gates.
2. Establish private GitHub remote and remote CI.
3. Conduct real-device validation on Android and iPhone.
4. Build Signature Resizer.
5. Build Compress Image with batch queue, retries and ZIP.
6. Build and test the shared PDF engine; then Merge PDF, Split PDF and Organize PDF.
7. Add portal presets only as official notices are collected and verified.
8. Continue through the W1 list, then reprioritise W2/W3 using actual usage and search data.

**This document is the master product-scope catalogue.** Tool-specific implementation details, ADRs, SEO briefs and research remain in their respective documents; update this catalogue whenever scope or lifecycle status changes.

---

# EXPANSION ADDENDUM — CONVERTER MATRIX, QR SUITE, YOUTUBE UTILITIES & COMPETITOR PARITY

**Version:** 3 · **Date:** 4 November 2026  
**Purpose:** Consolidate overlapping workflows and describe competitor-parity capabilities without treating every format, preset or shortcut as a separate tool. The original 100-item list is a discovery backlog, not a committed baseline.  
**Important:** A format pair is generally a generated route/use case inside a shared converter, not a separately maintained processing implementation. We should offer broad format coverage without creating hundreds of duplicate code paths or thin SEO pages.

## 12. Product scope update: compete on breadth, win on execution

The draft inventory is not a ceiling or commitment. Competitor research shows that broad converters advertise hundreds of formats and conversion pairs. CloudConvert currently describes 212 formats across 11 categories; other newer browser-first platforms advertise hundreds of tools and format pairs. YouTube-focused platforms also expose dedicated transcript, subtitle, chapter, thumbnail and analysis utilities. QR products go well beyond a basic URL generator into Wi-Fi, vCard, email, SMS, event, location, branded export and scan testing. These claims are competitor-reported, not independently benchmarked by us.

Our scope therefore has two layers:

1. **Competitor parity:** cover the common and meaningful jobs users already expect from established utility platforms.
2. **Our differentiation:** exact output constraints, upload-readiness, reliable batch workflows, format detection, chained operations, transparent local processing, strong validation and excellent mobile performance.

We should not blindly copy every obscure codec or every low-quality one-click tool. Add a format only when we can decode, encode, validate and document its limitations correctly.

## 13. Universal file-conversion experience

Build a **Universal Converter** entry point in addition to individual converter landing pages.

### Required user journey

1. User drops or selects one or more files.
2. Detect file type from file signature/content where possible, not just extension.
3. Display the detected format and confidence/limitations.
4. Show only valid target formats for that input and current browser capability.
5. Allow per-file or batch target selection.
6. Expose format-specific options (quality, resolution, bitrate, page size, metadata, etc.).
7. Process locally when supported; clearly label any future server-required route.
8. Verify output signature, extension, dimensions/duration/pages and other applicable properties.
9. Download one file or a ZIP, with clear per-file failures.

### Converter categories and format coverage

#### 13.1 Image format converter

**Shared tool:** Image Converter. **Generated conversion routes:** source → target combinations below, only where the codec implementation supports them.

| Format | Import/read | Export/write | Notes |
|---|---:|---:|---|
| JPEG / JPG | Yes | Yes | Lossy; quality and chroma options where encoder permits |
| PNG | Yes | Yes | Transparency and lossless output |
| WebP | Yes | Yes | Lossy/lossless and alpha support where available |
| AVIF | Yes | Yes | Browser/codec support must be capability-tested |
| GIF | Yes | Yes | Animated GIF needs frame-aware pipeline; still-image conversion is separate |
| BMP | Yes | Yes | Common uncompressed bitmap |
| TIFF / TIF | Yes | Conditional | Multi-page TIFF requires explicit handling; encoder support must be verified |
| ICO | Yes | Yes | Multi-resolution icon output |
| SVG | Yes, sanitise | Yes, raster output | SVG is vector markup; sanitize before rendering; raster→SVG is not genuine vectorisation |
| HEIC / HEIF | Conditional | Conditional | Native support where available; fallback gated by licensing/patent review |
| JPEG XL | Conditional | Conditional | Do not promise until browser/codec support is proven |
| RAW camera formats (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2) | Conditional | Usually no direct browser encoder | Treat as a separate RAW development capability; investigate decoder licensing and memory |
| PNM family (PBM, PGM, PPM) | Conditional | Conditional | Developer/scientific niche; add only with tests |

**High-intent conversion routes to support and validate:**

- JPG → PNG; PNG → JPG; JPG → WebP; PNG → WebP; WebP → JPG; WebP → PNG.
- JPG → AVIF; PNG → AVIF; AVIF → JPG; AVIF → PNG; WebP → AVIF; AVIF → WebP.
- HEIC → JPG; HEIC → PNG; HEIC → WebP (legal/codec gate).
- GIF → JPG; GIF → PNG (first frame, explicitly labelled); GIF → WebP (animation-aware where supported).
- BMP → JPG; BMP → PNG; TIFF → JPG; TIFF → PNG (multi-page behaviour explicitly defined).
- SVG → PNG; SVG → JPG; SVG → WebP; ICO → PNG; PNG → ICO.

**Do not create separate processors for every pair.** One converter engine plus a capability matrix should generate the UI and route metadata. SEO pages should be generated only for distinct, validated search intents and must have useful unique guidance.

#### 13.2 Audio format converter

**Shared tool:** Audio Converter. Support common formats and expose only valid conversions based on available decoders/encoders.

| Format | Import/read | Export/write | Notes |
|---|---:|---:|---|
| MP3 | Yes | Yes | Lossy; bitrate control |
| WAV | Yes | Yes | PCM variants; uncompressed output can be large |
| FLAC | Yes | Yes | Lossless |
| AAC | Conditional | Conditional | Container/codec distinctions matter |
| M4A | Yes | Yes | Usually AAC or ALAC in MP4 container; inspect codec |
| OGG Vorbis | Yes | Yes | Distinguish Ogg container from codec |
| Opus | Yes | Yes | Common in Ogg/WebM containers |
| AIFF / AIF | Conditional | Conditional | PCM audio |
| ALAC | Conditional | Conditional | Apple Lossless; decoder/encoder availability to verify |
| WMA | Conditional | Conditional | Browser support limited; defer unless vetted engine exists |
| AMR | Conditional | Conditional | Telephony format; defer pending codec support |
| MIDI | Parse/convert via synthesizer only | Conditional | MIDI is event data, not ordinary recorded audio; requires soundfont/synth engine |
| CAF | Conditional | Conditional | Apple container; defer |

**Required conversion routes:** MP3↔WAV, MP3↔FLAC, MP3↔M4A, MP3↔OGG, MP3↔Opus, WAV↔FLAC, WAV↔M4A, WAV↔AIFF, OGG↔MP3, OGG↔WAV, M4A↔WAV, FLAC↔WAV, Opus↔MP3. Each route must disclose lossy/lossless consequences and avoid fake lossless claims after lossy transcoding.

#### 13.3 Video format converter

**Shared tool:** Video Converter. Do not imply every browser can encode every container/codec. Probe capabilities and show only supported combinations.

| Format/container | Import/read | Export/write | Notes |
|---|---:|---:|---|
| MP4 | Yes | Yes | Common H.264/AAC profile where supported |
| MOV | Conditional | Conditional | QuickTime container; codec varies |
| WebM | Yes | Yes | VP8/VP9/AV1 and Opus/Vorbis capability dependent |
| MKV | Conditional | Conditional | Container parsing/remux support must be proven |
| AVI | Conditional | Conditional | Legacy container; many codec combinations |
| M4V | Conditional | Conditional | Often MP4-family; inspect actual stream codecs |
| 3GP | Conditional | Conditional | Mobile/legacy format |
| TS / M2TS | Conditional | Conditional | Transport streams; defer until demux support exists |
| MPEG / MPG | Conditional | Conditional | Legacy formats |
| GIF | Import | Export | Video→GIF is frame extraction + palette/animation encoding, not normal video encoding |
| OGV | Conditional | Conditional | Ogg video; defer until codec support exists |
| MXF | No initial support | No initial support | Professional production container; server/desktop-grade scope |

**High-intent routes:** MOV→MP4, MKV→MP4, WebM→MP4, MP4→WebM, AVI→MP4, M4V→MP4, 3GP→MP4, MP4→GIF, video→MP3, video→WAV, video→M4A. Add routes only after end-to-end test fixtures exist for the relevant codecs.

#### 13.4 Subtitle and caption converter

Create a dedicated **Subtitle Converter & Editor** tool (new long-term tool) for:

- SRT ↔ VTT.
- SRT/VTT → TXT.
- TXT → SRT only when timestamps are supplied or generated by a clearly labelled workflow.
- ASS ↔ SSA (where parser/writer fidelity is proven).
- SBV → SRT/VTT.
- LRC ↔ supported subtitle/text formats (lyrics timing is not identical to subtitle timing).
- Shift all cue timestamps by a fixed offset.
- Retiming by scale factor.
- Merge/split subtitle files.
- Fix encoding/BOM and line endings.
- Rewrap lines to a chosen character count without changing cue timing.
- Validate overlapping cues, negative times and malformed timestamps.

Never silently alter the spoken words or timings. Preview changes and show validation warnings.

#### 13.5 Document, ebook, spreadsheet and presentation converters

These are a major competitor-parity area, but many require a server-side office suite or licensed engine. Separate browser-local and server-gated capabilities.

**Document formats to evaluate:** PDF, DOCX, DOC, ODT, RTF, TXT, HTML, Markdown, EPUB, MOBI/AZW (where lawful and technically supported), XPS, ODP/ODS/ODT, PPTX/PPT, XLSX/XLS/CSV.

**Useful conversion routes:**

- DOCX → PDF; PDF → DOCX (quality/fidelity gate; do not promise editable fidelity prematurely).
- DOCX ↔ ODT; DOCX → TXT; DOCX → HTML; RTF ↔ DOCX/ODT where supported.
- PPTX → PDF; PPTX → images; PDF → PPTX only as a clearly qualified reconstruction feature.
- XLSX → PDF; XLSX → CSV; CSV → XLSX; ODS ↔ XLSX.
- HTML → PDF; HTML → TXT; Markdown → HTML/PDF/DOCX where supported.
- EPUB → PDF; EPUB → TXT; PDF → EPUB only if reflow quality is acceptable.
- TXT ↔ RTF; TXT → PDF.

**Additional tools to add to the long-term catalogue:**

1. Document Converter (multi-format hub).
2. Word to PDF (already in W3; first server-side candidate).
3. PDF to Word (fidelity-gated).
4. PowerPoint to PDF.
5. Excel to PDF.
6. PDF to PowerPoint (experimental/reconstruction).
7. PDF to Excel (table extraction; OCR/structure caveats).
8. EPUB Converter.
9. Markdown Converter (expanded export targets).
10. HTML to PDF.
11. RTF Converter.
12. ODT Converter.
13. Presentation Converter.
14. Spreadsheet Converter.

Do not promise font/layout fidelity without testing. The server-side LibreOffice path must have file isolation, timeouts, resource limits, malware scanning strategy, retention policy and per-job deletion before public release.

#### 13.6 Archive and compression format converter

Extend beyond ZIP create/extract with a dedicated archive converter/inspector.

Formats to evaluate: ZIP, 7Z, TAR, TAR.GZ, TGZ, TAR.BZ2, TAR.XZ, GZ, BZ2, XZ, RAR (read-only/codec licensing constraints), CAB, ISO (inspection/extraction only where supported), CBZ/CBR (comic archives; CBR is RAR-based).

Additional tools:

- Archive Converter (supported archive → ZIP/TAR variants).
- TAR/GZ Extractor.
- 7Z Extractor (library and licence gate).
- RAR Extractor (legal/library gate; no RAR creation promise).
- ZIP Repair / Test Archive (best-effort integrity check; no guarantee of recovery).
- Archive Contents Viewer.

Security requirements: path traversal protection, symlink handling, entry count caps, nested archive depth, decompressed-size limits, compression-ratio limits, encrypted archive handling and cancellation.

#### 13.7 Developer/data format conversion

Add generated routes and, where useful, dedicated tools for:

- JSON ↔ YAML.
- JSON ↔ XML (schema/type loss caveats).
- CSV ↔ JSON.
- CSV ↔ TSV.
- CSV ↔ XLSX.
- JSON ↔ CSV (nested JSON requires flattening options).
- TOML ↔ JSON.
- INI ↔ JSON (comment/order preservation caveats).
- XML ↔ JSON.
- HTML ↔ Markdown (conversion is approximate).
- Markdown ↔ HTML.
- HTML entities encode/decode.
- URL encode/decode.
- Base64 ↔ text/file.
- Hex ↔ text/file.
- Binary ↔ text/number.
- PEM certificate/key viewer and format converter (never expose private key material to analytics; local-only; careful validation).
- Unix/Linux line endings ↔ Windows line endings.
- UTF-8/UTF-16 encoding inspector/converter (lossy replacement warnings).

## 14. QR & barcode scope — consolidated, not multiplied

There should be **one QR Studio**, not a collection of tiny QR generators named after every payload type. Every item below is a template, option or mode in that studio.

### QR payload templates (not separate tools)

- Web URL or arbitrary text.
- Wi-Fi network (SSID, password, encryption, hidden-network flag).
- Contact card (vCard / MeCard).
- Email, phone call and SMS.
- WhatsApp chat link.
- Geographic location / map link.
- Calendar event.
- Social profile, YouTube URL, app-store URL or document URL.
- Payment/UPI deep link only after format, security and legal validation; do not imply payment processing.

### QR Studio capabilities

- Static QR generation by default; no hidden redirects, forced signup or expiry.
- Colour, contrast warning, error correction, quiet zone, pattern/finder styling and optional centre logo—with scan reliability checks.
- PNG, SVG and print-ready PDF export; explicit print dimensions.
- Scan from uploaded image or camera where supported; decode without automatically opening links.
- Verify the generated QR by decoding it before download.
- Optional batch CSV → individual QR files + ZIP.
- Optional A4/Letter print-sheet layout with labels and sizing.

Payload templates, bulk mode, print-sheet mode, scan mode and export formats are **capabilities inside QR Studio**. They are not separate catalogue tools and do not each get a standalone indexable SEO page. A focused route can be used as a non-indexed shortcut or campaign landing page, but it does not increase the tool count.

### Barcode Studio

One **Barcode Studio** covers both generation and scanning for symbologies that the selected libraries actually support and that have test fixtures. Candidate formats: Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, ITF, Codabar and GS1-128 where appropriate. Validate check digits. Never claim a generated retail barcode is registered, licensed or globally unique.

---

## 15. YouTube & creator utilities

Add a **YouTube & Creator Tools** category. This can attract creators, students and editors, but every feature must respect YouTube's terms, copyright and access controls.

**Important product boundary:** do not build a tool that circumvents YouTube restrictions, extracts protected streams, bypasses authentication/paywalls/DRM, or facilitates downloading copyrighted video/audio without rights. Do not use an unofficial scraper as a hidden backend. Prefer user-provided files, creator-owned content, official APIs and publicly available metadata. A user may download/export their own data through authorised methods. Before implementing any YouTube URL-based feature, verify current YouTube API/Terms requirements and the exact permitted data source.

### Consolidated YouTube & Creator workflows

Do not create a separate tool for every button in a creator workflow. Start with these coherent utilities; add a separate product only when usage shows a materially different job.

| Workflow / tool | Included capabilities | Data/access boundary |
|---|---|---|
| **Video & Channel Inspector** | Public video metadata, channel identifier lookup, available thumbnail previews, thumbnail dimension/quality checks | Official API/oEmbed or permitted public metadata; use user-supplied thumbnails where possible; respect API quotas and terms |
| **Link & Embed Builder** | Normalise watch/Shorts/live/youtu.be URLs, create timestamp links, generate responsive embed snippets | URL parsing and official embed formats; no media extraction |
| **Playlist Analyzer** | Playlist item list, item count, total/average duration and CSV/JSON export | Official YouTube Data API or permitted user-provided data; quota and field availability apply |
| **Chapter Builder** | Parse, validate, edit and format chapter timestamps from creator-provided description text | User-pasted text or permitted metadata; validation rules must be explicit |
| **Caption & Transcript Workspace** | Work with authorised transcript data or user-provided caption files; convert SRT/VTT/ASS where supported, shift/synchronise timings, clean text and export | No scraping or bypass; captions API access may be restricted; clearly distinguish transcript retrieval from local file editing |
| **Creator Text Prep** | Description formatting, title/description character counts, tag cleanup, chapter insertion and upload checklist | User-provided text; do not claim undocumented platform ranking or character limits |
| **Creator Media Check** | Inspect creator-owned video resolution, codec, frame rate, bitrate and duration; preview thumbnail aspect ratio and safe areas; link to the shared video crop/resize tools | User-provided files processed locally where supported; do not duplicate general video editor tools under YouTube branding |

**Not separate tools:** thumbnail viewer + thumbnail quality checker are one inspection workflow; timestamp link + embed + URL normalisation are one link-building workflow; playlist duration + playlist export are one playlist analysis workflow; chapter extraction + timestamp formatting are one Chapter Builder; subtitle conversion + timing shift + transcript cleaning are modes in the Caption & Transcript Workspace.

**Explicitly excluded pending legal/terms review:** YouTube video downloader, YouTube-to-MP3 stream extraction, playlist media downloader, private/unlisted video downloader, age/region restriction bypass and any feature that circumvents technical access controls. Video-to-audio conversion remains available for a file the user owns or is authorised to process; it belongs to the shared Video/Audio tools, not to a YouTube downloader.

## 16. Additional creator/media tools to consider

These are capabilities in the shared Media Studio, not a list of extra tools to count independently. Expose them as controls/modes within a coherent editor or converter unless a genuinely distinct workflow warrants its own tool:

- Video Compressor to exact MB.
- Video Compressor for Discord, WhatsApp, email and user-defined limits (presets must be re-verified against current platform limits).
- Video to GIF / GIF to MP4 / GIF to WebP.
- Video Trimmer and Splitter.
- Video Merger.
- Video Rotator.
- Video Speed Changer.
- Video Cropper and Aspect Ratio Converter (16:9, 9:16, 1:1, 4:5, 3:2).
- Video Resizer by resolution (4K/1080p/720p/480p) where supported.
- Video Frame Extractor.
- Video Thumbnail Maker.
- Audio Extractor from Video.
- Audio Trimmer and Merger.
- Audio Normalizer / Volume Booster.
- Audio Noise Reduction (quality and CPU caveats; model/algorithm gate).
- Audio Speed Changer.
- Audio Fade In/Out.
- Voice Recorder.
- Screen Recorder (permissions and browser support; careful privacy UX).
- Webcam Recorder.
- Webcam Test.
- Microphone Test.
- Speaker Test.
- Subtitle Editor.
- Subtitle Format Converter.
- Subtitle Timing Shifter.
- Video Metadata Inspector.
- Audio Metadata Inspector / Tag Editor (ID3/Vorbis/MP4 tags; preserve original when metadata write is unsupported).
- Cover Art Embedder / Extractor for supported audio containers.

## 17. Additional competitor-parity categories

The broader product should consider these capabilities after the initial launch suite is stable:

### E-book tools
- EPUB Reader / Previewer.
- EPUB to PDF.
- EPUB to TXT.
- EPUB Metadata Editor.
- EPUB Cover Extractor.
- MOBI/AZW inspection or conversion only after format/library/licensing review.

### Font tools
- Font Metadata Viewer.
- WOFF/WOFF2/TTF/OTF converter (licensing and font table fidelity must be tested).
- Font Previewer.
- Font Subsetter (advanced; server/resource gate).

### Vector and design tools
- SVG Optimizer.
- SVG Viewer.
- SVG to PNG/JPG/WebP.
- PNG/JPG to SVG only as raster embedding or traced vectorisation, clearly distinguished.
- EPS/PDF/SVG conversion (PostScript engine/licensing and security gate).
- Palette Extractor.
- Image Colour Format Converter.

### Data and technical tools
- XML ↔ JSON.
- TOML ↔ JSON.
- YAML ↔ JSON.
- CSV ↔ TSV.
- CSV delimiter converter.
- SQL Formatter and minifier.
- JSON Schema validator (schema supplied by user).
- JSON to TypeScript interface generator.
- OpenAPI / Swagger viewer and formatter.
- JWT inspector (decode only unless a user supplies verification key and we implement safe local verification).
- PEM certificate viewer.
- Certificate expiry checker from user-supplied certificate.
- Markdown table generator.
- Lorem Ipsum generator.
- HTML/CSS/JS minifier (security and source-map caveats).

### Everyday and business utilities
- Image DPI calculator/change-DPI metadata tool (explain pixel dimensions vs print metadata).
- File Size Converter (bytes, KB, KiB, MB, MiB, GB, GiB).
- Date/Time Zone Converter.
- Business Card QR Generator.
- Invoice/receipt PDF generator (user-entered data; template quality gate).
- ID/photo sheet maker (multiple passport photos on A4/Letter; official dimensions only from verified specs).
- Image-to-PDF and PDF-to-image presets.
- Printable label/sheet generator.
- Unit converters (length, weight, temperature, area, volume, speed, data storage).
- GST calculator (India-specific; tax rules must be dated and qualified).
- EMI / loan calculator (not financial advice; formula transparency).
- Salary / CTC calculator (India-specific assumptions and date/version labels).

## 18. Tool discovery and converter SEO architecture

A broad catalogue only helps if users can find the right operation quickly.

### File-first discovery

When a user drops a file on the homepage, identify the file type locally and show:

- Detected format.
- Safe/available operations.
- Supported output formats.
- Compression options.
- Relevant editing tools.
- Any unsupported features with a clear explanation.

Example: dropping a PNG should offer Compress PNG, Resize PNG, Crop PNG, PNG→JPG, PNG→WebP, PNG→AVIF (if supported), PNG→ICO and image metadata inspection.

### Search-first discovery

Search should understand:

- Tool names: “compress image”.
- Format pairs: “png to jpg”.
- Outcome: “make photo under 50kb”.
- Portal intent: “signature size for application”.
- Synonyms: “shrink”, “reduce”, “convert”, “change format”, “resize”.
- Input/output extension aliases.

### SEO page generation rules

- Generate routes from a validated format capability matrix, not manually duplicated implementations.
- Index only pages with a real, working converter route and unique useful content.
- Do not index every theoretical pair if the operation is unsupported or the page has no distinct user value.
- Use canonical URLs and avoid duplicate pair/hub pages competing with one another.
- Add format explainers: transparency loss, animation loss, quality loss, metadata loss, codec/container differences and file-size expectations.
- Every page should state supported browser formats and limitations.

Example route patterns:

```text
/convert/png-to-jpg/
/convert/webp-to-png/
/convert/mov-to-mp4/
/convert/m4a-to-mp3/
/convert/srt-to-vtt/
/convert/docx-to-pdf/
/qr-studio/
/youtube/thumbnail-viewer/
/youtube/timestamp-link-generator/
/youtube/playlist-duration/
/subtitles/srt-to-vtt/
```

## 19. Master catalogue governance

The catalogue should become a structured data source rather than a manually maintained markdown-only list.

Create a machine-readable tool registry with fields such as:

- `id`, `slug`, `name`, `category`, `subCategory`.
- `description`, `userJobs`, `searchAliases`.
- `inputFormats`, `outputFormats`, `conversionPairs`.
- `engine`, `capabilities`, `browserSupport`.
- `executionMode` (`browser`, `server`, `hybrid`).
- `privacyMode`, `legalStatus`, `licenseNotes`.
- `wave`, `priority`, `implementationStatus`.
- `seoIndexable`, `canonicalGroup`, `contentStatus`.
- `testFixtures`, `acceptanceTests`.

A conversion pair must reference a real capability edge, not a hand-written claim. Build-time checks should reject:

- Unsupported source/target combinations.
- Duplicate routes.
- Missing processor registrations.
- Missing test fixtures for a newly enabled codec.
- Missing licence review for gated codecs.
- Indexable pages with no useful unique content.
- YouTube tools whose data source or terms review is not documented.

### Priority levels

- **P0:** Approved initial launch workflows and core runtime; no fixed count.
- **P1:** Competitor-parity essentials, especially common format conversions and QR expansion.
- **P2:** Creator/YouTube utilities, subtitle tools, more office/ebook formats.
- **P3:** Professional/rare formats (RAW, CAD, fonts, scientific formats) and server-dependent conversion.

### Definition of done for every converter

1. Input detection by signature where practical.
2. Correct decoding.
3. Correct target encoding.
4. Metadata and orientation behaviour documented.
5. Animation/page/frame behaviour documented.
6. Output file signature independently checked.
7. Output can be reopened by an independent decoder/test tool.
8. Quality or fidelity tests pass.
9. Cancellation and cleanup work.
10. Batch behaviour is tested if advertised.
11. Browser capability fallback is honest.
12. Licence and patent review is recorded.
13. SEO page accurately describes actual support.

## 20. Competitor research references informing this addendum

These are examples of current public competitor scope and should be rechecked before implementation; competitor marketing claims are not proof of quality or legal permission:

- CloudConvert format catalogue: https://cloudconvert.com/ — reports 212 formats across documents, images, video, audio, spreadsheets, slides, ebooks, archives, vector, CAD and fonts.
- FreeConvert: https://www.freeconvert.com/ — broad conversion catalogue and advanced options; current public page describes more than 1,500 conversions and upload/retention terms.
- ConvertAnythink: https://convertanythink.com/ — advertises a large browser-first tool catalogue and broad format categories.
- File2File: https://file2file.app/ — advertises hundreds of conversion pairs and a format encyclopedia.
- RunConvert: https://www.runconvert.com/ — advertises broad document, image, video, audio, ebook, archive, CAD and font conversion.
- YouTubeScribe tools: https://youtubescribe.com/tools — examples of transcript, subtitle, chapter, playlist and creator utilities.
- Y2Tool: https://y2tool.com/ — examples of YouTube metadata, thumbnail, subtitle and creator-tool categories; review terms and data sources before copying any feature.
- QR Code Monkey: https://www.qrcode-monkey.com/ — QR design and export competitor.
- QR TIGER: https://www.qrcode-tiger.com/ — static/dynamic QR and business QR competitor.
- GoQR: https://goqr.me/ — basic static QR generation reference.
- Filator QR generator: https://filator.com/tools/qr-code-generator — example of broad QR payload types and styling/export features.

Research snapshots used for this addendum:
- CloudConvert format catalogue and category counts: https://cloudconvert.com/ (search result reviewed 4 Nov 2026).
- YouTubeScribe tools catalogue: https://youtubescribe.com/tools (reviewed 4 Nov 2026).
- Y2Tool YouTube utilities: https://y2tool.com/ (reviewed 4 Nov 2026).
- QR content-type examples: https://www.generateonlineqr.com/blog/types-of-qr-codes.php and https://www.qrville.com/blog/every-qr-code-type-explained (reviewed 4 Nov 2026).

---

## 21. Updated product direction

**The original 100-item inventory is only a discovery backlog; it is not a product quota.** The consolidated scope should deliver competitor parity across common formats and meaningful workflows, without inflating tool counts through presets, file extensions or duplicated landing pages.

The next practical implementation order remains:

1. Signature Resizer.
2. Compress Image with all supported common formats, batch and ZIP.
3. Image Converter with the validated common format matrix and generated pair routes.
4. Merge PDF, Split PDF, Organize PDF and core PDF conversion.
5. QR suite expansion (Wi-Fi, vCard, bulk generation, scanner/decoder, print sheet).
6. Audio Converter and Video Converter with browser capability detection.
7. Subtitle Converter and creator utilities.
8. Office/ebook/archive conversions as engine, licence, security and hosting decisions permit.

**Do not let the breadth roadmap dilute quality:** a converter is not “supported” until the real codec path, test fixtures, output verification, browser support and licence review all exist.
