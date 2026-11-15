export interface VisualCenter {
  /** Alpha-weighted center, as a fraction of the image width and height. */
  x: number;
  y: number;
  /** Size needed to show every visible pixel around that center, as a
   * fraction of the image width and height. */
  spanX: number;
  spanY: number;
}

export const CENTERED: VisualCenter = { x: 0.5, y: 0.5, spanX: 1, spanY: 1 };

/**
 * Finds where an RGBA image looks centered: the alpha-weighted mean of its
 * pixels. Heavy parts (the camera body) pull harder than thin ones (the
 * lens), so it stays put while the lens swings around.
 */
export function visualCenter(
  data: ArrayLike<number>,
  width: number,
  height: number
): VisualCenter {
  let sum = 0;
  let sx = 0;
  let sy = 0;
  let x0 = width;
  let x1 = 0;
  let y0 = height;
  let y1 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      sum += a;
      sx += a * (x + 0.5);
      sy += a * (y + 0.5);
      // Ignore the faint alpha noise of lossy edges for the extent.
      if (a > 32) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x + 1);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y + 1);
      }
    }
  }
  if (!sum || x1 <= x0) return CENTERED;
  const cx = sx / sum / width;
  const cy = sy / sum / height;
  return {
    x: cx,
    y: cy,
    spanX: 2 * Math.max(cx - x0 / width, x1 / width - cx),
    spanY: 2 * Math.max(cy - y0 / height, y1 / height - cy)
  };
}
