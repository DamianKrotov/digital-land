import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import videoData from '../data/video_data.json';
import {VideoData} from '../data/types';
import {C, type} from '../lib/theme';
import {fmtPct, fmtUSD, fmtUSDBillions} from '../lib/format';
import {Counter} from '../components/Counter';
import {SourceTag} from '../components/SourceTag';
import {SceneProps, useCue} from './sceneProps';

const data = videoData as unknown as VideoData;

const FAN_X0 = 1010, FAN_X1 = 1810, FAN_MAX_BN = 10;
const fx = (bn: number) => FAN_X0 + (bn / FAN_MAX_BN) * (FAN_X1 - FAN_X0);

const SCENARIOS: {key: keyof VideoData['fan']; label: string}[] = [
  {key: 'optimistic', label: 'optimistic (p = 0.8)'},
  {key: 'base', label: 'base (p = 0.5)'},
  {key: 'exelon_like', label: 'Exelon-like (p = 0.22)'},
];

export const S5WhoPays: React.FC<SceneProps> = ({sceneFrames, spec}) => {
  const frame = useCurrentFrame();
  const cue = useCue(sceneFrames, spec);
  const h = data.headline;

  const headerIn = interpolate(frame, [cue(0.5), cue(0.5) + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const gainedIn = interpolate(frame, [cue(4), cue(4) + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const stampIn = interpolate(frame, [cue(16), cue(16) + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const exelonIn = interpolate(frame, [cue(22.5), cue(22.5) + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fanAt = cue(32.5);
  const closerIn = interpolate(frame, [cue(44.5), cue(44.5) + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // header color swap flash on "privatized gains, socialized losses"
  const swap = frame >= cue(44.5) && frame < cue(44.5) + 12;

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {/* WHO GAINED */}
      <div style={{position: 'absolute', top: 130, left: 130, width: 720, opacity: headerIn}}>
        <div style={{...type.h2, color: swap ? C.risk : C.land, borderBottom: `2px solid ${C.grid}`, paddingBottom: 14}}>
          WHO GAINED
        </div>
        <div style={{marginTop: 44, opacity: gainedIn}}>
          <div style={{...type.body, color: C.text}}>nearby homeowners</div>
          <div style={{...type.hero, fontSize: 66, color: C.land, marginTop: 10}}>≈ nothing</div>
          <div style={{...type.label, color: C.textDim, marginTop: 10}}>
            detectable: {fmtPct(h.att_pct)} [{fmtPct(h.ci_lo_pct)}, {fmtPct(h.ci_hi_pct)}] — n.s.
          </div>
        </div>
      </div>
      {/* WHO PAYS */}
      <div style={{position: 'absolute', top: 130, left: 980, width: 860, opacity: headerIn}}>
        <div style={{...type.h2, color: swap ? C.land : C.risk, borderBottom: `2px solid ${C.grid}`, paddingBottom: 14}}>
          WHO PAYS
        </div>
        {frame >= cue(8) && (
          <div style={{marginTop: 44}}>
            <div style={{...type.body, color: C.text}}>sales-tax exemption, this year</div>
            <div style={{...type.hero, fontSize: 66, color: C.risk, marginTop: 10}}>
              <Counter
                value={(data.facts.exemption_fy26_usd_bn.value as number) * 1e9}
                format={fmtUSD}
                startFrame={cue(8)}
                durFrames={55}
              />
              <span style={{...type.label, fontSize: 30, color: C.textDim}}> /yr</span>
            </div>
            <div style={{...type.label, color: C.textDim, marginTop: 8}}>
              headed toward {fmtUSDBillions(data.facts.exemption_fy27_usd_bn.value as number)} next year
            </div>
          </div>
        )}
        {stampIn > 0 && (
          <div
            style={{
              marginTop: 34,
              display: 'inline-block',
              transform: `rotate(-4deg) scale(${2 - stampIn})`,
              opacity: stampIn,
              border: `3px solid ${C.risk}`,
              borderRadius: 6,
              padding: '10px 20px',
              ...type.label,
              fontSize: 30,
              color: C.risk,
            }}
          >
            {String(data.facts.redundancy_pct.value)}% WOULD HAVE BUILT ANYWAY
          </div>
        )}
        {exelonIn > 0 && (
          <div style={{...type.label, color: C.textDim, marginTop: 30, opacity: exelonIn}}>
            Exelon: only {String(data.facts.exelon_materialize_pct.value)}% of its 65-GW pipeline likely to materialize
          </div>
        )}
      </div>
      {/* stranded-cost fan */}
      {frame >= fanAt && (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          <text x={FAN_X0} y={672} fill={C.textDim} fontFamily={type.label.fontFamily} fontSize={26}>
            if certified load falls short — stranded exposure, $B
          </text>
          <text x={FAN_X0} y={704} fill={C.risk} fontFamily={type.tag.fontFamily} fontSize={20}>
            ILLUSTRATIVE — scenario simulation, not a forecast
          </text>
          {SCENARIOS.map((s, i) => {
            const q = data.fan[s.key];
            const y = 748 + i * 88;
            const grow = interpolate(frame, [fanAt + 10 + i * 12, fanAt + 40 + i * 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const w95 = (fx(q.stranded_bn_p95) - fx(q.stranded_bn_p5)) * grow;
            const w50 = (fx(q.stranded_bn_p75) - fx(q.stranded_bn_p25)) * grow;
            return (
              <g key={s.key}>
                <text x={FAN_X0} y={y - 12} fill={C.text} fontFamily={type.tag.fontFamily} fontSize={24}>
                  {s.label}
                </text>
                <rect x={fx(q.stranded_bn_p5)} y={y} width={w95} height={26} rx={6} fill={C.risk} opacity={0.28} />
                <rect x={fx(q.stranded_bn_p25)} y={y} width={w50} height={26} rx={6} fill={C.risk} opacity={0.55} />
                {grow > 0.95 && (
                  <>
                    <line x1={fx(q.stranded_bn_median)} y1={y - 4} x2={fx(q.stranded_bn_median)} y2={y + 30} stroke={C.text} strokeWidth={3} />
                    <text x={fx(q.stranded_bn_p95) + 16} y={y + 20} fill={C.risk} fontFamily={type.label.fontFamily} fontSize={26}>
                      {fmtUSDBillions(q.stranded_bn_median)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {/* closer */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 130,
          ...type.h1,
          fontSize: 54,
          color: C.text,
          opacity: closerIn,
        }}
      >
        Privatized gains. <span style={{color: C.risk}}>Socialized losses.</span>
      </div>
      <SourceTag
        text="OPB Tax Expenditure Report FY27 · GA DOAA audit · POWER Magazine (May 2026) · Monte Carlo: output/results.json"
        appearFrame={cue(8)}
      />
    </AbsoluteFill>
  );
};
