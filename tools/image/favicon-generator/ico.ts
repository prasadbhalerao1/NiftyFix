/**
 * ICO files holding PNG images (one per size). Every browser since IE 11
 * reads PNG inside ICO, and PNG keeps the alpha channel exact.
 */
export function encodeIco(images: readonly { size: number; png: Uint8Array }[]): Uint8Array {
  const header = 6;
  const entry = 16;
  let offset = header + entry * images.length;
  const total = offset + images.reduce((sum, image) => sum + image.png.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, images.length, true);
  images.forEach(({ size, png }, i) => {
    const at = header + i * entry;
    // 256 is written as 0.
    out[at] = size >= 256 ? 0 : size;
    out[at + 1] = size >= 256 ? 0 : size;
    view.setUint16(at + 4, 1, true); // colour planes
    view.setUint16(at + 6, 32, true); // bits per pixel
    view.setUint32(at + 8, png.length, true);
    view.setUint32(at + 12, offset, true);
    out.set(png, offset);
    offset += png.length;
  });
  return out;
}

/** The sizes an ICO file holds, read back to verify it. */
export function readIcoSizes(bytes: Uint8Array): number[] {
  if (bytes.length < 6 || bytes[0] !== 0 || bytes[1] !== 0 || bytes[2] !== 1 || bytes[3] !== 0)
    return [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint16(4, true);
  const sizes: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const at = 6 + i * 16;
    if (at + 16 > bytes.length) return [];
    const size = bytes[at] === 0 ? 256 : (bytes[at] ?? 0);
    const length = view.getUint32(at + 8, true);
    const offset = view.getUint32(at + 12, true);
    if (offset + length > bytes.length) return [];
    sizes.push(size);
  }
  return sizes;
}
