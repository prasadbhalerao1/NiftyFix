# Deliverable A — Expanded Competitive Intelligence

**Research date:** 4 Nov 2026. **Evidence labels:**
- **V** = verified on the competitor's own official page on the research date (published claim, not hands-on test)
- **V-doc** = verified in official documentation/help centre
- **3P** = reported by third-party sources only (not confirmed on an official page)
- **NV** = not verified
- **Hands-on testing: not performed in this pass** (see §6 for the protocol).

---

## 1. Market structure (how to read the field)

The market splits into five groups with different economics:

| Group | Examples | Economics | Threat to us |
|---|---|---|---|
| **Freemium server suites** | iLovePDF/iLoveIMG, Smallpdf, Adobe Acrobat online, Sejda, PDF2Go/Online-Convert (QaamGo) | Free tier with caps → subscription. Server processing. Strong brands | Own head terms. Weak on billing trust (Doc B) |
| **Credit/minute converters** | CloudConvert, FreeConvert, Convertio, XConvert, Online-Convert | Free daily credits; paid credits; API revenue | Own format-conversion long tail. Costs scale with usage |
| **Ad-funded broad suites** | PDF24, TinyWow, 123apps | Free + ads; some now add Premium (TinyWow, 123apps) | Closest business model to ours; PDF24 has huge trust |
| **Browser-local "privacy" suites** | Filevane, BentoPDF, Gigai, Slaytic, ATools, OmniTools, Bundle, DoxDock, many `pages.dev` sites | Mostly ads or donations/OSS; near-zero marginal cost | **Direct positioning overlap.** Rapidly multiplying in 2026 |
| **Specialists** | Squoosh, TinyPNG, Ezgif, Photopea, CyberChef, IT Tools, Browserling, PineTools, RapidTables | Varies | Win specific intents with depth |

---

## 2. Competitor profiles

### 2.1 iLovePDF / iLoveIMG
- **Pricing (V, https://www.ilovepdf.com/pricing):** Basic free; Premium **₹500/month or ₹2,900/year** (India pricing shown; varies by region); Business "Let's talk" (25+ users).
- **Free-tier restrictions (V):** "Limited tools"; ads; batch "Limited". Per-tool caps, e.g. Merge 100 MB / 25 files; Compress 200 MB / 2 files; Office conversions 15 MB / 1 file; OCR PDF 15 MB / 1 file; PDF to JPG 25 MB / 2 files; Image to PDF 40 MB / 20 files. OCR-based PDF→Word/Excel/PPT excluded from free.
- **Premium (V):** "Unlimited document processing", 4 GB/task for most tools, Merge up to 500 files, workflows, digital signatures, regional processing (7 regions), 2,000 AI credits.
- **Retention (V-doc, https://www.ilovepdf.com/help/faq):** files kept "a maximum of 2 hours"; user can delete manually. Processing is server-side.
- **iLoveIMG (V, https://www.iloveimg.com/):** 13 tools (compress, resize, crop, convert to/from JPG, editor, upscale, remove background, watermark, meme, rotate, HTML→image, blur face). "Batch processing" listed as Premium. **No target-size control** on the page. Deletion policy not stated on page.
- **Reputation (V, Trustpilot):** 4.9, 14,051 reviews; 1★ ≈1%. Low-star themes Jun–Oct 2026: auto-renewal, refunds, support non-response, 25-file cap, OCR/conversion quality (PDF→Word producing images).
- **Weaknesses:** caps on free batch; no target-size; billing trust issues; no cross-category (video/audio/dev) coverage.
- **Confidence:** High (official page).

### 2.2 Smallpdf
- **Pricing (3P):** Pro ≈ $12/mo monthly or $9/mo annual ($108/yr) per a comparison citing Smallpdf's page dated 12 Jun 2026; other sources say $15/mo. Smallpdf's own pricing page could not be extracted (truncated). **NV on official page.**
- **Free tier (3P):** commonly reported as **2 tasks/day**, limited compression, no batch. 7-day free trial (V via Smallpdf blog title/snippet).
- **Retention (3P):** 1 hour (14 days for shared files) per a dev.to review.
- **Reputation (V, Trustpilot):** 4.7, 5,430 reviews. 1–2★ themes Aug–Nov 2026: trial auto-converting to annual plan, charges after cancellation, refund refusals incl. "early termination fee", scripted support, "free tool" with a 2-hour download wait.
- **Weaknesses:** very tight free tier; trial-to-paid friction; server-only.
- **Confidence:** Medium (limits from 3P).

### 2.3 Adobe Acrobat online
- **Free use (V-doc, https://helpx.adobe.com/document-cloud/faq/free-online-pdf.html, per search snippet):** without sign-in, most tools allow **one free transaction and one download**; Compress PDF has a 30-day quota window; files ≤100 MB (Compress up to 2 GB / 500 MB depending on page version — Adobe's pages disagree). Adobe marketing blog claims "no sign-in, no limits" — contradicts FAQ.
- **Strength:** brand authority; best-in-class PDF engine quality.
- **Weakness:** sign-in walls; quotas.
- **Confidence:** Medium.

### 2.4 PDF24
- **Model (V, https://tools.pdf24.org/en/compress-pdf):** "100% free thanks to advertising", "No limits", "No subscription traps or forced premium versions". Files deleted after 1 hour; servers in Germany.
- **Compress PDF controls (V):** DPI, image quality %, grayscale, max Flate compression, strip metadata, rasterize heavy graphics, lossless mode. **No target-size input.**
- **Processing:** compression is server-side ("compressed in the cloud on our servers"); some other tools local (bigads.md). PDF24 Creator desktop app (Windows) for offline.
- **OCR (3P):** no strict page limits online; large files may time out; ~95% on clean letter in one reviewer's test (softpicker.com).
- **Threat level: highest** for an ad-funded PDF competitor — generous, trusted, broad.
- **Weaknesses:** no target size, dated UI, Windows-only desktop fallback, server upload for many tools.
- **Confidence:** High.

### 2.5 TinyWow
- **Model (V, https://tinywow.com/your-data):** no sign-ups; "one ad on each page"; "We don't limit"; files deleted 1 h after processing (page also mentions a "15-minute window" — inconsistent).
- **New (V):** Premium ₹1,499/mo or ₹1,249.92/mo yearly; 7-day trial; "Skip all CAPTCHAs" (implies CAPTCHAs for free users), "Priority processing", no ads.
- **Reputation (bigads.md, Trustpilot 18 reviews):** subscription renewal/cancellation complaints; a compression yielding 3008→3007 KB. Small sample.
- **Weaknesses:** CAPTCHAs; server uploads; inconsistent retention statement; drift towards premium.
- **Confidence:** High for published claims.

### 2.6 123apps
- **Pricing (V, https://123apps.com/pricing):** 51 tools. Free: **unlimited files/day, 10 GB max, ads**. Premium **₹190/mo or ₹1,824/yr**: no ads, "faster". Page intro still mentions daily limits; discount shown as −20% and −33% in different places. **Inconsistent page.**
- **Reputation (bigads.md, Trustpilot):** download failures, duration paywall discovered after long work.
- **Strength:** strong audio/video browser editors (video cutter, audio cutter, voice recorder).
- **Confidence:** Medium (inconsistent source).

### 2.7 FreeConvert
- **Pricing (V, https://www.freeconvert.com/pricing):** Free: **20 conversion minutes/day** (web + API), **5 conversion minutes per file**. Paid: Basic $12.99 (1,500 min/mo, 1.5 GB), Standard $24.99 (2,000 min, 2 GB), Pro $29.99 (4,000 min, 5 GB, GPU encoding), Scale on-demand (up to 20 GB). 100 conversions at a time on paid.
- **Reputation (V, Trustpilot):** 4.6, 17,403 reviews. Low-star themes 2025–2026: unrecognised recurring charges, "FreeConvert" name vs ~10 conversions/day reality, uploads stalling, no time estimate, ad-blocker prompts, output unusable.
- **Weakness:** minute-based quota is opaque to users before upload.
- **Confidence:** High.

### 2.8 CloudConvert
- **Pricing (V, https://cloudconvert.com/pricing):** Free **10 credits/day, 1 GB, 5 min processing, 5 concurrent tasks**. Per-credit prices not extractable (JS-rendered). Subscriptions "up to 50% cheaper than packages".
- **Strength:** API-first, 200+ formats, configurable options. Developer-oriented; not a direct consumer-SEO competitor at our scale.
- **Confidence:** High for free tier.

### 2.9 Convertio
- **Limits (bigads.md via help centre):** 1 GB/file? — the help page returned **HTTP 403** to our fetcher; **NV** today. bigads.md reported 10 credits/24 h, 10 concurrent.
- **Reputation (bigads.md):** high rating; tab must stay open during conversion.
- **Confidence:** Low (not re-verified).

### 2.10 XConvert
- **Limits (V, https://www.xconvert.com/faq/is-xconvert-free-to-use):** free 400 MB/file (higher in some regions), 30 video conversions/day (60 with free account), small concurrency, standard queue, ads. Paid: 1 GB (Basic) / 4 GB (Pro), priority CPU, **resumable chunked uploads**, HEVC/VP9, special TIFF/PDF compression. **In-browser tools:** Rotate PDF, Crop image, Add page numbers ("such as").
- **Relevance:** proves the **hybrid local/server** model is commercially viable.
- **Confidence:** High.

### 2.11 Online-Convert (QaamGo — also PDF2Go, Compress2Go, Image2Go)
- **Pricing (V, https://www.online-convert.com/pricing):** Free trial "Limited" batch/size/tasks; 10 min processing/task. Pay-as-you-go 480 credits €13; monthly 2,800 credits €22.42; 10,000 credits €68. Premium: batch up to 200, up to 64 GB, 8 h/task. Chain tasks appear in plan table (free value unclear).
- **Reputation (bigads.md):** PDF2Go slow/cluttered for large files; Compress2Go returned a 25 MB file from a 16 MB input.
- **Confidence:** Medium.

### 2.12 Sejda (added — not in bigads.md)
- **Free tier (3P via online-tech-tips/sejda listing):** up to **10 pages or 50 MB, 3 tasks/hour** for OCR; paid up to 100 pages. Sejda also offers a desktop app. Server-side (multiple upload subdomains seen in search: `uploads.sejda.com`, `cf-uploads2.sejda.com`).
- **Confidence:** Low–Medium.

### 2.13 TinyPNG / Tinify
- **Free web (V, https://tinypng.com/):** up to **20 images at once, 5 MB each**; format conversion capped at 3 images free. Supports AVIF, WebP, JPG, PNG, APNG, **JPEG XL**. Resize/convert/crop are **API-only** features. **No target-size** on web.
- **Strength:** brand, simplicity, quality defaults.
- **Confidence:** High.

### 2.14 Squoosh (Google Chrome Labs, Apache-2.0)
- Local, single image, excellent codec comparison. **Batch (#1259, open since Jul 2022)** and **target size (#1422, open since Jul 2024, no maintainer response)** remain unaddressed. Repo pushed 22 Oct 2026 (some activity). Analytics: Google Analytics per README (bigads.md).
- **Confidence:** High.

### 2.15 Ezgif
- **(V, https://ezgif.com/):** large GIF/animation suite incl. **target-size compressor**, bulk GIF optimizer in-browser, video→GIF, WebP/APNG/AVIF/JXL, Lottie, ICO, background removal, QR/barcode. **Has a local (in-browser) processing mode** "no file size limits" for supported tools; server mode for others. Video→animated image up to 1280 px. Ads/retention not stated on homepage.
- **Implication:** Ezgif already does target-size + local for GIFs; do not claim uniqueness there.
- **Confidence:** High.

### 2.16 Filevane
- **(V, https://filevane.com/):** **407 tools** in 10 categories (PDF 74, Image 48, Media 21, Calculators 101, Developer 81, Text 33, Color 23, Generators 7, SEO 9, Social 10). "Every file is processed by your own browser and never uploaded." Batch + ZIP on resize/compress/convert/blur/watermark. No ads/pricing mentioned on homepage. Own comparative claim "sent 0.00 MB" (unverified).
- **Note:** 101 of 407 are calculators — tool count is inflated by low-effort categories. Count is not a moat.
- **Confidence:** High (published claims).

### 2.17 BentoPDF (added — not in bigads.md)
- **(V, https://github.com/alam00000/bentopdf):** ~16.2k stars, AGPL-3.0 **or $79 lifetime commercial licence**. Client-side; ~110 tool entries (docs say "50+"). Engines: pdf-lib, PDF.js, PDFKit, EmbedPDF, qpdf-wasm, **LibreOffice WASM** (Office→PDF in browser; needs SharedArrayBuffer/cross-origin isolation), wasm-vips; AGPL PyMuPDF/Ghostscript/cpdf **loaded from CDN at runtime**; Tesseract OCR. "Hyper Compress" engine licensed separately ($99/yr for standalone/server use).
- **Implication:** the strongest browser-PDF benchmark. Also a possible **licensable engine source**.
- **Confidence:** High.

### 2.18 Stirling-PDF (added)
- **(V):** ~95.7k stars; MIT except proprietary directories (`app/proprietary/`, `engine/`, SaaS/desktop/cloud paths). Server-side (Docker), LibreOffice-backed; desktop app; "Upgrade to Pro" prompts. Self-hosted market, not consumer SEO — but sets user expectations for "free PDF suite".
- **Confidence:** High.

### 2.19 Other browser-local suites (2026 wave)
| Site | Claim (self-reported) | Source |
|---|---|---|
| Gigai Tools | 250+ file tools, 100% in browser | https://www.indiehackers.com/product/gigai-tools |
| Slaytic Tools | "Hundreds of useful online tools", launched Jul 2026 | https://www.producthunt.com/products/slaytic-tools/launches |
| Coda One | 26 local PDF tools + 100+ others | https://www.codaone.ai/blog/free-pdf-tools-no-upload-2026/ |
| NowTo Tools | Video/PDF/image/dev in-browser | https://now.to/blog/file-compression-guide.html |
| ImagePDF.Tools, NoMoreUploads, Offline Tools Dashboard | Local PDF/image | IndieHackers / Capterra listings |
| LocalPDF | Astro + PDF.js, local; ~50% traffic from ChatGPT (self-reported, Dec 2025) | https://news.ycombinator.com/item?id=46203547 |
| Many `*.pages.dev` sites (lura-pdf, aback-tools, zaqta, pdfyay, casperpdf, cashew-crate…) | "100% private" target-size PDF pages, "is iLovePDF safe" articles | Search results, 4 Nov 2026 |

**Interpretation:** AI-assisted building has made "100 browser tools" cheap. Expect this cohort to keep growing and Google to keep filtering it (scaled-content policy, core updates). Quality signals and brand become the separators.

### 2.20 Developer/text specialists
- **CyberChef** (Apache-2.0, 36.3k★, pushed 2 Nov 2026): recipe chaining + URL-encoded recipes. Benchmark for pipelines.
- **IT Tools** (GPL-3.0, 41.1k★, pushed 27 Oct 2026): Vue; `pnpm run script:create:tool` scaffolding. Benchmark for dev-tool UX.
- **Browserling / PineTools / RapidTables:** long-tail SEO incumbents with simple pages (not re-audited in this pass — **NV**).
- **Photopea:** full editor; not a competitor for single tasks; benchmark for browser performance.

---

## 3. Comparison matrix (published claims; V unless marked)

Legend: ✅ verified available · ❌ verified unavailable · ◐ partial · ? not verified · 💲 paid only

| Capability | iLovePDF | Smallpdf | Adobe | PDF24 | TinyWow | 123apps | FreeConvert | CloudConvert | XConvert | TinyPNG | Squoosh | Ezgif | Filevane | BentoPDF |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| No account for basic use | ✅ | ◐ (3P) | ◐ 1 task | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daily cap on free | ◐ per-tool | ✅ cap (3P: 2/day) | ✅ quota | ❌ none | ❌ (CAPTCHA) | ◐ inconsistent | ✅ 20 min | ✅ 10 credits | ✅ 30 video | ◐ 20 img/batch | ❌ | ? | ❌ | ❌ |
| Ads on free | ✅ | ? | ? | ✅ | ✅ 1/page | ✅ | ✅ | ? | ✅ | ? | ❌ | ? | ? | ❌ |
| Batch on free | ◐ limited | ❌ (3P) | ? | ◐ implied | ? | ? | ◐ | ✅ 5 conc. | ◐ | ✅ 20 | ❌ | ✅ GIF bulk | ✅ some | ? |
| Target output size | ❌ (page) | ? | ? | ❌ | ? | ? | ? | ? | ? | ❌ | ❌ (#1422) | ✅ GIF | ? | ? |
| Local (browser) processing | ❌ | ❌ | ❌ | ◐ some | ❌ | ◐ (editors) | ❌ | ❌ | ◐ some | ❌ | ✅ | ◐ local mode | ✅ claim | ✅ |
| Workflow chaining | 💲 workflows | ? | ? | ? | ? | ❌ | ? | ✅ API jobs | ? | ❌ | ❌ | ◐ (tool→tool links) | ❌ | ◐ "Automate" |
| Published retention | ✅ 2 h | (3P 1 h) | ? | ✅ 1 h | ✅ 1 h/15 min | ? | ? | ? | ? | ? | n/a | ? | n/a | n/a |
| Premium price | ₹500/mo | ~$12/mo (3P) | — | free | ₹1,499/mo | ₹190/mo | $12.99/mo | credits | ? | ? | free | ? | free | free/$79 lic |

**Not verified for any competitor in this pass:** keyboard accessibility, mobile quality, failure handling, preview quality. These require the hands-on protocol in §6.

---

## 4. Monetization patterns observed

| Model | Who | Observations |
|---|---|---|
| Ads only, no caps | PDF24 | Sustained for years; demonstrates the ad model works at scale with a trusted brand |
| Ads + optional premium (no ads, priority, no CAPTCHA) | TinyWow, 123apps, XConvert | Premium sells *convenience*, not core capability |
| Freemium caps → subscription | iLovePDF, Smallpdf, Adobe | Highest revenue per user; **highest billing-complaint load** |
| Credits/minutes | FreeConvert, CloudConvert, Online-Convert | Aligns price with server cost; opaque to consumers |
| API sales | CloudConvert, iLovePDF (SDKs), Tinify | B2B revenue; needs server infrastructure |
| OSS + commercial licence | BentoPDF ($79), Stirling (Pro) | Monetises self-hosters/businesses |

**Does advertising harm processing performance?** Ad scripts compete for the main thread and network on page load. They must not load until after the tool is interactive, and processing must run in workers (Doc F). Under our sandboxed-frame design, ad scripts cannot reach the tool's DOM or file data at all.

---

## 5. Competitive conclusions

1. **Table stakes** (must match on day 1): no signup, fast single-file flow, clear download, mobile-usable, visible privacy/retention statement, merge/split/compress/convert basics.
2. **Where incumbents are weak:** billing trust (iLovePDF, Smallpdf, FreeConvert reviews), free batch limits (iLovePDF, Smallpdf), target-size controls (iLovePDF, PDF24, TinyPNG, Squoosh lack it on their pages), opaque quotas (FreeConvert minutes), server uploads for sensitive files.
3. **Where browser-local newcomers are weak (hypothesis — needs hands-on verification):** consistency across 100+ tools, real output verification, failure handling, mobile memory handling, and depth of a few flagship tools. Many appear AI-generated in bulk.
4. **We cannot out-breadth Filevane or out-trust PDF24 at launch.** We can out-*finish* them on a focused set of high-intent jobs.

---

## 6. Hands-on test protocol (Phase 0 — required before freezing the launch list)

For the top 12 competitors × 8 flagship jobs (compress image to 100 KB, resize 30 photos, HEIC→JPG ×20, merge 5 PDFs, compress scanned PDF to <500 KB, PDF→JPG, extract audio from 2-min MP4, compress 50 MB video to <10 MB):

| Measure | How |
|---|---|
| Time to first result (s) | Stopwatch from page load to download, Chrome desktop + mid-range Android |
| Clicks/taps to download | Count |
| Upload observed? | DevTools Network: any request with body ≥ 1 KB during processing |
| Output correctness | File opens; dimensions/pages/duration match; target met (bytes) |
| Quality | SSIM/Butteraugli for images (scripted), visual for PDFs |
| Paywall/cap/CAPTCHA encountered | Y/N + when (before/after processing) |
| Ads: count, placement, fake-download-button risk | Screenshot |
| Mobile: layout, download works, memory crash | Real device |
| Keyboard-only completion | Y/N |
| CWV (LCP/INP/CLS) | PageSpeed Insights field data where available (CrUX), else Lighthouse lab |

Record in a spreadsheet with date, browser version, test-file hashes. Re-run quarterly.
