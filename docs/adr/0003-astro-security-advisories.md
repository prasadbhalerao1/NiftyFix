# ADR 0003 — Astro 6 security advisories and the Astro 7 upgrade

**Date:** 4 Nov 2026 · **Status:** Accepted, temporary · **Launch-blocking:** yes

## Finding

`pnpm audit --prod` (4 Nov 2026) reported advisories in dependencies of Astro 6.4.8:

| GHSA                                      | Severity | Package | Fixed in | Reachable in NiftyFix?                                                                                                                             |
| ----------------------------------------- | -------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GHSA-26w7-cxv4-gfx2                       | critical | astro   | 7.2.8    | **No.** RCE through AVIF _image optimisation_. We never use `astro:assets`/the image service; no `<Image>` or `getImage()` exists in the codebase. |
| GHSA-98hj-9722-w3j8                       | moderate | astro   | 7.3.2    | **No.** XSS via unescaped `<script>/<style>` content from untrusted data. All rendered content is first-party, from the repository.                |
| GHSA-f48w-9m4c-m7f5                       | moderate | astro   | 7.0.6    | **No.** Requires spreading attribute _names_ from untrusted input.                                                                                 |
| GHSA-4g3v-8h47-v7g6                       | moderate | astro   | 7.1.0    | **No.** View Transitions are not used.                                                                                                             |
| GHSA-376h-93r7-7g6f                       | moderate | astro   | 7.2.4    | **No.** Path-segment check in middleware/SSR; output is fully static, no middleware.                                                               |
| GHSA-7pw4-f3q4-r2p2                       | low      | astro   | 7.0.4    | **No.** `transition:*` directives are not used.                                                                                                    |
| GHSA-g7r4-m6w7-qqqr                       | low      | esbuild | 0.28.1   | Dev server only; never runs in production. Bind dev to localhost only.                                                                             |
| (3 × high, sharp/libvips/libheif/librsvg) | high     | sharp   | 0.35.5   | **Fixed** by a pnpm override to sharp 0.35.5.                                                                                                      |

## Decision

1. Override `sharp` to 0.35.5 now (done).
2. Ignore exactly the seven GHSA IDs above in `pnpm-workspace.yaml` so CI stays meaningful for **new** advisories.
3. **Upgrade to Astro 7 before public launch.** This requires Node ≥ 22.23.4 (the development machine has 22.17.1). This reverses the version choice in ADR 0002 §1, for security reasons.

## Guard rails until upgraded

- Do not add `astro:assets` image optimisation, View Transitions, SSR/middleware, or render any user-supplied content in site pages.
- Remove the `auditConfig` block in the same change that upgrades Astro.
