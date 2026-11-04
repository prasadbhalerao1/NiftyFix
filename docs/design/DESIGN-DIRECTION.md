# NiftyFix design direction

Derived from [DESIGN-RESEARCH.md](DESIGN-RESEARCH.md). Tokens live in
`packages/ui/src/theme.css` (shared by the site and the tool frame); site-only composition styles
live in `apps/site/src/styles/global.css`.

## Identity

NiftyFix is a workbench, not a brochure: precise like Linear, warm like a well-made paper tool.
Dark is the default theme; light is warm paper. The logo's orange is the only accent.

## Colour

**No blue, purple, violet, pink, navy-tinted greys or decorative multi-colour gradients** (owner
decision, 2026-11-05; it overrides the brief's navy/violet suggestion). Colour marks meaning only.

| Role       | Light                | Dark (default)                       | Use                                |
| ---------- | -------------------- | ------------------------------------ | ---------------------------------- |
| Page       | `cream` #f8f3ea      | `stone-950`                          | Background                         |
| Surface    | `paper` #fffcf6      | `stone-900`                          | Cards, inputs, panels              |
| Line       | `stone-200`          | `stone-800`                          | 1px borders, dividers              |
| Text       | `stone-900`          | `stone-100`                          | Body                               |
| Muted text | `stone-700`          | `stone-400`                          | Descriptions (AA on both surfaces) |
| Action     | `brand-700` (orange) | `brand-400` text / `brand-700` fills | Primary buttons, links, selection  |
| Pass       | `emerald-700`        | `emerald-400`                        | Validation pass, live badges       |
| Warning    | `amber-800`          | `amber-300`                          | Honest "check yourself" rows       |
| Error      | `red-800`            | `red-300`                            | Failed checks                      |

Rules: white text only on `brand-700`+. One accent per component. The only gradient is a soft
orange glow behind the hero and the orange-to-amber accent phrase in the display headline.

## Typography

| Level              | Font                    | Size (desktop / mobile)      | Weight / tracking    |
| ------------------ | ----------------------- | ---------------------------- | -------------------- |
| Display            | Geist                   | 72 / 40px                    | 600, −0.04em         |
| Display accent     | Instrument Serif italic | same as display              | 400                  |
| Section            | Geist                   | 40 / 30px, two-tone sentence | 600, −0.03em         |
| Card title         | Geist                   | 18px                         | 600                  |
| Body               | Geist                   | 16–18px                      | 400, 1.6 line height |
| Labels / eyebrows  | Geist Mono              | 12px uppercase               | 500, +0.08em         |
| Technical metadata | Geist Mono              | 12–14px, tabular numbers     | 400                  |

Self-hosted from `@fontsource` (the CSP allows fonts from our own origin only). Variable fonts,
Latin subsets; Devanagari falls back to Noto Sans Devanagari / the system font.

## Spacing and layout

- 4px base unit; section rhythm 96px (desktop) / 64px (mobile); card padding 24px / 20px.
- Container 1200px (`max-w-6xl` + 16px gutters on mobile, no horizontal scroll at 360px).
- 12-column mental grid; bento tiles span 7+5 or 4+4+4. Live categories get large tiles; planned
  categories are a dense text index.
- Radii: 8px controls, 12px panels, 16px showcase windows, full for pills. Nothing larger.

## Components

- **Window**: product previews sit in a window frame (title bar with three dots, mono file name).
- **Check row**: status icon + requirement + required value + your value (mono), as in the real
  validation report.
- **Keycap**: mono 11px, 1px border, 4px radius, for `⌘K`, `↑↓`, `↵`.
- **Tool row**: icon tile, name, one-line description, arrow; used in lists, not as isolated cards.
- **Status badge**: `live` (emerald), `soon` (neutral), never invented counts.

## Motion

- 150–200ms colour/border transitions on hover; 1–2px lift on showcase cards only.
- Hero composition fades up once on load (≤ 600ms, no delay on the search field).
- No looping animation except the "live" status dot. `prefers-reduced-motion` reduces all of it
  to instant (global rule in `theme.css`).

## Honesty rules

Previews show only shipped tools. Planned tools are labelled "soon" and never linked. No customer
logos, testimonials, user counts or popularity claims. "0 uploads" is phrased as the architecture
("files are processed in your browser"), with a link to the verification page.
