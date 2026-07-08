export const fmtUSD = (n: number): string =>
  '$' + Math.round(n).toLocaleString('en-US');

export const fmtUSDBillions = (bn: number, digits = 1): string =>
  '$' + bn.toFixed(digits) + 'B';

export const fmtPct = (pct: number, digits = 1): string =>
  (pct > 0 ? '+' : '') + pct.toFixed(digits) + '%';

export const fmtDateTicker = (isoDate: string): string => {
  const [y, m] = isoDate.split('-');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
};

export const daysSinceEpoch = (isoDate: string): number =>
  Date.parse(isoDate + 'T00:00:00Z') / 86_400_000;
