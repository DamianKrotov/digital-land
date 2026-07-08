import {SCENES} from '../manifest/timing';
import {Timeline} from './timeline';

export interface Envelope {
  frames: number[];
  levels: number[];
}

// Piecewise-linear music volume: per-scene duck levels from the manifest,
// 15-frame ramps at scene boundaries, 30-frame fade-in, 60-frame fade-out.
export const buildMusicEnvelope = (t: Timeline): Envelope => {
  const RAMP = 15;
  const frames: number[] = [0];
  const levels: number[] = [0];
  t.scenes.forEach((slot, i) => {
    const level = SCENES[i].musicVolume;
    const start = i === 0 ? 30 : slot.from + RAMP;
    frames.push(start);
    levels.push(level);
    frames.push(slot.from + slot.durationInFrames);
    levels.push(level);
  });
  frames.push(t.totalFrames - 60, t.totalFrames);
  levels.push(levels[levels.length - 1], 0);
  // interpolate() requires strictly monotonic input — nudge duplicates.
  for (let i = 1; i < frames.length; i++) {
    if (frames[i] <= frames[i - 1]) frames[i] = frames[i - 1] + 1;
  }
  return {frames, levels};
};
