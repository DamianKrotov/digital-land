import {FPS, HARD_MAX_SEC, HARD_MIN_SEC, SCENES, SceneId} from '../manifest/timing';

export type Mode = 'animatic' | 'final';

export interface SceneSlot {
  id: SceneId;
  from: number;
  durationInFrames: number;
}

export interface Timeline {
  scenes: SceneSlot[];
  totalFrames: number;
  totalSec: number;
}

export const secToFrames = (sec: number): number => Math.round(sec * FPS);

// The ONLY place frame math lives. In final mode, scenes whose VO WAV was
// measurable get (voSec + voTailSec); everything else falls back to targetSec.
export const computeTimeline = (
  mode: Mode,
  voDurations: Partial<Record<SceneId, number>>,
): Timeline => {
  let from = 0;
  const scenes: SceneSlot[] = SCENES.map((s) => {
    const voSec = mode === 'final' ? voDurations[s.id] : undefined;
    const sec = voSec !== undefined ? voSec + s.voTailSec : s.targetSec;
    const slot = {id: s.id, from, durationInFrames: secToFrames(sec)};
    from += slot.durationInFrames;
    return slot;
  });
  return {scenes, totalFrames: from, totalSec: from / FPS};
};

export const assertContestBounds = (t: Timeline): void => {
  if (t.totalSec < HARD_MIN_SEC || t.totalSec > HARD_MAX_SEC) {
    throw new Error(
      `Total runtime ${t.totalSec.toFixed(1)}s violates the 180-300s contest bound (refs/rules.md). ` +
        'Adjust targetSec/VO takes in src/manifest/timing.ts.',
    );
  }
};
