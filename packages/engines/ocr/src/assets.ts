/**
 * Where the OCR engine and language data are served from on the tool frame's
 * own origin (the frame may not connect anywhere else). Versioned paths, so
 * browsers and Cloudflare can cache them for good; the frame build copies the
 * files here from node_modules (apps/tool-frame/vite.config.ts).
 */
export const TESSERACT_VERSION = '7.0.0';
/** "best_int": the most accurate models that run in WebAssembly (the float "best" ones do not). */
export const LANGUAGE_DATA = '4.0.0_best_int';

export const OCR_ASSET_PATHS = {
  worker: `ocr/tesseract-${TESSERACT_VERSION}/worker.min.js`,
  core: `ocr/tesseract-${TESSERACT_VERSION}/core/`,
  lang: `ocr/lang-${LANGUAGE_DATA}/`,
} as const;

/** The LSTM-only engine builds; the browser picks one by its WebAssembly features. */
export const CORE_FILES = [
  'tesseract-core-relaxedsimd-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-lstm.wasm.js',
] as const;

export const OCR_LANGUAGES = {
  eng: 'English',
  hin: 'Hindi',
  mar: 'Marathi',
} as const;

export type OcrLanguage = keyof typeof OCR_LANGUAGES;
export const OCR_LANGUAGE_IDS = Object.keys(OCR_LANGUAGES) as OcrLanguage[];
