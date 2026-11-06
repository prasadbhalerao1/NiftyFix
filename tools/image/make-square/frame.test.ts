import { describe, expect, it } from 'vitest';
import { MAX_FRAME_PIXELS, planFrame } from './frame';

describe('planFrame', () => {
  it('pads a landscape photo to a square without cropping it', () => {
    expect(planFrame({ width: 1000, height: 700 }, { shape: 'square', borderPercent: 0 })).toEqual({
      width: 1000,
      height: 1000,
      image: { x: 0, y: 150, width: 1000, height: 700 },
      scale: 1,
    });
  });

  it('adds a border as a share of the longer side, keeping the shape', () => {
    expect(planFrame({ width: 1000, height: 500 }, { shape: 'border', borderPercent: 5 })).toEqual({
      width: 1100,
      height: 600,
      image: { x: 50, y: 50, width: 1000, height: 500 },
      scale: 1,
    });
  });

  it('adds the border around a square too', () => {
    const frame = planFrame({ width: 600, height: 800 }, { shape: 'square', borderPercent: 10 });
    expect(frame).toMatchObject({ width: 960, height: 960 });
    expect(frame.image).toEqual({ x: 180, y: 80, width: 600, height: 800 });
  });

  it('shrinks a huge square so phones can open it', () => {
    const frame = planFrame({ width: 6000, height: 4000 }, { shape: 'square', borderPercent: 0 });
    expect(frame.scale).toBeLessThan(1);
    expect(frame.width * frame.height).toBeLessThanOrEqual(MAX_FRAME_PIXELS * 1.01);
    expect(frame.width).toBe(frame.height);
  });
});
