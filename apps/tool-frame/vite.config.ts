import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { frameHeaders, renderHeadersFile } from './src/security/headers.ts';

const DEV_SITE_ORIGIN = 'http://localhost:4321';

/** Emit Cloudflare `_headers` from the same definition used by `vite preview`. */
function headersFile(siteOrigin: string): Plugin {
  return {
    name: 'niftyfix-frame-headers',
    apply: 'build',
    writeBundle(options) {
      writeFileSync(
        resolve(options.dir ?? 'dist', '_headers'),
        renderHeadersFile(frameHeaders(siteOrigin)),
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
  const siteOrigin = env.PUBLIC_SITE_ORIGIN ?? DEV_SITE_ORIGIN;
  return {
    plugins: [preact(), tailwindcss(), headersFile(siteOrigin)],
    envPrefix: 'PUBLIC_',
    define: { 'import.meta.env.PUBLIC_SITE_ORIGIN': JSON.stringify(siteOrigin) },
    // `manifest` maps each tool's source files to emitted chunks for per-tool budget checks.
    build: {
      target: 'es2022',
      sourcemap: true,
      manifest: true,
      modulePreload: { polyfill: false },
    },
    worker: { format: 'es' },
    server: { host: '127.0.0.1', port: 4322, strictPort: true },
    preview: { host: '127.0.0.1', port: 4322, strictPort: true, headers: frameHeaders(siteOrigin) },
  };
});
