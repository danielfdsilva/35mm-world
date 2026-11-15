import { storyIndexes, storyProgress } from '../app/utils/story-indexes';

describe('storyIndexes', () => {
  it('maps scroll progress to camera frame and story line', () => {
    expect(storyIndexes(0, 36, 3)).toEqual({ frame: 0, line: 0 });
    expect(storyIndexes(0.5, 36, 3)).toEqual({ frame: 18, line: 1 });
    expect(storyIndexes(1, 36, 3)).toEqual({ frame: 35, line: 2 });
  });

  it('clamps progress outside the section', () => {
    expect(storyIndexes(-0.2, 36, 3)).toEqual({ frame: 0, line: 0 });
    expect(storyIndexes(1.4, 36, 3)).toEqual({ frame: 35, line: 2 });
  });
});

describe('storyProgress', () => {
  it('runs the intro first, then the story', () => {
    expect(storyProgress(0, 1000, 200)).toEqual({ intro: 0, story: 0 });
    expect(storyProgress(100, 1000, 200)).toEqual({ intro: 0.5, story: 0 });
    expect(storyProgress(600, 1000, 200)).toEqual({ intro: 1, story: 0.5 });
    expect(storyProgress(1000, 1000, 200)).toEqual({ intro: 1, story: 1 });
  });

  it('clamps outside the section', () => {
    expect(storyProgress(-50, 1000, 200)).toEqual({ intro: 0, story: 0 });
    expect(storyProgress(1500, 1000, 200)).toEqual({ intro: 1, story: 1 });
  });
});
