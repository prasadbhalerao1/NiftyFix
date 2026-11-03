# Deliverable B — User Pain-Point Research

**Research date:** 4 Nov 2026.

## 0. Evidence base and limitations

| Source type | Access | Used for |
|---|---|---|
| Trustpilot 1–2★ pages (iLovePDF, Smallpdf, FreeConvert) | ✅ fetched 4 Nov 2026, dated reviews Jun–Nov 2026 | Billing, quota, quality complaints |
| Hacker News comments (Algolia API) | ✅ | Privacy, limits, ad-farm complaints |
| GitHub issue trackers (Squoosh, OmniTools, BentoPDF, Stirling-PDF) | ✅ | Feature requests, defects |
| Security/malware reports (PCRisk, TechRadar) | ✅ via search | Fake-download-button/malvertising risk |
| **Reddit** | ✅ via logged-in browser session (4 Nov 2026); search + top comments of ~30 threads (API/JSON endpoints blocked, HTML pages read) | All categories — see §1b |
| Product Hunt / IndieHackers / dev.to | ✅ via search | Supply-side signal (what builders think users want) — weak demand evidence |

**Bias warnings:** Trustpilot reviewers self-select; the overall scores of the same companies are high (iLovePDF 4.9/14,051; Smallpdf 4.7/5,430; FreeConvert 4.6/17,403). Complaints show *failure modes*, not prevalence. HN users skew technical/privacy-conscious. Builder posts ("I built X because…") are promotional.

Paraphrases only; no quotations are invented. Review dates are as displayed on Trustpilot.

---

## 1. Pain-point register

Columns: **Indep.** = number of independent source types pointing the same way. **Verified limitation** = whether the underlying product behaviour is confirmed on an official page.

### P1 — Billing traps: trial → paid, auto-renewal, refund refusal
- **Complaint:** charged after a "free trial"; annual renewal not expected; charges continuing after cancellation; refunds refused (incl. an "early termination fee"); support scripted or silent.
- **Sources:**
  - Smallpdf 1–2★, 3 Nov, 26 Oct, 23 Oct, 20 Oct, 15 Oct, 9 Oct, Sep 9–15, Aug 8 2026 — https://www.trustpilot.com/review/smallpdf.com?stars=1&stars=2
  - iLovePDF 1–2★, 9 Oct, 22 Sep, 15 Sep, 9 Jul, 2 Jul, 21 Jun 2026 — https://www.trustpilot.com/review/ilovepdf.com?stars=1&stars=2
  - FreeConvert 1–2★, 11 Mar 2026 ($9.99 Basic Web with no cancel option), 21 Feb 2026 (charged 3 months after cancelled trial) — https://www.trustpilot.com/review/freeconvert.com?stars=1&stars=2
  - TinyWow (bigads.md, small sample), r/pdf "Be careful with Smallpdf subscriptions" (bigads.md, *Reddit not re-verified*)
- **Indep.:** 3 companies, 2 source types. **Verified limitation:** trial exists (Smallpdf, TinyWow 7-day — V). Billing practices themselves not adjudicated.
- **Opportunity:** No card-gated trials. If premium ever exists: monthly only at first, one-click cancel, renewal reminder email, pro-rata refunds. Market this ("No trials. No subscriptions needed. Ever for basics.").
- **Difficulty:** Low. **Confidence:** High that this is a strong, recurring frustration.

### P2 — "Free" that isn't: caps and paywalls discovered after effort
- **Complaint:** FreeConvert name vs ~10 conversions/day (reviews 2 Feb 2026, 24 Dec 2025, 21 Dec 2025); iLovePDF 25-file cap without subscription (7 Oct 2026); "unlimited" plan blocked on long document (24 Sep 2026); Smallpdf free tool with 2-hour download wait (28 Sep 2026); HN: tools that "charge after a few uses" / "File too large" (piyushpr134, 9 Mar 2026, https://news.ycombinator.com/item?id=47313393); HN: accounts, subscriptions, daily limits (nicbars, 3 Jan 2025, https://news.ycombinator.com/item?id=42584901); 123apps duration paywall after recording (bigads.md).
- **Indep.:** 4+ products, Trustpilot + HN. **Verified limitation:** yes — FreeConvert 20 min/day & 5 min/file; iLovePDF per-tool caps; CloudConvert 10 credits; XConvert 30 video/day (all V).
- **Opportunity:** **Preflight panel** before any work: limits, processing location, expected time. Since our launch tools are local, our "limits" are device limits — state them honestly ("Files over ~200 MB may fail on phones").
- **Difficulty:** Low. **Confidence:** High.

### P3 — Privacy distrust of uploading sensitive documents
- **Complaint:** tax/legal/medical PDFs sent to third-party servers (vardhan1237, 26 Oct 2026, https://news.ycombinator.com/item?id=50238740); bank statements to converters (amsaleque, 27 Sep 2025, https://news.ycombinator.com/item?id=45397810); data collection by text extractors (18272837023, 31 Oct 2025, https://news.ycombinator.com/item?id=45772400); large CSVs (yszhu, 10 Jul 2025, https://news.ycombinator.com/item?id=44521007); r/pdf & r/opensource threads (bigads.md, *not re-verified*); OmniTools #301 — third-party analytics + document fingerprint from a "local" tool (filed 14 Dec 2025, closed 20 Oct 2026); Stirling-PDF #3283 tracking pixel sending data after opt-out (closed Jul 2025).
- **Indep.:** HN ×5, GitHub ×2, Reddit (unverified), dozens of vendor articles (supply-side).
- **Verified limitation:** iLovePDF retains up to 2 h server-side (V); PDF24 1 h server (V).
- **Opportunity:** Technically enforced local processing (sandbox frame + CSP, Doc E) with a public, reproducible "verify it yourself" page and automated network tests. **Note:** the claim alone is saturated (Doc A §2.19); enforcement + verifiability is the edge.
- **Difficulty:** Medium. **Confidence:** High that the concern is real; Medium that it drives tool choice for mainstream users (vs. technical users).

### P4 — Output quality destroyed / conversions unusable
- **Complaint:** PDF→Word producing images not text (iLovePDF 26 Jul 2026), uneditable Word text (21 Sep 2026), disorganised PDF→Excel (7 Oct 2026), edits not persisting (6 Aug 2026); FreeConvert output unusable for PowerPoint (27 May 2026), "no visible change" (17 May 2025); compressor destroying scanned legibility at 100 KB (r/pdf via bigads.md); Compress2Go output larger than input (bigads.md); TinyWow 3008→3007 KB (bigads.md).
- **Indep.:** 4+ products, Trustpilot + Reddit (unverified).
- **Opportunity:** **Output verification** + "original kept if output is larger" + visual before/after for lossy ops + honest scoping of hard conversions (PDF→Word fidelity). Don't launch PDF→Word until fidelity is measurably acceptable.
- **Difficulty:** Medium (verification) to Very High (fidelity conversions). **Confidence:** High.

### P5 — Need to hit an exact size/dimension limit (upload portals)
- **Complaint:** portal accepts ≤100 KB, scanned pages became unreadable (r/pdf via bigads.md); Squoosh #1422 target size (2024, open); vendor guides show the KB vs KiB ambiguity and "aim ~3% under" heuristics.
- **Supply-side signal:** the SERP for "compress pdf to 100kb" is saturated with vendor pages (iLovePDF, Smallpdf blogs; many pages.dev sites). Demand clearly exists; competition too.
- **Indep.:** GitHub, Reddit (unverified), the sheer number of competing pages.
- **Opportunity:** a **shared constraint engine** that guarantees `bytes ≤ target` (using 1000-byte KB with a safety margin, and stating it), searches quality → resolution → grayscale in a declared order, previews legibility, and reports "not achievable at readable quality" honestly. Indian exam/government forms (photo 20–50 KB, signature 10–20 KB at fixed pixel sizes) are an especially specific sub-job — **needs Reddit/forum verification and official notice research**.
- **Difficulty:** Medium. **Confidence:** High.

### P6 — Batch: "stop making me do one file at a time"
- **Complaint:** Squoosh #301 "upload multiple image files" (top-reacted, closed 2020) and #1259 "Batch/Bulk process" (open since Jul 2022); bulk OCR (r/pdf via bigads.md); FreeConvert reviewer wanting fewer batch limits (bigads.md); iLovePDF/iLoveIMG gate batch as Premium (V).
- **Indep.:** GitHub, Trustpilot, Reddit (unverified), competitor pricing pages.
- **Opportunity:** platform-level batch queue (per-file status, retry, ZIP, collision-safe names) for every compatible tool, free.
- **Difficulty:** Medium (once, in the runtime). **Confidence:** High.

### P7 — Slow, stalling, no progress feedback; tab must stay open
- **Complaint:** FreeConvert stalls at 66%, no time estimate (May 2025); PDF2Go slow/timeout then premium (bigads.md); Convertio requires tab open (bigads.md); Sejda 3 tasks/hour (3P).
- **Opportunity:** real progress (per-page/per-frame), cancellation, ETA after first 10% of work; local processing avoids upload/queue time entirely for most files. For future server jobs: resumable uploads (XConvert sells this — V), job IDs that survive tab close.
- **Difficulty:** Low–Medium. **Confidence:** Medium-High.

### P8 — Ad-farm UX, fake download buttons, malvertising
- **Complaint:** HN gloosx (24 Feb 2025, https://news.ycombinator.com/item?id=43161135) — converters full of "ad-farms"; PCRisk reports converter sites redirecting to fake CAPTCHA/notification spam; TechRadar on malvertising via a converter site's ad supplier.
- **Opportunity:** ad policy that never places ads inside/adjacent to tool controls; download button visually unique; ad slots fixed-size; block categories (downloads/software) in ad network controls; no pop-unders/interstitials.
- **Difficulty:** Low (policy) — revenue trade-off. **Confidence:** High.

### P9 — Hard-to-understand settings
- **Complaint:** Squoosh #1410 tooltips for codec settings (bigads.md); "Simple Mode not simple" BentoPDF #69 (closed Oct 2025).
- **Opportunity:** outcome-first controls ("under 200 KB", "for email", "for WhatsApp") with advanced settings collapsed.
- **Difficulty:** Low. **Confidence:** Medium.

### P10 — Mobile/accessibility failures blocking completion
- **Complaint:** Squoosh #1442 download button missing with large font sizes (bigads.md); Safari AVIF export failure #1460.
- **Opportunity:** large-text/zoom/mobile tests in CI; feature-detect encoders and offer alternatives.
- **Difficulty:** Low–Medium. **Confidence:** Medium.

### P11 — Users want real PDF text editing, forms, translation, OCR→Excel
- **Requests:** BentoPDF #144, #290 edit existing text; Stirling #1141 edit PDF text, #320 form entries, #2192 translation; OmniTools #244 fillable forms, #234 OCR→Excel, #275 translate PDF.
- **Indep.:** 3 OSS trackers.
- **Assessment:** high demand, **very high difficulty** for true text editing (font subsetting, reflow). Form *filling* (AcroForm) is feasible early; form *creation* medium; text editing and translation should be long-term.
- **Confidence:** High demand / Low feasibility near-term.

### P12 — Upsell nags in otherwise free tools
- **Requests:** Stirling #2974 "Option to disable Upgrade to Pro" (23 comments), #5772 default-app prompt; BentoPDF #329 remove "Used by companies…" banner.
- **Opportunity:** no nag modals. Premium (if any) is discoverable, never interruptive.

### P13 — Clone/copycat distrust and unclear ownership
- **Complaint:** r/pdf thread (bigads.md, *not re-verified*); HN jacquesm questioning whether a launch post was LLM-written (26 Oct 2026, https://news.ycombinator.com/item?id=50239259).
- **Opportunity:** named operator, real About/Contact, changelog, public status/incident page, open test corpus results. Trust is earned through accountability signals the clone wave won't bother with.

---

## 1b. Reddit evidence (read 4 Nov 2026 via logged-in browser)

Scores are upvotes at read time. Post bodies were read for the first group; for others only top comments were captured. "Builder post" = someone promoting their own tool (supply-side evidence, not neutral demand).

### Threads that add new pain points

**P14 (NEW, strong) — Government / exam / visa upload rejections.** Independent posts across many communities, all 2025–2026:
| Thread | Date | Signal |
|---|---|---|
| [r/RailwayExams — resize signature for NTPC form](https://www.reddit.com/r/RailwayExams/comments/1xlv5es/how_to_resize_my_signature_for_ntpc_form_filling/) | 2 Nov 2026 | Signature size spec confusion |
| [r/ssc — 20 KB signature for SSC CHSL](https://www.reddit.com/r/ssc/comments/1wzw53k/how_do_i_upload_a_20_kb_4k_signature_for_the_ssc/) | 7 Oct 2026 | 4K phone photo → 20 KB requirement |
| [r/CBSE — signature dimensions in circular](https://www.reddit.com/r/CBSE/comments/1ujr5if/while_applying_private_candidates_supplementary/) | 30 Jun 2026 | Spec in a PDF circular |
| [r/UPSC — Mains form photo keeps getting rejected](https://www.reddit.com/r/UPSC/comments/1rcf4ad/i_am_not_able_to_upload_the_photo_in_the_upsc/) | 23 Feb 2026 | Still rejected after renaming / .jpg→.jpeg — validation beyond size |
| [r/bankingexam — IBPS PO upload rejections](https://www.reddit.com/r/bankingexam/comments/1ulhv3z/fixing_common_ibps_po_document_upload_rejections/) | 2 Jul 2026 | Portal's automated photo "recognizer works very randomly" (comment) |
| [r/nri — Passport Seva 630×810, <250 KB keeps failing](https://www.reddit.com/r/nri/comments/1s9m7f2/passport_seva_photo_upload_keeps_failing_630x810/) | 1 Apr 2026 | Exact pixels + KB; commenters share a Streamlit converter that "worked in one shot" |
| [r/Indian_Academia — "File size exceeds limit" (50 KB)](https://www.reddit.com/r/Indian_Academia/comments/1v66w36/file_size_exceeds_limit_on_form_photo_uploads/) | 25 Jul 2026 | — |
| [r/indianstudents — SSC CPO 50 KB fix (Hindi)](https://www.reddit.com/r/indianstudents/comments/1wjriza/ssc_cpo_2026_photo_size_kaise_fix_kare_50kb/) | 18 Sep 2026 | Hindi-language demand |
| [r/pgwp — reduce PDFs for IRCC size limits](https://www.reddit.com/r/pgwp/comments/1pm3tx1/how_did_you_reduce_your_pdf_files_to_meet_irccs/) | 14 Dec 2025 | Canada immigration PDFs |
| [r/passportcanada — photo upload rejected](https://www.reddit.com/r/passportcanada/comments/1v8ebtu/uploading_photos_rejected/) | 27 Jul 2026 | Pixel issue + automated checks (background, glare, eyes) |
| [r/srilanka — PDF to 200 KB for police clearance](https://www.reddit.com/r/srilanka/comments/1wwdejg/how_to_compress_pdf_to_200kb_for_police_clearance/) | 3 Oct 2026 | — |
| [r/indotech — compress under 250 KB](https://www.reddit.com/r/indotech/comments/1w55t7w/cara_compress_under_250kb/) | 2 Sep 2026 | Indonesia |
| Builder posts: [r/GATEtard](https://www.reddit.com/r/GATEtard/comments/1wi7ual/made_a_free_tool_for_fixing_photosignature_sizes/) (16 Sep 2026), [r/ssc](https://www.reddit.com/r/ssc/comments/1p3qkr4/i_made_a_free_tool_to_resize_photos_for_upscssc/) (22 Nov 2025), [r/SideProject "annoying kb limits"](https://www.reddit.com/r/SideProject/comments/1xk1wb3/i_made_a_free_image_resizer_for_those_annoying_kb/) (31 Oct 2026), [r/JSKAPPS "fix pixel size before quality"](https://www.reddit.com/r/JSKAPPS/comments/1x0lcgl/exam_form_wants_a_20_to_50_kb_photo_fix_the_pixel/) (8 Oct 2026) | — | Others see the same gap → competition forming |

- **Indep.:** 12+ communities, 5 countries. **Strongest demand signal in this research.**
- **Product insight:** the job is not "compress" — it is **"make this file pass portal X's validator"**: exact pixel dimensions + KB range (min *and* max) + format/extension + sometimes DPI, background, face framing. Also PDF size caps for immigration/clearance documents.
- **Opportunity:** a **"Form-ready" tool family**: photo + signature + document presets per portal, with a *spec checker* that validates against the published rule. Presets must cite the official notice and date; rules change yearly.
- **Risk:** spec data maintenance; portals' AI photo checks can't be guaranteed — say so.

**P15 (NEW) — Discord stopped auto-compressing videos (2026).** [r/discordapp, Jul–Oct 2026](https://www.reddit.com/r/discordapp/comments/1uns96u/discord_no_longer_auto_compressing_video_uploads/): users say compression now happens before send, so files must already be under the cap; one user calls 50 MB Nitro insufficient. [r/software (10 Sep 2026)](https://www.reddit.com/r/software/comments/1wck97l/is_there_an_easy_to_use_software_solution_to/): answers are ffmpeg/HandBrake + a bitrate calculator, or 8mb.video. Builder: [r/prettyusefulwebsites, 15 Jun 2026](https://www.reddit.com/r/prettyusefulwebsites/comments/1u6p89s/i_have_made_a_website_that_will_compress_videos/). → **"Compress video to X MB"** is a concrete target-size job (Discord/WhatsApp/email). Discord's exact limits were not verified on an official page.

### Threads confirming existing pain points
| Thread | Date / score | Confirms |
|---|---|---|
| [r/software — "free PDF editor that isn't a scam"](https://www.reddit.com/r/software/comments/1uw7mw6/looking_for_a_free_pdf_editor_that_isnt_a_scam/) | 14 Jul 2026, 42 pts, 184 comments | P2: tried ~12 "free" editors; all demanded $20–70 subscription at export |
| [r/rant — "Free" PDF editors](https://www.reddit.com/r/rant/comments/1ui561v/free_pdf_editors/) | 28 Jun 2026 | P2: account wall then payment after doing the work |
| [r/pdf — paywalled PDF editors; "actually free" way](https://www.reddit.com/r/pdf/comments/1wjy233/fuck_paywalled_pdf_editors_heres_the_actually/) | 18 Sep 2026, 70 pts | P2/P11: mobile is the gap (desktop has LibreOffice Draw); builder says server LibreOffice costs "a few seconds of CPU per file" |
| [r/pdf — Be careful with Smallpdf subscriptions](https://www.reddit.com/r/pdf/comments/1q86e1y/be_careful_with_smallpdf_subscriptions/) | 9 Jan 2026 | P1: no same-day refund; replies through Sep 2026 report similar; official Smallpdf reply explains auto-convert trial |
| [r/pdf — 33 MB scanned 580-page book → 25 MB](https://www.reddit.com/r/pdf/comments/1stff09/need_a_high_pdf_compressing_tool_with_retention/) | 23 Apr 2026, 54 comments | P4/P5: "famous and underrated" tools either **increased** size or cut 1–2 MB; commenter explains JBIG2 (binary) trade-offs |
| [r/studytips — compress without killing quality](https://www.reddit.com/r/studytips/comments/1v5hzbr/what_do_you_use_to_compress_pdfs_without_killing/) | 24 Jul 2026 | P4: watermarks, tiny upload limits, unreadable scans; goal "readable charts for email" |
| [r/software — PDFs with personal info](https://www.reddit.com/r/software/comments/1wtcfez/what_do_you_use_for_pdfs_with_personal_info/) | 29 Sep 2026 | P3: IDs/contracts/tax docs; answers favour local apps (Preview, PDF-XChange, BentoPDF, Ghostscript) |
| [r/privacy — one site to convert/compress confidential docs](https://www.reddit.com/r/privacy/comments/1xes6og/i_want_one_good_website_that_converts_and/) | 25 Oct 2026 | P3 + P5: non-technical user (previously iLovePDF) wants "500 KB → 200 KB" |
| [r/privacy — PSA: most converters upload your files](https://www.reddit.com/r/privacy/comments/1r73kbd/psa_most_online_file_converters_upload_your_files/) | 17 Feb 2026 | Top comment (146): financial-services security staff can't stop employees using upload sites; another notes the internal tools are worse (Adobe "sluggish, bloated") |
| [r/pdf — Best OCR option today?](https://www.reddit.com/r/pdf/comments/1sxj0w9/best_ocr_option_today/) | 27 Apr 2026 | P4: OCR output downgrades image quality even on "high quality" |
| [r/SaasDevelopers — free OCR caps at 15 pages/hour](https://www.reddit.com/r/SaasDevelopers/comments/1x1gpw1/free_ocr_sites_cap_you_at_15_pageshour_so_i_made/) | 9 Oct 2026 | P2/P6; comment: phone photos/old scans need **deskew + contrast cleanup before Tesseract** |
| [r/prettyusefulwebsites — what tools don't exist yet?](https://www.reddit.com/r/prettyusefulwebsites/comments/1v61oya/what_online_tools_dont_exist_yet_i_might_build_one/) | 25 Jul 2026 | P11: "true metadata-level redaction" — only expensive programs do it properly; good free TTS |
| [r/androidapps — bulk-compress images](https://www.reddit.com/r/androidapps/comments/1u86v3q/app_to_bulkcompress_images/) | 17 Jun 2026 | P6 on mobile; answers favour native apps (Image Toolbox) |
| [r/software — mass WebP→JPG](https://www.reddit.com/r/software/comments/1rip9x9/how_to_mass_convert_webp_to_jpg_and_remove_the/) | 2 Mar 2026 | P6; [r/hatethissmug "I HATE WEBP"](https://www.reddit.com/r/hatethissmug/comments/1xjin4n/i_hate_webp_image_format/) (30 Oct 2026) — WebP→JPG remains a live consumer job |
| [r/technology — converters that install malware](https://www.reddit.com/r/technology/comments/1jdmu71/warning_over_free_online_file_converters_that/) | 17 Mar 2025 | P8 |

### Counter-evidence (important)
- [r/SideProject — "Do you actually care how converters handle your files?"](https://www.reddit.com/r/SideProject/comments/1v7a6yv/do_you_actually_care_how_online_file_converters/) (26 Jul 2026): a builder of browser-local tools reports after a month that **most people don't care**; they want speed and a correct file. Another commenter: the people who care are those whose employer bans upload sites (legal/health/finance).
- [r/pdf — "Would you use another PDF platform other than iLovePDF?"](https://www.reddit.com/r/pdf/comments/1uk1nft/would_you_guys_use_another_pdf_platform_other/) (30 Jun 2026): replies say new private PDF sites pop up **weekly**, "BentoPDF is probably the best known", the field is crowded, and "the sketchy sites pay for ads on Google". Another builder (PDFClear) says theirs "remains unknown".
- [r/studytips](https://www.reddit.com/r/studytips/comments/1v5hzbr/) top answer recommends **Smallpdf free** as good enough for email-attachment compression. Incumbents satisfy many users.

**Implication:** privacy is a *trust floor* and a niche B2B/professional wedge, not a mass-market acquisition hook. Mass-market wins come from **correct results for specific jobs** (P5, P14, P15) and no paywall surprises (P2).

### Supply-side saturation (measured)
In 25 Reddit searches, **builder posts of "free, no-upload, browser-only" tools** dominated results for: image compression, HEIC→JPG, file conversion, JSON formatting (6 of 7 results), PDF tools, OCR, and exam-photo resizing — most posted Jun–Nov 2026.

## 2. Answers to the brief's ten questions

| Question | Best-supported answer | Evidence strength |
|---|---|---|
| 1. What causes abandonment? | Paywall/cap discovered after effort; stalls without progress; output unusable | High (Trustpilot ×3, HN) |
| 2. What makes users switch? | Hitting a cap; a billing incident; a quality failure; privacy concern for sensitive files | Medium |
| 3. Repeated requests? | Batch; target size; PDF text editing; forms; OCR→structured data; desktop/offline app | High (GitHub ×4) |
| 4. What do tools fail to implement? | Target size (Squoosh, iLoveIMG, TinyPNG, PDF24 pages lack it); free batch; verified results | High |
| 5. Unnecessarily complicated? | Codec settings; "simple mode" that isn't; credit/minute quotas | Medium |
| 6. What creates distrust? | Billing practices; unknown operators/clones; uploads of sensitive docs; ad-farms/fake buttons | High |
| 7. What causes poor output? | Over-aggressive defaults; raster fallback in PDF→Office; output larger than input | Medium-High |
| 8. Workflows needing multiple sites? | Resize→compress→convert; PDF organise→compress; scan→OCR→Excel; video trim→compress | Medium (inferred from feature requests; needs interviews) |
| 9. Power-user wants? | Batch/CLI/API, presets, offline/desktop, self-hosting, no telemetry | High (GitHub) |
| 10. Mobile struggles? | Hidden controls at large text; codec failures in Safari; memory limits | Medium (few direct sources) |

## 3. Validation still required
1. **8–10 user interviews** with people who recently hit an upload limit (students, job applicants, small sellers).
2. **Portal spec research (now high priority, given P14):** collect official photo/signature/document rules (pixels, KB min/max, format, DPI, background) from the 15 largest portals (UPSC, SSC, IBPS, RRB, NTA/JEE/NEET, GATE, CBSE, Passport Seva, plus IRCC/Canada, US DS-160, UK visa) with notice URLs and dates. Determines the "Form-ready" family scope.
3. **Discord/WhatsApp/Gmail attachment limits** from official help pages (for target-size presets).
