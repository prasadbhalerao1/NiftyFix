# Performance

Speed is a product requirement: every page must be usable fast on a low-end phone over a slow
connection, and stay smooth while scrolling and moving the pointer.

## Measurements (2026-11-05, production build, local preview)

Mobile viewport. "Slow 3G" = 400 kbps, 400 ms RTT. CPU throttled 4× (6× for blocking time).

| Page                  | Slow 3G LCP                  | Fast 3G LCP | Layout shift | Downloaded | Main-thread blocking |
| --------------------- | ---------------------------- | ----------- | ------------ | ---------- | -------------------- |
| Home, before          | 3.9 s                        | 1.6 s       | 0.06–0.08    | 125 KB     | —                    |
| Home, after           | **1.95 s**                   | **0.97 s**  | 0.002        | 93 KB      | 16 ms                |
| Photo Resizer, before | 1.7 s (full load 5.0 s)      | 0.8 s       | 0            | 170 KB     | —                    |
| Photo Resizer, after  | **1.66 s (full load 3.5 s)** | 0.78 s      | 0            | 117 KB     | 0 ms                 |
| All tools, after      | 1.67 s                       | 0.83 s      | 0            | 91 KB      | 0 ms                 |

Desktop at 4× CPU throttle, homepage: pointer movement and scrolling went from 20–30 fps to a
60 fps median.

## Rules

- **Fonts never block or shift text.** Site fonts use `font-display: optional` and are not
  preloaded (a preload delayed first paint from 2.0 s to 2.3 s on slow 3G). The tool frame uses
  the system UI font and monospace text uses the system monospace font: no font downloads there.
- **The largest text is visible on first paint.** No fade-in from invisible on the hero text.
- **Animate only `transform`/`translate`/`opacity`, set on the moving element.** Never move
  things through inherited custom properties or large gradients (both forced full repaints).
- **No backdrop blur on phones**; a light blur on desktop only.
- **Nothing important waits on JavaScript.** Motion, search and menus enhance static HTML;
  reduced-motion and no-JS show the final state.
- **Warm the next step:** tool pages preconnect to the tool origin; links prefetch on hover or
  touch (Astro, skipped on data-saver and 2G); the search index loads when the page is idle.
- **Cache:** hashed assets are immutable for a year; `/search.json` is cached for an hour.
- **Budgets** (`pnpm check:budgets`): site JS ≤ 15 kB and CSS ≤ 15 kB gzipped per page; tool
  frame shell, UI and processor budgets as listed in `scripts/check-budgets.ts`.
