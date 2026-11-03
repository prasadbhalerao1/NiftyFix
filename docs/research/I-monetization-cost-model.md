# Deliverable I — Monetization & Cost Model

**Verified prices (4 Nov 2026):** Cloudflare R2 storage $0.015/GB-month, Class A $4.50/M, Class B $0.36/M, egress free, free tier 10 GB + 1 M A + 10 M B ops. Cloudflare Containers: $0.000020/vCPU-s, $0.0000025/GiB-s, $0.00000007/GB-s disk; included 375 vCPU-min, 25 GiB-h, 200 GB-h per month on Workers Paid; egress $0.025/GB (NA/EU) after 1 TB. Workers static asset requests: free and unlimited. Hetzner dedicated vCPU from €43.49/month. AdSense: Google-certified TCF CMP required for personalized ads in EEA/UK (since 16 Jan 2024) and Switzerland (since 31 Jul 2024).
**Everything else is an assumption and labelled (A).**

---

## 1. How competitors make money (summary of Doc A)
Ads only (PDF24) · ads + optional no-ads premium (TinyWow ₹1,499/mo, 123apps ₹190/mo, XConvert) · freemium caps → subscription (iLovePDF ₹500/mo, Smallpdf ~$12/mo 3P, Adobe) · credits/minutes (FreeConvert $12.99–29.99, CloudConvert, Online-Convert €13–68) · API · commercial licences (BentoPDF $79).
**Key lesson from Doc B:** subscription-trial mechanics generate the majority of 1–2★ reviews for the best-rated incumbents.

## 2. Recommended model

### Phase A (launch → ~1M PV/month): ads only
- **AdSense** at launch (no traffic minimum) with Google's own certified CMP ("Privacy & messaging") for EEA/UK/CH.
- Upgrade path (thresholds from secondary sources, verify before applying): **Mediavine Journey** (reported 1,000 sessions/month since 15 Jan 2026), **Raptive** (reported 25,000 PV/month since Oct 2025), Ezoic (reported raised to 250,000 MAU in Feb 2026).
- Do **not** add premium, accounts or payments yet.

### Phase B (validated demand only): optional paid tier with no traps
Candidates ranked by fit:
1. **Ad-free + convenience** (larger batch defaults, saved presets in local storage synced via account, priority server jobs) — sold as a **one-time Day/Week Pass** (e.g., ₹49 / $1.99 for 24 h — hypothesis) *and* monthly with one-click cancel. A pass has no renewal and directly answers P1 complaints.
2. **Server-capacity jobs** (Office conversion beyond free quota, long video, bulk OCR) priced to cost + margin.
3. **API / commercial engine licence** (e.g., the constraint solver, form-spec validator for portals/coaching institutes) — B2B.
4. **Teams / privacy-sensitive organisations** (self-hosted or enforced local build) — matches the r/privacy evidence that companies can't stop staff using upload sites.

**Never:** card-required trials; paywall *after* processing; watermark on free outputs; download wall behind signup; nag modals.

## 3. Ad placement policy (UX + CLS + trust)
| Page area | Desktop | Mobile |
|---|---|---|
| Between H1 and tool | ❌ never | ❌ never |
| Inside / adjacent to tool frame controls, results, download buttons | ❌ never | ❌ never |
| Right rail (sticky only within content column, not over tool) | ✅ 1 unit (300×600 / 300×250) | — |
| Below tool, before how-to | ✅ 1 responsive unit, reserved height | ✅ 1 unit (300×250 reserved) |
| Within long content (≥ 600 words) | ✅ 1 unit | ✅ 1 unit |
| Anchor/sticky footer | ⚠️ test; dismissible; must not cover download | ⚠️ test |
| Interstitials, pop-unders, auto-play video ads, "download"-style creatives | ❌ | ❌ |
- Reserve slot dimensions in CSS (`min-height`) ⇒ CLS 0; load ad script after LCP + idle.
- Block sensitive/deceptive categories in ad network controls (software downloads, "PC cleaner", VPN-scare, gambling where legal-sensitive).
- Max **3 ad units per page**; ad density reviewed against Better Ads Standards.
- **Ads never run inside the tool frame** (Doc E ADR-02) ⇒ privacy claim remains technically true; tool INP unaffected.

## 4. Unit economics

### 4.1 Revenue per pageview (A)
No credible primary RPM data for utility sites was found (only calculator vendors). Scenarios:

| Scenario | Page RPM (A) | Rationale |
|---|---|---|
| India-heavy (forms traffic) | $0.50–1.50 | Lower CPMs in IN (directionally supported by multiple sources; magnitude unverified) |
| Mixed global | $2–4 | |
| US/UK/CA/AU-heavy | $5–10 | Tier-1 geos, premium network |

| Monthly PV | RPM $1 | RPM $3 | RPM $8 |
|---|---|---|---|
| 100k | $100 | $300 | $800 |
| 1M | $1,000 | $3,000 | $8,000 |
| 5M | $5,000 | $15,000 | $40,000 |

### 4.2 Cost per job
**Browser-local tools (all of W1/W2, nearly all W3):** marginal cost ≈ **$0** — static requests free on Workers static assets; engine WASM is cached client-side. The only scaling costs are analytics events (Workers Analytics Engine; within plan allowances at expected volumes — verify) and error monitoring.

**Server tools (Phase 3), Cloudflare Containers pricing, our assumptions on runtime (A):**
| Job | Instance | Runtime (A) | CPU cost | Memory cost | ≈ Total / job |
|---|---|---|---|---|---|
| Word→PDF (LibreOffice), typical doc | standard-1 (½ vCPU, 4 GiB) | 5 s active + 3 s overhead | 8 s × ½ × $0.00002 = $0.00008 | 4 × 8 × $0.0000025 = $0.00008 | **$0.0002** |
| Video transcode, per minute of 1080p → 720p H.264 (CPU) | standard-2 (1 vCPU, 6 GiB) | ~60 vCPU-s per video-minute (A — must benchmark) | $0.0012 | 6 × 60 × $0.0000025 = $0.0009 | **$0.002 / video-minute** |
| Bulk OCR, per page | standard-2 | 3 s | $0.00006 | $0.000045 | **$0.0001** |
| Storage (R2), 50 MB for 1 h | — | — | — | — | ≈ $0.000001 (negligible) + ops $0.0000049 |

**Revenue per tool session (A):** ~2 pageviews × RPM $1–8 ⇒ **$0.002–0.016**.

### 4.3 Where losses happen
| Operation | Verdict |
|---|---|
| Office→PDF on server | **Profitable** even at low RPM ($0.0002 vs ≥ $0.002) |
| Server OCR | Profitable per page; cap pages per session |
| **Server video transcoding** | **Loss-making at India RPMs** beyond ~1 video-minute per session; marginal at global RPMs beyond ~5 min. ⇒ Keep video in the browser; server video only for paid tier or with tight caps (e.g., ≤ 3 min, ≤ 200 MB free) |
| AI (GPU) operations | Not viable on ad revenue; browser-side models or paid only |
| Egress of results | Free via R2 |

### 4.4 Fixed costs (A — verify vendor pricing before budgeting)
| Item | Monthly (A) |
|---|---|
| Cloudflare Workers Paid (includes Containers allowances) | $5 |
| Domain(s) incl. frame domain | ~$2 |
| Error monitoring (free tier → paid) | $0–30 |
| Real-device testing cloud | $0–150 (can start with owned devices) |
| CMP | $0 (Google Privacy & messaging) |
| Search tools (Keyword Planner free; Ahrefs/Semrush optional) | $0–130 |
| **Total at launch** | **≈ $10–320** |

## 5. Abuse & cost controls
- Browser tools: abuse is mostly scraping/hotlinking of assets → cache at edge; frame `frame-ancestors` restricts embedding.
- Server tools: Turnstile when risk signals appear; per-IP and per-/24 rate limits; signed upload size caps; per-tool daily free quota shown **before** upload; global daily budget circuit-breaker (Worker reads spend counter; switches server tools to "busy — try later or use the on-device version"); reject archives/media exceeding caps before queueing.
- Alerting: daily cost report; alert at 50/80/100% of monthly budget.

## 6. Privacy & consent requirements for monetization
- Certified TCF CMP for EEA/UK/CH (required for personalized ads).
- Non-personalized ads fallback when consent is declined.
- Privacy policy must disclose: ad partners, analytics, frame architecture (what never leaves the device), server-tool retention.
- India DPDP Act 2023 obligations for Indian users — **legal review** (not researched in depth here).
