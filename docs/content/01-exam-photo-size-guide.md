# How to resize your photo and signature for an exam form (without the "invalid size" error)

_For Medium or LinkedIn. Suggested tags: SSC, UPSC, Government Jobs, Online Forms, India._

You fill in the whole form, upload your photo, and get: **"Photo size should be between
20 KB and 50 KB."** You shrink it, and now it is blurry, or the pixel size is wrong, or it
is still 62 KB. Almost every Indian exam and government form has rules like this, and
they trip up lakhs of applicants every season.

Here is what those rules mean, and how to meet them properly.

## The three numbers on every form

Read the "photo and signature specifications" part of the notification. It usually gives:

1. **Pixel size** (width x height), for example "200 x 230 pixels". This is the shape and
   resolution of the image.
2. **File size range in KB**, for example "20 KB to 50 KB". This is how much space the file
   takes.
3. **Format**, almost always JPG or JPEG.

They are separate rules. A photo can have the right pixels and the wrong KB, or the
reverse, and the portal rejects both.

Always take the numbers from the official notification for your exam and year. Sizes
change between exams and sometimes between years.

## Why simple resizing goes wrong

- **Shrinking the photo too much to cut the KB** makes it blurry, and blurry photos can
  get an application rejected later even if the portal accepts the upload.
- **Phone photos carry hidden data** (camera model, date, sometimes GPS location). It adds
  size and has no business going to a government portal.
- **Some portals count 1 KB as 1000 bytes, others as 1024.** A file that is 50.5 KB by one
  count is 49.3 KB by the other, so a photo "just under" the limit can still fail.

## The right order

1. **Crop** to the shape the form wants, with your face centred and some space above the head.
2. **Resize** to the exact pixel size given in the notification.
3. **Lower the JPG quality step by step** until the file is inside the KB range. Stop at
   the highest quality that fits, rather than squeezing far below the limit.
4. **Remove the hidden camera data.**
5. **Check all three numbers** before you upload.

## Doing it in one step, without uploading your photo

I built a free tool that does exactly this order:
[NiftyFix Form Photo Resizer](https://niftyfix.in/forms/photo-resizer/). You enter the
pixel size and the KB range from your notification, and it crops, resizes and finds the
best quality that fits, then shows a check against each requirement. It also handles
the 1000 vs 1024 KB question.

There is a matching [Signature Resizer](https://niftyfix.in/forms/signature-resizer/) that
cleans up a phone photo of your signature (white background, dark ink), and a
[Passport Photo Maker](https://niftyfix.in/forms/passport-photo-maker/) for passport and
visa sizes.

All of them run inside your browser. Your photo is never uploaded to any server, which
matters when the same photo goes on an ID document.

## Quick checklist before you hit submit

- [ ] Pixel size matches the notification exactly
- [ ] File size is inside the KB range (not just under the maximum)
- [ ] JPG format
- [ ] Face clear and sharp, plain light background
- [ ] Signature readable, dark ink on white

Good luck with your exam.
