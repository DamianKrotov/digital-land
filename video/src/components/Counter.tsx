import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {F} from '../lib/theme';

// Number roll-up: eases toward the target over [startFrame, startFrame+durFrames].
// Numbers never just appear (plan §Design system).
export const Counter: React.FC<{
  value: number;
  format: (n: number) => string;
  startFrame: number;
  durFrames?: number;
  style?: React.CSSProperties;
}> = ({value, format, startFrame, durFrames = 45, style}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startFrame, startFrame + durFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - (1 - t) ** 3;
  return (
    <span style={{fontFamily: F.mono, fontVariantNumeric: 'tabular-nums', ...style}}>
      {format(value * eased)}
    </span>
  );
};
