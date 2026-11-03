# ADR 0003 — Astro 6 security advisories and the Astro 7 upgrade

**Opened:** 4 Nov 2026 · **Resolved:** 4 Nov 2026 (sprint 2) · **Status:** Resolved — no audit exceptions remain for production dependencies

## Original finding (Astro 6.4.8)

`pnpm audit --prod` reported advisories fixed only in Astro 7:

| GHSA                | Severity | Package | Fixed in | Was it reachable?                                                |
| ------------------- | -------- | ------- | -------- | ---------------------------------------------------------------- |
| GHSA-26w7-cxv4-gfx2 | critical | astro   | 7.2.8    | No — RCE via AVIF _image optimisation_; image service never used |
| GHSA-98hj-9722-w3j8 | moderate | astro   | 7.3.2    | No — needs untrusted content in `<script>/<style>`               |
| GHSA-f48w-9m4c-m7f5 | moderate | astro   | 7.0.6    | No — needs untrusted attribute names                             |
| GHSA-4g3v-8h47-v7g6 | moderate | astro   | 7.1.0    | No — View Transitions unused                                     |
| GHSA-376h-93r7-7g6f | moderate | astro   | 7.2.4    | No — middleware/SSR unused                                       |
| GHSA-7pw4-f3q4-r2p2 | low      | astro   | 7.0.4    | No — `transition:*` unused                                       |
| GHSA-g7r4-m6w7-qqqr | low      | esbuild | 0.28.1   | Dev server only                                                  |
| 3 × high            | high     | sharp   | 0.35.5   | Not invoked; temporarily fixed by a pnpm override                |

Interim mitigation (now removed): a `sharp` override plus seven `auditConfig.ignoreGhsas` entries.

## Resolution

1. **Node 22.17.1 → 22.23.4** on the development machine (official MSI, SHA-256 verified against `SHASUMS256.txt`). 22.23.4 is the newest 22.x LTS ("Jod") and is itself a security release (nodejs.org dist index, 20 Oct 2026). Pinned in `.nvmrc`; `engines.node >= 22.23.4`; CI uses `node-version-file: .nvmrc`.
2. **Astro 6.4.8 → 7.4.5**, **Vite 7.3.7 → 8.3.5** (site, tool frame, tools package).
3. Removed the `sharp` override (Astro 7 requires `sharp ^0.35.4`, resolving to the patched 0.35.5) and **all seven** audit exceptions.
4. Result: `pnpm audit --prod` → **No known vulnerabilities found**, with no ignores configured.

## Development-only finding (documented, not ignored)

`pnpm audit` (all dependencies) reports **GHSA-g3hv-75wg-m249** (moderate, minimatch < 11.0.1, "denial of service via globparts amplification") through `eslint` and `typescript-eslint`.

- Upgrading ESLint does **not** fix it: ESLint 10.14.0 depends on `minimatch ^10.2.6` and `@typescript-eslint/typescript-estree` 8.72.1 on `^10.2.2`; both resolve below 11.0.1.
- Exposure: minimatch only receives glob patterns written by us (lint/config globs) on developer and CI machines. No attacker-controlled patterns, nothing shipped to users.
- Mitigation: CI gates on `pnpm audit --prod` (clean). No `ignoreGhsas` entry was added. Re-check when ESLint/typescript-eslint adopt minimatch ≥ 11.0.1.

## Related change in this sprint

ESLint 9.39.5 reached end of support (deprecation warning on install). Moved to **ESLint 10.14.0** with **`eslint-plugin-jsx-a11y-x` 0.2.0** (MIT, es-tooling maintained fork; ~1M downloads/month) because the original `eslint-plugin-jsx-a11y` 6.10.2 does not support ESLint 10. Verified the strict a11y rules still fire on planted violations. ESLint 10's recommended set found two genuine useless assignments, which were fixed.

## Guard rails (still apply)

Do not adopt Astro image optimisation, SSR, middleware or View Transitions, and do not render user-supplied content in site pages, without a security review recorded as an ADR.
