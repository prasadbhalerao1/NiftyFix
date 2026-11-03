# ADR 0002 — Decisions made while building the platform foundation

**Date:** 4 Nov 2026 · **Status:** Accepted
Records every place the implementation differs from, or refines, the research pack and ADR 0001.

## 1. Dependency versions (verified on the npm registry, 4 Nov 2026)

| Area         | Chosen     | Latest available | Why not latest                                                                                                                                                             |
| ------------ | ---------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astro        | **6.4.8**  | 7.4.5            | Astro 7 requires Node ≥ 22.23.4; this machine has 22.17.1. Astro 6 is what ADR-01 specified. **Upgrade path:** install Node ≥ 22.23.4, bump `astro` and Vite 7→8 together. |
| Vite         | 7.3.7      | 8.3.5            | Must match Astro 6's Vite (`^7.3.2`) so site and frame share one toolchain.                                                                                                |
| Preact       | 10.29.8    | 11.1.1           | `@astrojs/preact` 5.x (the Astro 6 line) supports Preact 10 only.                                                                                                          |
| TypeScript   | **6.0.3**  | 7.0.2            | TS 7 (native compiler) is not yet supported by `typescript-eslint` (< 6.1) or `@astrojs/check` (^5 \|\| ^6).                                                               |
| ESLint       | **9.39.5** | 10.14.0          | `eslint-plugin-jsx-a11y` 6.10.2 supports ESLint ≤ 9; accessibility linting outranks the newest ESLint.                                                                     |
| Vitest       | 5.1.0      | 5.1.0            | —                                                                                                                                                                          |
| Playwright   | 1.64.1     | 1.64.1           | —                                                                                                                                                                          |
| Tailwind CSS | 4.3.4      | 4.3.4            | —                                                                                                                                                                          |
| Valibot      | 1.5.0      | 1.5.0            | Chosen over Zod for tree-shaken size (ADR-04).                                                                                                                             |

## 2. Main-thread fallback when workers lack OffscreenCanvas

**Problem found by tests:** Playwright's WebKit has no `OffscreenCanvas` in workers. Real Safari has it from 16.4/17, but older iOS Safari does not, and India-first means older phones matter.
**Decision:** the image engine creates canvases via `createCanvas()` (OffscreenCanvas → `<canvas>`). If a worker throws `WORKER_UNSUPPORTED`, `JobRunner` re-runs the job — and all later jobs — on the frame's main thread through the same `executeJob()` path. Cancellation there is cooperative (AbortSignal between encode attempts) rather than worker termination.
**Trade-off:** in fallback mode heavy work can briefly block the frame's UI. The frame is isolated, so the parent page stays responsive.

## 3. Error classification is structural, not `instanceof`

Vite emitted separate copies of `ToolError` into the worker and the lazily loaded processor chunk, so `instanceof` failed and a recoverable error was reported as "unknown". `isToolError()` now checks name + a known error code + `serialize()`.

## 4. Parent `frame-src` includes `blob:`

Firefox checks a download link clicked inside the tool frame (a navigation to the frame's own `blob:` URL) against the **parent's** `frame-src`. Without `blob:` the download was silently blocked. Blob URLs are origin-bound, so this does not let other sites frame content.

## 5. Site CSP forbids inline scripts → `assetsInlineLimit: 0`

Astro inlines small scripts by default, which a `script-src 'self'` policy blocks. Inlining is disabled; scripts are emitted as hashed files.

## 6. Registry ownership

The prompt's rule "shared packages must not depend on individual tools" conflicts with a registry package that imports manifests. Resolution: `packages/registry` holds pure functions (`createRegistry`, `validateEntries`); the **generated index lives in `tools/registry.generated.ts`** and is passed in by the apps. Enforced by dependency-cruiser.

## 7. Frame loads one manifest, not the catalogue

The frame uses lazy `import.meta.glob` loaders for manifests, UIs and processors (`tools/loaders.ts`). Opening a tool downloads only that tool's metadata and code; the full registry (with all page content) is used only by the static site at build time.

## 8. No portal presets yet

No portal specification could be verified against an official notice during the build (official sites were not reachable in search results; third-party summaries conflict). Third-party sources also report SSC and UPSC moved to **live photo capture** in 2025–26 cycles, which reduces the value of SSC/UPSC _photo_ presets (signatures are still uploaded). The tool ships with custom settings and clearly-labelled generic size templates; the portal-spec schema, validation and CI gate are in place for verified records.

## 9. Not yet implemented (explicitly deferred, not faked)

jSquash/MozJPEG encoders (native encoders used for v1), batch UI (runtime supports queueing and ZIP; photo tool is single-file), OPFS scratch storage (not needed for single images), Lighthouse CI in GitHub Actions (baseline measured locally), real-device testing, error monitoring service, CMP/ads.
