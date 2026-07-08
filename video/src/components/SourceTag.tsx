import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, type} from '../lib/theme';

// Provenance chip, lower-left: every on-screen statistic wears one for its
// full duration (plan §Design system).
export const SourceTag: React.FC<{text: string; appearFrame?: number; light?: boolean}> = ({
  text,
  appearFrame = 0,
  light = false,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [appearFrame, appearFrame + 12], [0, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        bottom: 48,
        ...type.tag,
        color: light ? C.ink : C.textDim,
        opacity,
      }}
    >
      {text}
    </div>
  );
};
