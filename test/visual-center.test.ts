import { CENTERED, visualCenter } from '../app/utils/visual-center';

// width x height RGBA image, opaque where `on(x, y)` is true.
const image = (w: number, h: number, on: (x: number, y: number) => boolean) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (on(x, y)) data[(y * w + x) * 4 + 3] = 255;
  return data;
};

describe('visualCenter', () => {
  it('centers a symmetric shape in the middle', () => {
    const c = visualCenter(
      image(10, 10, (x) => x >= 2 && x < 8),
      10,
      10
    );
    expect(c.x).toBeCloseTo(0.5);
    expect(c.y).toBeCloseTo(0.5);
    expect(c.spanX).toBeCloseTo(0.6);
    expect(c.spanY).toBeCloseTo(1);
  });

  it('is pulled toward the heavy part and spans the light one', () => {
    // Body: columns 0-5, full height. Lens: columns 6-9, two rows.
    const c = visualCenter(
      image(10, 10, (x, y) => x < 6 || (y >= 4 && y < 6)),
      10,
      10
    );
    expect(c.x).toBeLessThan(0.5);
    expect(c.x).toBeGreaterThan(0.3);
    expect(c.spanX).toBeCloseTo(2 * (1 - c.x));
  });

  it('falls back to the middle for an empty image', () => {
    expect(
      visualCenter(
        image(4, 4, () => false),
        4,
        4
      )
    ).toEqual(CENTERED);
  });
});
