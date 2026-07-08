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
  const panelAIn = interpolate(frame, [cue(14), cue(14) + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const panelBIn = interpolate(frame, [cue(18.5), cue(18.5) + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const panelDraw = interpolate(frame, [cue(14) + 8, cue(19)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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

  // mini-panel: how land value capture behaves in the two futures
  const panel = (
    x: number,
    inT: number,
    title: string,
    sub: string,
    rising: boolean,
  ) => (
    <g transform={`translate(${x} 645)`} opacity={inT}>
      <rect x={0} y={0} width={660} height={190} rx={10} fill="rgba(21,26,33,0.9)" stroke={C.grid} strokeWidth={1.5} />
      {rising ? (
        <>
          {/* site value rises -> the shaded lift is what the public captures */}
          <path
            d={`M 40 150 L ${40 + 260 * panelDraw} ${150 - 80 * panelDraw} L ${40 + 260 * panelDraw} 150 Z`}
            fill={C.land}
            opacity={0.35}
          />
          <path d={`M 40 150 L ${40 + 260 * panelDraw} ${150 - 80 * panelDraw}`} stroke={C.land} strokeWidth={4} fill="none" />
          {panelDraw > 0.9 && (
            <text x={315} y={96} fill={C.land} fontFamily={type.tag.fontFamily} fontSize={21}>
              ← the lift → public revenue
            </text>
          )}
        </>
      ) : (
        <>
          <path d={`M 40 120 L ${40 + 260 * panelDraw} 120`} stroke={C.textDim} strokeWidth={4} fill="none" strokeDasharray="6 8" />
          {panelDraw > 0.9 && (
            <text x={315} y={126} fill={C.textDim} fontFamily={type.tag.fontFamily} fontSize={21}>
              nothing to tax — no bailout
            </text>
          )}
        </>
      )}
      <text x={40} y={40} fill={C.text} fontFamily={type.label.fontFamily} fontSize={24}>
        {title}
      </text>
      <text x={40} y={178} fill={C.textDim} fontFamily={type.tag.fontFamily} fontSize={19}>
        {sub}
      </text>
    </g>
  );

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {panel(240, panelAIn, 'if the boom is real: site value rises', 'a land value tax collects that lift for the public', true)}
        {panel(990, panelBIn, 'if it never materializes: value stays flat', 'no phantom tax base, no stranded-cost bailout', false)}
      </svg>
      <div style={{position: 'absolute', top: 140, left: 240, opacity: cardIn, transform: `scale(${zoom})`}}>
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
          bottom: 110,
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
