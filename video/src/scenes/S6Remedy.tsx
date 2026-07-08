import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import videoData from '../data/video_data.json';
import {VideoData} from '../data/types';
import {C, type} from '../lib/theme';
import {fmtUSD} from '../lib/format';
import {SourceTag} from '../components/SourceTag';
import {SceneProps, useCue} from './sceneProps';

const data = videoData as unknown as VideoData;

const Seal: React.FC<{
  text: string;
  color: string;
  inT: number;
  struck: boolean;
}> = ({text, color, inT, struck}) => (
  <div
    style={{
      display: 'inline-block',
      transform: `rotate(-6deg) scale(${2 - inT})`,
      opacity: inT * (struck ? 0.45 : 1),
      border: `4px solid ${color}`,
      borderRadius: 8,
      padding: '6px 22px',
      ...type.label,
      fontSize: 40,
      fontWeight: 500,
      color,
      position: 'relative',
    }}
  >
    {text}
    {struck && (
      <div
        style={{
          position: 'absolute',
          left: -8,
          right: -8,
          top: '50%',
          height: 5,
          background: C.risk,
          transform: 'rotate(-4deg)',
        }}
      />
    )}
  </div>
);

export const S6Remedy: React.FC<SceneProps> = ({sceneFrames, spec}) => {
  const frame = useCurrentFrame();
  const cue = useCue(sceneFrames, spec);

  const cardIn = interpolate(frame, [cue(0.5), cue(0.5) + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const exemptIn = interpolate(frame, [cue(3), cue(3) + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const taxIn = interpolate(frame, [cue(9), cue(9) + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const struck = frame >= cue(23.5);
  const swapIn = interpolate(frame, [cue(23.5), cue(23.5) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lineY = interpolate(frame, [cue(14), cue(20)], [860, 500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const questionIn = interpolate(frame, [cue(29), cue(29) + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const zoom = interpolate(frame, [cue(29), sceneFrames], [1, 0.97], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const row = (
    label: string,
    value: number,
    color: string,
    seal: React.ReactNode,
  ) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 60, marginBottom: 48}}>
      <div style={{width: 900}}>
        <div style={{...type.hero, fontSize: 72, color}}>{fmtUSD(value)}</div>
        <div style={{...type.label, color: C.textDim, marginTop: 6}}>{label}</div>
      </div>
      {seal}
    </div>
  );

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {/* the land line, rising */}
      <div
        style={{
          position: 'absolute',
          top: lineY,
          left: 64,
          height: 3,
          width: 1792,
          background: C.land,
          opacity: 0.5,
          boxShadow: `0 0 24px 2px ${C.land}`,
        }}
      />
      <div style={{position: 'absolute', top: 200, left: 240, opacity: cardIn, transform: `scale(${zoom})`}}>
        {row(
          'the servers — capital, human effort',
          (data.facts.equipment_usd_bn.value as number) * 1e9,
          C.capital,
          <Seal text="EXEMPT" color={C.capital} inT={exemptIn} struck={struck} />,
        )}
        {row(
          'the land — value the community creates',
          (data.facts.land_usd_m.value as number) * 1e6,
          C.land,
          <Seal text="TAX" color={C.land} inT={taxIn} struck={struck} />,
        )}
        {swapIn > 0 && (
          <div style={{...type.label, fontSize: 30, color: C.risk, opacity: swapIn, marginTop: 8}}>
            what Georgia built instead: tax neither — exempt the capital, let the land ride, backstop the risk
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          left: 240,
          width: 1440,
          ...type.h1,
          fontSize: 58,
          color: C.text,
          opacity: questionIn,
        }}
      >
        Who should get paid for what <span style={{color: C.land}}>everyone</span> builds together?
      </div>
      <SourceTag text="remedy: land value taxation — George (1879); Plassmann & Tideman (2000)" appearFrame={cue(9)} />
    </AbsoluteFill>
  );
};
