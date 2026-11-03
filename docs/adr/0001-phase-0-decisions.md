# ADR 0001 — Phase 0 strategic decisions

**Date:** 4 Nov 2026 · **Status:** Accepted (items marked _pending_ need the stated evidence)
**Context:** `docs/research/` pack (A–K) reviewed by the product owner.

## Strategy

**Upload-readiness platform first, universal utility suite behind it.** We sell an outcome: the file meets the published requirements (dimensions, byte range, format, extension, DPI where specified), stays readable, and the user can see whether it succeeded — with no paywall discovered after processing.

**Promise wording:** "Prepare your file to match the official upload requirements." We verify published technical requirements; we do **not** guarantee acceptance by portals with unpublished rules or automated face/background/quality checks.

**Positioning line (working):** "Get your files ready. Meet the requirements. Get it done."

## Decisions

| Decision                                                                                                                             | Status                                   |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| India-first market (exam, recruitment, government, Passport Seva), English-first UI, globally accessible                             | Adopted                                  |
| Hindi for top form workflows                                                                                                         | Validate after launch                    |
| Form-ready tools (photo, signature, document) as flagship                                                                            | Adopted                                  |
| Astro 6 + Preact islands                                                                                                             | Adopted, subject to prototype benchmarks |
| Cloudflare hosting (static assets); no backend/DB at launch                                                                          | Adopted                                  |
| Browser-local 30-tool launch; server processing reconsidered in Phase 3 (Word→PDF first); **no automatic server fallback for video** | Adopted                                  |
| Separate-origin sandboxed tool frame; ads only on parent                                                                             | Adopted, subject to security testing     |
| PDF: build on pdf.js + cantoo-scribe/pdf-lib + vetted qpdf-wasm; request MuPDF quote now; decide after a 40-PDF benchmark            | Commercial licence deferred              |
| BentoPDF commercial licence                                                                                                          | Investigate only                         |
| GPL ffmpeg.wasm build                                                                                                                | Excluded pending legal review            |
| HEIC: native Safari decode only; libheif-WASM fallback                                                                               | Fallback deferred pending legal review   |
| Advertising-first (AdSense, parent page only); no card-gated trials, export charges or nags                                          | Adopted                                  |
| One focused legal review: GPL/LGPL/codec distribution; H.264/HEVC patents & HEIC; India DPDP + ad consent (EEA/UK/CH CMP)            | Adopted                                  |

## Frame privacy requirements (in addition to Doc E ADR-02)

- Parent↔frame: strict `event.origin` checks both ways, typed message allowlist (schema-validated), no file bytes/names/text/content ever cross.
- Frame CSP covers all outbound paths: `default-src 'none'`; explicit `script-src`, `worker-src`, `connect-src 'self'`, `img-src 'self' blob: data:`, `media-src 'self' blob:`, `font-src 'self'`, `style-src 'self'`, `form-action 'none'`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors <parent>`; plus `Referrer-Policy: no-referrer`, `Permissions-Policy` minimal.
- Frame origin serves static assets only (no API endpoints, no 3rd-party analytics, no remote engines).
- Playwright egress tests during real processing; public, reproducible privacy-verification page.

## Video target-size requirements

Presets (<8 MB, <25 MB, <50 MB, custom, WhatsApp, Discord, email — limits to be verified on official help pages), bitrate estimate → encode → measure → retry; codec capability probe before enabling formats; workers only; device-aware duration/size/resolution limits; progress + cancel; low-memory warnings; success only when the final size is verified.

## Launch order of the 30 tools

1. **Upload readiness:** Form Photo Resizer, Signature Resizer, Compress Image (shared target-size engine)
2. **Universal file utilities:** Merge, Split, Organize, PDF→JPG, JPG→PDF, Compress PDF (image-heavy first, honest scope, keep original if worse), Protect, Unlock
3. **Media:** Compress Video to Size, Trim Video, Extract Audio, Convert Audio
4. **Low-cost breadth:** JSON Formatter, Text Diff, Word Counter, Base64, JWT Decoder, QR Generator, OCR
   (+ remaining W1 items from Doc G)

**Architecture pilot (Phase 1):** Form Photo Resizer (replaces generic Compress Image as the image pilot; compression engine underneath), Merge PDF, JSON Formatter.

## Phase 0 exit criteria

Market choice recorded · 10–15 official portal specs documented · workflow tested with real applicants · 8 flagship competitor benchmarks run · PDF build-vs-buy benchmark plan + Artifex quote requested · legal launch blockers resolved · brand + main domain + frame domain registered · architecture approved · performance baselines on low-end Android and desktop.

### Portal spec record schema

`portal, documentType, officialSourceUrl, noticeReference, widthPx/heightPx (or ranges), minBytes, maxBytes, byteUnitConvention, formats, extensions, dpi?, background?, otherRequirements[], effectiveDate, lastVerifiedDate, verifiedBy, version, history[]`.
Maintenance: watch list of portal notification pages; re-verify each record at every new notification cycle and at least quarterly; changes go through PR review with source link.

## Brand decision: **NiftyFix** (chosen by product owner, 4 Nov 2026)

| Domain                              | Status (RDAP, 4 Nov 2026)                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| niftyfix.com                        | **Taken** — registered 2009-12-09 (Namecheap), default registrar nameservers, no live site; **expires 2026-12-09** |
| niftyfix.in                         | Free                                                                                                               |
| niftyfix.app / .net / .tools / .dev | Free                                                                                                               |
| getniftyfix.com / niftyfixapp.com   | Free                                                                                                               |
| niftyfixcdn.com (tool-frame domain) | Free                                                                                                               |

**Domain plan:** register niftyfix.in + niftyfix.app + niftyfixcdn.com immediately; make an anonymous offer for niftyfix.com via a broker (Namecheap marketplace/Afternic/Sedo) and watch its 9 Dec 2026 expiry. Until acquired, primary = **niftyfix.in** (fits India-first) with getniftyfix.com as a global redirect. Avoid launching SEO on a domain we will later migrate from unless the .com is secured within ~2 months (a migration costs ranking time).

**Risks to check before committing:**

1. **"Nifty" collides with NIFTY 50**, the NSE stock index. In India, branded search for "nifty…" is dominated by stock-market content, and Google may auto-correct or blend "niftyfix" with "nifty". "NIFTY" is a registered mark of NSE Indices Ltd (finance class) — get a trademark opinion on class 9/42 use and run IP India + WIPO searches.
2. Brand search test: type "niftyfix" and "nifty fix" into Google (India locale) after launch; consider always pairing the logo with a descriptor ("NiftyFix — file tools").
3. Social handles (X, Instagram, YouTube, GitHub, LinkedIn) not yet checked.

## Scope clarification: compete for every tool, flagship for differentiation

Product owner requirement: NiftyFix should be the go-to result for _any_ tool intent (PDF, image, video, developer/GitHub, creator/YouTube…), not only forms.

- The 100-tool inventory (Doc G) is the acquisition surface; Forms remains the differentiated flagship.
- Ranking is earned per tool, not site-wide: each tool page must be the best answer for its query (working tool above the fold, faster, cleaner, honest limits). Head terms will take 12–24 months; long tail first.
- **Creator & developer categories to add (W2/W3 candidates):** YouTube thumbnail viewer/downloader (public thumbnail images only), timestamp-link generator, title/description length checker, embed-code generator, channel banner/thumbnail resizer (2560×1440, 1280×720); GitHub README/profile generator, .gitignore generator, badge (shields) builder, Markdown table generator, license chooser, repo-size/commit-message helpers.
- **Excluded:** YouTube/Instagram/social video or audio _downloaders_ — violate platform terms, carry copyright and ad-network policy risk (verify AdSense publisher policy before any related tool), and are the category most associated with malware ads (Doc B P8).
  Checked via authoritative RDAP (Verisign for .com; IANA bootstrap for others). **Availability can change at any moment until registered.** Not yet checked: trademarks (IP India, WIPO Global Brand Database), social handles.

| Name                                                                           | .com  | .in  | .app | Frame domain          | Collision search                                             | Notes                                                                                                                |
| ------------------------------------------------------------------------------ | ----- | ---- | ---- | --------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **PakkaFile**                                                                  | free  | free | free | pakkafilecdn.com free | none found                                                   | _pakka_ (पक्का) = sure/confirmed — matches "validated" promise; natural for Indian users; works for the broad suite  |
| PukkaFile                                                                      | free  | free | free | pukkafilecdn.com free | none found                                                   | English spelling of the same word (UK/global); "Pukka" is a major food/tea brand (different class) — trademark check |
| PakkaFit / PukkaFit                                                            | free  | free | —    | —                     | not searched                                                 | Narrower ("fit")                                                                                                     |
| PakkaDoc / PukkaDoc                                                            | free  | free | —    | —                     | not searched                                                 | Document-centric                                                                                                     |
| ReadyKar                                                                       | free  | free | free | —                     | none found                                                   | Hinglish "make it ready"; catchy for students, weaker globally                                                       |
| TickFile                                                                       | free  | free | free | —                     | **collision**: existing file-sharing service (AlternativeTo) | Rejected                                                                                                             |
| ~140 other candidates (FileReady, FormFit, UploadReady, Fitly-style coinages…) | taken | —    | —    | —                     | —                                                            | —                                                                                                                    |
