/**
 * Subtitles: read SRT, WebVTT, ASS/SSA and SBV; write SRT, VTT, SBV, ASS or a
 * plain transcript; shift, rescale (frame rate) and repair timing.
 */
export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'sbv' | 'txt';

export interface Cue {
  /** Milliseconds. */
  start: number;
  end: number;
  text: string;
}

const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,:](\d{1,3})/;

function parseTime(value: string): number | null {
  const match = TIME.exec(value.trim());
  if (!match) return null;
  const [, h = '0', m = '0', s = '0', frac = '0'] = match;
  // ASS uses centiseconds, SRT and VTT milliseconds: scale by the digits given.
  const ms = Math.round(Number(frac) * 10 ** (3 - frac.length));
  return ((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000 + ms;
}

export function detectFormat(text: string): SubtitleFormat | null {
  const head = text.replace(/^\uFEFF/, '').trimStart();
  if (/^WEBVTT/.test(head)) return 'vtt';
  if (/^\[Script Info\]/i.test(head) || /^Dialogue:/m.test(head)) return 'ass';
  if (/^\d+\s*\n\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->/m.test(head)) return 'srt';
  if (/^\d{1,2}:\d{2}:\d{2}\.\d{3},\d{1,2}:\d{2}:\d{2}\.\d{3}/m.test(head)) return 'sbv';
  if (/-->/.test(head)) return 'srt';
  return null;
}

export function parseSubtitles(input: string): { format: SubtitleFormat; cues: Cue[] } | null {
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const format = detectFormat(text);
  if (!format) return null;
  const cues: Cue[] = [];
  if (format === 'ass') {
    // Text is the last field; commas inside it belong to the text.
    const formatLine = /^Format:\s*(.+)$/im.exec(text.slice(text.search(/\[Events\]/i)));
    const fields = formatLine?.[1]?.split(',').map((f) => f.trim().toLowerCase()) ?? [
      'layer',
      'start',
      'end',
      'style',
      'name',
      'marginl',
      'marginr',
      'marginv',
      'effect',
      'text',
    ];
    for (const line of text.split('\n')) {
      const dialogue = /^Dialogue:\s*(.*)$/i.exec(line);
      if (!dialogue) continue;
      const parts = (dialogue[1] ?? '').split(',');
      const values = [
        ...parts.slice(0, fields.length - 1),
        parts.slice(fields.length - 1).join(','),
      ];
      const start = parseTime(values[fields.indexOf('start')] ?? '');
      const end = parseTime(values[fields.indexOf('end')] ?? '');
      const body = (values[fields.indexOf('text')] ?? '')
        .replace(/\\N/gi, '\n')
        .replace(/\{[^}]*\}/g, '');
      if (start !== null && end !== null) cues.push({ start, end, text: body.trim() });
    }
    return { format, cues };
  }
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split('\n').filter((line) => line.trim() !== '');
    const timing = lines.findIndex((line) =>
      format === 'sbv' ? /^\d.*,\d/.test(line) : line.includes('-->'),
    );
    if (timing === -1) continue;
    const [from = '', to = ''] = (lines[timing] ?? '').split(format === 'sbv' ? ',' : '-->');
    const start = parseTime(from);
    const end = parseTime(to.trim().split(/\s+/)[0] ?? '');
    if (start === null || end === null) continue;
    cues.push({ start, end, text: lines.slice(timing + 1).join('\n') });
  }
  return { format, cues };
}

const pad = (n: number, width = 2): string => String(Math.floor(n)).padStart(width, '0');
function formatTime(ms: number, style: 'srt' | 'vtt' | 'sbv' | 'ass'): string {
  const t = Math.max(0, Math.round(ms));
  const h = Math.floor(t / 3_600_000);
  const m = Math.floor(t / 60_000) % 60;
  const s = Math.floor(t / 1000) % 60;
  const milli = t % 1000;
  if (style === 'ass') return `${h}:${pad(m)}:${pad(s)}.${pad(milli / 10)}`;
  if (style === 'sbv') return `${h}:${pad(m)}:${pad(s)}.${pad(milli, 3)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}${style === 'srt' ? ',' : '.'}${pad(milli, 3)}`;
}

/** Remove HTML-style and ASS formatting tags, keeping the words. */
export const stripTags = (text: string): string =>
  text.replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '');

export function writeSubtitles(cues: readonly Cue[], format: SubtitleFormat): string {
  switch (format) {
    case 'vtt':
      return `WEBVTT\n\n${cues.map((c) => `${formatTime(c.start, 'vtt')} --> ${formatTime(c.end, 'vtt')}\n${c.text}`).join('\n\n')}\n`;
    case 'sbv':
      return `${cues.map((c) => `${formatTime(c.start, 'sbv')},${formatTime(c.end, 'sbv')}\n${c.text}`).join('\n\n')}\n`;
    case 'ass':
      return [
        '[Script Info]',
        'ScriptType: v4.00+',
        '',
        '[V4+ Styles]',
        'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
        'Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,1,2,10,10,10,1',
        '',
        '[Events]',
        'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
        ...cues.map(
          (c) =>
            `Dialogue: 0,${formatTime(c.start, 'ass')},${formatTime(c.end, 'ass')},Default,,0,0,0,,${stripTags(c.text).replace(/\n/g, '\\N')}`,
        ),
        '',
      ].join('\n');
    case 'txt':
      return `${cues.map((c) => stripTags(c.text).replace(/\n/g, ' ')).join('\n')}\n`;
    default:
      return `${cues.map((c, i) => `${i + 1}\n${formatTime(c.start, 'srt')} --> ${formatTime(c.end, 'srt')}\n${c.text}`).join('\n\n')}\n`;
  }
}

export interface TimingOptions {
  /** Milliseconds to add (negative = earlier). */
  shift: number;
  /** Multiply every time (e.g. 25 / 23.976 to fix a frame-rate mismatch); 1 = unchanged. */
  scale: number;
  /** Sort by start time and stop each cue before the next starts. */
  repair: boolean;
  stripFormatting: boolean;
}

export function retime(cues: readonly Cue[], options: TimingOptions): Cue[] {
  let out = cues.map((c) => ({
    start: Math.max(0, c.start * options.scale + options.shift),
    end: Math.max(0, c.end * options.scale + options.shift),
    text: options.stripFormatting ? stripTags(c.text) : c.text,
  }));
  if (options.repair) {
    out = out.filter((c) => c.text.trim() !== '').sort((a, b) => a.start - b.start);
    out.forEach((cue, i) => {
      const next = out[i + 1];
      if (next && cue.end > next.start) cue.end = next.start;
      if (cue.end <= cue.start) cue.end = cue.start + 1000;
    });
  }
  return out;
}
