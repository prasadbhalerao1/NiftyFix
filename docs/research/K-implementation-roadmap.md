# Deliverable K — Implementation Roadmap

Durations assume 2–3 engineers + part-time content/design. They are planning estimates, not commitments.

## Phase 0 — Validate & decide (2–3 weeks)
| | |
|---|---|
| **Objectives** | Close the research gaps that change the tool list or architecture |
| **Deliverables** | Hands-on competitor benchmark (Doc A §6) for 8 flagship jobs; portal-spec dataset v0 for 10–15 portals with official sources (Doc B §3); keyword briefs for W1 (Doc H §8); legal opinions requested (HEIC/libheif, ffmpeg GPL, MuPDF quote, DPDP/CMP); brand + domains (main + frame domain); decisions on open questions (00-README §6) |
| **Dependencies** | None |
| **Acceptance** | W1 list frozen with evidence per tool; ADRs 01–12 accepted or amended |
| **Risks** | Portal specs hard to source → forms tools slip to W2 |
| **Perf checks** | n/a |
| **Testing** | Fixture corpus v0 assembled (licensed/self-made files only) |

## Phase 1 — Platform foundation (5–6 weeks)
| | |
|---|---|
| **Objectives** | Everything shared, proven with 3 pilot tools of different types: **Compress Image** (target-size), **Merge PDF** (custom UI), **JSON Formatter** (schema-form/light) |
| **Deliverables** | Monorepo + CI gates; `tool-sdk`, `registry` codegen, `runtime` (worker pool, batch, cancel, OPFS, ZIP, verification), `ui` kit, `constraints` v1, `engines/image` + `pdf` + `data` (minimum), Astro site templates (home, category, tool), sandboxed frame with CSP, SEO generation (meta, JSON-LD, sitemap, robots, redirects), analytics schema + RUM, error monitoring, `new-tool` scaffolder |
| **Dependencies** | Phase 0 decisions |
| **Acceptance** | 3 pilot tools pass §4 checklist; adding a 4th dummy tool touches only its folder; e2e egress test proves no request leaves frame origin during processing; keyboard-only completion; sandbox spike meets budgets |
| **Main risks** | Frame UX (focus, height, drag-drop) friction; Valibot/Preact bundle surprises; OPFS Safari quirks |
| **Perf checks** | All Doc F page budgets in Lighthouse CI; frame ≤ 50 kB; home has zero engine modules |
| **Testing** | Unit + e2e on 3 browser engines + mobile emulation; first real-device pass (low Android, iPhone SE) |

## Phase 2 — Launch set (6–8 weeks)
| | |
|---|---|
| **Objectives** | Ship W1 (30 tools) at acceptance quality |
| **Order** | (1) Text/dev/QR (fast, proves scaffolding) → (2) image + forms (flagship) → (3) PDF (structural → compression last) → (4) media (Mediabunny) → (5) OCR |
| **Deliverables** | 30 tools, content pages, category pages, forms hub, About/Contact/Privacy/Terms/Security, "verify our privacy" page, third-party notices page, CMP + ads (AdSense) wired in parent only |
| **Dependencies** | Phase 1; legal answers for HEIC; portal specs |
| **Acceptance** | All 30 pass §4; Search Console verified; sitemap clean; zero P1 bugs; CWV budgets met in lab; privacy policy reviewed |
| **Main risks** | PDF compression quality (permissive engine) — fallback: ship with honest scope; WebCodecs codec gaps on Firefox/Android — fallback messages + format alternatives; mobile memory crashes |
| **Perf checks** | Processing benchmarks (Doc F §2.4) baselined; size-limit per tool |
| **Testing** | Per-tool fixtures incl. corrupt/malicious; real-device matrix before launch |

## Phase 3 — Learn, harden, first server tool (6–8 weeks after launch)
| | |
|---|---|
| **Objectives** | Iterate from data; W2 tools; introduce server path only for Word→PDF |
| **Deliverables** | W2 (30 tools) prioritised by Search Console + funnel data; `apps/api` + `services/processor` (LibreOffice) with full isolation, retention, rate limits, budget breaker; Hindi UI for forms (if data supports); MuPDF licence decision |
| **Acceptance** | Server tool: p95 queue wait ≤ 30 s, 0 retained files after 60 min (audited by job), security review passed; tool success rate ≥ 95% of starts across site |
| **Risks** | Server abuse/cost; LibreOffice CVEs (patch cadence); indexation slower than hoped |
| **Perf/test** | Load test API (k6); chaos test processor kills; dependency CVE SLAs |

## Phase 4 — Scale to 100 (ongoing, ~3–4 months)
- W3 (40 tools); premium validation experiment (Day Pass) **only if** ≥ 1M PV/month and user requests for ads-free/batch exist; ad network upgrade (Mediavine/Raptive); quarterly competitor benchmark; portal-spec dataset maintenance tied to exam calendars.
- Acceptance: maintenance load per tool stays flat (measured: CI time, bug rate per tool, time to add a tool ≤ 2 days for light, ≤ 1–2 weeks for heavy).

---

## 4. Tool acceptance checklist (every tool, every release)

**Function**
- [ ] Input validated by magic bytes + extension + size/pixel/page/duration limits (device-class aware)
- [ ] Correct output on all relevant fixtures; output re-validated (decodes, format, dims/pages/duration, target met)
- [ ] Output never larger than input for "compress" tools unless the user is told and the original is offered
- [ ] Closed error codes with human messages for: corrupt, unsupported, encrypted, too large, out of memory, target unreachable, engine crash, cancelled
- [ ] Batch: per-item status, retry failed only, ZIP of successes, collision-safe names, partial-success summary

**States & UX**
- [ ] Empty, loading-engine (with size if > 1 MB), processing (progress), success, failure, cancelled states
- [ ] Cancel works within 1 s (worker termination if needed)
- [ ] Mobile 360×640: no horizontal scroll, primary actions reachable, download works on iOS Safari and Android Chrome
- [ ] Keyboard-only flow; visible focus; axe: 0 serious/critical; screen-reader labels; 200% zoom/large text doesn't hide download (Squoosh #1442 lesson)

**Privacy & security**
- [ ] e2e egress test: zero requests from frame to non-self origins; zero POST/PUT during processing
- [ ] No filenames/content/exact sizes in analytics or error reports (schema-enforced + test)
- [ ] Regex/text ops in worker with timeout; SVG/HTML outputs sanitized; ZIP: path traversal + ratio + entry-count limits

**Performance**
- [ ] Frame JS within tier budget; engine within budget; no engine in parent/home bundles
- [ ] Benchmarks recorded for fixtures; INP ≤ 200 ms during processing

**SEO/content**
- [ ] Title, description, H1, canonical, breadcrumbs, JSON-LD valid; content sections complete and tool-specific; example uses real fixture numbers; related tools set
- [ ] Licences of new dependencies on allowlist (or ADR + legal sign-off)

## 5. Tool-specific test strategy (examples, not generic)
| Category | Must-have fixtures / cases |
|---|---|
| Image | EXIF-rotated JPEG (all 8 orientations); PNG with alpha → JPEG (background choice); CMYK JPEG; 16-bit PNG; animated GIF/WebP (first frame vs reject); 1×1 and 20000×200 extremes; > 100 MP (rejected); truncated JPEG; HEIC from multiple iPhone generations; ICC profiles (Display P3); target 20 KB from 12 MP (achievable), 2 KB (unreachable → honest failure) |
| Forms | Each portal preset: px exact, KB within [min,max], DPI tag, format/extension, filename rules; signature photo with shadows/lined paper |
| PDF | Encrypted (user/owner password, AES-128/256, RC4); malformed xref (repairable/not); 1,000-page; mixed page sizes/rotations; forms (AcroForm, XFA → unsupported message); embedded fonts subsetting; scanned JBIG2/CCITT; incremental updates; PDF/A; linearized; attachments; JavaScript actions (stripped/neutral) |
| Media | H.264/H.265/VP9/AV1 inputs; variable frame rate phone video; rotation metadata; no-audio and audio-only; 5.1 audio; MOV from iPhone; corrupt moov atom; > device limit (rejected); keyframe-boundary trims |
| OCR | Clean scan 300 DPI; phone photo skewed 7°; low contrast; two-column; Hindi/Devanagari; rotated 90° |
| Text/Dev | Unicode (emoji, RTL, combining marks), CRLF/LF, 10 MB input, invalid JSON with error position, catastrophic regex (must time out), JWT with invalid base64url |
| Archive | Zip bomb (42.zip-style ratio), path traversal entries (`../`), symlinks, 10,000 tiny entries, encrypted zip, non-UTF8 names |

## 6. CI/CD
| Stage | Gates |
|---|---|
| PR | Typecheck (tsc --noEmit), ESLint + boundaries, Prettier check, unit tests (affected), e2e (affected tools, 3 engines), `check-tools`, size-limit, Lighthouse CI (6 URLs), license allowlist + OSV scan, SBOM diff |
| Main | Full test suite, build, deploy to staging (preview URL), smoke e2e on staging, egress tests |
| Release | Manual approval; deploy site + frame atomically (frame paths are hashed so old pages keep working); post-deploy synthetic checks; rollback = redeploy previous build |
| Nightly | Benchmarks, full cross-browser matrix, broken-link crawl, CWV pull from CrUX |
| Weekly | Renovate dependency PRs (grouped), Search Console export, cost report (Phase 3) |

**Monitoring & alerting:** RUM CWV regression > 10% week-over-week; tool success rate < 95% (per tool, 24 h); error spikes by `ToolError.code`; server budget thresholds; uptime checks for site/frame/API.
