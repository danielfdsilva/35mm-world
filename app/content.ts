import type { DriftWallItem } from './components/drift-wall/drift-wall';

export const site = {
  name: import.meta.env.VITE_APP_TITLE,
  tagline: 'Shot on film'
};

// The story, shown one sentence at a time while the camera turns.
export const story = [
  "This was my father's camera.",
  'He used it a lot, until digital took over.',
  'Then it sat in the closet, forgotten.',
  'I decided to dust it off and give it a spin.',
  'You press the shutter and, eventually, see the result.',
  'This is what came back.'
];

export interface Photo extends DriftWallItem {
  /** Large version for the lightbox. */
  full: string;
  film: string;
  iso: number;
  /** Year the roll was shot. */
  date: string;
}

const byName = (files: Record<string, string>) =>
  Object.entries(files).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

export interface CameraFrame {
  /** Tiny blurry image drawn until a full size source loads. */
  placeholder?: string;
  /** Full size sources, smallest width first. */
  sources: { width: number; url: string }[];
}

// Camera frames in app/media/camera, made by scripts/optimize-images.sh:
// <frame>-<width>.webp and <frame>-lqip.webp. They play in frame name order
// over one full turn, starting at cameraStartFrame.
const cameraFrameMap = new Map<string, CameraFrame>();
byName(
  import.meta.glob<string>('./media/camera/*.webp', {
    eager: true,
    import: 'default',
    query: '?url'
  })
).forEach(([path, url]) => {
  const [, name, size] = path.match(/([^/]+)-(\d+|lqip)\.webp$/) ?? [];
  if (!name) return;
  const frame = cameraFrameMap.get(name) ?? { sources: [] };
  cameraFrameMap.set(name, frame);
  if (size === 'lqip') frame.placeholder = url;
  else frame.sources.push({ width: Number(size), url });
});
const cameraFiles = [...cameraFrameMap.values()];

// Frame shown in the hero, where the turn starts (1 = first file by name).
const cameraStartFrame = 27;
const start = (cameraStartFrame - 1) % (cameraFiles.length || 1);
export const cameraFrames: CameraFrame[] = [
  ...cameraFiles.slice(start),
  ...cameraFiles.slice(0, start)
];

// Photos in app/media/photos/<YYYY.MM> - <film> <ISO>/, one folder per roll,
// made by scripts/process-photos.sh: <name>-800.webp for the wall and
// <name>-2048.webp for the lightbox.
const photoMap = new Map<string, Photo>();
byName(
  import.meta.glob<string>('./media/photos/*/*.webp', {
    eager: true,
    import: 'default',
    query: '?url'
  })
).forEach(([path, url]) => {
  const [, roll, year, _, film, iso, name, size] =
    path.match(
      /\/((\d{4})\.(\d{2}) - (.+) (\d+))\/([^/]+)-(800|2048)\.webp$/
    ) ?? [];
  if (!roll) return;
  const key = `${roll}/${name}`;
  const photo = photoMap.get(key) ?? {
    image: '',
    full: '',
    film,
    iso: Number(iso),
    date: year
  };
  photoMap.set(key, photo);
  if (size === '800') photo.image = url;
  else photo.full = url;
});

export const photos: Photo[] = [...photoMap.values()].map((photo, i) => ({
  ...photo,
  title: `Photo ${i + 1}, ${photo.film}, ${photo.date}`
}));
