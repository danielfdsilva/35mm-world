/** Maps scroll progress (0..1) to a frame and story line index. */
export function storyIndexes(progress: number, frames: number, lines: number) {
  const p = Math.min(Math.max(progress, 0), 1);
  return {
    frame: Math.min(frames - 1, Math.floor(p * frames)),
    line: Math.min(lines - 1, Math.floor(p * lines))
  };
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/**
 * Splits the scrolled distance of the story section into the intro (camera
 * moves from the hero spot to its side) and the story that follows it.
 * Both values run 0..1.
 */
export function storyProgress(
  scrolled: number,
  scrollable: number,
  introLength: number
) {
  return {
    intro: introLength > 0 ? clamp01(scrolled / introLength) : 1,
    story:
      scrollable > introLength
        ? clamp01((scrolled - introLength) / (scrollable - introLength))
        : 0
  };
}
