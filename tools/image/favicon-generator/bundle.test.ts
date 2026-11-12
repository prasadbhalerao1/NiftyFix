import { describe, expect, it } from 'vitest';
import { headTags, textSvg, webManifest } from './bundle';
import { encodeIco, readIcoSizes } from './ico';

describe('encodeIco', () => {
  it('packs PNGs with a directory that reads back', () => {
    const png = (n: number) => Uint8Array.from({ length: n }, (_, i) => i % 256);
    const ico = encodeIco([
      { size: 16, png: png(70) },
      { size: 32, png: png(90) },
      { size: 256, png: png(10) },
    ]);
    expect(readIcoSizes(ico)).toEqual([16, 32, 256]);
    expect(ico.length).toBe(6 + 3 * 16 + 170);
    expect(readIcoSizes(Uint8Array.of(1, 2, 3))).toEqual([]);
  });
});

describe('bundle files', () => {
  const options = {
    name: 'My Bakery Shop',
    themeColor: '#c2410c',
    backgroundColor: '#ffffff',
    svg: true,
  };

  it('writes a web manifest with normal and maskable icons', () => {
    const manifest = JSON.parse(webManifest(options));
    expect(manifest.short_name).toBe('My Bakery Sh');
    expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
      '/android-chrome-192x192.png',
      '/android-chrome-512x512.png',
      '/maskable-512x512.png',
    ]);
    expect(manifest.icons[2].purpose).toBe('maskable');
  });

  it('writes the head tags, with the SVG only when there is one', () => {
    expect(headTags(options)).toContain(
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    );
    expect(headTags({ ...options, svg: false })).not.toContain('favicon.svg');
    expect(headTags(options)).toContain('<meta name="theme-color" content="#c2410c">');
  });

  it('draws text as an escaped SVG', () => {
    const svg = textSvg('A&B', '#fff', '#000', 'circle');
    expect(svg).toContain('A&amp;B');
    expect(svg).toContain('rx="50"');
    expect(textSvg('N', '#fff', 'transparent', 'square')).not.toContain('<rect');
  });
});
