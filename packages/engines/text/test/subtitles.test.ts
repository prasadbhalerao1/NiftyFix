import { describe, expect, it } from 'vitest';
import { parseSubtitles, retime, writeSubtitles } from '../src';

const SRT =
  '1\n00:00:01,500 --> 00:00:03,000\nHello <i>there</i>\n\n2\n00:00:04,000 --> 00:00:06,250\nSecond line\nwith two rows\n';

describe('subtitles', () => {
  it('reads SRT and writes VTT, SBV and a transcript', () => {
    const parsed = parseSubtitles(SRT);
    expect(parsed?.format).toBe('srt');
    expect(parsed?.cues).toEqual([
      { start: 1500, end: 3000, text: 'Hello <i>there</i>' },
      { start: 4000, end: 6250, text: 'Second line\nwith two rows' },
    ]);
    const cues = parsed?.cues ?? [];
    expect(writeSubtitles(cues, 'vtt')).toBe(
      'WEBVTT\n\n00:00:01.500 --> 00:00:03.000\nHello <i>there</i>\n\n00:00:04.000 --> 00:00:06.250\nSecond line\nwith two rows\n',
    );
    expect(writeSubtitles(cues, 'sbv').split('\n')[0]).toBe('0:00:01.500,0:00:03.000');
    expect(writeSubtitles(cues, 'txt')).toBe('Hello there\nSecond line with two rows\n');
  });

  it('round-trips through VTT, SBV and ASS', () => {
    const cues = parseSubtitles(SRT)?.cues ?? [];
    for (const format of ['vtt', 'sbv', 'ass'] as const) {
      const back = parseSubtitles(writeSubtitles(cues, format));
      expect(back?.format).toBe(format);
      expect(back?.cues.map((c) => [c.start, c.end])).toEqual([
        [1500, 3000],
        [4000, 6250],
      ]);
    }
    expect(parseSubtitles(writeSubtitles(cues, 'ass'))?.cues[1]?.text).toBe(
      'Second line\nwith two rows',
    );
  });

  it('reads ASS dialogue with commas in the text and override tags', () => {
    const ass =
      '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\nDialogue: 0,0:00:02.50,0:00:04.00,Default,,0,0,0,,{\\i1}Well, hello\\Nworld';
    expect(parseSubtitles(ass)?.cues).toEqual([
      { start: 2500, end: 4000, text: 'Well, hello\nworld' },
    ]);
  });

  it('shifts, rescales and repairs timing', () => {
    const cues = [
      { start: 5000, end: 9000, text: 'b' },
      { start: 1000, end: 6000, text: '<b>a</b>' },
    ];
    const fixed = retime(cues, { shift: -500, scale: 1, repair: true, stripFormatting: true });
    expect(fixed).toEqual([
      { start: 500, end: 4500, text: 'a' },
      { start: 4500, end: 8500, text: 'b' },
    ]);
    expect(
      retime([{ start: 1000, end: 2000, text: 'x' }], {
        shift: 0,
        scale: 25 / 24,
        repair: false,
        stripFormatting: false,
      })[0]?.end,
    ).toBeCloseTo(2083.33, 1);
  });

  it('rejects text that is not subtitles', () => {
    expect(parseSubtitles('just words')).toBeNull();
  });
});
