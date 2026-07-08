import React from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS, Caption} from '../manifest/timing';
import {C, F} from '../lib/theme';

// Animatic-only: burns the draft script into the frame so pacing and wording
// can be reviewed on a real render. Never shown in final mode.
export const CaptionCard: React.FC<{captions: Caption[]; light?: boolean}> = ({
  captions,
  light = false,
}) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const current = [...captions].reverse().find((c) => sec >= c.startSec);
  if (!current) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 96,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 1400,
        padding: '18px 32px',
        borderRadius: 8,
        background: light ? 'rgba(26,26,24,0.82)' : 'rgba(14,17,22,0.82)',
        border: `1px solid ${C.grid}`,
        color: C.text,
        fontFamily: F.sans,
        fontSize: 30,
        lineHeight: 1.4,
        textAlign: 'center',
      }}
    >
      {current.text}
    </div>
  );
};
