import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, type} from '../lib/theme';
import {SceneProps, useCue} from './sceneProps';

const LINES = [
  'Based on the working paper “Digital Land: Data-Center Announcements and the Capture of Community-Created Value in Georgia” (2026)',
  'Data: Zillow ZHVI · GA DOAA audit (Dec 2025) · GA PSC (Dec 2025) · OPB Tax Expenditure Report FY2027 · EIA · Project Gutenberg #55308',
  'Method: Callaway & Sant’Anna (2021) staggered difference-in-differences · pre-registered hypotheses · permutation placebo',
  'Every figure computed by open code from public records — full replication repository linked with the submission',
  'Made with Remotion · Music: CC0 · Typeface: IBM Plex (OFL)',
  'Research, data verification, and code assisted by AI (Anthropic Claude) under the author’s direction — prompt log disclosed with submission',
];

export const S7Credits: React.FC<SceneProps> = ({sceneFrames, spec}) => {
  const frame = useCurrentFrame();
  const cue = useCue(sceneFrames, spec);
  const t1 = interpolate(frame, [cue(0.5), cue(0.5) + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [sceneFrames - 30, sceneFrames - 4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: C.bg, opacity: fadeOut}}>
      <div style={{position: 'absolute', top: 220, left: '50%', transform: 'translateX(-50%)', width: 1500, textAlign: 'center'}}>
        <div style={{...type.h1, color: C.text, opacity: t1}}>
          DIGITAL LAND
        </div>
        <div style={{...type.label, color: C.land, marginTop: 12, opacity: t1}}>
          who gains from the data-center boom — and who carries the risk?
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 190, left: '50%', transform: 'translateX(-50%)', width: 1560, textAlign: 'center'}}>
        {LINES.map((line, i) => {
          const born = cue(4) + i * 22;
          const o = interpolate(frame, [born, born + 12], [0, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{...type.tag, color: C.textDim, opacity: o, marginBottom: 16, lineHeight: 1.5}}>
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
