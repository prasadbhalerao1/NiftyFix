# NiftyFix launch kit

Ready-to-paste text for getting the first links and visitors. Post from your own
accounts, one platform a day, and reply to every comment. Read each community's
self-promotion rules first; where links are not allowed, answer the question in
full and mention the site only if asked.

Facts you can rely on in every post:

- 30+ free tools for PDFs, images, exam form photos, Hindi text and Indian calculators.
- Everything runs in the browser. Files are never uploaded; there is no server that sees them.
- No sign-up, no watermark, works on phones and slow connections.
- Built for Indian needs: exam photo and signature sizes, passport photos to official
  specs, Hindi and Marathi OCR, Kruti Dev converter, GST invoice and EMI prepayment planning.

---

## 1. Hacker News (Show HN)

Post on a weekday morning US time (about 7 to 9 pm India time).

**Title**

Show HN: NiftyFix, PDF and image tools that never upload your files

**URL:** https://niftyfix.in

**First comment (post it yourself right after submitting)**

Hi HN, I built NiftyFix because the popular PDF and image sites upload every file to
their servers, and in India people put Aadhaar cards, marksheets and bank statements
through them every day.

Every tool runs in the browser: PDF work with pdf.js and pdf-lib, images with canvas
and WebAssembly encoders, and OCR with Tesseract compiled to WebAssembly (English,
Hindi and Marathi). The tool code runs in a sandboxed cross-origin iframe with a
strict CSP (connect-src 'self'), so even a bug cannot send your file anywhere. There
is a page explaining how to verify that yourself in DevTools:
https://niftyfix.in/privacy-verification/

Some tools exist because of Indian forms: compress a photo to exactly 20 to 50 KB
for an exam form, a passport photo maker checked against the official specs, and a
Kruti Dev to Unicode converter (an old Hindi font still used in typing tests).

Happy to answer questions about the architecture or the browser-side OCR.

---

## 2. Product Hunt

**Name:** NiftyFix

**Tagline (60 chars max):** Free PDF and image tools that never upload your files

**Description**

NiftyFix is a free toolkit for PDFs, images and everyday Indian paperwork. Compress,
merge and sign PDFs, resize photos to the exact KB an exam form asks for, make
passport photos to official specs, extract Hindi and Marathi text from photos, and
convert Kruti Dev to Unicode. Everything runs in your browser, so your files never
leave your device. No sign-up, no watermark.

**Topics:** Productivity, Privacy, Developer Tools, Education

**Maker comment**

Most online PDF tools upload your documents. NiftyFix does all the work on your
device, which matters when the file is an Aadhaar card or a bank statement. It is
built for Indian needs first: exam form photo sizes, passport photos, Hindi and
Marathi OCR, GST and EMI calculators. I would love feedback on what tool to build
next.

---

## 3. AlternativeTo (alternativeto.net)

Add NiftyFix as a new app, then suggest it as an alternative to: iLovePDF, Smallpdf,
Sejda PDF, PDF24 Tools, TinyPNG, Online OCR.

**Short description**

Free PDF and image tools that run in your browser; files are never uploaded.

**Long description**

NiftyFix offers PDF tools (compress, merge, split, rotate, sign, watermark, page
numbers, PDF to image, PDF to text), image tools (compress, resize, crop, convert,
remove location data, watermark), OCR for English, Hindi and Marathi, and tools for
Indian forms such as passport photos and exam photo and signature sizes. All
processing happens on your device. Free, no account, no watermark.

**Tags:** pdf, privacy, offline-capable, image-compression, ocr, free

---

## 4. Reddit

Read the rules of each subreddit first. Many allow self-promotion only in a weekly
thread or only when you are an active member.

### r/developersIndia (flair: "I made this")

**Title:** I built a set of PDF and image tools that work fully in the browser, no uploads

**Body**

I got tired of uploading Aadhaar and marksheets to random PDF sites, so I built
NiftyFix (niftyfix.in). Every tool runs client side: pdf-lib and pdf.js for PDFs,
WebAssembly encoders for images, Tesseract WASM for Hindi and Marathi OCR. Tool code
runs in a sandboxed iframe on a separate origin with connect-src 'self', so files
cannot leave the device.

Stack: Astro for the site, Preact in the tool frame, Cloudflare Workers free plan.

Would love feedback, especially on speed on low-end phones.

### Exam subreddits (r/SSC, r/UPSC, r/bankexams): answer, do not advertise

Look for posts like "photo size error in form" and reply:

> Most forms want the photo as a JPG between a minimum and maximum KB (for example
> 20 to 50 KB) and sometimes at a set pixel size. Check the notification for the
> exact numbers. To hit the size without losing quality, lower the JPG quality step
> by step rather than shrinking the photo a lot. I made a free tool that does this
> to a target size in your browser (nothing is uploaded): https://niftyfix.in/forms/photo-resizer/

---

### Exam answers for Reddit (one per subreddit, only where the question is asked)

Google ranks Reddit threads highly for exam questions, so a correct, complete
answer keeps bringing students for months. Search the subreddit for the question
first and answer the existing thread instead of starting a new one.

**r/UPSC: "photo rejected" or "triple signature"**

> UPSC's own upload instructions (upsconline.nic.in, Instructions and FAQs > Photo &
> Signature) say: photo as a colour JPG of 20 to 200 KB, plain white background, and
> your face must cover at least 3/4 of the photo; that rule rejects most photos, so
> crop tighter than a normal passport photo. The signature is a triple signature: sign
> three times one below the other in black ink, one JPG of 20 to 100 KB. You also
> take a live photo, which is matched with the uploaded one. I put the official
> numbers in a free tool that fills them in for you:
> https://niftyfix.in/forms/upsc-photo-size/

**r/NEET: "photo or signature size"**

> From the NEET UG 2026 bulletin: photo JPG 10 to 200 KB (colour or black and white,
> face 80% of the photo, white background), signature JPG 10 to 100 KB (not 4 to 30 KB
> as some sites say), certificates as PDF 50 to 300 KB. The bulletin gives two
> different ranges for the fingerprint image (10 to 200 KB and 50 to 300 KB), so keep
> it between 50 and 200 KB to satisfy both. Details: https://niftyfix.in/forms/neet-photo-size/

**r/SSC: "SSC photo size"**

> For CGL 2026 there is no photo upload at all: the form captures your photo live with
> the camera, and using an old photo gets the application rejected (no cap, mask or
> glasses). Only the signature is uploaded: JPEG, 10 to 20 KB, about 6 x 2 cm.
> https://niftyfix.in/forms/ssc-signature-size/

**r/bankingexams or r/IBPS: "IBPS PO upload sizes"**

> From the official CRP PO/MT-XVI notice (Annexure III): photo 200 x 230 px, 20 to 50
> KB; signature 140 x 60 px, 10 to 20 KB, black ink, not in capitals; left thumb
> 240 x 240 px at 200 DPI, 20 to 50 KB; handwritten declaration 800 x 400 px at 200
> DPI, 50 to 100 KB. Plus a live photo during registration.
> https://niftyfix.in/forms/ibps-po-photo-size/

## 5. Quora answer templates

Search Quora for each question and answer it fully; the link is a bonus, not the answer.

**"How do I reduce photo size to 20 KB for an online form?"**

> Three things decide the size: pixel dimensions, JPG quality, and hidden data in the
> photo. First resize to the pixel size the notification gives, then lower the JPG
> quality until it is under the limit, and remove camera data (EXIF), which can add
> several KB. You can do all three in one step, free and
> without uploading the photo, at https://niftyfix.in/forms/photo-resizer/

**"How to convert Kruti Dev to Unicode?"**

> Kruti Dev is a font that draws Hindi on English keys, which is why copied text shows
> as "Hkkjr" instead of भारत. You need a converter that understands its order rules:
> the short i matra (ि) is typed before the letter and the reph (र्) after it, so
> simple find-and-replace tools get words like स्थिति and कार्य wrong. Paste the text
> at https://niftyfix.in/text/krutidev-to-unicode/ and copy the Unicode result; it also
> converts Unicode back to Kruti Dev for typing tests.

**"Is it safe to upload my Aadhaar card to online PDF compressors?"**

> Most of them upload your file to their server, and you have to trust their deletion
> policy. Safer options either run on your computer or process the file inside your
> browser. NiftyFix (https://niftyfix.in/pdf/compress-pdf/) does the work in the browser;
> you can check in DevTools that no upload happens, as explained at
> https://niftyfix.in/privacy-verification/

---

## 6. Free listings (submit once)

- Bing Webmaster Tools: import from Google Search Console (also feeds ChatGPT search).
- SaaSHub (saashub.com): free listing, alternative to iLovePDF.
- Indie Hackers: product page plus a short "how I built it" post.
- GitHub "awesome" lists for privacy tools: open a pull request adding one line, for
  example "NiftyFix: PDF and image tools that run entirely in the browser."

## Do not

- Buy backlink packages, join link exchanges or use PBNs. Google penalises them.
- Post the same text in many subreddits on the same day; Reddit flags it as spam.
- Leave links in blog comments.
