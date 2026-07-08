import {FPS, SceneSpec} from '../manifest/timing';

export interface SceneProps {
  sceneFrames: number;
  spec: SceneSpec;
}

// Beats are authored in "script seconds" against targetSec; when final-mode VO
// re-times a scene, cues scale proportionally so beats keep tracking the read.
export const useCue = (sceneFrames: number, spec: SceneSpec) => {
  const scale = sceneFrames / (spec.targetSec * FPS);
  return (sec: number): number => Math.round(sec * FPS * scale);
};
