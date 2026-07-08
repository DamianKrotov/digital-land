// Semantic color system (plan §Design system): amber = land / community-created
// value; cyan = capital / servers; crimson = socialized risk. Do not repurpose.
export const C = {
  bg: '#0E1116',
  bgWhite: '#F4EFE6', // S2 savannah inversion
  land: '#F5A623',
  capital: '#4FC3F7',
  risk: '#E4572E',
  text: '#F2EFE9',
  textDim: '#8B929C',
  ink: '#1A1A18', // dark ink on the savannah scene
  grid: '#2A2F38',
} as const;

export const F = {
  sans: 'IBM Plex Sans',
  mono: 'IBM Plex Mono',
} as const;

export const type = {
  hero: {fontFamily: F.mono, fontSize: 96, fontWeight: 500, letterSpacing: '-0.02em'},
  h1: {fontFamily: F.sans, fontSize: 64, fontWeight: 700},
  h2: {fontFamily: F.sans, fontSize: 44, fontWeight: 600},
  body: {fontFamily: F.sans, fontSize: 32, fontWeight: 400},
  label: {fontFamily: F.mono, fontSize: 24, fontWeight: 400, letterSpacing: '0.06em'},
  tag: {fontFamily: F.mono, fontSize: 19, fontWeight: 400, letterSpacing: '0.04em'},
} as const;
