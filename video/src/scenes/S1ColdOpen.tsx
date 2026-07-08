import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import videoData from '../data/video_data.json';
import {VideoData} from '../data/types';
import {C, type} from '../lib/theme';
import {fmtUSD} from '../lib/format';
import {Counter} from '../components/Counter';
import {SourceTag} from '../components/SourceTag';
import {SceneProps, useCue} from './sceneProps';

const data = videoData as unknown as VideoData;

export const S1ColdOpen: React.FC<SceneProps> = ({sceneFrames, spec}) => {
  const frame = useCurrentFrame();
  const cue = useCue(sceneFrames, spec);

  const equipment = (data.facts.equipment_usd_bn.value as number) * 1e9;
  const land = (data.facts.land_usd_m.value as number) * 1e6;

  // the "land line" — born here, persists as the film's through-line
  const lineW = interpolate(frame, [0, 40], [0, 1792], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // ghost-white flash on the exempt number ("guess which one")
  const flash = interpolate(
    frame,
    [cue(14), cue(14) + 8, cue(14) + 30],
    [0, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const taglineIn = interpolate(frame, [cue(19.5), cue(19.5) + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "this one" callout on the exempt number, then the disparity bars
  const calloutIn = interpolate(frame, [cue(14), cue(14) + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const barsIn = interpolate(frame, [cue(15.5), cue(17.5)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const BAR_MAX = 520; // px for the larger value; the land bar scales truly
  const landBarW = Math.max(3, BAR_MAX * (land / equipment) * barsIn);

  const row = (
    label: string,
    value: number,
    color: string,
    startSec: number,
    extraStyle?: React.CSSProperties,
  ) => (
    <div style={{opacity: frame >= cue(startSec) ? 1 : 0, marginBottom: 56}}>
      <div style={{...type.hero, color, ...extraStyle}}>
        <Counter value={value} format={fmtUSD} startFrame={cue(startSec)} durFrames={50} />
      </div>
      <div style={{...type.label, color: C.textDim, marginTop: 8}}>{label}</div>
    </div>
  );

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <div style={{position: 'absolute', top: 240, left: 240}}>
        {row('the servers and electrical equipment', equipment, C.capital, 5.5, {
          textShadow: flash > 0 ? `0 0 ${40 * flash}px rgba(255,255,255,${0.9 * flash})` : undefined,
          color: flash > 0.5 ? C.text : C.capital,
        })}
        {row('the land under them', land, C.land, 10.5)}
      </div>
      {/* "this one" callout on the exempt (cyan) number */}
      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 1210,
          opacity: calloutIn,
          transform: `translateX(${(1 - calloutIn) * 30}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{...type.label, fontSize: 34, color: C.text}}>←</div>
        <div
          style={{
            ...type.label,
            fontSize: 30,
            color: C.capital,
            border: `2px solid ${C.capital}`,
            borderRadius: 6,
            padding: '6px 16px',
          }}
        >
          this one — tax-exempt
        </div>
      </div>
      {/* the disparity, drawn to scale (right column, under the callout) */}
      {barsIn > 0 && (
        <div style={{position: 'absolute', top: 420, left: 1210, opacity: Math.min(1, barsIn * 2)}}>
          <div style={{...type.tag, color: C.textDim, marginBottom: 14}}>drawn to scale:</div>
          <div style={{...type.label, fontSize: 22, color: C.capital, marginBottom: 6}}>equipment</div>
          <div style={{width: BAR_MAX * barsIn, height: 34, background: C.capital, borderRadius: 4, marginBottom: 22}} />
          <div style={{...type.label, fontSize: 22, color: C.land, marginBottom: 6}}>
            the land — {((land / equipment) * 100).toFixed(1)}% of that
          </div>
          <div style={{width: landBarW, height: 34, background: C.land, borderRadius: 2}} />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 300,
          left: 240,
          ...type.h2,
          color: C.text,
          opacity: taglineIn,
          maxWidth: 1400,
        }}
      >
        When the boom moves in, who actually gets paid?
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 240,
          left: 64,
          height: 3,
          width: lineW,
          background: C.land,
        }}
      />
      <SourceTag text={`${data.facts.equipment_usd_bn.label} — GA DOAA audit, Dec 2025`} appearFrame={cue(5.5)} />
    </AbsoluteFill>
  );
};
