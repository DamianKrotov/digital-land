export interface EventDot {
  id: string;
  x: number;
  y: number;
  date: string; // YYYY-MM-DD
  company: string;
  county: string;
  investment_usd_m: number | null;
  status: 'announced' | 'under_construction' | 'operational' | 'withdrawn';
}

export interface EventStudyPoint {
  e: number;
  att: number;
  se: number;
  ci_lo: number;
  ci_hi: number;
  phase: 'pre' | 'post';
}

export interface FanScenario {
  p_mean: number;
  stranded_bn_p5: number;
  stranded_bn_p25: number;
  stranded_bn_median: number;
  stranded_bn_p75: number;
  stranded_bn_p95: number;
}

export interface Fact {
  value: number | string;
  label: string;
  source: string;
}

export interface VideoData {
  meta: {
    inputs: Record<string, string>;
    n_events: number;
    n_events_with_investment: number;
    facts_verified: boolean;
  };
  map: {
    viewBox: {w: number; h: number};
    counties: {geoid: string; name: string; d: string}[];
    stateOutline: string;
  };
  events: EventDot[];
  eventstudy: EventStudyPoint[];
  fan: Record<'optimistic' | 'base' | 'exelon_like', FanScenario>;
  headline: {
    att_pct: number;
    ci_lo_pct: number;
    ci_hi_pct: number;
    n_treated_zips: number;
    n_control_zips: number;
    pretrend_n: number;
    pretrend_n_sig_5pct: number;
    placebo_p: number;
    placebo_B: number;
    robustness_specs: {label: string; att_pct: number}[];
  };
  facts: Record<string, Fact>;
}
