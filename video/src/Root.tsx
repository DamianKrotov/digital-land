import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import './lib/fonts';
import videoData from './data/video_data.json';
import {VideoData} from './data/types';
import {DigitalLandVideo, SCENE_COMPONENTS, VideoProps} from './DigitalLandVideo';
import {FPS, SCENES, SceneId} from './manifest/timing';
import {assertContestBounds, computeTimeline, secToFrames} from './lib/timeline';
import {SceneProps} from './scenes/sceneProps';

const data = videoData as unknown as VideoData;

const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({props}) => {
  // Facts gate (mirrors refs/mc_params.json): a final render refuses to build
  // until the owner flips refs/video_facts.json verified:true and rebakes.
  if (props.mode === 'final' && !data.meta.facts_verified) {
    throw new Error(
      'refs/video_facts.json is unverified — final render refused. ' +
        'Check each value against refs/sources.md, set verified:true, run `make bake-video`.',
    );
  }
  const vo: Partial<Record<SceneId, number>> = {};
  const voAvailable: SceneId[] = [];
  if (props.mode === 'final') {
    for (const s of SCENES) {
      try {
        vo[s.id] = await getAudioDurationInSeconds(staticFile(`audio/vo/${s.id}.wav`));
        voAvailable.push(s.id);
      } catch {
        console.warn(`[vo] ${s.id}.wav missing/undecodable -> falling back to targetSec=${s.targetSec}s`);
      }
    }
  }
  let hasMusic = false;
  try {
    await getAudioDurationInSeconds(staticFile('audio/music/bed.mp3'));
    hasMusic = true;
  } catch {
    console.warn('[music] bed.mp3 not found -> rendering without music');
  }
  const timeline = computeTimeline(props.mode, vo);
  assertContestBounds(timeline);
  return {
    durationInFrames: timeline.totalFrames,
    fps: FPS,
    props: {...props, timeline, voAvailable, hasMusic},
  };
};

// Per-scene thumbnail compositions: render QC frames with
//   npx remotion still thumb-S3 out/stills/S3.png --frame=<n>
const Thumb: React.FC<{id: SceneId} & Record<string, unknown>> = ({id}) => {
  const spec = SCENES.find((s) => s.id === id)!;
  const Component = SCENE_COMPONENTS[id];
  return <Component sceneFrames={secToFrames(spec.targetSec)} spec={spec} />;
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DigitalLand"
        component={DigitalLandVideo}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={secToFrames(280)} // overridden by calculateMetadata
        defaultProps={{mode: 'animatic' as const, timeline: null, voAvailable: [], hasMusic: false}}
        calculateMetadata={calculateMetadata}
      />
      {SCENES.map((s) => (
        <Composition
          key={s.id}
          id={`thumb-${s.id}`}
          component={Thumb}
          width={1920}
          height={1080}
          fps={FPS}
          durationInFrames={secToFrames(s.targetSec)}
          defaultProps={{id: s.id}}
        />
      ))}
    </>
  );
};
