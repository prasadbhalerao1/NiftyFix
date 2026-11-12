/**
 * The text files of a favicon package: the web app manifest and the HTML
 * tags to paste into <head>. Pure, so their contents are tested.
 */
export interface BundleOptions {
  name: string;
  themeColor: string;
  backgroundColor: string;
  /** A favicon.svg is included (SVG or text source). */
  svg: boolean;
}

export function webManifest({ name, themeColor, backgroundColor }: BundleOptions): string {
  const icon = (size: number, purpose?: string) => ({
    src: purpose ? `/maskable-${size}x${size}.png` : `/android-chrome-${size}x${size}.png`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    ...(purpose ? { purpose } : {}),
  });
  return JSON.stringify(
    {
      name,
      short_name: name.length > 12 ? name.slice(0, 12).trim() : name,
      icons: [icon(192), icon(512), icon(512, 'maskable')],
      theme_color: themeColor,
      background_color: backgroundColor,
      display: 'standalone',
    },
    null,
    2,
  );
}

export function headTags({ themeColor, svg }: BundleOptions): string {
  return [
    '<link rel="icon" href="/favicon.ico" sizes="48x48">',
    ...(svg ? ['<link rel="icon" href="/favicon.svg" type="image/svg+xml">'] : []),
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    `<meta name="theme-color" content="${themeColor}">`,
  ].join('\n');
}

/** An SVG favicon from text or emoji, so it stays sharp at any size. */
export function textSvg(
  text: string,
  color: string,
  background: string,
  shape: 'square' | 'rounded' | 'circle',
): string {
  const radius = shape === 'circle' ? 50 : shape === 'rounded' ? 18 : 0;
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const size = [...text].length > 2 ? 42 : [...text].length === 2 ? 52 : 68;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
    background === 'transparent'
      ? ''
      : `<rect width="100" height="100" rx="${radius}" fill="${background}"/>`,
    `<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="${size}" fill="${color}">${escaped}</text>`,
    '</svg>',
  ].join('');
}
