import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import videoData from '../data/video_data.json';
import {VideoData} from '../data/types';
import {C, type} from '../lib/theme';
import {fmtPct} from '../lib/format';
import {SourceTag} from '../components/SourceTag';
import {SceneProps, useCue} from './sceneProps';

const data = videoData as unknown as VideoData;

// plot geometry
const X0 = 250, X1 = 1670, Y0 = 170, Y1 = 850;
const E_MIN = -24, E_MAX = 36, A_MAX = 0.09;
const xOf = (e: number) => X0 + ((e - E_MIN) / (E_MAX - E_MIN)) * (X1 - X0);
const yOf = (a: number) => Y1 - ((a + A_MAX) / (2 * A_MAX)) * (Y1 - Y0);

const shortLabel = (label: string) =>
  label.replace(/^\([^)]*\)\s*/, '').replace(/ — see text$/, '').slice(0, 26);

export const S4EventStudy: React.FC<SceneProps> = ({sceneFrames, spec}) => {
  const frame = useCurrentFrame();
  const cue = useCue(sceneFrames, spec);

  const pre = data.eventstudy.filter((p) => p.phase === 'pre');
  const post = data.eventstudy.filter((p) => p.phase === 'post');
  const h = data.headline;

  const axisIn = interpolate(frame, [0, 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const preDrawn = Math.floor(
    interpolate(frame, [cue(5), cue(24)], [0, pre.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  const lineStamp = interpolate(frame, [cue(26.5), cue(26.5) + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // the beat of silence: everything dims except the announcement line
  const dim = frame >= cue(28) && frame < cue(30.2) ? 0.35 : 1;
  const postDrawn = Math.floor(
    interpolate(frame, [cue(30.5), cue(36.5)], [0, post.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  const bandIn = interpolate(frame, [cue(34), cue(37)], [0, 0.16], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const statIn = interpolate(frame, [cue(37.5), cue(38.5)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chipsAt = cue(46);
  const chipsShowing = frame >= chipsAt;
  const chartDim = chipsShowing ? 0.35 : dim;

  const shown = [...pre.slice(0, preDrawn), ...post.slice(0, postDrawn)];
  const bandPts = post.slice(0, Math.max(postDrawn, 2));
  const bandPath =
    bandPts.length >= 2
      ? 'M ' +
        bandPts.map((p) => `${xOf(p.e)} ${yOf(p.ci_hi)}`).join(' L ') +
        ' L ' +
        [...bandPts].reverse().map((p) => `${xOf(p.e)} ${yOf(p.ci_lo)}`).join(' L ') +
        ' Z'
      : '';

  const chips = [...h.robustness_specs.map((s) => ({label: shortLabel(s.label), value: fmtPct(s.att_pct), risk: false})),
    {label: `placebo, B=${h.placebo_B}`, value: `p = ${h.placebo_p.toFixed(3)}`, risk: true}];

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{opacity: 1}}>
        <g opacity={chartDim}>
          {/* axes */}
          <line x1={X0} y1={yOf(0)} x2={X0 + (X1 - X0) * axisIn} y2={yOf(0)} stroke={C.textDim} strokeWidth={2} />
          <line x1={X0} y1={Y1} x2={X0} y2={Y1 - (Y1 - Y0) * axisIn} stroke={C.grid} strokeWidth={2} />
          {[-0.05, 0.05].map((a) => (
            <g key={a} opacity={axisIn * 0.8}>
              <line x1={X0} y1={yOf(a)} x2={X1} y2={yOf(a)} stroke={C.grid} strokeWidth={1} strokeDasharray="4 8" />
              <text x={X0 - 16} y={yOf(a) + 8} fill={C.textDim} fontFamily={type.tag.fontFamily} fontSize={22} textAnchor="end">
                {fmtPct(a * 100, 0)}
              </text>
            </g>
          ))}
          {[-24, -12, 0, 12, 24, 36].map((e) => (
            <text key={e} x={xOf(e)} y={Y1 + 40} fill={C.textDim} fontFamily={type.tag.fontFamily} fontSize={22} textAnchor="middle" opacity={axisIn}>
              {e > 0 ? `+${e}` : e}
            </text>
          ))}
          <text x={(X0 + X1) / 2} y={Y1 + 86} fill={C.textDim} fontFamily={type.label.fontFamily} fontSize={24} textAnchor="middle" opacity={axisIn}>
            months since announcement
          </text>
          <text x={X0 - 150} y={(Y0 + Y1) / 2} fill={C.textDim} fontFamily={type.label.fontFamily} fontSize={24} textAnchor="middle" transform={`rotate(-90 ${X0 - 150} ${(Y0 + Y1) / 2})`} opacity={axisIn}>
            effect on home values
          </text>
          {/* CI band over post period */}
          {bandPath && <path d={bandPath} fill={C.text} opacity={bandIn} />}
          {/* estimates */}
          {shown.map((p) => (
            <g key={p.e} opacity={0.95}>
              <line x1={xOf(p.e)} y1={yOf(p.ci_lo)} x2={xOf(p.e)} y2={yOf(p.ci_hi)} stroke={p.phase === 'pre' ? C.textDim : C.land} strokeWidth={2} opacity={0.5} />
              <circle cx={xOf(p.e)} cy={yOf(p.att)} r={7} fill={p.phase === 'pre' ? C.textDim : C.land} />
            </g>
          ))}
        </g>
        {/* the announcement */}
        <g opacity={lineStamp}>
          <line x1={xOf(-0.5)} y1={Y0} x2={xOf(-0.5)} y2={Y1} stroke={C.land} strokeWidth={2.5} strokeDasharray="10 8" />
          <text x={xOf(-0.5)} y={Y0 - 18} fill={C.land} fontFamily={type.label.fontFamily} fontSize={26} textAnchor="middle">
            the announcement
          </text>
        </g>
      </svg>
      {/* headline stat */}
      <div style={{position: 'absolute', top: 190, right: 170, textAlign: 'right', opacity: statIn * (chipsShowing ? 0.4 : 1)}}>
        <div style={{...type.hero, fontSize: 84, color: C.text}}>
          {fmtPct(h.att_pct)}
        </div>
        <div style={{...type.label, color: C.textDim, marginTop: 6}}>
          95% CI [{fmtPct(h.ci_lo_pct)}, {fmtPct(h.ci_hi_pct)}]
        </div>
        <div style={{...type.h2, fontSize: 34, color: C.land, marginTop: 14}}>
          statistically indistinguishable from zero
        </div>
        <div style={{...type.tag, color: C.textDim, marginTop: 10}}>
          {h.n_treated_zips} treated ZIPs · {h.n_control_zips} controls · pre-trends {h.pretrend_n_sig_5pct}/{h.pretrend_n} significant
        </div>
      </div>
      {/* robustness chips */}
      {chipsShowing && (
        <div
          style={{
            position: 'absolute',
            left: 210,
            top: 300,
            width: 1500,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
          }}
        >
          {chips.map((c, i) => {
            const born = chipsAt + i * 4;
            const inT = interpolate(frame, [born, born + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div
                key={c.label}
                style={{
                  opacity: inT,
                  transform: `scale(${0.9 + 0.1 * inT})`,
                  border: `1.5px solid ${c.risk ? C.risk : C.grid}`,
                  background: 'rgba(14,17,22,0.92)',
                  borderRadius: 8,
                  padding: '14px 22px',
                  minWidth: 330,
                }}
              >
                <div style={{...type.tag, color: C.textDim}}>{c.label}</div>
                <div style={{...type.label, fontSize: 34, color: c.risk ? C.risk : C.text, marginTop: 4}}>{c.value}</div>
              </div>
            );
          })}
        </div>
      )}
      <SourceTag text="Zillow ZHVI · Callaway–Sant'Anna (2021) · computed in output/results.json" appearFrame={cue(5)} />
    </AbsoluteFill>
  );
};
