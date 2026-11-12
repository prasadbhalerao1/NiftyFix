import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Open or paste a subtitle file and download it in another format: SRT, WebVTT (for web players and YouTube), ASS, YouTube SBV, or a plain-text transcript. The format you start with is recognised automatically. If the subtitles are out of sync, shift every timing earlier or later, or fix the slow drift caused by a different frame rate; overlapping and out-of-order lines are repaired too. Everything runs in your browser.',
  howTo: [
    'Choose a subtitle file, or paste the subtitles.',
    'Pick the format to save as.',
    'If needed, shift the timings or choose a frame-rate fix.',
    'Download the new file, or copy the text.',
  ],
  options: [
    {
      name: 'Save as',
      description:
        'SRT works almost everywhere; VTT is for HTML5 video and many web players; ASS for styled subtitles in players such as VLC and mpv; SBV for YouTube; Text gives a clean transcript without timings.',
    },
    {
      name: 'Shift all timings',
      description:
        'If every subtitle appears too late, enter a negative number of seconds (such as -1.5); if too early, a positive one.',
    },
    {
      name: 'Frame-rate fix',
      description:
        'If subtitles start in sync but drift further off as the video plays, they were timed for a different frame rate. Choose the matching conversion, such as 23.976 to 25 fps.',
    },
    {
      name: 'Fix order and overlaps',
      description:
        'Sorts subtitles by time, removes empty ones, and ends each subtitle before the next begins, which some players and YouTube require.',
    },
  ],
  example: {
    title: 'Example',
    input: 'movie.srt that shows 2 seconds late',
    settings: 'Save as VTT, shift -2 seconds',
    output: 'movie.vtt in sync, ready for an HTML5 video player',
  },
  limits: [
    'ASS styling (fonts, colours, positions) is not carried into SRT or VTT, which have no equivalent; the words and timings are kept.',
  ],
  faqs: [
    {
      question: 'How do I convert SRT to VTT?',
      answer:
        'Open the SRT file here, choose VTT under "Save as" and download. VTT uses a dot instead of a comma in timings and starts with WEBVTT; the tool handles both.',
    },
    {
      question: 'My subtitles get more out of sync over time. How do I fix that?',
      answer:
        'That drift comes from a frame-rate difference. Try "23.976 to 25 fps" (or the reverse) under Frame-rate fix, then shift timings if the start is still off.',
    },
    {
      question: 'Are my files uploaded?',
      answer:
        'No. Subtitles are converted in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'sync-subtitles',
      preset: 'sync',
      label: 'Sync subtitles',
      h1: 'Sync subtitles: shift timing and fix drift',
      seoTitle: 'Sync Subtitles: shift SRT timing online, free | NiftyFix',
      seoDescription:
        'Fix subtitles that are early, late or drift out of sync: shift all timings by seconds or correct a frame-rate mismatch. SRT, VTT, ASS and SBV. Free.',
      intro:
        'Subtitles showing too early or too late? Open the file, enter how many seconds to move them (negative for earlier), and download it in the same format. If they drift further off as the video plays, choose a frame-rate fix such as 23.976 to 25 fps.',
    },
  ],
});
