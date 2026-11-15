import type { CameraFrame } from '../../content';
import {
  CENTERED,
  visualCenter,
  type VisualCenter
} from '../../utils/visual-center';

const usable = (img?: HTMLImageElement) =>
  img?.complete && img.naturalWidth ? img : undefined;

const measure = (img: HTMLImageElement) => {
  const { naturalWidth: w, naturalHeight: h } = img;
  const ctx = document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true })!;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  ctx.drawImage(img, 0, 0);
  return visualCenter(ctx.getImageData(0, 0, w, h).data, w, h);
};

/**
 * Loads the camera frames and draws one at a time on a canvas. Drawing on a
 * canvas avoids the decode flicker of swapping an <img> src. Until a full
 * frame loads, its blurry placeholder stands in.
 */
export function createFramePlayer(
  canvas: HTMLCanvasElement,
  frames: CameraFrame[]
) {
  const ctx = canvas.getContext('2d')!;
  const images: HTMLImageElement[] = [];
  let current = 0;
  let cancelled = false;

  const load = (src: string, i: number, priority: 'high' | 'low') => {
    const img = new Image();
    img.fetchPriority = priority;
    img.src = src;
    // Decode off the main thread so drawing it while scrolling is cheap.
    const ready = img.decode().then(
      () => !cancelled && i === current && draw(),
      () => undefined
    );
    return { img, ready };
  };

  const placeholders = frames.map((f, i) =>
    f.placeholder ? load(f.placeholder, i, 'high') : undefined
  );

  // The lens swings around as the camera turns, so each frame is drawn with
  // its visual center (measured on the small placeholder) in the middle.
  // One shared span for all frames keeps the size steady and nothing clipped.
  let centers: VisualCenter[] = [];
  let spanX = 1;
  let spanY = 1;
  Promise.all(placeholders.map((p) => p?.ready)).then(() => {
    if (cancelled) return;
    centers = placeholders.map((p) =>
      p && usable(p.img) ? measure(p.img) : CENTERED
    );
    spanX = Math.max(...centers.map((c) => c.spanX));
    spanY = Math.max(...centers.map((c) => c.spanY));
    draw();
  });

  const draw = () => {
    const img = usable(images[current]) ?? usable(placeholders[current]?.img);
    // Wait for the centers so the first frame doesn't jump into place.
    if (!img || !centers.length) return;
    const { width, height } = canvas;
    const scale = Math.min(
      width / (img.naturalWidth * spanX),
      height / (img.naturalHeight * spanY)
    );
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const center = centers[current];
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      img,
      width / 2 - center.x * w,
      height / 2 - center.y * h,
      w,
      h
    );
  };

  return {
    /** Redraws the current frame, e.g. after the canvas was resized. */
    draw,

    /** Shows frame `i`. */
    show(i: number) {
      if (i === current) return;
      current = i;
      draw();
    },

    /**
     * Loads the full size frames, picking the smallest source that covers the
     * canvas as it is now. Frame 0 (the hero) goes first so it is sharp as
     * soon as possible on slow networks, then the rest in the order they turn.
     * shortcut: the size is picked once, a bigger window later keeps it.
     */
    loadSources() {
      const pick = (f: CameraFrame) =>
        (f.sources.find((s) => s.width >= canvas.width) ?? f.sources.at(-1))!
          .url;
      const first = load(pick(frames[0]), 0, 'high');
      images[0] = first.img;
      first.ready.then(() => {
        frames.forEach((f, i) => {
          if (i > 0 && !cancelled) images[i] = load(pick(f), i, 'low').img;
        });
      });
    },

    destroy() {
      cancelled = true;
    }
  };
}
