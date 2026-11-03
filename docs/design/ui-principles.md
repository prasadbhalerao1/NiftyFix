# NiftyFix — UI Principles

**Goal:** clean, modern, calm, obviously trustworthy. The tool is the hero; everything else is quiet.
**Test for every screen:** a first-time user on a 360-px Android phone can finish the task without reading anything below the tool.

## 1. Product feel

- **Calm utility, not a marketing site.** Think precision instrument: Linear/Vercel restraint + Squoosh-level focus on the task.
- **One primary action per state.** Empty → "Choose files". Ready → "Fix it" (tool-specific verb). Done → "Download".
- **Show facts, not adjectives.** "1.8 MB → 48.2 KB · 413×531 px · JPG · ✓ Matches SSC photo spec" beats "Amazing! Your file is optimized!"

## 2. Anti-slop rules (hard bans)

| Banned                                                                               | Instead                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Purple/blue gradient hero, glassmorphism, 3D blobs, floating orbs, sparkles          | Flat surfaces, one accent colour, real product UI as the visual                 |
| "Unlock the power of…", "Seamlessly", "Effortlessly", "Supercharge", "Revolutionary" | Plain verbs: "Compress", "Resize", "Merge"                                      |
| Emoji in headings and buttons                                                        | Icons from one consistent set (Lucide) only where they aid scanning             |
| Fake testimonials, fake user counts, "Trusted by 10M+", fake ratings                 | Nothing, until real and verifiable                                              |
| Homepage grid of 100 identical cards                                                 | Search-first home + task groups (≤ 8 per group) + "popular" (data-driven later) |
| Confetti, bouncy animations, typing effects                                          | 120–200 ms ease-out transitions only for state changes                          |
| Modal popups (newsletter, upgrade, cookie walls beyond legal CMP)                    | None. CMP only where legally required                                           |
| Fake progress, artificial delays, countdown-to-download                              | Real progress; download available instantly                                     |
| Ads styled like buttons or placed near controls                                      | Doc I ad policy                                                                 |
| Long SEO text above the tool                                                         | Content below the tool, scannable, with headings                                |
| Stock illustrations of people on laptops                                             | Real screenshots/examples from our own tools                                    |

## 3. Visual system

- **Typography:** one variable sans (e.g., Inter or Geist — pick one, self-hosted subset) + system mono for numbers/code. Scale: 14 / 16 (body) / 20 / 24 / 32 / 40. Tabular numbers for sizes and dimensions.
- **Colour:** neutral greys (warm-neutral, not blue-grey) + **one accent** for primary actions + semantic success/warning/error. All tokens defined for light and dark; WCAG AA contrast minimum (4.5:1 text).
- **Spacing:** 4-px base, generous whitespace; max content width ~72ch for text, ~960 px for tool area.
- **Shape:** 8-px radius for controls, 12-px for panels; 1-px borders instead of heavy shadows.
- **Icons:** Lucide (ISC licence), 1.5-px stroke, 20 px default.
- **Dark mode:** follows system, toggle available; designed, not inverted.

## 4. Tool page anatomy (every tool)

```
Breadcrumb
H1 (task)                       one-line promise + processing-location badge ("On your device")
┌───────────────────────────────────────────────┐
│ Dropzone / input  (visible at 360×640 without scrolling)
│ Presets as chips  (e.g., SSC · IBPS · Passport · 100 KB · 200 KB · Custom)
│ Essential options (≤ 3 visible) · "More options" disclosure
│ [ Primary action ]
│ Results: per-file row → before/after facts → validation checklist → Download / Download all (ZIP)
│ "Next: Convert to PDF · Resize · …" (contextual)
└───────────────────────────────────────────────┘
How it works · Options explained · Limits · Example · FAQ · Related tools
```

## 5. States (designed, not afterthoughts)

- **Empty:** dropzone + accepted formats + device limit in one line.
- **Engine loading** (> 300 ms): skeleton in the result area + "Preparing image engine (380 KB)".
- **Processing:** per-file progress; overall progress for batch; Cancel always visible.
- **Success:** facts + validation checklist (✓/✗ per requirement) + download.
- **Partial success (batch):** "18 of 20 done · 2 need attention" with per-file reason and Retry.
- **Failure:** what happened, why, what to do next — never a stack trace, never "Something went wrong" alone.
- **Unreachable target:** closest result offered, with the trade-off stated ("Reached 112 KB at minimum readable quality. Allow resizing to 80%?").

## 6. Interaction & accessibility

- Keyboard: every action reachable; visible focus ring; `Ctrl/⌘+K` global tool search; Enter runs primary action.
- Touch targets ≥ 44 px; no hover-only affordances.
- Respect `prefers-reduced-motion`, 200% zoom, large system fonts (download button must never disappear — Squoosh #1442 lesson).
- Screen-reader announcements for progress and results (`aria-live="polite"`).
- Paste images/files from clipboard; drag-and-drop anywhere on the tool card.

## 7. Copy voice

- Short, specific, second person. Sentence case everywhere.
- Numbers over adjectives. Name limits honestly.
- Error messages: cause + fix. ("This PDF is password-protected. Enter the password to unlock it, or use Unlock PDF.")
- Microcopy reviewed per tool in the acceptance checklist.

## 8. Home & navigation

- Home: big search ("What do you need to do?" — matches task language and synonyms from `searchAliases`), category tabs, "Get your files ready" Forms highlight, recently used (local only).
- Global header: logo, search, categories menu, theme toggle. No sign-in button (no accounts at launch).
- Footer: categories, privacy verification page, about/contact, legal.

## 9. Process

- Design tokens + components built once in `packages/ui`; Storybook-style gallery (Ladle — light) for every component and state.
- Each tool PR includes mobile + desktop screenshots of every state; visual regression in CI.
- Design review checklist = sections 2, 5, 6 of this doc.
- Benchmark against: Squoosh (focus), iLovePDF (simplicity), Linear/Vercel (restraint). Never copy their visual identity.
