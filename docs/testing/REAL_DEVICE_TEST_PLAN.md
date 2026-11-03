# Real-device test plan

**Status:** plan only — **no physical-device test has been run yet** (4 Nov 2026). Automated coverage so far is Playwright desktop engines + Pixel 7 _emulation_, which does not reproduce real memory limits, real camera files, OS file pickers, or iOS Safari.

Run this plan before any tool moves from `beta` to `live`, and on every release that changes the runtime, an engine, or a tool UI. Record results in a copy of the table in §6 (one file per run under `docs/testing/runs/YYYY-MM-DD-<device>.md`).

## 1. Device matrix

| ID  | Class                           | Example devices                                                   | Browser(s)                        | Why                                                                                       |
| --- | ------------------------------- | ----------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| A1  | Low-memory Android (≤ 3 GB RAM) | Redmi A-series, Samsung Galaxy A0x/M0x, Android Go devices        | Chrome (latest), Samsung Internet | Most constrained real users (India-first); memory limits, slow CPU                        |
| A2  | Mid-range Android (6–8 GB)      | Redmi Note, Galaxy A3x/A5x, Pixel 6a/7a                           | Chrome                            | Typical exam applicant phone                                                              |
| I1  | Older iPhone                    | iPhone SE (2nd/3rd gen), iPhone 8/11 on the oldest iOS we support | Safari                            | Low memory; older WebKit — exercises main-thread fallback if workers lack OffscreenCanvas |
| I2  | Recent iPhone                   | iPhone 13–16, current iOS                                         | Safari, Chrome (WebKit)           | HEIC camera files, Photos picker                                                          |
| D1  | Windows laptop                  | Any, 8 GB                                                         | Chrome, Edge, Firefox             | Keyboard users, large files                                                               |
| D2  | Mac                             | Any                                                               | Safari, Chrome                    | Desktop WebKit                                                                            |

Minimum for a release: **A1, A2, I1, D1 (Chrome + Firefox), D2 (Safari)**.

## 2. Test environment

### Option A — staging deployment (preferred)

Deploy both apps to staging domains (see `docs/runbooks/deploy-cloudflare.md`) so the phone uses HTTPS and two registrable domains exactly like production.

### Option B — LAN preview from the development machine

Find the machine's LAN IP (e.g. `192.168.1.20`), then:

```sh
PUBLIC_SITE_ORIGIN=http://192.168.1.20:4321 PUBLIC_FRAME_ORIGIN=http://192.168.1.20:4322 pnpm build
pnpm --filter @niftyfix/site preview --host 0.0.0.0
pnpm --filter @niftyfix/tool-frame preview --host 0.0.0.0
```

Open `http://192.168.1.20:4321/` on the phone (same Wi-Fi; allow the ports through the firewall).
**Limits of option B:** plain HTTP, and site/frame differ only by port (same host), which is a weaker isolation boundary than production's separate domains. Valid for functional, memory and UX testing; **not** valid as evidence for the privacy/isolation guarantees.

### Remote inspection

- Android: USB debugging → desktop Chrome `chrome://inspect` → inspect the page and the frame; Performance and Memory panels.
- iPhone: Settings → Safari → Advanced → Web Inspector → desktop Safari → Develop menu.

## 3. Test files

Copy to each device: `fixtures/images/*`, `fixtures/signatures/*`, `fixtures/malicious/*`, plus **files captured on that device**: a selfie and a rear-camera photo (portrait and landscape), an iPhone HEIC photo, a WhatsApp-forwarded photo, a screenshot, and a phone-camera photo of a handwritten signature on white paper, on lined paper, and under a desk lamp (shadow).

## 4. Measurements to capture

| Measure                      | How                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Time to result (s)           | Stopwatch from tapping the primary button to the result appearing                                                              |
| Peak memory (MB)             | Android: `chrome://inspect` → Memory → JS heap + Performance monitor; iOS: Web Inspector → Timelines → Memory                  |
| Main-thread fallback active? | Web Inspector console: a worker error `This browser cannot draw images in a background worker` precedes main-thread processing |
| UI responsiveness            | Can the crop frame be dragged and the Cancel button tapped during processing? (yes/no, lag in s)                               |
| Downloaded file              | Open in the phone's gallery/Files; check dimensions in file info; size in bytes                                                |

## 5. Checklist (each tool × each device)

### 5.1 File selection

- [ ] Tapping the dropzone opens the OS picker (Android: Photos/Files chooser; iOS: Photo Library / Take Photo / Choose File).
- [ ] Choosing from the **camera** directly works (iOS "Take Photo", Android camera option).
- [ ] Drag-and-drop works on desktop; paste (Ctrl/⌘+V) works on desktop.
- [ ] HEIC photo: iOS normally converts to JPEG when picked from Photos — confirm; if a raw HEIC arrives, the HEIC message appears (no crash).
- [ ] A 30 MB+ file on A1 shows the device-limit message, not a crash.

### 5.2 Decoding and orientation

- [ ] Portrait and landscape camera photos display upright (EXIF orientation) in the preview.
- [ ] Reported source dimensions match the gallery's file info (after rotation).
- [ ] 48–50 MP photos (recent phones) decode on A2/I2; on A1/I1 either decode or show the pixel-limit message — never a blank page or tab reload.

### 5.3 Crop interaction

- [ ] Drag the frame with one finger; it stays inside the image; page does not scroll while dragging.
- [ ] Corner handle resizes with the aspect ratio locked.
- [ ] "Crop size" slider is usable with a thumb (≥ 44 px target).
- [ ] Keyboard (desktop): Tab to the frame, arrows move, +/− resize.

### 5.4 Output accuracy

- [ ] Output pixel dimensions exactly equal the requested width × height (gallery file info + validation report).
- [ ] Output bytes are within the requested min/max (Files app size in bytes; compare with the report's exact byte count).
- [ ] DPI (when set) is shown correctly by a desktop image viewer for the downloaded JPEG.
- [ ] Unreachable targets produce the explanation, not a file.

### 5.5 Solver reliability

Run each combination on A1, I1, D1 and record time + attempts:

- [ ] 413 × 531, 20–50 KB (photo)
- [ ] 140 × 60, 10–20 KB (signature)
- [ ] 1000 × 1000, max 2 KB (must fail with explanation)
- [ ] 40 × 40, min 200 KB (must refuse to pad)

### 5.6 Cancellation and resilience

- [ ] Cancel during processing returns to editing within 1 s (worker) / within one encode step (main-thread fallback).
- [ ] Switching apps (home button) during processing, then returning: either completes or shows a recoverable error.
- [ ] Rotating the phone during editing keeps the crop and settings.

### 5.7 Download

- [ ] Android Chrome: file lands in Downloads with the correct name and extension; opens in the gallery.
- [ ] iOS Safari: download prompt → "View" / saved to Files → Downloads; correct name; can be shared to Photos.
- [ ] Desktop: correct name; second download of a changed result does not reuse the stale file.

### 5.8 Accessibility and responsiveness

- [ ] Android TalkBack and iOS VoiceOver: dropzone, settings, result status and validation report are announced; result/error is announced when it appears.
- [ ] 200 % system font size: no control (especially Download) is hidden or overlapping.
- [ ] Dark mode (system) is legible.
- [ ] The result/error scrolls into view on phones after tapping the primary button.

### 5.9 WebKit main-thread fallback (I1, D2 if applicable)

- [ ] Determine whether the fallback activates (§4).
- [ ] If active: processing completes; the UI may pause briefly but recovers; Cancel works between steps.
- [ ] Record worst-case freeze duration for the 4000 × 3000 fixture.

## 6. Result template

| Device ID | Model / OS / browser | Tool | Checklist section | Result (pass/fail) | Time (s) | Peak memory (MB) | Notes / bug link |
| --------- | -------------------- | ---- | ----------------- | ------------------ | -------- | ---------------- | ---------------- |
|           |                      |      |                   |                    |          |                  |                  |

A failure blocks `live` status until fixed and re-tested on the same device.
