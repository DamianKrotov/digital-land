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
      <div
        style={{
          position: 'absolute',
          bottom: 320,
          left: 240,
          ...type.h2,
          color: C.text,
          opacity: taglineIn,
          maxWidth: 1300,
        }}
      >
        Who gets paid when the cloud touches the ground?
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
