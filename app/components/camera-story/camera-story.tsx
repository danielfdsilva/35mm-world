import { useEffect, useRef, useState } from 'react';
import BlurText from '../blur-text/blur-text';
import LightPillar from '../light-pillar/light-pillar';
import type { CameraFrame } from '../../content';
import { cssVar } from '../../utils/css-var';
import { storyIndexes, storyProgress } from '../../utils/story-indexes';
import { createFramePlayer } from './frame-player';
import './camera-story.css';

interface CameraStoryProps {
  title: string;
  frames: CameraFrame[];
  lines: string[];
  /** Link at the bottom of the hero to jump past the story. */
  skip?: { href: string; label: string };
}

export default function CameraStory({
  title,
  frames,
  lines,
  skip
}: CameraStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // -1 while the hero is shown, before the story starts.
  const [line, setLine] = useState(-1);

  useEffect(() => {
    const section = sectionRef.current!;
    const stage = stageRef.current!;
    const hero = heroRef.current!;
    const canvas = canvasRef.current!;
    const player = createFramePlayer(canvas, frames);
    let raf = 0;

    // Measures how far the camera travels from the hero spot to its place in
    // the layout. offset* values ignore the CSS transform on the canvas.
    const resize = () => {
      const dx =
        hero.offsetLeft +
        hero.offsetWidth / 2 -
        (canvas.offsetLeft + canvas.offsetWidth / 2);
      const dy =
        hero.offsetTop +
        hero.offsetHeight / 2 -
        (canvas.offsetTop + canvas.offsetHeight / 2);
      const heroScale = hero.offsetWidth / canvas.offsetWidth;
      stage.style.setProperty('--camera-dx', `${dx}px`);
      stage.style.setProperty('--camera-dy', `${dy}px`);
      stage.style.setProperty('--camera-scale', String(heroScale));

      // Backing store sized for the biggest (hero) size so it stays sharp.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = dpr * Math.max(1, heroScale);
      canvas.width = canvas.offsetWidth * scale;
      canvas.height = canvas.offsetHeight * scale;
      player.draw();
    };

    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const scrolled = -rect.top;
      const { intro, story } = storyProgress(
        scrolled,
        rect.height - window.innerHeight,
        window.innerHeight / 2
      );
      // A little scroll plays the intro on its own timing (title out, camera
      // to its place); the turn starts once the intro distance is scrolled.
      // Scrolling back to the top plays it in reverse.
      const started = intro > 0.2;
      stage.classList.toggle('is-started', started);
      const idx = storyIndexes(story, frames.length, lines.length);
      player.show(idx.frame);
      setLine(started ? idx.line : -1);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    resize();
    update();

    // After the first resize, so the sources match the canvas size.
    player.loadSources();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      player.destroy();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
    };
  }, [frames, lines.length]);

  return (
    <section ref={sectionRef} className='story' aria-label='Story'>
      <div ref={stageRef} className='story__stage'>
        <LightPillar
          className='story__bg'
          topColor={cssVar('--color-pillar-top')}
          bottomColor={cssVar('--color-pillar-bottom')}
          pillarRotation={33}
          flow={0.85}
          twist={0.35}
          clickPulse={false}
          noiseIntensity={0.3}
          bloom={0.7}
          intensity={0.95}
        />
        <div className='story__hero'>
          <h1 className='story__title'>{title}</h1>
          <div ref={heroRef} className='story__hero-spot' />
          {skip && (
            <a className='story__skip' href={skip.href}>
              {skip.label}
              <span aria-hidden='true'>↓</span>
            </a>
          )}
        </div>
        <div className='story__text'>
          <div className='story__lines'>
            {lines.map((text, i) => (
              <div
                key={text}
                className={`story__line${i === line ? ' is-active' : ''}`}
              >
                {/* Remounts on activation to replay the focus pull. Inactive
                    lines use trigger 'hover' only to render settled text
                    while the wrapper fades out. */}
                <BlurText
                  key={i === line ? 'in' : 'out'}
                  text={text}
                  effect='focus'
                  trigger={i === line ? 'load' : 'hover'}
                  delay={90}
                  stepDuration={0.6}
                  blur={12}
                />
              </div>
            ))}
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className='story__camera'
          role='img'
          aria-label='Analog camera turning as you scroll'
        />
      </div>
    </section>
  );
}
