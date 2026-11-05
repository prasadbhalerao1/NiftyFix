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
import {
  CORE_FILES,
  LANGUAGE_DATA,
  OCR_ASSET_PATHS,
  OCR_LANGUAGE_IDS,
} from '../../packages/engines/ocr/src/assets.ts';
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
 * Serve vendor files (engines, fonts, language data) from the frame's own
 * origin, as the frame CSP allows nothing else: copied into the build, and
 * served straight from node_modules in dev. `files` maps URL paths to files.
 */
function staticAssets(name: string, files: () => Map<string, string>): Plugin {
  return {
    name: `niftyfix-${name}-assets`,
    configureServer(server) {
      const map = files();
      server.middlewares.use((request, response, next) => {
        const path = map.get((request.url ?? '').replace(/^\//, '').split('?')[0] ?? '');
        if (!path || !existsSync(path)) return next();
        if (path.endsWith('.wasm')) response.setHeader('Content-Type', 'application/wasm');
        if (path.endsWith('.js')) response.setHeader('Content-Type', 'text/javascript');
        response.end(readFileSync(path));
      });
    },
    writeBundle(options) {
      for (const [url, file] of files()) {
        const target = resolve(options.dir ?? 'dist', url);
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(file, target);
      }
    },
  };
}

/**
 * pdf.js assets (standard fonts, CMaps, image decoders, ICC profile) under
 * /pdfjs/. The scripting engine (quickjs) is left out: PDF JavaScript is
 * never executed.
 */
function pdfjsFiles(): Map<string, string> {
  const require = createRequire(
    resolve(import.meta.dirname, '../../packages/engines/pdf/package.json'),
  );
  const root = dirname(require.resolve('pdfjs-dist/package.json'));
  const files = new Map<string, string>();
  for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs'])
    for (const file of readdirSync(join(root, dir)))
      if (!file.startsWith('quickjs')) files.set(`pdfjs/${dir}/${file}`, join(root, dir, file));
  return files;
}

/** The OCR engine (tesseract.js worker and WebAssembly builds) and language data. */
function ocrFiles(): Map<string, string> {
  const require = createRequire(
    resolve(import.meta.dirname, '../../packages/engines/ocr/package.json'),
  );
  const tesseract = dirname(require.resolve('tesseract.js/package.json'));
  const core = dirname(
    createRequire(join(tesseract, 'package.json')).resolve('tesseract.js-core/package.json'),
  );
  const files = new Map<string, string>([
    [OCR_ASSET_PATHS.worker, join(tesseract, 'dist', 'worker.min.js')],
  ]);
  for (const file of CORE_FILES) files.set(`${OCR_ASSET_PATHS.core}${file}`, join(core, file));
  for (const language of OCR_LANGUAGE_IDS) {
    const data = dirname(require.resolve(`@tesseract.js-data/${language}/package.json`));
    files.set(
      `${OCR_ASSET_PATHS.lang}${language}.traineddata.gz`,
      join(data, LANGUAGE_DATA, `${language}.traineddata.gz`),
    );
  }
  return files;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
  const siteOrigin = env.PUBLIC_SITE_ORIGIN ?? DEV_SITE_ORIGIN;
  return {
    plugins: [
      preact(),
      tailwindcss(),
      headersFile(siteOrigin),
      staticAssets('pdfjs', pdfjsFiles),
      staticAssets('ocr', ocrFiles),
    ],
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
