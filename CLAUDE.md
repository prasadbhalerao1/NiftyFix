# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NiftyFix (niftyfix.in): free, India-first, browser-only file tools. Full handoff in [CONTEXT.md](CONTEXT.md).

## Goal: the best tool for every job

Before building or reworking a tool, research and show the owner a summary first:

1. Competitors: every tool doing this job (global and Indian); their features, formats, limits, paywalls.
2. Unmet wishes: Reddit, Quora, reviews, forums; what users complain about or wish for.
3. Build the superset that runs in the browser, as modes inside one tool. Note server or AI-only wishes for later; never fake them.
4. Keywords: free views only (Ahrefs free tools, autocomplete, People also ask, Trends, AnswerThePublic), incl. Hinglish and Marathi. One primary keyword per tool page; one `variants` page per distinct real intent. No accounts, logins or payments.

SEO: title up to 65 chars led by the keyword, description 70 to 160, one H1, first paragraph answers the query, FAQs from People also ask, content in static HTML, local names in `apps/site/src/data/local-names.ts`. Audit all pages for duplicates after changes.

## Rules

- No em dashes (U+2014) anywhere. No blue, purple, violet, pink, navy or gradients.
- Keep the codebase clean and consistent: same naming, file layout, structure and copy style as existing tools, put shared code in `packages/` not copies, pure logic in its own tested file, no dead code, unused files, stray scripts or TODO leftovers. Delete what a change makes obsolete.
- Commit verified, meaningful units of work (a tool, a fix), no Co-Authored-By trailer. Don't commit tiny edits on their own; fold them into the next real commit.
- Deploy (`pnpm deploy:cloudflare`, then `pnpm build`) only when the owner says "deploy", after CI passes.
- Never delete, move or reformat owner-written files without asking.
- Portal and exam specs only from official notices. New exam pages only for big national exams; tell the owner first.

## Commands

```sh
pnpm dev                                   # site :4321, tool frame 127.0.0.1:4322
pnpm new-tool <category> <slug> "<Name>"   # slug from packages/registry/src/planned.ts
pnpm format:check && pnpm lint && pnpm check:tools && pnpm check:boundaries && pnpm typecheck && pnpm test
pnpm --filter @niftyfix/tools exec vitest run image/make-square   # one unit test
pnpm build && pnpm exec playwright test e2e/<slug>.spec.ts --project=chromium   # also run --project=webkit
```

## Architecture

- `apps/site`: Astro static site; all tool, intent, hub, sitemap and search pages are generated from the registry. Embeds tools in a cross-origin iframe.
- `apps/tool-frame`: Preact, strict CSP (`style-src 'self'`, no network); lazy-loads each tool and runs processors in workers.
- `tools/<cat>/<slug>/`: `manifest.ts` and `content.ts` (import only `@niftyfix/tool-sdk`; `variants` become intent URLs, preset arrives as `props.preset`), `options.ts` (valibot), `processor.ts` (verifies its output, never pads), `ui.tsx`. Commit `tools/registry.generated.ts`.
- Reuse `packages/engines/{image,pdf}`, `constraints` (target-KB solver; max = KB x 1000, min = KB x 1024), `runtime` (ZIP). `@cantoo/pdf-lib` only inside `packages/engines/pdf`. Canvases under about 16M pixels (iOS).
- `pnpm check:boundaries` forbids tool-to-tool imports and processing code in the site.

## Gotchas

- WebKit logs a CSP error for any native `<select>`; `recordProblems` in `e2e/helpers.ts` ignores only that.
- `SegmentedControl` needs an explicit generic for union types.
