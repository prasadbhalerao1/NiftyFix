# Research & Architecture Pack — Online Utility Platform

**Research date:** 4 November 2026 (all "verified" statements refer to pages fetched on this date unless another date is given)
**Input:** `bigads.md` (research dossier dated 21 Oct 2026), read in full.
**Status:** Research + architecture for review. No application code has been written, per the brief.

| Doc | Deliverable |
|---|---|
| [A-competitive-intelligence.md](A-competitive-intelligence.md) | A — Expanded competitive intelligence + comparison matrix |
| [B-user-pain-points.md](B-user-pain-points.md) | B — User pain-point research |
| [C-open-source-audit.md](C-open-source-audit.md) | C — Open-source technology audit + license matrix |
| [D-differentiation-strategy.md](D-differentiation-strategy.md) | D — Differentiation strategy (ranked) |
| [E-architecture-decision-record.md](E-architecture-decision-record.md) | E — Technical architecture decision record |
| [F-performance-architecture.md](F-performance-architecture.md) | F — Performance architecture & budgets |
| [G-first-100-tools.md](G-first-100-tools.md) | G — First 100 tools roadmap |
| [H-seo-architecture.md](H-seo-architecture.md) | H — SEO architecture & launch strategy |
| [I-monetization-cost-model.md](I-monetization-cost-model.md) | I — Monetization & cost model |
| [J-folder-structure.md](J-folder-structure.md) | J — Repository structure & dependency boundaries |
| [K-implementation-roadmap.md](K-implementation-roadmap.md) | K — Implementation roadmap |

---

## 1. Research method and its limits (read first)

**What was done:** official pricing/FAQ/product pages fetched directly; GitHub REST API for license, stars, last push and archive status of 45+ repositories; GitHub issue trackers sorted by reactions; Trustpilot 1–2★ review pages (dated reviews); Hacker News comments via the Algolia API; Google Search Central, web.dev, Cloudflare and AdSense documentation; web search for 2026 market state.

**Hard limitations — be aware of these when reading:**

1. **Reddit was researched through a logged-in browser session** (the search crawler is blocked from reddit.com; Reddit's JSON API returned 403, so rendered HTML pages were read). About 25 searches and the top comments of about 30 threads were reviewed. This is a *sample*, not an exhaustive crawl. See Doc B §1b.
2. **No hands-on competitor workflow testing with real files was performed.** There is no browser automation run against competitor sites in this pass. Every "verified" capability is verified from the competitor's *own published page*, not from operating the tool. Section 6 of Doc A gives a test protocol to close this gap in Phase 0.
3. **No keyword volumes are quoted anywhere.** No keyword tool was available. Doc H defines the workflow to obtain them.
4. **No performance numbers were measured.** All performance figures in Doc F are *budgets/targets*, explicitly labelled.
5. Ad RPM figures found online come from calculator vendors with no primary data; they are used only as labelled scenario assumptions in Doc I.

## 2. Corrections to `bigads.md` (verified 4 Nov 2026)

| `bigads.md` said | Current finding | Source |
|---|---|---|
| 123apps free plan: 5 files/day, 500 MB | Pricing page now lists free: **unlimited files/day, 10 GB max, ads**; Premium ₹190/mo or ₹1,824/yr. The page's own intro still mentions daily limits — page is internally inconsistent | https://123apps.com/pricing |
| OmniTools issue #301 (analytics/fingerprint in local PDF tool) is open | **Closed 20 Oct 2026**; collaborator says the PDF editor no longer uses SimplePDF. No commit shown; not independently verified | https://github.com/iib0011/omni-tools/issues/301 |
| ATools license AGPL-3.0 | README says AGPL-3.0; GitHub API reports `NOASSERTION` (license file not auto-detected). Treat as AGPL | https://github.com/aak1247/atools |
| FreeTools is "one of the closest competitors" | Repo has **0 stars** (GitHub API, 4 Nov 2026). Real-world traction is not evident; it's a code reference, not a market leader | https://github.com/firstlinkai/omnitools |
| Open-source landscape (list) | **Missing the two largest open-source PDF suites:** Stirling-PDF (~95.7k stars) and **BentoPDF (~16.2k stars, AGPL-3.0, browser-only, ~110 tool entries, sells a $79 lifetime commercial licence)** | GitHub API; https://github.com/alam00000/bentopdf |
| pdf-lib as a core dependency | **Last push 17 Jul 2024**, 318 open issues — effectively unmaintained. Maintained fork exists (`cantoo-scribe/pdf-lib`, pushed Sep 2026) | GitHub API |
| ffmpeg.wasm for audio/video | Its core build uses `--enable-gpl` with x264/x265 → shipping it means distributing a **GPL binary** + H.264/HEVC patent questions. **Mediabunny** (MPL-2.0, WebCodecs-based) is now a strong default, with ffmpeg.wasm as a fallback only | ffmpeg.wasm Dockerfile; https://mediabunny.dev |
| Add FAQs / structured data to tool pages | **Google stopped showing FAQ rich results on 7 May 2026** (docs removed 15 Jun 2026). FAQs remain useful *content*, but FAQPage markup gives no SERP feature | https://developers.google.com/search/docs/appearance/structured-data/faqpage |
| TinyWow deletes files after 1 hour | Its page says 1 hour in two places and "15-minute window" in another — internally inconsistent. TinyWow also now sells Premium (₹1,499/mo) with "skip all CAPTCHAs" and "priority processing" | https://tinywow.com/your-data |
| Squoosh #1422 (target size) | Confirmed open, opened 9 Jul 2024, 1 👍, no maintainer response. Batch processing (#1259) also still open since Jul 2022 | GitHub |

## 3. The six findings that should most change your plan

1. **"Free, no upload, privacy-first, 100+ tools" is a crowded, commoditised position in 2026.** Filevane (407+ tools), Gigai Tools (250+), Slaytic Tools (launched Jul 2026), BentoPDF, and a large wave of `*.pages.dev` / `*.vercel.app` sites (many evidently AI-generated) all claim it. Searches for "compress pdf to 100kb" and "is iLovePDF safe" returned mostly such sites. You cannot win on that claim; you can only lose by *not* meeting it.
2. **Incumbents' biggest weakness is not tools — it is billing trust.** iLovePDF (4.9★, 14k reviews) and Smallpdf (4.7★, 5.4k reviews) have strong overall ratings; their 1–2★ reviews in Jun–Nov 2026 are dominated by trial-to-paid conversion, auto-renewal, refund refusals and unresponsive support — not by tool quality. FreeConvert's low reviews add "'free' name vs ~10 conversions/day cap". Implication: an ad-funded model with no card-gated "free trial" is a genuine trust differentiator.
3. **Exact-output (target size/dimensions) is a real, under-served job, but the SERP is already flooded with "compress to 100kb" pages.** The differentiator is *verified* hit-the-target behaviour across image, PDF and video with honest failure — not having a page for it.
4. **The architecture's hardest problem is reconciling ads with privacy and with multithreaded WASM.** Third-party ad scripts in the same document can read pasted text and filenames; cross-origin isolation (needed for `SharedArrayBuffer`) breaks most ad iframes, and `COEP: credentialless` is unsupported in Safari through 27.2. Doc E resolves this with a **sandboxed cross-origin tool frame** and a **no-SharedArrayBuffer-by-default** engine policy.
5. **The strongest unmet demand found is "make my file pass this portal's upload validator"** — Indian exam/government forms (UPSC, SSC, IBPS, RRB, CBSE, GATE, Passport Seva) and visa/immigration portals (Canada IRCC, passport photos), plus "compress video to X MB" after Discord stopped auto-compressing uploads (Aug 2026). The job is exact pixels + KB range + format, sometimes DPI/background — not generic compression. Reddit also shows **counter-evidence: mainstream users mostly don't care about privacy; they want speed and a correct file.** (Doc B §1b)
6. **Search is no longer the only discovery channel.** A Dec 2025 Show HN (LocalPDF) reported ~50% of its traffic from ChatGPT vs ~45% from Google (self-reported, unverified). Treat AI-assistant citations as a second acquisition channel: clean semantic HTML, precise capability statements, and stable URLs serve both.

## 4. Final recommendation — key decisions ranked by impact

| # | Decision | Recommendation | Why (short) | Reversibility |
|---|---|---|---|---|
| 1 | Positioning | "Get the exact file you need — accepted the first time" — verified outcomes + **form/portal-ready tools as the flagship** + batch + honest limits; privacy as baseline, not headline | Privacy/no-upload is saturated and mainstream users care less than assumed; portal-upload rejections are the strongest unmet demand; billing trust is the incumbents' weak spot | Medium |
| 2 | Execution model | **Browser-local for all 30 launch tools; no server processing until Phase 3**, and then only for jobs browsers cannot do (Office conversion, long video) | Near-zero marginal cost; ad RPM cannot fund server transcoding (Doc I) | High |
| 3 | Privacy enforcement | Tool UI + workers run in a **sandboxed iframe on a separate origin** with `connect-src` locked to same-origin static assets; ads live only in the parent page | Only way to make "files never leave your device" *technically true* while running ads | Medium |
| 4 | Frontend | **Astro 6 (static output) + Preact islands**, one island per tool; content pages ship ~0 JS | Pages are 90% static content + one interactive widget; islands fit exactly | Low (costly to change later) |
| 5 | Tool system | Manifest (serializable, build-time) **strictly separated** from processor (lazy, worker) and UI (island); registry generated by codegen; boundaries enforced in CI | Keeps homepage/category bundles independent of tool count | Low |
| 6 | Media engine | **Mediabunny (WebCodecs)** primary; single-thread ffmpeg.wasm lazy fallback for formats WebCodecs can't handle | ~5–60× faster per vendor + competitor benchmarks; avoids shipping GPL x264 by default | High |
| 7 | PDF engine | pdf.js (render/text) + maintained pdf-lib fork (structure) + qpdf-wasm (encrypt/linearize/repair) — all permissive. **Evaluate commercial licences** for MuPDF or BentoPDF before building PDF compression from scratch | AGPL engines (MuPDF, Ghostscript, PyMuPDF) are best-in-class but need a licence for a closed product | Medium |
| 8 | Hosting | Cloudflare Workers static assets (free, unlimited static requests) + R2/Queues/Containers only when Phase 3 needs them | Static requests are free; server pieces scale to zero | High |
| 9 | Monetization | AdSense at launch → Raptive (25k PV threshold, per secondary sources) / Mediavine Journey; certified CMP for EEA/UK/CH; no subscriptions until data justifies | Avoid the exact billing-trust failure that hurts incumbents | High |
| 10 | Scope discipline | 30 tools at launch, each passing the acceptance checklist (Doc K); expand from Search Console data | Quality > count; Google scaled-content policy | High |

## 5. Honest competitive disadvantages

- **Zero domain authority** vs. PDF24/iLovePDF/Smallpdf (decade-old domains with massive backlink profiles). Head terms ("merge pdf", "compress pdf") are realistically unwinnable for 12–24 months; early traffic must come from long-tail, task-specific queries and non-Google channels.
- **No brand recognition** in a category where users are wary of unknown sites (Doc B: trust/clone-site concerns).
- **Server-side capabilities competitors already have** (Office↔PDF conversion with good fidelity, high-quality PDF compression via Ghostscript/MuPDF-class engines, OCR at scale) are expensive or license-constrained for us.
- **Copyability:** every browser-local feature can be cloned quickly by AI-assisted competitors. Durable advantages must come from quality, breadth of verified fixtures, brand trust and accumulated SEO, not from features alone.
- **Device ceiling:** browser-local processing is limited by the user's device; low-end Android phones (the majority in India, a likely key market) will fail on large PDFs/videos where server-based competitors succeed.

## 6. Unresolved questions that need your decision

1. **Brand/domain** — not researched further here; `bigads.md` §10 process stands.
2. **Primary market language/geography** — English-global vs. India-first (Indian exam/government upload rules: photo/signature KB limits are a big, specific job). This changes the tool list (Doc G wave 2) and RPM assumptions.
3. **Appetite for commercial licences** (MuPDF / BentoPDF / Ghostscript from Artifex) vs. building PDF compression on permissive libraries (slower, lower quality initially).
4. **Whether to go open-source** with the client (AGPL-style) — it would let us reuse BentoPDF/ATools-class code and strengthens the "verify our privacy" story, but gives competitors our code.
5. **Legal review budget** for: GPL ffmpeg.wasm distribution, LGPL libheif + HEVC patents (HEIC), AGPL engines, CMP/consent.
