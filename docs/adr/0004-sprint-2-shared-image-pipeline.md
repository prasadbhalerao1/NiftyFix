# ADR 0004 — Shared image pipeline and signature enhancement

**Date:** 4 Nov 2026 · **Status:** Accepted

## Context

The Signature Resizer needed the same input validation, export, size solving, verification, requirements form and result panel as the Form Photo Resizer. Copying the photo tool would have given two pipelines that drift apart. It also needed image cleanup that the photo tool does not have.

## Decisions

### 1. One image pipeline for every image tool

- `@niftyfix/engine-image/pipeline`: `readSafeHeader` (pixel limit before decoding), `exportImage` (encode at a quality or solve a byte range; never pads, throws `TARGET_UNREACHABLE`), `verifyImageOutput` (dimensions, size, format, extension, DPI measured from the bytes).
- `@niftyfix/tool-sdk` output spec: `OutputSpecDraft` → `validateOutputSpec` → `resolveOutputSpec`, and `outputSpecEntries(formats)` for each tool's worker-side Valibot schema. A tool restricts formats; it does not redefine the fields.
- `@niftyfix/ui`: `OutputSpecForm`, `useToolJob` (start / progress / cancel / done / error), `loadImageSource`, `ProcessingPanel`, `ImageResultPanel`.
- Consequence: `@niftyfix/ui` depends on `@niftyfix/engine-image` (header reading for `loadImageSource`). Allowed by the boundary rules: UI may use engines, engines may not use UI.

### 2. Enhancement is pure and shared by preview and export

`enhancePixels(pixels, settings)` works on raw RGBA without DOM or canvas. The live preview runs it on a ≤ 640 px sample on the main thread; the processor runs it on the working-size crop in the worker. The two paths cannot disagree. It never modifies its input, and every cleanup step is a setting, so "Original", "No cleanup" and "Reset to safe defaults" are always available.

Safe defaults: flatten on, contrast +10 %, background cleanup 40 %, **colour** mode. The hard black-and-white threshold is never the default because it is the setting most likely to erase thin strokes.

### 3. Paper estimate by morphological closing

The first version took block maxima, dilated and blurred them. A blur smears across hard shadow edges and left a grey line along them in the output (caught by e2e and visual review). The paper level is now a **closing** of the luminance: a square max filter (removes ink narrower than the window), then a min filter of the same size. A closing reproduces step edges, gradients and flat grey paper exactly.

- Window radius: max(12 px, short side ÷ 8). Strokes up to about a quarter of the short side are treated as ink.
- O(n) per pass with a monotonic deque, independent of the radius.
- The image is padded by the radius with replicated edges first; without padding, clipped windows near the border let lit paper leak across an edge.
- An edge-aware mask (local standard deviation ≤ 6 and level above a whiten-dependent floor) forces smooth light regions to pure white.

### 4. Legibility is measured, not assumed

`assessLegibility` compares ink coverage after cleanup against the image after lighting correction only. It reports `strokes-lost`, `empty` or `background-dark`; the warnings show in the preview and again in the result.

### 5. Auto-crop by connected components

`findInkBounds` groups ink into 8-connected components and ignores components below max(6 px, 0.02 % of the area). A thin pen stroke is one long component; dust and JPEG specks are not.

### 6. Accessibility lint: `eslint-plugin-jsx-a11y-x`

ESLint 10 is unsupported by `eslint-plugin-jsx-a11y`; the maintained fork keeps the strict preset. The preview canvas is `aria-hidden` inside a `<figure>` with a screen-reader caption, as the rules require.

## Consequences

- A new image tool supplies only its manifest, content, options schema, processor steps and UI-specific controls.
- Shared UI is hoisted into the frame shell by the bundler (18.0 → 27.5 kB gzip, budget 50 kB); per-tool chunks shrank. See IMPLEMENTATION_STATUS for the numbers.
- Enhancement is tested on synthetic images. Real phone photos may need tuning of the window size and mask thresholds once the device plan runs.
