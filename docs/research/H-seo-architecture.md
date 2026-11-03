# Deliverable H — SEO Architecture & Launch Strategy

**Sources (verified 4 Nov 2026):** Google spam policies (https://developers.google.com/search/docs/essentials/spam-policies), FAQ structured data deprecation (https://developers.google.com/search/docs/appearance/structured-data/faqpage), Software App structured data (https://developers.google.com/search/docs/appearance/structured-data/software-app), Core Web Vitals (https://web.dev/articles/vitals). Rankings cannot be guaranteed; this plan maximizes eligibility and usefulness.

## 1. Realistic SEO stance
- Head terms ("merge pdf", "compress image") are held by decade-old domains. Expect **no meaningful head-term rankings for 12–24 months.**
- Our entry points: **specific, high-intent long tail where our tool is genuinely better** — portal-specific form pages (Doc B P14), "compress video for discord", "compress pdf to 200kb", format pairs — plus brand/direct, Reddit/community answers, and AI assistants (LocalPDF reported ~50% ChatGPT traffic; self-reported).
- **Policy risk is real:** Google's *scaled content abuse* policy targets "many pages generated for the primary purpose of manipulating search rankings", including generative-AI pages with little value; *doorway abuse* targets "substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy"; *misleading functionality* targets pages that claim a tool but don't deliver it. Core updates in 2026 (March, May; spam update Sept 2026 per secondary sources) reportedly hit AI-generated tool/affiliate sites. **Every page must have a working, distinct tool at its centre.**

## 2. URL structure

```
/                                   home (brand, search, categories)
/{category}/                        /image/  /pdf/  /video/  /audio/  /text/  /developer/  /data/  /ocr/
                                    /generators/  /calculators/  /files/  /forms/
/{category}/{tool-slug}/            /image/compress-image/   /pdf/merge-pdf/   /video/compress-video/
/{category}/{tool-slug}/{variant}/  ONLY for qualifying variants (rules below):
                                    /image/convert-image/webp-to-jpg/
                                    /video/compress-video/discord/
/forms/{portal}/{document}/         /forms/ssc/photo/   /forms/ibps/signature/   /forms/passport-seva/photo/
/guides/{slug}/                     substantive how-to articles tied to tools (sparingly)
/{locale}/...                       later (hi/ first for forms if justified)
```
- Lowercase, hyphenated, trailing slash, stable forever; tool `id` ≠ slug so slugs can be renamed with 301s.
- Canonical host: `https://www.<brand>.com` (301 apex→www, http→https, no-trailing-slash→slash) at the edge.

### Variant-page qualification rule (anti-doorway)
A variant URL is allowed **only if all three hold**: (1) it pre-configures the tool differently (preset, input/output types, constraints) so the user lands ready to act; (2) it has ≥ 150 words of *variant-specific* content (e.g., the official spec with source and date, format-specific caveats) not shared with siblings; (3) Search Console or keyword research shows distinct queries. Otherwise it's a preset chip on the main tool page, not a URL. Variant pages canonicalize to **themselves** (they are distinct), and are linked from the parent tool in a visible list (browseable hierarchy, not hidden doorway links).

## 3. Page template (tool page)
Order is designed so the tool is above the fold on mobile.
1. Breadcrumb (`Home › Image › Compress Image`)
2. **H1** (task phrasing) + one-sentence promise including the processing location ("Runs on your device — files are not uploaded")
3. **Tool frame** (dropzone visible without scrolling at 360×640)
4. Preflight facts strip: supported formats · max size on this device · batch limit · output formats
5. "How to" (3–5 steps, specific to this tool, with the real control names)
6. Options explained (what each setting changes, in outcome language)
7. Limits & troubleshooting (honest: e.g., "Scanned PDFs under 100 KB may become unreadable — try…")
8. Worked example (real input→output numbers from our fixtures, e.g., "4.2 MB phone photo → 98.6 KB at 1200×1600")
9. FAQs (real questions from Reddit/Search Console; **no FAQPage markup** — Google stopped showing FAQ rich results on 7 May 2026)
10. Related tools (contextual: "Next: convert to PDF", "Resize first")
11. Privacy note specific to this tool's `privacy` class
12. Ads only in positions defined in Doc I (never between H1 and tool)

**Content ownership:** every tool's `content.{locale}.mdx` lives next to its manifest (Doc J). Written by a human (AI-assisted drafting allowed) and reviewed against the acceptance checklist: no generic filler, every claim matches tool behaviour, numbers come from fixtures.

## 4. Metadata & structured data (generated from the registry)
| Element | Source | Rule |
|---|---|---|
| `<title>` | `manifest.i18n.seoTitle` | ≤ 60 chars; task first, brand last |
| meta description | `seoDescription` | ≤ 155 chars; concrete capability |
| canonical | computed from slug | self-referencing absolute URL |
| `hreflang` | locales present | only when a translated page exists |
| Open Graph/Twitter | generated per tool (build-time OG image via Satori or static template) | |
| `WebSite` + `Organization` JSON-LD | home only | consistent site name (Google site-name guidance) |
| `BreadcrumbList` JSON-LD | every tool/category page | matches visible breadcrumb |
| `WebApplication` JSON-LD | tool pages | `name`, `applicationCategory`, `operatingSystem: "Any (web browser)"`, `offers.price: 0`. **Rich result requires `aggregateRating` or `review`** — we will **not** fabricate ratings; add only once we collect genuine on-site ratings that follow review-snippet guidelines |
| `HowTo` | — | not used (deprecated in Search) |
| `FAQPage` | — | not used (no SERP feature since May 2026) |

## 5. Indexing controls
- `sitemap.xml` generated from the registry: only `status: 'live'` tools, live categories, qualifying variants; `lastmod` = content or manifest version change date (not build date).
- `status: 'beta'` → `noindex, follow` until it passes the acceptance checklist; `deprecated` → 301 to the replacement (redirect map generated from `manifest.redirectFrom`).
- `robots.txt`: allow all content; disallow `/t/` on the frame domain (frames are not landing pages) and any internal search result URLs.
- The frame origin sends `X-Robots-Tag: noindex`.
- No query-parameter URLs are linked internally; options deep links use the URL **hash** (not crawled as separate URLs).
- 404 is a real 404 with search; no soft-404 stub pages for unbuilt tools ("coming soon" pages are not published).

## 6. Internal linking
- Category pages: curated groups ("Make files smaller", "Convert", "Edit pages") with 1–2 sentences each — not a bare grid.
- Tool → related tools from `manifest.related` (2–5, contextual sentences).
- **Post-result "continue with this file"** links (inside the frame, client-side) — these are UX, not SEO; SEO links are the static ones in the parent.
- Forms hub `/forms/` → portals → documents; each portal page links to Photo/Signature/Document tools with its preset.
- Guides link to tools; tools link to at most 1–2 guides.
- All links are plain `<a href>` in static HTML.

## 7. Static vs. dynamic rendering
| Content | Rendering |
|---|---|
| All tool, category, forms, guide pages | **Static at build** (Astro) |
| Search index JSON, sitemap, robots, OG images | Static at build |
| Portal spec data | Static at build from a versioned JSON dataset with source URLs; rebuild on change |
| Anything personalized (none at launch) | n/a |
| Job status (Phase 3) | API, never indexed |

## 8. Keyword-research workflow (no fabricated volumes)
For each candidate tool/variant:
1. **Seed list** from task language: Reddit titles (Doc B), Google autocomplete, People Also Ask, related searches (manual, incognito, US + IN locations).
2. **Volume/difficulty:** Google Keyword Planner (ranges) + one third-party tool (Ahrefs/Semrush/free alternatives). Record tool name, location, date. Treat as relative, not absolute.
3. **SERP analysis** (top 10): page type (tool vs article), whether the top results have target-size/batch/no-upload, ads present, AI Overview present, freshness. Save screenshots.
4. **Gap statement:** one sentence of what top pages fail to provide that we will (must be verifiable in our tool).
5. **Decision:** main page / variant page / preset only / skip.
6. **Post-launch:** replace estimates with Search Console impressions after 8–12 weeks.

Template stored in `content/keyword-briefs/{tool-id}.md` (Doc J).

## 9. Monitoring
| Metric | Tool | Cadence | Action trigger |
|---|---|---|---|
| Impressions, clicks, CTR, avg. position per page & query | Search Console (API → weekly export to a sheet/BigQuery) | Weekly | Impressions rising + CTR < 2% → improve title/description accuracy |
| Indexed vs submitted | Search Console Pages report | Weekly | Any live tool "Crawled – currently not indexed" > 4 weeks → content review |
| Bing | Bing Webmaster Tools | Monthly | |
| CWV field data | Search Console CWV report + CrUX + Cloudflare RUM | Weekly | Any URL group "Needs improvement" → perf sprint |
| Tool funnel: view → start → success → download | Workers Analytics Engine | Daily | Success < 95% of starts → bug triage |
| Organic landing → tool start rate | Analytics | Weekly | < 30% → page/UX review |
| Returning users | Analytics (cookie-less approximation; consent-aware) | Monthly | |
| AI-assistant referrals (chatgpt.com, perplexity.ai, gemini) | Referrer report | Monthly | |

## 10. Launch sequence
- **Pre-launch:** registry-driven metadata/sitemap; About/Contact/Privacy/Terms/Security pages with named operator; Search Console + Bing verified; crawl the staging site with Screaming Frog (or open-source equivalent) to confirm no orphan pages, canonical errors, or noindex leaks.
- **Days 1–14:** submit sitemap; URL inspection for the 30 tools; fix errors.
- **Days 15–90:** iterate content on pages with impressions; add W2 tools by observed demand; publish forms pages aligned to exam notification calendars.
- **Off-site (allowed, non-spammy):** answer genuine questions on Reddit/Quora *with disclosure*, list in alternative-to directories, Product Hunt launch, open-source a small component (e.g., the constraint solver) for developer goodwill and links.
