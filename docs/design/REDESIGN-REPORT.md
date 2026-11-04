# Redesign report (2026-11-05)

Research: [DESIGN-RESEARCH.md](DESIGN-RESEARCH.md) · Direction: [DESIGN-DIRECTION.md](DESIGN-DIRECTION.md)

## What changed

- **Tokens** (`packages/ui/src/theme.css`): Geist / Geist Mono / Instrument Serif (accent only),
  self-hosted; dark default; cream and paper light theme; orange as the only accent. Shared by the
  site and the sandboxed tool frame, so every tool picks up the new type.
- **Search** (`packages/registry/src/search.ts`, `apps/site/src/scripts/search.ts`): one engine for
  the hero combobox and the Ctrl/⌘ K palette (also `/`). Understands names, aliases, format pairs
  and sizes ("photo under 50 kb" → the 50 KB preset page). Planned tools appear as "soon" without a
  link. The index is a static `/search.json`, fetched on first use.
- **Header**: Categories menu (live categories first), All tools, Privacy, About, search button
  with keycaps, theme toggle; mobile menu. Sticky, with scroll padding so it never hides focus.
- **Homepage**: hero with layered screens of shipped tools (photo check, PDF target, page grid);
  category bento sized by what is live, plus a dense "coming next" index of the 16 planned
  categories; essentials list; upload-ready validation report (the real row names); a PDF
  workflow; privacy with the actual CSP; every preset page as a link list.
- **Category pages**: shared template, category-specific visual for live categories, scoped
  filter, ready-made presets, planned tools grouped by how they will run.
- **All tools** (`/tools/`): the whole catalogue with jump links and a filter; in the sitemap.
- **Tool pages**: new header, info strip and related tools; the tool frame stays the focus.

## Screenshots

`screenshots/before-home-dark.jpg` is the first-pass page from earlier today (commit `bc87919`);
the original pre-session page is in git history at `4aebe40`. After: `after-home-dark.jpg`,
`after-home-light.jpg`, `after-home-390.jpg`, `after-pdf-dark.jpg`.

Reviewed at 1440, 1280, 768, 390 and 360 px in both themes: no horizontal scroll at any width.

## Validation

| Check                                                                       | Result                          |
| --------------------------------------------------------------------------- | ------------------------------- |
| `pnpm format:check`, `lint`, `check:tools`, `check:boundaries`, `typecheck` | Pass                            |
| Unit tests (`pnpm test`), including 7 new search tests                      | Pass                            |
| `pnpm build`, `pnpm check:budgets` (site JS ≈ 3 kB per page, budget 15 kB)  | Pass                            |
| Playwright e2e, Chromium / Firefox / WebKit / Pixel 7 emulation             | Pass (1 test skipped by design) |
| axe WCAG 2.2 AA, site pages in dark and light, tool states in dark          | No serious violations           |

Not done: testing on physical phones (only emulated viewports).

## Not implemented, and why

- **Navy and violet palette** from the brief: dropped on the owner's instruction (no blue, purple,
  violet or pink). Orange is the only accent.
- **Gallery research** (Land-book, Awwwards, SaaSFrame, Mobbin, Recent.design): not captured;
  they aggregate the sites that were studied, and Mobbin needs an account.
- **Category previews for planned categories** (code editor, timeline, QR, calculator): not shown,
  because those tools do not exist yet and a preview would advertise them. They get a typographic
  layout until a tool ships.
- **Subcategory grouping**: the registry has no subcategories; planned tools are grouped by how
  they will run (device, server, AI, under review), which the data does record.
- **"Popular tools" by usage**: there is no usage data; the lists are curated and not labelled as
  popularity.
- **Automated multi-step workflows**: tools are chained by downloading and re-dropping the file;
  the page says so rather than implying a pipeline.
- **Per-tool interface redesign**: tools changed through the shared tokens and fonts only.
