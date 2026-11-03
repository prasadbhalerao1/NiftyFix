/**
 * Security headers for the tool frame origin. Single source of truth used by
 * `vite preview` (tests) and written to dist/_headers (Cloudflare) at build.
 *
 * The frame may only load its own static files and may only connect to itself.
 * Every outbound path is closed explicitly (connect, form, frame, object, base,
 * media, fonts), and only the NiftyFix site may embed it.
 */
export function frameHeaders(siteOrigin: string): Record<string, string> {
  const csp = [
    "default-src 'none'",
    "script-src 'self' 'wasm-unsafe-eval'",
    "worker-src 'self'",
    "connect-src 'self'",
    "img-src 'self' blob: data:",
    "media-src 'self' blob:",
    "style-src 'self'",
    "font-src 'self'",
    "manifest-src 'none'",
    "form-action 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    `frame-ancestors ${siteOrigin}`,
  ].join('; ');
  return {
    'Content-Security-Policy': csp,
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()',
    'X-Robots-Tag': 'noindex, nofollow',
  };
}

export function renderHeadersFile(headers: Record<string, string>): string {
  return `/*\n${Object.entries(headers)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join('\n')}\n`;
}
