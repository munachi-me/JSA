export const PALETTE = ['#6366F1', '#F59E0B', '#22C55E', '#EC4899', '#06B6D4', '#EF4444', '#A78BFA', '#84CC16'];
export const colorAt = (spec, i) => (i === 0 && spec?.colors?.[0]) || PALETTE[i % PALETTE.length];
export const fmtNum = (v) => (v === null || v === undefined ? '—' : v.toLocaleString(undefined, { maximumFractionDigits: 3 }));
export const trunc = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
