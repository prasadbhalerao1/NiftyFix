/**
 * Security headers for the public site. The site may embed only the tool
 * frame origin; nothing may embed the site. When an ad network is approved,
 * its script/frame origins are added here deliberately (and only here).
 */
export function siteHeaders(frameOrigin: string): Record<string, string> {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    // blob: is needed because Firefox checks a download link clicked inside the
    // tool frame (a navigation to the frame's own blob: URL) against this directive.
    `frame-src ${frameOrigin} blob:`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  return {
    'Content-Security-Policy': csp,
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };
}

export function renderHeadersFile(headers: Record<string, string>): string {
  return `/*\n${Object.entries(headers)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join('\n')}\n`;
}
