/**
 * Baseline JPEG encoding of one-channel (gray) pixels in plain JavaScript.
 * Browsers only encode colour JPEGs; a true gray JPEG is about a third
 * smaller and contains no colour at all, which matters for print shops that
 * charge for any colour. Standard IJG quantisation and Huffman tables.
 */

const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20,
  13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52,
  45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63,
];

const LUMINANCE_QUANT = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113,
  92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
];

const DC_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AC_BITS = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
export const AC_VALUES = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
  0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0,
  0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
  0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
  0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
  0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5,
  0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
  0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8,
  0xf9, 0xfa,
];

/** Code and length for each symbol (spec Annex C). */
function huffman(
  bits: readonly number[],
  values: readonly number[],
): Map<number, [number, number]> {
  const table = new Map<number, [number, number]>();
  let code = 0;
  let k = 0;
  for (let length = 1; length <= 16; length += 1) {
    for (let i = 0; i < (bits[length - 1] ?? 0); i += 1) {
      table.set(values[k] ?? 0, [code, length]);
      code += 1;
      k += 1;
    }
    code <<= 1;
  }
  return table;
}
const DC_TABLE = huffman(DC_BITS, DC_VALUES);
const AC_TABLE = huffman(AC_BITS, AC_VALUES);

/** cos((2x + 1) u π / 16), scaled for the orthonormal DCT. */
const COS = Array.from({ length: 64 }, (_, i) => {
  const x = i >> 3;
  const u = i & 7;
  return (u === 0 ? Math.SQRT1_2 : 1) * Math.cos(((2 * x + 1) * u * Math.PI) / 16) * 0.5;
});

class BitWriter {
  private bytes: number[] = [];
  private buffer = 0;
  private count = 0;
  write(code: number, length: number): void {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.buffer = (this.buffer << 1) | ((code >> i) & 1);
      this.count += 1;
      if (this.count === 8) this.flushByte();
    }
  }
  private flushByte(): void {
    this.bytes.push(this.buffer);
    // A 0xFF byte in entropy data is followed by 0x00 so it is not read as a marker.
    if (this.buffer === 0xff) this.bytes.push(0);
    this.buffer = 0;
    this.count = 0;
  }
  finish(): number[] {
    // Pad the last byte with 1 bits.
    while (this.count !== 0) this.write(1, 1);
    return this.bytes;
  }
}

const category = (value: number): number => (value === 0 ? 0 : 32 - Math.clz32(Math.abs(value)));
const amplitude = (value: number, size: number): number =>
  value < 0 ? (value - 1) & ((1 << size) - 1) : value;

export function encodeGrayJpeg(
  gray: Uint8Array,
  width: number,
  height: number,
  quality = 0.9,
): Uint8Array {
  const q = Math.max(1, Math.min(100, Math.round(quality * 100)));
  const scale = q < 50 ? 5000 / q : 200 - 2 * q;
  const quant = LUMINANCE_QUANT.map((t) =>
    Math.max(1, Math.min(255, Math.floor((t * scale + 50) / 100))),
  );

  const writer = new BitWriter();
  const block = new Float64Array(64);
  const rows = new Float64Array(64);
  let previousDc = 0;
  for (let by = 0; by < height; by += 8) {
    for (let bx = 0; bx < width; bx += 8) {
      // Samples, centred on zero; edges repeat the last row and column.
      for (let y = 0; y < 8; y += 1) {
        const sy = Math.min(height - 1, by + y) * width;
        for (let x = 0; x < 8; x += 1) {
          block[y * 8 + x] = (gray[sy + Math.min(width - 1, bx + x)] ?? 0) - 128;
        }
      }
      // Separable 2-D DCT: rows, then columns.
      for (let y = 0; y < 8; y += 1) {
        for (let u = 0; u < 8; u += 1) {
          let sum = 0;
          for (let x = 0; x < 8; x += 1) sum += (block[y * 8 + x] ?? 0) * (COS[x * 8 + u] ?? 0);
          rows[y * 8 + u] = sum;
        }
      }
      const coefficients = new Array<number>(64);
      for (let u = 0; u < 8; u += 1) {
        for (let v = 0; v < 8; v += 1) {
          let sum = 0;
          for (let y = 0; y < 8; y += 1) sum += (rows[y * 8 + u] ?? 0) * (COS[y * 8 + v] ?? 0);
          const natural = v * 8 + u;
          coefficients[natural] = Math.round(sum / (quant[natural] ?? 1));
        }
      }
      const dc = coefficients[0] ?? 0;
      const diff = dc - previousDc;
      previousDc = dc;
      const dcSize = category(diff);
      const [dcCode, dcLength] = DC_TABLE.get(dcSize) ?? [0, 0];
      writer.write(dcCode, dcLength);
      if (dcSize > 0) writer.write(amplitude(diff, dcSize), dcSize);
      let run = 0;
      for (let k = 1; k < 64; k += 1) {
        const value = coefficients[ZIGZAG[k] ?? 0] ?? 0;
        if (value === 0) {
          run += 1;
          continue;
        }
        while (run > 15) {
          const [zrl, zrlLength] = AC_TABLE.get(0xf0) ?? [0, 0];
          writer.write(zrl, zrlLength);
          run -= 16;
        }
        const size = category(value);
        const [code, length] = AC_TABLE.get((run << 4) | size) ?? [0, 0];
        writer.write(code, length);
        writer.write(amplitude(value, size), size);
        run = 0;
      }
      if (run > 0) {
        const [eob, eobLength] = AC_TABLE.get(0) ?? [0, 0];
        writer.write(eob, eobLength);
      }
    }
  }

  const u16 = (n: number): number[] => [(n >> 8) & 0xff, n & 0xff];
  const header = [
    ...[0xff, 0xd8],
    // JFIF APP0, 72 DPI.
    ...[0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0, 72, 0, 72, 0, 0],
    ...[0xff, 0xdb, 0x00, 0x43, 0x00, ...ZIGZAG.map((i) => quant[i] ?? 1)],
    ...[0xff, 0xc0, 0x00, 0x0b, 0x08, ...u16(height), ...u16(width), 0x01, 0x01, 0x11, 0x00],
    ...[0xff, 0xc4, ...u16(2 + 1 + 16 + DC_VALUES.length), 0x00, ...DC_BITS, ...DC_VALUES],
    ...[0xff, 0xc4, ...u16(2 + 1 + 16 + AC_VALUES.length), 0x10, ...AC_BITS, ...AC_VALUES],
    ...[0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00],
  ];
  const data = writer.finish();
  const out = new Uint8Array(header.length + data.length + 2);
  out.set(header, 0);
  out.set(data, header.length);
  out.set([0xff, 0xd9], header.length + data.length);
  return out;
}
