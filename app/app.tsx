import { useEffect, useState } from 'react';
import CameraStory from './components/camera-story/camera-story';
import DriftWall from './components/drift-wall/drift-wall';
import Lightbox from './components/lightbox';
import { cameraFrames, photos, site, story } from './content';
import { cssVar } from './utils/css-var';
import './app.css';

const ratio = 10 / 15;
const gap = 32;

// Columns that fit across the screen. A few more are drawn because the wall
// is tilted, so its corners stay filled.
const visibleColumns = (width: number) =>
  width < 600 ? 2 : width < 1000 ? 3 : width < 1800 ? 4 : 5;
const EXTRA_COLUMNS = 2;

const useWindowWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
};

export default function App() {
  const [open, setOpen] = useState<number | null>(null);

  const width = useWindowWidth();
  const columns = visibleColumns(width);
  // Rounded to the 4px grid.
  const tileW = Math.round((width / columns - gap) / 4) * 4;

  return (
    <>
      <main>
        <CameraStory
          title={site.name}
          frames={cameraFrames}
          lines={story}
          skip={{ href: '#photos', label: 'Skip to photos' }}
        />
        <section id='photos' className='wall' aria-label='Photographs'>
          <DriftWall
            items={photos}
            columns={columns + EXTRA_COLUMNS}
            gap={gap}
            tileWidth={tileW}
            tileHeight={Math.round((tileW * ratio) / 4) * 4}
            overlayColor={cssVar('--color-bg')}
            onItemClick={(item) => setOpen(photos.findIndex((p) => p === item))}
          />
        </section>
        <Lightbox photos={photos} index={open} onChange={setOpen} />
      </main>
      <footer className='footer'>
        <span className='author'>
          © {new Date().getFullYear()} • A project by{' '}
          <a href='https://danielfdsilva.com/'>Daniel da Silva</a>
        </span>
        <span className='site'>
          {site.name} • {site.tagline}
        </span>
      </footer>
    </>
  );
}
