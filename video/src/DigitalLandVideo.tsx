import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import videoData from './data/video_data.json';
import {VideoData} from './data/types';
import {SCENES, SceneId} from './manifest/timing';
import {Mode, Timeline} from './lib/timeline';
import {buildMusicEnvelope} from './lib/audio';
import {C} from './lib/theme';
import {CaptionCard} from './components/CaptionCard';
import {SceneHUD} from './components/SceneHUD';
import {SceneProps} from './scenes/sceneProps';
import {S1ColdOpen} from './scenes/S1ColdOpen';
import {S2Parable} from './scenes/S2Parable';
import {S3BoomMap} from './scenes/S3BoomMap';
import {S4EventStudy} from './scenes/S4EventStudy';
import {S5WhoPays} from './scenes/S5WhoPays';
import {S6Remedy} from './scenes/S6Remedy';
import {S7Credits} from './scenes/S7Credits';

const data = videoData as unknown as VideoData;

export interface VideoProps {
  mode: Mode;
  timeline: Timeline | null; // filled by calculateMetadata
  voAvailable: SceneId[];
  hasMusic: boolean;
  [key: string]: unknown; // Remotion requires index-signature-compatible props
}

export const SCENE_COMPONENTS: Record<SceneId, React.FC<SceneProps>> = {
  S1: S1ColdOpen,
  S2: S2Parable,
  S3: S3BoomMap,
  S4: S4EventStudy,
  S5: S5WhoPays,
  S6: S6Remedy,
  S7: S7Credits,
};

// 12-frame self-managed fade-in per scene (hard cuts + fades; deliberately not
// @remotion/transitions, which would change total duration under the VO math)
const FadeIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

export const DigitalLandVideo: React.FC<VideoProps> = ({mode, timeline, voAvailable, hasMusic}) => {
  if (!timeline) {
    return <AbsoluteFill style={{backgroundColor: C.bg}} />;
  }
  const env = buildMusicEnvelope(timeline);
  // S2 renders on the light savannah background
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {hasMusic && (
        <Audio
          loop
          src={staticFile('audio/music/bed.mp3')}
          volume={(f) =>
            interpolate(f, env.frames, env.levels, {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      )}
      {timeline.scenes.map((slot, i) => {
        const spec = SCENES[i];
        const Scene = SCENE_COMPONENTS[slot.id];
        const light = slot.id === 'S2';
        return (
          <Sequence key={slot.id} from={slot.from} durationInFrames={slot.durationInFrames} name={`${slot.id} ${spec.title}`}>
            <FadeIn>
              <Scene sceneFrames={slot.durationInFrames} spec={spec} />
            </FadeIn>
            {mode === 'final' && voAvailable.includes(slot.id) && (
              <Audio src={staticFile(`audio/vo/${slot.id}.wav`)} />
            )}
            {mode === 'animatic' && (
              <>
                <CaptionCard captions={spec.captions} light={light} />
                <SceneHUD id={slot.id} title={spec.title} factsVerified={data.meta.facts_verified} />
              </>
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
