/**
 * Text cleaning and repeating, as pure functions. Each cleaning step is
 * optional and runs in a fixed order, so results are predictable.
 */
export interface CleanOptions {
  /** Join lines broken mid-sentence (PDF and email copies), keeping paragraph breaks. */
  joinLines: boolean;
  /** Remove every line break, paragraphs too. */
  removeAllBreaks: boolean;
  collapseSpaces: boolean;
  trimLines: boolean;
  removeEmptyLines: boolean;
  /** Curly quotes, long dashes and ellipses to plain keyboard characters. */
  plainPunctuation: boolean;
  stripHtml: boolean;
  removeEmoji: boolean;
  /** Zero-width spaces, soft hyphens and other characters you cannot see. */
  removeInvisible: boolean;
}

const INVISIBLE = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;
/** Pictographs, flag letters, skin tones, and the variation and keycap marks that follow them. */
const EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|\uFE0F|\u20E3/gu;

export function cleanText(input: string, o: CleanOptions): string {
  let text = input.replace(/\r\n?/g, '\n');
  if (o.stripHtml) {
    text = text
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  if (o.removeInvisible) text = text.replace(INVISIBLE, '');
  if (o.removeEmoji) text = text.replace(EMOJI, '');
  if (o.plainPunctuation) {
    text = text
      .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
      .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
      .replace(/[\u2013\u2014\u2212]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u00A0/g, ' ');
  }
  if (o.trimLines)
    text = text
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  if (o.removeAllBreaks) text = text.replace(/\s*\n\s*/g, ' ');
  else if (o.joinLines) {
    // A blank line marks a paragraph; single breaks inside a paragraph become spaces.
    text = text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/(\S)-\n(\S)/g, '$1$2').replace(/\s*\n\s*/g, ' '))
      .join('\n\n');
  }
  if (o.removeEmptyLines) text = text.replace(/\n\s*\n/g, '\n');
  if (o.collapseSpaces)
    text = text
      .replace(/[ \t\u00A0]+/g, ' ')
      .replace(/ +\n/g, '\n')
      .replace(/\n +/g, '\n');
  return text.trim();
}

export type Separator = 'newline' | 'space' | 'none' | 'comma' | 'custom';

export function repeatText(
  text: string,
  times: number,
  separator: Separator,
  custom = '',
  numbered = false,
): string {
  const join = { newline: '\n', space: ' ', none: '', comma: ', ', custom }[separator];
  const count = Math.max(0, Math.min(100_000, Math.floor(times)));
  return Array.from({ length: count }, (_, i) => (numbered ? `${i + 1}. ${text}` : text)).join(
    join,
  );
}
