// Pure grid-layout engine (12 columns). Items are { id, x, y, w, h } in grid cells.
export const COLS = 12;
export const MIN_W = 2;
export const MIN_H = 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function clampRect(r, cols = COLS) {
  const w = clamp(Math.round(r.w), MIN_W, cols);
  const h = Math.max(MIN_H, Math.round(r.h));
  return { ...r, w, h, x: clamp(Math.round(r.x), 0, cols - w), y: Math.max(0, Math.round(r.y)) };
}

/**
 * Resolve overlaps and close gaps. The `fixedId` item (the one being dragged/resized) keeps its
 * position; everything else is pushed down out of its way, then floats up as far as it can.
 */
export function settle(items, fixedId = null, cols = COLS) {
  const byId = new Map(items.map((i) => [i.id, clampRect(i, cols)]));
  const placed = [];
  if (fixedId && byId.has(fixedId)) placed.push(byId.get(fixedId));
  const rest = [...byId.values()].filter((i) => i.id !== fixedId).sort((a, b) => a.y - b.y || a.x - b.x);
  for (const it of rest) {
    const r = { ...it };
    while (placed.some((p) => overlaps(p, r))) r.y++;
    while (r.y > 0 && !placed.some((p) => overlaps(p, { ...r, y: r.y - 1 }))) r.y--;
    placed.push(r);
    byId.set(r.id, r);
  }
  return items.map((i) => { const { x, y, w, h } = byId.get(i.id); return { ...i, x, y, w, h }; });
}

/** First free position (scanning rows top to bottom, then left to right) for a w×h item. */
export function placeNew(items, w, h, cols = COLS) {
  const ww = clamp(w, MIN_W, cols), hh = Math.max(MIN_H, h);
  const bottom = items.reduce((m, i) => Math.max(m, i.y + i.h), 0);
  for (let y = 0; y <= bottom; y++) for (let x = 0; x + ww <= cols; x++) {
    if (!items.some((i) => overlaps(i, { x, y, w: ww, h: hh }))) return { x, y, w: ww, h: hh };
  }
  return { x: 0, y: bottom, w: ww, h: hh };
}
