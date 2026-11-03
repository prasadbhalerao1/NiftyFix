// Matching control characters is the point: they must never reach a downloaded file name.
// eslint-disable-next-line no-control-regex
const UNSAFE = /[\u0000-\u001f\u007f<>:"/\\|?*]+/g;

/** Strip path separators and control characters from a name stem (no extension handling). */
function sanitizeStem(stem: string): string {
  const cleaned = stem
    .replace(UNSAFE, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .replace(/^[.\-\s]+/, '')
    .trim();
  return (cleaned || 'file').slice(0, 80);
}

/** Remove the extension and unsafe characters; keep Unicode letters (users name files in Hindi too). */
export function sanitizeBaseName(name: string): string {
  return sanitizeStem(name.replace(/\.[^.]*$/, ''));
}

/** "IMG 2041.HEIC" + "200x230" + "jpg" → "IMG 2041-200x230.jpg" */
export function outputFileName(originalName: string, suffix: string, extension: string): string {
  const base = sanitizeBaseName(originalName);
  return suffix ? `${base}-${suffix}.${extension}` : `${base}.${extension}`;
}

/**
 * The user's custom name (e.g. "signature" — some portals require plain names)
 * if given, otherwise the original name with a suffix. Always gets `extension`.
 */
export function resolveOutputName(
  originalName: string,
  customStem: string,
  suffix: string,
  extension: string,
): string {
  const custom = customStem.trim();
  return custom
    ? `${sanitizeStem(custom)}.${extension}`
    : outputFileName(originalName, suffix, extension);
}

/** Make names unique within a batch: "a.jpg", "a (2).jpg", "a (3).jpg". */
export function uniqueFileNames(names: readonly string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let candidate = name;
    for (let n = 2; used.has(candidate.toLowerCase()); n += 1) candidate = `${base} (${n})${ext}`;
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
