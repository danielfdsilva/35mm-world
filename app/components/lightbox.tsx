import { useEffect, useRef, useState } from 'react';
import type { Photo } from '../content';

interface LightboxProps {
  photos: Photo[];
  index: number | null;
  onChange: (index: number | null) => void;
}

const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox='0 0 24 24'
    width='24'
    height='24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d={d} />
  </svg>
);

// Horizontal travel in px that counts as a swipe.
const SWIPE_DISTANCE = 48;

// Native modal <dialog>: focus trap and backdrop come for free.
export default function Lightbox({ photos, index, onChange }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  // Last photo whose full size has loaded. The photo on screen trails `index`
  // until the next one has loaded, so stepping never shows an empty frame.
  // On open nothing has loaded yet: show the wall image, already cached.
  const [loaded, setLoaded] = useState<number | null>(null);
  const shown = loaded ?? index;
  const photo = shown === null ? null : photos[shown];

  useEffect(() => {
    const dialog = ref.current!;
    if (index !== null && !dialog.open) {
      dialog.showModal();
      // Focus the dialog, not the first button, so no ring shows on open.
      dialog.focus();
    }
  }, [index]);

  useEffect(() => {
    if (index === null) {
      setLoaded(null);
      return;
    }
    let current = true;
    const img = new Image();
    img.src = photos[index].full;
    img
      .decode()
      .catch(() => {})
      .then(() => current && setLoaded(index));
    // Load the neighbours too, so the next step is instant.
    [index - 1, index + 1].forEach((i) => {
      new Image().src = photos[(i + photos.length) % photos.length].full;
    });
    return () => {
      current = false;
    };
  }, [index, photos]);

  // Play the exit animation before the dialog leaves the top layer.
  const close = () => {
    const dialog = ref.current!;
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    Promise.all(dialog.getAnimations().map((a) => a.finished))
      .catch(() => {})
      .then(() => {
        dialog.classList.remove('is-closing');
        dialog.close();
      });
  };

  const step = (direction: number) =>
    index !== null &&
    onChange((index + direction + photos.length) % photos.length);

  const info = [photo?.film, photo?.iso && `ISO\u00a0${photo.iso}`, photo?.date]
    .filter(Boolean)
    .join(' · ');

  return (
    <dialog
      ref={ref}
      className='lightbox'
      tabIndex={-1}
      aria-label={photo?.title ?? 'Photo'}
      onClose={() => onChange(null)}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      }}
      // The dialog fills the viewport, so a click on it (not the photo) is a backdrop click.
      onClick={(e) => e.target === e.currentTarget && close()}
      // Swipe left or right to change photo.
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start || e.touches.length) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
          step(dx < 0 ? 1 : -1);
        }
      }}
    >
      {photo && (
        <figure className='lightbox__figure'>
          {/* Keyed so each photo remounts and replays the step fade. */}
          <img
            key={`image-${shown}`}
            className={`lightbox__image${loaded === null ? ' is-preview' : ''}`}
            src={loaded === null ? photo.image : photo.full}
            alt={photo.title ?? ''}
          />
          <figcaption key={`info-${shown}`} className='lightbox__info'>
            <span>{info}</span>
            {/* Padded to the total's digits: 03/29. */}
            <span>
              {String(shown! + 1).padStart(String(photos.length).length, '0')}/
              {photos.length}
            </span>
          </figcaption>
          {photos.length > 1 && (
            <>
              <button
                type='button'
                className='lightbox__band lightbox__prev'
                aria-label='Previous photo'
                onClick={() => step(-1)}
              >
                <Icon d='M15 6l-6 6 6 6' />
              </button>
              <button
                type='button'
                className='lightbox__band lightbox__next'
                aria-label='Next photo'
                onClick={() => step(1)}
              >
                <Icon d='M9 6l6 6-6 6' />
              </button>
            </>
          )}
        </figure>
      )}
      <button
        type='button'
        className='lightbox__button lightbox__close'
        aria-label='Close'
        onClick={close}
      >
        <Icon d='M6 6l12 12M18 6L6 18' />
      </button>
    </dialog>
  );
}
