import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS, SceneId} from '../manifest/timing';
import {C, F} from '../lib/theme';

// Animatic-only overlay: scene id + local clock, plus a DRAFT banner while
// refs/video_facts.json is unverified. Neither appears in final mode.
export const SceneHUD: React.FC<{
  id: SceneId;
  title: string;
  factsVerified: boolean;
}> = ({id, title, factsVerified}) => {
  const frame = useCurrentFrame();
  const sec = (frame / FPS).toFixed(1);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 64,
          fontFamily: F.mono,
          fontSize: 22,
          color: C.textDim,
          opacity: 0.8,
        }}
      >
        {id} · {title} · {sec}s
      </div>
      {!factsVerified && (
        <div
          style={{
            position: 'absolute',
            top: 32,
            right: 64,
            fontFamily: F.mono,
            fontSize: 22,
            color: C.risk,
            border: `1px solid ${C.risk}`,
            padding: '4px 12px',
            borderRadius: 4,
            opacity: 0.9,
          }}
        >
          ANIMATIC DRAFT — facts pending verification
        </div>
      )}
    </>
  );
};
