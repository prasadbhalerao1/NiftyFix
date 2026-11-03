import { describe, expect, it } from 'vitest';
import { solveQualityForRange } from '../src/quality-solver';

/** Simulated encoder: size grows with quality like a typical JPEG curve. */
const curve =
  (base: number, span: number) =>
  async (quality: number): Promise<{ bytes: number; value: number }> => {
    const bytes = Math.round(base + span * quality ** 2);
    return { bytes, value: quality };
  };

describe('solveQualityForRange', () => {
  it('returns the ceiling immediately when it already fits', async () => {
    const result = await solveQualityForRange({
      encode: curve(10_000, 20_000),
      range: { maxBytes: 50_000 },
      qualityFloor: 0.3,
      qualityCeiling: 0.92,
    });
    expect(result.status).toBe('met');
    if (result.status === 'met') expect(result.attempt.quality).toBe(0.92);
    expect(result.attempts).toBe(1);
  });

  it('finds the highest quality under a maximum', async () => {
    const result = await solveQualityForRange({
      encode: curve(10_000, 100_000),
      range: { maxBytes: 50_000 },
      qualityFloor: 0.1,
      qualityCeiling: 1,
    });
    expect(result.status).toBe('met');
    if (result.status !== 'met') return;
    expect(result.attempt.bytes).toBeLessThanOrEqual(50_000);
    // Analytic optimum: sqrt(0.4) ≈ 0.632
    expect(result.attempt.quality).toBeGreaterThan(0.62);
    expect(result.attempt.quality).toBeLessThanOrEqual(0.633);
  });

  it('satisfies a min–max window', async () => {
    const result = await solveQualityForRange({
      encode: curve(5_000, 100_000),
      range: { minBytes: 20_000, maxBytes: 30_000 },
      qualityFloor: 0.05,
      qualityCeiling: 1,
    });
    expect(result.status).toBe('met');
    if (result.status !== 'met') return;
    expect(result.attempt.bytes).toBeGreaterThanOrEqual(20_000);
    expect(result.attempt.bytes).toBeLessThanOrEqual(30_000);
  });

  it('reports too-large when even the floor exceeds the maximum (no silent violation)', async () => {
    const result = await solveQualityForRange({
      encode: curve(80_000, 100_000),
      range: { maxBytes: 50_000 },
      qualityFloor: 0.4,
      qualityCeiling: 1,
    });
    expect(result.status).toBe('too-large');
    if (result.status === 'too-large') expect(result.closest.quality).toBe(0.4);
  });

  it('reports too-small instead of padding when the ceiling is below the minimum', async () => {
    const result = await solveQualityForRange({
      encode: curve(1_000, 5_000),
      range: { minBytes: 20_000 },
      qualityFloor: 0.1,
      qualityCeiling: 1,
    });
    expect(result.status).toBe('too-small');
  });

  it('reports no-fit for a window that falls between quality steps', async () => {
    // Step function: 10 kB below q=0.5, 40 kB at or above.
    const step = async (quality: number) => ({ bytes: quality < 0.5 ? 10_000 : 40_000, value: 0 });
    const result = await solveQualityForRange({
      encode: step,
      range: { minBytes: 20_000, maxBytes: 30_000 },
      qualityFloor: 0.1,
      qualityCeiling: 1,
    });
    expect(result.status).toBe('no-fit');
  });

  it('keeps the best in-range attempt when sizes are not monotonic', async () => {
    const bumpy = async (quality: number) => {
      const bytes = Math.round(
        10_000 + 80_000 * quality + (quality > 0.7 && quality < 0.75 ? -30_000 : 0),
      );
      return { bytes, value: quality };
    };
    const result = await solveQualityForRange({
      encode: bumpy,
      range: { maxBytes: 60_000 },
      qualityFloor: 0.1,
      qualityCeiling: 1,
    });
    expect(result.status).toBe('met');
    if (result.status === 'met') expect(result.attempt.bytes).toBeLessThanOrEqual(60_000);
  });

  it('stops when aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      solveQualityForRange({
        encode: curve(1, 1),
        range: { maxBytes: 10 },
        qualityFloor: 0,
        qualityCeiling: 1,
        signal: controller.signal,
      }),
    ).rejects.toThrow('Cancelled');
  });

  it('rejects invalid quality bounds', async () => {
    await expect(
      solveQualityForRange({
        encode: curve(1, 1),
        range: {},
        qualityFloor: 0.9,
        qualityCeiling: 0.5,
      }),
    ).rejects.toThrow(RangeError);
  });
});
