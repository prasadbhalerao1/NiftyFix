/**
 * Generate the image test corpus. Every fixture is synthesised here, so the
 * corpus has no licensing or privacy concerns and can be regenerated.
 * Usage: pnpm fixtures   (requires Playwright Chromium)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { ROOT } from './lib/tools';

const OUT = join(ROOT, 'fixtures', 'images');
const MALICIOUS = join(ROOT, 'fixtures', 'malicious');
mkdirSync(OUT, { recursive: true });
mkdirSync(MALICIOUS, { recursive: true });

/** Draw a deterministic photo-like scene (gradients, shapes, mild noise) and encode it in the browser. */
async function render(
  width: number,
  height: number,
  type: string,
  quality: number,
  transparent = false,
): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // tsx (esbuild keepNames) wraps named functions in __name(); provide it in the page.
    await page.evaluate('globalThis.__name = (fn) => fn');
    const base64 = await page.evaluate(
      async ({ width, height, type, quality, transparent }) => {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no 2d context');
        if (!transparent) {
          const sky = ctx.createLinearGradient(0, 0, 0, height);
          sky.addColorStop(0, '#8ec5e8');
          sky.addColorStop(1, '#f2e6d0');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, width, height);
        }
        // "Head and shoulders" shapes so crops look like portraits.
        ctx.fillStyle = '#c68e6d';
        ctx.beginPath();
        ctx.ellipse(width / 2, height * 0.38, width * 0.18, height * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2f4a6d';
        ctx.beginPath();
        ctx.ellipse(width / 2, height * 0.95, width * 0.4, height * 0.33, 0, 0, Math.PI * 2);
        ctx.fill();
        // Deterministic texture so JPEG sizes behave like real photos.
        let seed = 1234567;
        const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
        for (let i = 0; i < (width * height) / 40; i += 1) {
          ctx.fillStyle = `rgba(${Math.floor(rand() * 255)},${Math.floor(rand() * 255)},${Math.floor(rand() * 255)},0.18)`;
          ctx.fillRect(rand() * width, rand() * height, 2 + rand() * 4, 2 + rand() * 4);
        }
        const blob = await canvas.convertToBlob({ type, quality });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary);
      },
      { width, height, type, quality, transparent },
    );
    return Buffer.from(base64, 'base64');
  } finally {
    await browser.close();
  }
}

/** Insert an EXIF APP1 segment carrying only an Orientation tag, after the JFIF APP0. */
function withExifOrientation(jpeg: Buffer, orientation: number): Buffer {
  const tiff = Buffer.from([
    0x4d,
    0x4d,
    0x00,
    0x2a,
    0x00,
    0x00,
    0x00,
    0x08, // big-endian TIFF header, IFD0 at offset 8
    0x00,
    0x01, // one entry
    0x01,
    0x12,
    0x00,
    0x03,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    orientation,
    0x00,
    0x00, // Orientation SHORT
    0x00,
    0x00,
    0x00,
    0x00, // no next IFD
  ]);
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const length = payload.length + 2;
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, length >> 8, length & 0xff]), payload]);
  const app0Length = jpeg.readUInt16BE(4);
  const insertAt = 4 + app0Length; // SOI (2) + APP0 marker (2) + APP0 length
  return Buffer.concat([jpeg.subarray(0, insertAt), app1, jpeg.subarray(insertAt)]);
}

const portrait = await render(1200, 1600, 'image/jpeg', 0.9);
writeFileSync(join(OUT, 'portrait-1200x1600.jpg'), portrait);
writeFileSync(join(OUT, 'large-4000x3000.jpg'), await render(4000, 3000, 'image/jpeg', 0.92));
writeFileSync(join(OUT, 'transparent-800x800.png'), await render(800, 800, 'image/png', 1, true));
writeFileSync(
  join(OUT, 'landscape-webp-1000x700.webp'),
  await render(1000, 700, 'image/webp', 0.85),
);
// Stored 1600×1200 with orientation 6 (rotate 90° CW): must display as 1200×1600.
writeFileSync(
  join(OUT, 'exif-rotated-6.jpg'),
  withExifOrientation(await render(1600, 1200, 'image/jpeg', 0.9), 6),
);
// A PNG renamed .jpg: valid input, extension mismatch must be reported, not rejected.
writeFileSync(join(OUT, 'png-named.jpg'), await render(600, 600, 'image/png', 1));

// Malformed / hostile inputs.
writeFileSync(join(MALICIOUS, 'truncated.jpg'), portrait.subarray(0, 600));
writeFileSync(
  join(MALICIOUS, 'random-bytes.jpg'),
  Buffer.from(Array.from({ length: 2048 }, (_, i) => (i * 7919) % 251)),
);
writeFileSync(
  join(MALICIOUS, 'pdf-disguised.jpg'),
  Buffer.from('%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n'),
);
const bomb = Buffer.alloc(33);
Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bomb, 0);
bomb.writeUInt32BE(13, 8);
bomb.write('IHDR', 12, 'latin1');
bomb.writeUInt32BE(30000, 16);
bomb.writeUInt32BE(30000, 20);
bomb.set([8, 6, 0, 0, 0], 24);
writeFileSync(join(MALICIOUS, 'png-bomb-30000x30000.png'), bomb);
const heic = Buffer.alloc(64);
heic.writeUInt32BE(24, 0);
heic.write('ftypheic', 4, 'latin1');
writeFileSync(join(MALICIOUS, 'iphone.heic'), heic);
writeFileSync(join(MALICIOUS, 'empty.jpg'), Buffer.alloc(0));

// ---------------------------------------------------------------------------
// Signatures: one cursive path drawn on different papers, inks and lighting.
// ---------------------------------------------------------------------------
const SIGNATURES = join(ROOT, 'fixtures', 'signatures');
mkdirSync(SIGNATURES, { recursive: true });

interface SignatureVariant {
  name: string;
  width: number;
  height: number;
  type: 'image/jpeg' | 'image/png';
  quality: number;
  /** 'white' | 'grey' | 'gradient' | 'shadow' | 'none' (transparent) */
  paper: 'white' | 'grey' | 'gradient' | 'shadow' | 'none';
  ink: string;
  stroke: number;
  noise: number;
}

async function renderSignature(variant: SignatureVariant): Promise<Buffer> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.evaluate('globalThis.__name = (fn) => fn');
    const base64 = await page.evaluate(async (v: SignatureVariant) => {
      const canvas = new OffscreenCanvas(v.width, v.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      const { width: w, height: h } = v;
      if (v.paper === 'white') ctx.fillStyle = '#f7f6f2';
      if (v.paper === 'grey') ctx.fillStyle = '#bdbab3';
      if (v.paper === 'gradient') {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#f5f3ee');
        g.addColorStop(1, '#8f8c86');
        ctx.fillStyle = g;
      }
      if (v.paper !== 'none') ctx.fillRect(0, 0, w, h);
      if (v.paper === 'shadow') {
        ctx.fillStyle = '#f6f5f1';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(40, 38, 35, 0.45)';
        ctx.beginPath();
        ctx.moveTo(w * 0.55, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, h);
        ctx.lineTo(w * 0.35, h);
        ctx.closePath();
        ctx.fill();
      }
      // Cursive-like signature centred with generous margins (to exercise auto-crop).
      const sx = (x: number): number => w * (0.2 + 0.6 * x);
      const sy = (y: number): number => h * (0.3 + 0.4 * y);
      ctx.strokeStyle = v.ink;
      ctx.lineWidth = v.stroke;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(0.8));
      ctx.bezierCurveTo(sx(0.05), sy(-0.2), sx(0.15), sy(-0.2), sx(0.12), sy(0.9));
      ctx.bezierCurveTo(sx(0.2), sy(0.2), sx(0.3), sy(0.2), sx(0.32), sy(0.8));
      ctx.bezierCurveTo(sx(0.4), sy(0.1), sx(0.5), sy(1.1), sx(0.58), sy(0.4));
      ctx.bezierCurveTo(sx(0.66), sy(-0.1), sx(0.76), sy(1.0), sx(0.84), sy(0.5));
      ctx.bezierCurveTo(sx(0.9), sy(0.2), sx(0.95), sy(0.6), sx(1), sy(0.55));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx(0.05), sy(1.05));
      ctx.lineTo(sx(0.95), sy(0.95));
      ctx.stroke();
      if (v.noise > 0) {
        let seed = 99;
        const rand = (): number => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
        const img = ctx.getImageData(0, 0, w, h);
        for (let i = 0; i < img.data.length; i += 4) {
          const n = (rand() * 2 - 1) * v.noise;
          for (let c = i; c < i + 3; c += 1) img.data[c] = (img.data[c] ?? 0) + n;
        }
        ctx.putImageData(img, 0, 0);
      }
      const blob = await canvas.convertToBlob({ type: v.type, quality: v.quality });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    }, variant);
    return Buffer.from(base64, 'base64');
  } finally {
    await browser.close();
  }
}

const BLACK = '#15151c';
const SIGNATURE_VARIANTS: SignatureVariant[] = [
  {
    name: 'white-black.jpg',
    width: 1600,
    height: 700,
    type: 'image/jpeg',
    quality: 0.9,
    paper: 'white',
    ink: BLACK,
    stroke: 7,
    noise: 0,
  },
  {
    name: 'blue-ink.jpg',
    width: 1600,
    height: 700,
    type: 'image/jpeg',
    quality: 0.9,
    paper: 'white',
    ink: '#1d2f9c',
    stroke: 7,
    noise: 0,
  },
  {
    name: 'thin-pen.jpg',
    width: 1600,
    height: 700,
    type: 'image/jpeg',
    quality: 0.9,
    paper: 'white',
    ink: BLACK,
    stroke: 2,
    noise: 0,
  },
  {
    name: 'thick-marker.jpg',
    width: 1600,
    height: 700,
    type: 'image/jpeg',
    quality: 0.9,
    paper: 'white',
    ink: BLACK,
    stroke: 22,
    noise: 0,
  },
  {
    name: 'uneven-lighting.jpg',
    width: 1600,
    height: 700,
    type: 'image/jpeg',
    quality: 0.9,
    paper: 'gradient',
    ink: BLACK,
    stroke: 6,
    noise: 0,
  },
  {
    name: 'hand-shadow.jpg',
    width: 1600,
    height: 700,
    type: 'image/jpeg',
    quality: 0.9,
    paper: 'shadow',
    ink: BLACK,
    stroke: 6,
    noise: 0,
  },
  {
    name: 'grey-paper.jpg',
    width: 1600,
    height: 700,
    type: 'image/jpeg',
    quality: 0.9,
    paper: 'grey',
    ink: BLACK,
    stroke: 6,
    noise: 0,
  },
  {
    name: 'jpeg-noise.jpg',
    width: 1600,
    height: 700,
    type: 'image/jpeg',
    quality: 0.3,
    paper: 'white',
    ink: BLACK,
    stroke: 6,
    noise: 18,
  },
  {
    name: 'low-res.jpg',
    width: 240,
    height: 100,
    type: 'image/jpeg',
    quality: 0.8,
    paper: 'white',
    ink: BLACK,
    stroke: 2,
    noise: 0,
  },
  {
    name: 'transparent.png',
    width: 1200,
    height: 500,
    type: 'image/png',
    quality: 1,
    paper: 'none',
    ink: BLACK,
    stroke: 5,
    noise: 0,
  },
];
for (const variant of SIGNATURE_VARIANTS) {
  writeFileSync(join(SIGNATURES, variant.name), await renderSignature(variant));
}

console.log('Fixtures written to fixtures/images, fixtures/malicious and fixtures/signatures');
