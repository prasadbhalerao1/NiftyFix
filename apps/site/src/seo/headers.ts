/**
 * Security headers for the public site. The site may embed only the tool
 * frame origin; nothing may embed the site. When an ad network is approved,
 * its script/frame origins are added here deliberately (and only here).
 */
export function siteHeaders(frameOrigin: string): Record<string, string> {
  const csp = [
    "default-src 'self'",
    // Google Tag Manager / Analytics and Cloudflare Web Analytics on the outer page only
    // (the tool frame stays closed).
    "script-src 'self' https://www.googletagmanager.com https://static.cloudflareinsights.com",
    "style-src 'self'",
    "img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com",
    "font-src 'self'",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://cloudflareinsights.com",
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
    // Ignored over plain HTTP (local preview); every niftyfix.in host is HTTPS.
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };
}

/** Hashed build files never change, so browsers and Cloudflare may keep them for a year. */
const IMMUTABLE = 'public, max-age=31536000, immutable';
/** The search index changes only on deploy: reuse it for an hour, refresh in the background for a day. */
const SEARCH_INDEX = 'public, max-age=3600, stale-while-revalidate=86400';

export function renderHeadersFile(headers: Record<string, string>): string {
  return `/*\n${Object.entries(headers)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join(
      '\n',
    )}\n\n/_astro/*\n  Cache-Control: ${IMMUTABLE}\n\n/search.json\n  Cache-Control: ${SEARCH_INDEX}\n`;
}
