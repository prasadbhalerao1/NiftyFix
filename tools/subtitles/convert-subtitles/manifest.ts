import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'subtitles.convert-subtitles',
  version: 1,
  slug: 'convert-subtitles',
  category: 'subtitles',
  status: 'live',
  name: 'Subtitle Converter and Sync',
  h1: 'Convert subtitles between SRT, VTT, ASS and SBV, and fix their timing',
  tagline:
    'Convert subtitle files between SRT, WebVTT, ASS and YouTube SBV, shift or rescale their timing to match the video, and fix overlaps.',
  seoTitle: 'Subtitle Converter: SRT to VTT, ASS, SBV and sync | NiftyFix',
  seoDescription:
    'Convert subtitles between SRT, VTT, ASS and SBV, shift timings, fix frame-rate drift and overlaps, or get a plain transcript. Free, nothing uploaded.',
  searchAliases: [
    'srt to vtt',
    'vtt to srt',
    'subtitle converter',
    'ass to srt',
    'sync subtitles',
    'shift subtitle timing',
  ],
  input: { kind: 'interactive' },
  output: { formats: [] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'text',
  capabilities: {
    batch: false,
    cancellable: false,
    progress: 'determinate',
    verifiesOutput: false,
  },
  related: ['text.text-diff', 'text.word-counter'],
});
