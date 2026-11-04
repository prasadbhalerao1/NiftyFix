# Catalogue verification — consolidated workspace list (396 entries)

**Date:** 4 Nov 2026 · **Result:** 401 unique tools in 18 categories, in `packages/registry/src/planned.ts`.
A unit test (`packages/registry/test/registry.test.ts`) fails the build if any two tools share a URL slug or a name, in any category.

## Duplicates merged (one tool, one page)

Two pages for the same job compete with each other in search, so each pair below is one tool.

| Kept as | Merged entries from the list |
| --- | --- |
| PDF Table to Excel / CSV (`ocr/pdf-table-extractor`) | 27 PDF Table Extractor · 165 PDF Table-to-Spreadsheet Extractor · 175 PDF Table Data Exporter |
| Extract Text and Content from PDF (`pdf/pdf-to-text`) | 28 PDF Content Extractor (text part) |
| Extract Text and Attachments from Files (`ocr/file-content-extractor`) | 164 File Content Extractor · 166 Document and Attachment Extractor |
| OCR PDF (`ocr/ocr-pdf`) | 26 PDF OCR and Searchable PDF Creator · 158 Scanned PDF OCR |
| HTML and Webpage to PDF (`documents/html-to-pdf`) | 45 HTML and Webpage-to-PDF · 282 Webpage-to-PDF Converter |
| Website Screenshot (`image/website-screenshot`) | 89 Webpage Screenshot Tool · 281 Webpage Screenshot and Capture Utility |
| Image Colour Picker and Palette Extractor (`image/image-color-picker`) | 84 Image Colour Picker and Palette Extractor · 252 Image Palette Extractor |
| Voice Recorder (`audio/voice-recorder`) | 134 Voice Recorder · 369 Microphone Recorder |
| Microphone Test / Speaker Test (`utilities/mic-test`, `utilities/speaker-test`) | 135 Microphone and Speaker Tester · 370 Microphone Tester · 371 Speaker Tester |
| Screen Recorder (`video/screen-recorder`) | 115 Screen and Browser Video Recorder · 367 Screen Recorder |
| Webcam Recorder (`video/webcam-recorder`) | 116 Webcam Video Recorder · 368 Webcam Recorder |
| Extract Audio from Video (`audio/extract-audio`) | 130 Video-to-Audio Extractor (video 104/106 stay separate: mute, replace) |
| Add or Replace Video Audio (`video/replace-video-audio`) | 106 Video Audio Replacement Tool · 131 Audio-to-Video Track Inserter |
| Password and Token Generator (`generators/password-generator`) | 219 Secure Password and Token Generator (and the password part of 242) |
| UUID, ULID and ObjectID Generator (`developer/uuid-generator`) | 220 (identifier part of 242 stays in Random Number and Identifier Generator for non-ID data) |
| Unix Timestamp and ISO 8601 Converter (`developer/timestamp-converter`) | 333 (listed under calculators and implied in developer tools) |
| Keyword Extractor and Density (`seo/keyword-density`) | 275 Keyword Extractor and Density Analyser (text-tool word frequency folded in) |
| Base64, Base32, Base58 Encoder (`developer/base64`) | 199 Base Encoder and Decoder Workbench |
| Colour Picker and Converter (`design/color-converter`) | 248 Colour Picker and Converter (Image Colour Picker stays separate: it reads colours from an uploaded image) |
| Unit Converter (`calculators/unit-converter`) | 336 Unit Converter · 337 Length · 338 Area and Volume · 339 Weight · 340 Temperature · 341 Pressure/Energy/Power · 342 Frequency/Angle (each unit family becomes a preset page of the one converter) |
| Image Dimension and DPI Calculator (`calculators/image-dimension-calculator`) | 362 Image Dimension Calculator · 366 Print DPI and Pixel Size Calculator |
| Ohm's Law and Electrical Calculator (`calculators/electrical-calculator`) | 343 Voltage, Current and Resistance · 344 Ohm's Law and Circuit |
| Caption and Transcript Workspace (`creator/caption-workspace`) | 290 (subtitle conversion itself lives in the Subtitles workspace) |
| Video Metadata Inspector (`video/video-info`) | 114 Video Metadata Inspector · 294 Creator Video Metadata Inspector |
| Video to Shorts and Highlights (`video/video-to-shorts`) | 117 AI Video Highlight and Short-Clip Creator · 295 AI Video-to-Shorts |
| Quiz Maker (`utilities/quiz-maker`) | 380 Quiz and Study Tool (PDF-based quizzes stay in PDF: `pdf/pdf-to-quiz`) |
| Random Choice Picker (`utilities/random-picker`) | 383 Item Locator was unclear; 387 Random Choice Picker kept |

## Missing from the list, added back

- **A Text workspace** (word counter, case converter, text diff, find and replace, duplicate lines, sort lines, line breaks, special characters, Unicode normalisation, repeater, split/merge, random line, readability, reading time, n-grams, extract emails/URLs, grammar, paraphrase, summarise, AI writer). These are among the most searched utilities and were in the v3 catalogue.
- **PDF:** Rotate PDF, PDF to JPG/PNG, JPG to PDF (very high search demand; previously only implied by "Create PDF").
- **Image:** Compress GIF and Animated Images, Make Square / Add Border.
- **Documents:** Word to PDF and PDF to Word as their own entries (the two most searched document conversions).

## Execution labels

Every tool carries one: **browser** (runs on the device), **server** (needs our servers), **ai** (needs a model) or **gated** (blocked on a legal, licence, codec or terms review). Examples: Request Signatures is server (sends email, stores documents); Protect/Unlock/Repair PDF, PDF/A and RAR extraction are gated on vetting an engine (qpdf-wasm, licences); Chat with PDF is AI.

## Not included

- Social-media and YouTube **downloaders** (terms of service, DRM, copyright), as decided earlier.
- 383 Item Locator (no clear user job described).
