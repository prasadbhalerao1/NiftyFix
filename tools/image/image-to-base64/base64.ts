import { FILE_FORMATS, sniffFormat } from '@niftyfix/tool-sdk';

/**
 * Base64 in both directions for images. Pure, and unit-tested: encoding
 * produces every snippet people paste (data URI, CSS, HTML, Markdown, JSON);
 * decoding accepts whatever they paste back (data URIs, raw, URL-safe,
 * wrapped lines, missing padding) and says exactly what is wrong otherwise.
 */
export type Snippet = 'data-uri' | 'raw' | 'css' | 'html' | 'markdown' | 'json';

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  // In chunks: String.fromCharCode with a huge argument list overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function snippet(base64: string, mime: string, kind: Snippet, name = 'image'): string {
  const uri = `data:${mime};base64,${base64}`;
  switch (kind) {
    case 'raw':
      return base64;
    case 'css':
      return `background-image: url("${uri}");`;
    case 'html':
      return `<img src="${uri}" alt="${name.replace(/"/g, '&quot;')}">`;
    case 'markdown':
      return `![${name.replace(/[[\]]/g, '')}](${uri})`;
    case 'json':
      return JSON.stringify({ name, mime, base64 });
    default:
      return uri;
  }
}

export interface ImageKind {
  extension: string;
  mime: string;
  label: string;
}

/** What the bytes are: an image format we can show, or another file type. */
export function detectKind(bytes: Uint8Array): ImageKind | null {
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 512)).trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) {
    return { extension: 'svg', mime: 'image/svg+xml', label: 'SVG' };
  }
  if (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) {
    return { extension: 'ico', mime: 'image/x-icon', label: 'ICO' };
  }
  const format = sniffFormat(bytes);
  if (!format) return null;
  const info = FILE_FORMATS[format];
  return { extension: info.extensions[0] ?? format, mime: info.mime, label: info.label };
}

export type Decoded =
  | { ok: true; bytes: Uint8Array; kind: ImageKind | null; declaredMime: string | null }
  | { ok: false; error: string };

export function fromBase64(input: string): Decoded {
  const text = input.trim();
  if (text === '') return { ok: false, error: 'Paste a Base64 string or a data URI.' };
  let body = text;
  let declaredMime: string | null = null;
  const uri = /^data:([^;,]*)?((?:;[^;,]*)*?);base64,/i.exec(text);
  if (uri) {
    declaredMime = uri[1] || null;
    body = text.slice(uri[0].length);
  } else if (/^data:/i.test(text)) {
    return { ok: false, error: 'This data URI is not Base64 (it has no ";base64," part).' };
  }
  // Line breaks, spaces and quotes from copying code; URL-safe letters; missing padding.
  body = body
    .replace(/[\s"'`]/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const bad = /[^A-Za-z0-9+/=]/.exec(body);
  if (bad) {
    return {
      ok: false,
      error: `"${bad[0]}" at position ${bad.index + 1} is not a Base64 character.`,
    };
  }
  body = body.replace(/=+$/, '');
  if (body.length % 4 === 1) {
    return { ok: false, error: 'The text is cut off: its length is not valid Base64.' };
  }
  body += '='.repeat((4 - (body.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(body);
  } catch {
    return { ok: false, error: 'This is not valid Base64: "=" can only appear at the end.' };
  }
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return { ok: true, bytes, kind: detectKind(bytes), declaredMime };
}
