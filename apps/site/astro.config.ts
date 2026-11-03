import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { siteHeaders, renderHeadersFile } from './src/seo/headers';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const siteOrigin = env.PUBLIC_SITE_ORIGIN ?? 'http://localhost:4321';
const frameOrigin = env.PUBLIC_FRAME_ORIGIN ?? 'http://127.0.0.1:4322';

/**
 * Write Cloudflare `_headers` from the same definition the preview server uses.
 * Not applied to `astro dev`: hot reloading injects inline scripts/styles that a
 * strict CSP blocks. CSP is enforced (and tested) on production builds via preview.
 */
const headersIntegration: AstroIntegration = {
  name: 'niftyfix-headers',
  hooks: {
    'astro:build:done': ({ dir }) => {
      writeFileSync(
        fileURLToPath(new URL('_headers', dir)),
        renderHeadersFile(siteHeaders(frameOrigin)),
      );
    },
  },
};

export default defineConfig({
  site: siteOrigin,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'never' },
  integrations: [headersIntegration],
  vite: {
    plugins: [tailwindcss()],
    // Never inline scripts: the CSP allows only same-origin script files.
    build: { assetsInlineLimit: 0 },
    define: {
      'import.meta.env.PUBLIC_FRAME_ORIGIN': JSON.stringify(frameOrigin),
      'import.meta.env.PUBLIC_SITE_ORIGIN': JSON.stringify(siteOrigin),
    },
    preview: { headers: siteHeaders(frameOrigin) },
  },
});
