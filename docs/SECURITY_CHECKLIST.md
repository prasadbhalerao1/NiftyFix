# Security checklist

Every tool and every release. ✅ = implemented and covered by an automated test; ⏳ = not yet.

## Isolation

- ✅ Tools run on a separate origin in a sandboxed iframe (`allow-scripts allow-same-origin allow-downloads allow-forms`).
- ✅ Frame CSP: `default-src 'none'`; only self for script/worker/connect/style/font; `form-action 'none'`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors <site>` (e2e: headers test).
- ✅ Frame serves static assets only; no API endpoints.
- ✅ Parent ↔ frame: frame posts only to the configured site origin; parent checks `event.origin` **and** `event.source`; messages parsed by a strict schema with no free-text fields (unit + e2e tests).
- ✅ No third-party requests from any page (e2e egress test).
- ✅ No file bytes leave the frame during processing; only same-origin GETs (e2e egress test).

## Input handling

- ✅ Format from magic bytes; extension/MIME never trusted alone (unit + e2e: PDF/random bytes named .jpg).
- ✅ Empty files, device-specific size limits.
- ✅ Pixel-count limit from the header before decoding (e2e: 30000×30000 PNG bomb).
- ✅ Truncated/corrupt files produce a clear error (e2e).
- ✅ Options re-validated in the worker with a schema (unit: tampered options rejected).
- ✅ Output file names sanitised (path traversal, control characters) (unit).
- ✅ Per-job timeout; crashed/stuck workers terminated and replaced (unit).
- ⏳ Regex tools: worker + timeout (no regex tools yet).
- ⏳ SVG sanitisation (no SVG input yet).
- ⏳ ZIP extraction limits: ratio, entry count, path traversal (no unzip tool yet).

## Errors and logging

- ✅ Users never see raw exception text (unit).
- ✅ Unexpected errors logged to the local console only.
- ⏳ Error monitoring service with scrubbing (not added).

## Supply chain

- ✅ Exact dependency versions pinned; lockfile committed; `pnpm audit --prod` in CI.
- ✅ No runtime CDN loading of code or WASM.
- ⏳ SBOM generation and licence allowlist gate in CI.
- ⏳ Renovate for grouped dependency updates.

## Before adding advertising

- ⏳ Certified CMP for EEA/UK/CH; consent before personalised ads.
- ⏳ Extend **site** CSP for the ad network only; frame CSP unchanged.
- ⏳ Re-run egress tests with ads enabled.
