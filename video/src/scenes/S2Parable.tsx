import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import videoData from '../data/video_data.json';
import {VideoData} from '../data/types';
import {C, F, type} from '../lib/theme';
import {SourceTag} from '../components/SourceTag';
import {SceneProps, useCue} from './sceneProps';

const data = videoData as unknown as VideoData;

const N_HOUSES = 42;
const GOLDEN = 2.399963;

// Deterministic settlement ring positions (golden-angle spiral, flattened
// onto the ground plane). No randomness — reruns are identical.
const housePos = (i: number) => {
  const r = 150 + 62 * Math.sqrt(i);
  const a = i * GOLDEN;
  return {x: 960 + r * Math.cos(a) * 1.25, y: 760 + r * Math.sin(a) * 0.32};
};

const House: React.FC<{x: number; y: number; scale: number}> = ({x, y, scale}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={scale}>
    <rect x={-11} y={-14} width={22} height={14} fill={C.ink} />
    <path d="M -14 -14 L 0 -26 L 14 -14 Z" fill={C.ink} />
  </g>
);

export const S2Parable: React.FC<SceneProps> = ({sceneFrames, spec}) => {
  const frame = useCurrentFrame();
  const cue = useCue(sceneFrames, spec);

  const wagonX = interpolate(frame, [cue(0.5), cue(6)], [-150, 620], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const housesStart = cue(11);
  const perHouse = Math.max(1, Math.floor((cue(23) - housesStart) / N_HOUSES));
  const nVisible = Math.max(0, Math.min(N_HOUSES, Math.floor((frame - housesStart) / perHouse)));

  // the settler's plot fills with community-created value
  const fill = interpolate(nVisible, [0, N_HOUSES], [0, 1]);
  const pulse =
    frame >= cue(28.5) && frame < cue(28.5) + 14
      ? 1 + 0.15 * Math.sin(((frame - cue(28.5)) / 14) * Math.PI)
      : 1;
  const quoteIn = interpolate(frame, [cue(17), cue(17) + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // transition out: the valuable plot grows to swallow the frame -> Georgia
  const grow = interpolate(frame, [sceneFrames - 55, sceneFrames - 8], [1, 34], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: C.bgWhite}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {/* horizon */}
        <line x1={0} y1={700} x2={1920} y2={700} stroke={C.ink} strokeWidth={2.5} />
        {/* covered wagon: canopy ribs, rotating spoked wheels, gentle bob */}
        {(() => {
          const bob = Math.sin(frame / 2.6) * 1.6;
          const rot = (wagonX * 5.2) % 360; // wheels roll with travel, not time
          const wheel = (cx: number, r: number) => (
            <g transform={`translate(${cx} 8) rotate(${rot})`}>
              <circle r={r} fill="none" stroke={C.ink} strokeWidth={3.2} />
              <circle r={2.6} fill={C.ink} />
              {[0, 45, 90, 135].map((a) => (
                <line key={a} x1={-r + 2} y1={0} x2={r - 2} y2={0} transform={`rotate(${a})`} stroke={C.ink} strokeWidth={2} />
              ))}
            </g>
          );
          return (
            <g
              transform={`translate(${wagonX} ${666 + bob})`}
              opacity={frame < cue(10) ? 1 : Math.max(0, 1 - (frame - cue(10)) / 20)}
            >
              {/* bed */}
              <path d="M -52 -24 L 44 -24 L 38 -2 L -46 -2 Z" fill={C.bgWhite} stroke={C.ink} strokeWidth={3.2} />
              {/* canopy with ribs */}
              <path d="M -50 -24 Q -50 -62 -14 -64 L 16 -64 Q 46 -62 44 -24" fill={C.bgWhite} stroke={C.ink} strokeWidth={3.2} />
              {[-34, -14, 6, 26].map((x) => (
                <path key={x} d={`M ${x} -24 Q ${x - 2} -50 ${x - 6} -58`} fill="none" stroke={C.ink} strokeWidth={1.8} opacity={0.7} />
              ))}
              {/* tongue + driver perch */}
              <line x1={44} y1={-8} x2={78} y2={-14} stroke={C.ink} strokeWidth={3} />
              <rect x={36} y={-34} width={14} height={8} fill={C.ink} />
              {wheel(-26, 13)}
              {wheel(22, 16)}
            </g>
          );
        })()}
        {/* settlers */}
        {Array.from({length: nVisible}, (_, i) => {
          const p = housePos(i);
          const born = housesStart + i * perHouse;
          const s = Math.min(1, (frame - born) / 8) * pulse;
          return p.y > 706 ? <House key={i} x={p.x} y={p.y} scale={s} /> : null;
        })}
        {/* the plot: same acre, rising value */}
        <g transform={`translate(960 745) scale(${grow})`}>
          <rect x={-85} y={-28} width={170} height={56} fill={C.land} opacity={grow > 1.5 ? 0.95 : 0.25 + 0.7 * fill} stroke={C.ink} strokeWidth={grow > 1.5 ? 0 : 3} />
        </g>
        {/* value meter above the plot */}
        {grow <= 1.5 && (
          <g>
            <rect x={880} y={640} width={160} height={10} fill="none" stroke={C.ink} strokeWidth={2} />
            <rect x={882} y={642} width={156 * fill} height={6} fill={C.land} />
          </g>
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1500,
          textAlign: 'center',
          fontFamily: F.sans,
          fontStyle: 'italic',
          fontSize: 40,
          lineHeight: 1.5,
          color: C.ink,
          opacity: quoteIn,
        }}
      >
        “{data.facts.george_quote.value}”
        <div style={{...type.tag, fontStyle: 'normal', marginTop: 18, color: '#6B6B66'}}>
          Henry George, Progress and Poverty (1879), Book IV, Ch. 2
        </div>
      </div>
      <SourceTag text="public-domain text: Project Gutenberg #55308" appearFrame={cue(17)} light />
    </AbsoluteFill>
  );
};
