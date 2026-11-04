import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
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

/**
 * Serve pdf.js assets (standard fonts, CMaps, image decoders, ICC profile)
 * from the frame's own origin under /pdfjs/, as the frame CSP allows nothing
 * else. Copied into the build; served from node_modules in dev. The scripting
 * engine (quickjs) is left out: PDF JavaScript is never executed.
 */
function pdfjsAssets(): Plugin {
  const require = createRequire(
    resolve(import.meta.dirname, '../../packages/engines/pdf/package.json'),
  );
  const root = dirname(require.resolve('pdfjs-dist/package.json'));
  const dirs = ['cmaps', 'standard_fonts', 'wasm', 'iccs'];
  const include = (name: string): boolean => !name.startsWith('quickjs');
  return {
    name: 'niftyfix-pdfjs-assets',
    configureServer(server) {
      server.middlewares.use('/pdfjs', (request, response, next) => {
        const [dir, file] = (request.url ?? '').replace(/^\//, '').split('?')[0]?.split('/') ?? [];
        if (!dir || !file || !dirs.includes(dir) || !include(file) || file.includes('..'))
          return next();
        const path = join(root, dir, file);
        if (!existsSync(path)) return next();
        if (file.endsWith('.wasm')) response.setHeader('Content-Type', 'application/wasm');
        response.end(readFileSync(path));
      });
    },
    writeBundle(options) {
      for (const dir of dirs) {
        const target = resolve(options.dir ?? 'dist', 'pdfjs', dir);
        mkdirSync(target, { recursive: true });
        for (const file of readdirSync(join(root, dir))) {
          if (include(file)) copyFileSync(join(root, dir, file), join(target, file));
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
  const siteOrigin = env.PUBLIC_SITE_ORIGIN ?? DEV_SITE_ORIGIN;
  return {
    plugins: [preact(), tailwindcss(), headersFile(siteOrigin), pdfjsAssets()],
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
