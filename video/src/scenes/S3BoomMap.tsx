import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import videoData from '../data/video_data.json';
import {VideoData} from '../data/types';
import {C, type} from '../lib/theme';
import {daysSinceEpoch, fmtDateTicker, fmtUSD} from '../lib/format';
import {SourceTag} from '../components/SourceTag';
import {SceneProps, useCue} from './sceneProps';

const data = videoData as unknown as VideoData;

const CALLOUTS: Record<string, string> = {
  GA008: 'Social Circle',
  GA005: 'Fayetteville',
  GA022: 'Twiggs County',
};

// 159 static county paths — memoized so only the dots re-render per frame.
const CountyLayer = React.memo(() => (
  <>
    {data.map.counties.map((c) => (
      <path key={c.geoid} d={c.d} fill="#151A21" stroke={C.grid} strokeWidth={1.2} fillRule="evenodd" />
    ))}
    <path d={data.map.stateOutline} fill="none" stroke={C.textDim} strokeWidth={2} opacity={0.6} />
  </>
));

export const S3BoomMap: React.FC<SceneProps> = ({sceneFrames, spec}) => {
  const frame = useCurrentFrame();
  const cue = useCue(sceneFrames, spec);

  const d0 = daysSinceEpoch(data.events[0].date);
  const d1 = daysSinceEpoch(data.events[data.events.length - 1].date);
  const popStart = cue(3);
  const popEnd = cue(41);

  const appearFrames = useMemo(
    () =>
      data.events.map((e) => {
        const p = (daysSinceEpoch(e.date) - d0) / (d1 - d0);
        return Math.round(popStart + p * (popEnd - popStart));
      }),
    [popStart, popEnd, d0, d1],
  );

  const nVisible = appearFrames.filter((f) => frame >= f).length;
  const invSum = data.events
    .filter((_, i) => frame >= appearFrames[i])
    .reduce((s, e) => s + (e.investment_usd_m ?? 0), 0);
  // current ticker date = inverse of the date->frame mapping
  const tickerDays = interpolate(frame, [popStart, popEnd], [d0, d1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tickerDate = new Date(tickerDays * 86_400_000).toISOString().slice(0, 10);

  const mapIn = interpolate(frame, [0, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const amberFlash = interpolate(frame, [0, 25], [0.5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const finalPulse =
    frame >= cue(41) && frame < cue(41) + 14
      ? 1 + 0.15 * Math.sin(((frame - cue(41)) / 14) * Math.PI)
      : 1;
  // transition out: rail/map fade, dots drift toward the S4 axis line
  const outT = interpolate(frame, [sceneFrames - 50, sceneFrames - 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scaleF = 940 / data.map.viewBox.h;
  const counter = (label: string, value: string, sub?: string) => (
    <div style={{marginBottom: 44}}>
      <div style={{...type.hero, fontSize: 76, color: C.land}}>{value}</div>
      <div style={{...type.label, color: C.textDim, marginTop: 6}}>{label}</div>
      {sub ? <div style={{...type.tag, color: C.textDim, marginTop: 4, opacity: 0.7}}>{sub}</div> : null}
    </div>
  );

  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      {/* left rail */}
      <div style={{position: 'absolute', top: 200, left: 96, opacity: (1 - outT) * mapIn}}>
        {counter('verified announcements, 2015–2026', String(nVisible))}
        {counter(
          'announced investment',
          fmtUSD(invSum * 1e6),
          `disclosed for ${data.meta.n_events_with_investment} of ${data.meta.n_events} projects`,
        )}
        {frame >= cue(35) &&
          counter('MW certified, Dec 2025', (data.facts.psc_mw_certified.value as number).toLocaleString('en-US'), `≈${data.facts.psc_dc_share_pct.value}% for data centers`)}
        {frame >= cue(27.5) && frame < cue(35) && (
          <div style={{...type.label, color: C.textDim}}>
            statewide: {String(data.facts.statewide_active.value)} active ·{' '}
            {String(data.facts.statewide_under_construction.value)} building ·{' '}
            {String(data.facts.statewide_announced.value)} announced
          </div>
        )}
      </div>
      {/* date ticker */}
      <div style={{position: 'absolute', top: 96, right: 96, ...type.label, fontSize: 40, color: C.text, opacity: mapIn * (1 - outT)}}>
        {fmtDateTicker(tickerDate)}
      </div>
      {/* map */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{position: 'absolute', inset: 0}}
      >
        <g transform={`translate(${880} ${70}) scale(${scaleF})`} opacity={mapIn}>
          <g opacity={1 - outT}>
            <CountyLayer />
            <rect x={0} y={0} width={data.map.viewBox.w} height={data.map.viewBox.h} fill={C.land} opacity={amberFlash} />
          </g>
          {data.events.map((e, i) => {
            const born = appearFrames[i];
            if (frame < born) return null;
            const pop = Math.min(1, (frame - born) / 8);
            const r = (5 + 0.12 * Math.sqrt(e.investment_usd_m ?? 100)) * pop * finalPulse;
            const ring = interpolate(frame - born, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
            const dy = outT * (data.map.viewBox.h - 40 - e.y) * 0.9; // drift toward the future axis
            return (
              <g key={e.id} transform={`translate(${e.x} ${e.y + dy})`}>
                {ring < 1 && (
                  <circle r={r + ring * 26} fill="none" stroke={C.land} strokeWidth={2} opacity={1 - ring} />
                )}
                <circle
                  r={r}
                  fill={e.status === 'withdrawn' ? 'none' : C.land}
                  stroke={C.land}
                  strokeWidth={e.status === 'withdrawn' ? 2.5 : 0}
                  opacity={0.92}
                />
                {CALLOUTS[e.id] && frame - born < 55 && frame - born > 4 && (
                  <text x={18} y={-14} fill={C.text} fontFamily={type.label.fontFamily} fontSize={26}>
                    {CALLOUTS[e.id]}
                  </text>
                )}
              </g>
            );
          })}
          {/* incoming axis the dots fall toward */}
          {outT > 0 && (
            <line
              x1={-650}
              y1={data.map.viewBox.h - 40}
              x2={data.map.viewBox.w + 60}
              y2={data.map.viewBox.h - 40}
              stroke={C.textDim}
              strokeWidth={2}
              opacity={outT}
            />
          )}
        </g>
      </svg>
      <SourceTag
        text="events: hand-verified announcement dataset (this project) · statewide counts: GA DOAA audit"
        appearFrame={cue(3)}
      />
    </AbsoluteFill>
  );
};
