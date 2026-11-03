# Deliverable G — First 100 Tools Roadmap

**Rules applied:** every tool solves a distinct job or a clearly distinct search intent; trivial variants (e.g., "compress image to 50 KB" vs "to 100 KB") are **presets inside one tool**, not separate tools. Where a distinct intent deserves its own landing page but shares a tool (e.g., *CSV→JSON* and *JSON→CSV*), it is counted **once**. **No keyword volumes are quoted** — the "Primary intent" column is the hypothesis to validate with Doc H's workflow.

**Legend**
- **Wave:** W1 = launch (30) · W2 = next 30 · W3 = next 40 · LT = long-term (not counted)
- **Exec:** B = browser (on-device) · S = server · H = hybrid (browser default, server for large inputs)
- **Intensity:** L/M/H (CPU+memory on the user's device or our server)
- **Diff.** = implementation difficulty 1 (trivial) – 5 (very hard) · **Cost** = our marginal operating cost: ~0 / Low / Med / High
- **Engines:** `img` `pdf` `media` `ocr` `text` `data` `archive` `constraints` (Doc E ADR-05)

---

## Category notes (competitors, weakness, SEO)

| Category | Main competitor alternatives | Observed competitor weakness (Docs A/B) | SEO opportunity |
|---|---|---|---|
| Image | iLoveIMG, TinyPNG, Squoosh, Filevane, Ezgif, many pages.dev clones | No target-size on iLoveIMG/TinyPNG/Squoosh pages; free batch limits (iLoveIMG premium batch, TinyPNG 20×5 MB) | Format-pair and "to X KB" long tail; saturated head terms |
| Forms | Small single-purpose sites (exammint, Streamlit apps, builder posts) | Fragmented, ad-heavy or hobby; rarely cite official specs; ignore min-KB/DPI | **Per-portal pages** ("SSC photo size", "IBPS signature") — distinct, high-intent, seasonal |
| PDF | iLovePDF, Smallpdf, PDF24, Adobe, Sejda, BentoPDF | Free caps (Smallpdf ~2/day, iLovePDF per-tool caps), billing complaints, no target size, quality failures | Head terms dominated by incumbents; long tail ("compress pdf for IRCC", "unlock pdf with password") |
| Video/Audio | 123apps, FreeConvert, CloudConvert, Ezgif, 8mb.video, Clideo | Minute/credit quotas (FreeConvert 20 min/day), uploads of large files, slow queues | "compress video for discord/whatsapp/email", "mp4 to mp3" |
| Text/Dev/Data | IT Tools, CyberChef, Browserling, PineTools, jsonformatter.org, countless clones | Ad clutter; privacy distrust when pasting API data (Reddit JSON-formatter builder posts) | Huge long tail, low RPM, very saturated — cheap to build, helps internal linking & breadth |
| OCR | Sejda (10 pages / 3 tasks per hour, 3P), OnlineOCR (15 pages/h, 3P), PDF24 | Page/hour caps; quality drop of output PDFs (r/pdf) | "image to text", "ocr pdf" |
| Generators/Calc | QR sites (many with expiring "dynamic" QR traps), RapidTables, Calculator.net | QR generators that require signup or expire codes (needs verification) | Moderate; QR is high-volume |

---

## W1 — Launch set (30)

| # | Tool | Problem & primary intent (hypothesis) | In → Out | Engine / library | Exec | Int. | Diff. | Cost | Differentiation / notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Compress Image** | Hit a KB limit or shrink for web — "compress image to 100kb" | JPG/PNG/WebP/HEIC/AVIF → same/other | `img` native + jSquash MozJPEG/WebP/AVIF/OxiPNG; `constraints` | B | M | 3 | ~0 | **Target KB min/max with verification**, batch+ZIP, before/after |
| 2 | **Resize Image** | Exact px/%, fit/fill/pad — "resize image to 1080x1080" | image → image | `img` OffscreenCanvas (high quality) | B | M | 2 | ~0 | Presets with cited platform specs; crop-after-resize (Squoosh #1417) |
| 3 | **Convert Image** (hub: JPG/PNG/WebP/AVIF/GIF-still) | "webp to jpg", "png to jpg" | image → image | `img` | B | M | 2 | ~0 | One engine; distinct landing pages per high-intent pair (Doc H §2) |
| 4 | **Crop Image** | Crop to aspect/px | image → image | `img` + crop UI | B | L | 2 | ~0 | Aspect presets, exact px input, batch-apply same crop |
| 5 | **Rotate & Flip Image** | Fix sideways photos, EXIF orientation | image → image | `img` | B | L | 1 | ~0 | Lossless JPEG rotation where possible (verify lib) |
| 6 | **HEIC to JPG** | iPhone photos unreadable elsewhere | HEIC → JPG/PNG | Safari native decode; else libheif-WASM ⚖️ | B | M | 3 | ~0 | **Legal review (LGPL + HEVC)** before launch; batch |
| 7 | **EXIF Viewer & Remover** | See/remove GPS & camera data before sharing | image → image + report | `img` EXIF parser (exifr, MIT — verify) | B | L | 2 | ~0 | Shows exactly what was removed |
| 8 | **Form Photo Resizer** | Portal rejects photo — "SSC photo size 20–50 kb" | photo → JPG at exact px, KB range, DPI | `img` + `constraints` + portal spec DB | B | M | 3 | ~0 | **Flagship (Doc D #1).** Per-portal presets citing official notice + date; validator report |
| 9 | **Signature Resizer** | Signature must be 10–20 KB at fixed px | photo of signature → clean JPG | `img` (threshold, auto-crop, background whiten) + `constraints` | B | M | 3 | ~0 | Paper photo → clean signature in one step |
| 10 | **Merge PDF** | Combine files | PDFs (+images) → PDF | `pdf` pdf-lib fork, pdf.js thumbnails | B | M | 2 | ~0 | Reorder with thumbnails; mixed image+PDF input; no file caps beyond device |
| 11 | **Split PDF** | Extract ranges / every page | PDF → PDFs/ZIP | `pdf` | B | L | 2 | ~0 | Range syntax + visual selection |
| 12 | **Compress PDF** | Fit upload limit — "compress pdf to 200kb" | PDF → PDF | `pdf` image-recompression walker + qpdf + raster mode; `constraints` | B | H | 4 | ~0 | Target size, scanned/text modes, **keeps original if output larger**; legibility preview |
| 13 | **Organize PDF** | Reorder/delete/rotate pages | PDF → PDF | `pdf` | B | M | 3 | ~0 | Also serves "rotate pdf", "delete pages" intents as presets |
| 14 | **PDF to JPG/PNG** | Pages as images | PDF → images/ZIP | `pdf` pdf.js render + `img` encode | B | M | 2 | ~0 | DPI choice, target KB per page (form use) |
| 15 | **JPG to PDF** (images to PDF) | Combine scans/photos into one PDF | images → PDF | `pdf` + `img` | B | M | 2 | ~0 | Page size/margins/orientation; auto-rotate; target size |
| 16 | **Add Page Numbers** | Number pages | PDF → PDF | `pdf` | B | L | 2 | ~0 | Position/format/start-at/skip-first |
| 17 | **Protect PDF** | Add password | PDF → encrypted PDF | qpdf-wasm (AES-256) | B | L | 3 | ~0 | States exactly what encryption does and doesn't do |
| 18 | **Unlock PDF** | Remove password **you know** | encrypted PDF + password → PDF | qpdf-wasm | B | L | 2 | ~0 | No cracking; clear authorised-use statement |
| 19 | **Extract Text from PDF** | Copy text out | PDF → TXT | pdf.js text layer | B | L | 2 | ~0 | Detects scanned PDFs → offers OCR (#30) |
| 20 | **Trim Video** | Cut a clip | video → video | `media` Mediabunny (keyframe-aware, no re-encode option) | B | M | 3 | ~0 | Lossless fast trim when cut at keyframes |
| 21 | **Compress Video to Size** | "compress video for discord/whatsapp/email" | video → MP4/WebM | `media` WebCodecs encode + `constraints` (bitrate solve) | B (device limits) | H | 4 | ~0 | **Target MB** with presets (Discord/WhatsApp/email — limits to verify on official pages) |
| 22 | **Extract Audio from Video** | "mp4 to mp3" | video → MP3/M4A/WAV | `media` (demux copy or encode; MP3 encode via LAME-WASM ⚖️ LGPL, or M4A/AAC via WebCodecs where supported) | B | M | 3 | ~0 | No re-encode when source AAC → M4A |
| 23 | **Convert Audio** | m4a/ogg/wav ↔ mp3 | audio → audio | `media` | B | M | 3 | ~0 | Bitrate presets; batch |
| 24 | **Word & Character Counter** | Essay/post limits | text → stats | `text` | B | L | 1 | ~0 | Reading time, platform limits (X, LinkedIn, meta description) |
| 25 | **Text Diff Checker** | Compare two texts | text×2 → diff | `text` jsdiff | B | L | 2 | ~0 | Word/char/line modes; shareable without uploading (local only) |
| 26 | **JSON Formatter & Validator** | Pretty-print/validate API JSON | text → text | `data` + CodeMirror | B | L | 2 | ~0 | Error position highlighting; large-file mode in worker |
| 27 | **Base64 Encode/Decode** | Text & file ↔ Base64 | text/file ↔ text | `text` | B | L | 1 | ~0 | File → data URI; image preview on decode |
| 28 | **JWT Decoder** | Inspect token claims | text → JSON | `data` | B | L | 1 | ~0 | Explicit "does not verify signature"; exp/iat human times |
| 29 | **QR Code Generator** | URL/WiFi/vCard QR | text → PNG/SVG | nuintun/qrcode (MIT) | B | L | 2 | ~0 | **Static QR that never expires** (contrast with "dynamic QR" traps — verify competitor practice) |
| 30 | **Image to Text (OCR)** | Copy text from screenshot/photo | image → text | `ocr` tesseract.js + deskew/threshold preprocessing | B | H | 3 | ~0 | Preprocessing (Reddit OCR evidence), language select, batch |

**Why this mix:** 9 image/forms (flagship differentiation + highest observed demand), 10 PDF (largest established demand), 4 media (target-size video + mp4→mp3), 6 light text/dev/QR (cheap breadth, internal links), 1 OCR. All browser-local ⇒ near-zero marginal cost. **Conditional:** #6 waits for legal sign-off (swap with *Case Converter* if blocked); #8/#9 depend on portal-spec research finishing in Phase 0.

---

## W2 — Next 30

| # | Tool | Problem & intent | In → Out | Engine | Exec | Int. | Diff. | Cost | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 31 | Watermark Image | Protect photos | image(s) → image(s) | `img` | B | L | 2 | ~0 | Batch, tiled/positioned |
| 32 | Blur / Pixelate Region | Hide faces/plates/IDs | image → image | `img` | B | L | 2 | ~0 | Irreversible pixel replacement (explain) |
| 33 | Favicon Generator | Site icons | image → ICO + PNG set + HTML | `img` + ICO writer | B | L | 2 | ~0 | Squoosh #1435 ICO demand |
| 34 | SVG to PNG | Rasterize SVG | SVG → PNG | `img` (sanitized via DOMPurify) | B | L | 2 | ~0 | Security: sanitize SVG |
| 35 | Image Color Picker | Get HEX from image | image → colours | `img` | B | L | 1 | ~0 | Palette extraction |
| 36 | Watermark PDF | Stamp text/image | PDF → PDF | `pdf` | B | L | 2 | ~0 | |
| 37 | Sign PDF | Add signature image (not cryptographic) | PDF → PDF | `pdf` | B | M | 3 | ~0 | Clear "visual signature ≠ digital signature" |
| 38 | Fill PDF Form | Fill AcroForm fields | PDF → PDF | `pdf` | B | M | 3 | ~0 | Stirling #320 / OmniTools #244 demand |
| 39 | Flatten PDF | Lock form fields/annotations | PDF → PDF | `pdf` | B | L | 2 | ~0 | |
| 40 | Extract Images from PDF | Get embedded images | PDF → images ZIP | `pdf` | B | M | 3 | ~0 | |
| 41 | OCR PDF (searchable PDF) | Make scans searchable | PDF → PDF+text layer | `ocr` + `pdf` | B (≤ ~30 pages) / H later | H | 4 | ~0 | Must not downgrade image quality (r/pdf complaint) |
| 42 | Convert Video (MP4/WebM/MOV) | Compatibility | video → video | `media` (+ ffmpeg fallback opt-in) | B | H | 3 | ~0 | Capability probe per browser |
| 43 | Video to GIF | Make GIFs | video → GIF/WebP | `media` + GIF encoder (gifenc, MIT — verify) | B | H | 3 | ~0 | Size target |
| 44 | Mute Video | Remove audio | video → video | `media` (remux, no re-encode) | B | L | 1 | ~0 | Instant |
| 45 | Trim Audio / Ringtone | Cut audio | audio → audio | `media` | B | M | 2 | ~0 | Fade in/out |
| 46 | Volume Booster / Normalize | Too quiet audio | audio → audio | Web Audio + `media` | B | M | 3 | ~0 | Loudness (LUFS) target |
| 47 | Case Converter | UPPER/lower/Title/camel | text → text | `text` | B | L | 1 | ~0 | |
| 48 | Remove Duplicate Lines | Dedupe lists | text → text | `text` | B | L | 1 | ~0 | Case/whitespace options |
| 49 | Sort / Shuffle / Number Lines | List ops | text → text | `text` | B | L | 1 | ~0 | Natural sort |
| 50 | Find & Replace (regex) | Bulk edits | text → text | `text` (worker + timeout, ReDoS guard) | B | L | 2 | ~0 | |
| 51 | Remove Line Breaks & Extra Spaces | Clean pasted PDF text | text → text | `text` | B | L | 1 | ~0 | Paragraph-aware |
| 52 | URL Encode/Decode | | text → text | `text` | B | L | 1 | ~0 | |
| 53 | UUID Generator | | → text | Web Crypto | B | L | 1 | ~0 | v4/v7, bulk |
| 54 | Hash / Checksum (text & file) | Verify downloads | text/file → hashes | Web Crypto + MD5 (hash-wasm, MIT) | B | M | 2 | ~0 | Streaming for large files |
| 55 | Unix Timestamp Converter | | text ↔ date | `text` | B | L | 1 | ~0 | Time zones |
| 56 | Regex Tester | | text → matches | `text` (worker + timeout) | B | L | 2 | ~0 | Explain pattern |
| 57 | JSON ↔ YAML | | text ↔ text | `data` (yaml, ISC — verify) | B | L | 1 | ~0 | |
| 58 | Color Converter | HEX/RGB/HSL/OKLCH | text → text | `text` | B | L | 1 | ~0 | Contrast checker included |
| 59 | CSV ↔ JSON | | file/text ↔ file/text | `data` PapaParse | B | M | 2 | ~0 | Two landing pages, one tool; streaming for big files |
| 60 | Video File Size / Bitrate Calculator | Plan target size | numbers → numbers | `text` | B | L | 1 | ~0 | Links to #21 (Reddit: users pair ffmpeg + bitrate calculators) |

---

## W3 — Next 40

| # | Tool | Exec | Int. | Diff. | Cost | Engine | Notes |
|---|---|---|---|---|---|---|---|
| 61 | Passport / Visa Photo Maker (country presets, background check) | B | H | 4 | ~0 | `img` + face landmark model (licence check) | Spec DB; can't guarantee portal AI acceptance — say so |
| 62 | Make Square / Add Border (pad to aspect) | B | L | 1 | ~0 | `img` | Instagram/WhatsApp DP |
| 63 | Combine Images (side-by-side/grid) | B | M | 2 | ~0 | `img` | |
| 64 | Image Splitter (grid) | B | L | 2 | ~0 | `img` | |
| 65 | Image to Base64 / Data URI | B | L | 1 | ~0 | `img` | Dev intent |
| 66 | Compress GIF | B | H | 3 | ~0 | GIF optimizer (gifsicle-wasm GPL ⚖️ → find permissive) | Ezgif strong here |
| 67 | Resize PDF Pages (to A4/Letter) / Crop PDF | B | M | 3 | ~0 | `pdf` | |
| 68 | PDF Metadata Editor | B | L | 1 | ~0 | `pdf` | Remove author/producer (privacy) |
| 69 | Grayscale PDF | B | H | 3 | ~0 | `pdf` (raster or colour-space rewrite) | Also shrinks size |
| 70 | Compare PDFs (text) | B | M | 3 | ~0 | `pdf` + `text` | |
| 71 | Repair PDF | B | M | 2 | ~0 | qpdf-wasm | Honest success criteria |
| 72 | Markdown to PDF | B | M | 2 | ~0 | `text` + print CSS / pdf-lib | Bundle has it |
| 73 | **Word to PDF** | **S** | M | 3 | **Low** | LibreOffice headless in container | First server tool; consent + retention notice |
| 74 | Resize/Crop Video for Social (9:16, 1:1) | B | H | 3 | ~0 | `media` | |
| 75 | Rotate Video | B | M | 2 | ~0 | `media` (metadata rotation when possible) | |
| 76 | Merge Videos | B | H | 3 | ~0 | `media` | Same-codec fast path |
| 77 | Extract Frames / Thumbnail | B | M | 2 | ~0 | `media` + `img` | |
| 78 | Change Video Speed | B | H | 3 | ~0 | `media` | |
| 79 | Add Audio to Video | B | H | 3 | ~0 | `media` | |
| 80 | Merge Audio | B | M | 2 | ~0 | `media` | |
| 81 | Remove Silence | B | M | 3 | ~0 | Web Audio | |
| 82 | Voice Recorder | B | L | 2 | ~0 | MediaRecorder | 123apps strong |
| 83 | Markdown Preview / to HTML | B | L | 1 | ~0 | `text` + DOMPurify | |
| 84 | Text to Speech | B | L | 2 | ~0 | Web Speech API (voice availability varies) | Reddit request (good free TTS) |
| 85 | Word Frequency / Keyword Density | B | L | 1 | ~0 | `text` | |
| 86 | Cron Expression Explainer | B | L | 2 | ~0 | `text` (cronstrue, MIT — verify) | |
| 87 | XML Formatter | B | L | 1 | ~0 | `data` | |
| 88 | SQL Formatter | B | L | 1 | ~0 | `data` (sql-formatter, MIT — verify) | |
| 89 | Number Base Converter | B | L | 1 | ~0 | `text` | |
| 90 | HTML Entity Encode/Decode | B | L | 1 | ~0 | `text` | |
| 91 | Excel (XLSX) to CSV | B | M | 2 | ~0 | SheetJS CE ⚖️ (distribution terms) | |
| 92 | CSV Viewer & Cleaner (dedupe rows, delimiter, trim) | B | M | 3 | ~0 | `data` | Large files streaming |
| 93 | QR Code Scanner (image/camera) | B | L | 2 | ~0 | `BarcodeDetector` → zxing-js fallback | |
| 94 | Barcode Generator | B | L | 2 | ~0 | bwip-js (MIT — verify) | |
| 95 | Password Generator | B | L | 1 | ~0 | Web Crypto | |
| 96 | Aspect Ratio Calculator | B | L | 1 | ~0 | `text` | Links to resize/crop |
| 97 | Percentage Calculator | B | L | 1 | ~0 | `text` | |
| 98 | Age & Date Difference Calculator | B | L | 1 | ~0 | `text` | Exam age-limit eligibility use case |
| 99 | Create ZIP | B | M | 2 | ~0 | `archive` fflate | |
| 100 | Extract ZIP (Unzip) | B | M | 2 | ~0 | `archive` zip.js + bomb guards | Path traversal + ratio limits |

---

## Long-term (beyond 100; gated by licence, cost or quality)

| Tool | Gate |
|---|---|
| PDF to Word | Fidelity; needs MuPDF/commercial engine or server; Trustpilot shows incumbents fail here |
| Excel / PowerPoint to PDF | Server LibreOffice (cost + security) |
| True PDF Redaction | MuPDF commercial licence; strong Reddit demand ("only expensive programs do it") |
| PDF/A conversion | Ghostscript/MuPDF licence |
| Edit PDF text | Very hard; repeatedly requested (BentoPDF, Stirling) |
| Translate PDF | AI cost + layout |
| Remove Background / Upscale | Permissive model licence + device performance |
| Audio/Video Transcription (Whisper) | Model size; device limits |
| Burn Subtitles | ffmpeg libass (GPL build) or custom renderer |
| Per-portal landing pages beyond launch set | Spec research throughput |

## Duplicates/overlaps deliberately removed
- "Rotate PDF", "Delete PDF pages", "Reorder PDF" → presets/landing variants of **Organize PDF** (#13).
- "Compress image to N KB" for every N → presets of **Compress Image** (#1); separate pages only for intents with distinct UX (e.g., forms #8/#9).
- "JPG to PNG", "PNG to WebP", … → **Convert Image** (#3) with a small set of high-intent pair pages (Doc H).
- "Checksum verifier" folded into **Hash** (#54); "JSON to CSV" folded into **CSV↔JSON** (#59).
