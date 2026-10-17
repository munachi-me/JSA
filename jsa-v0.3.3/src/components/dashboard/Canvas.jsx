import { useRef, useState } from 'react';
import { Copy, Settings, Trash2, GripVertical } from 'lucide-react';
import { COLS, settle } from '../../core/dashboard/layout.js';

const GAP = 12;
const labelOf = { chart: 'Chart', table: 'Chart table', kpi: 'KPI', text: 'Text', filter: 'Filter', insight: 'Insight' };

/**
 * Grid canvas. Dragging starts only from the header handle and resizing only from the corner
 * handle, so interacting with charts, tables and filter inputs never moves a component.
 * Keyboard: focus a handle, arrows move; Shift+arrows resize. Exact values are in the settings panel.
 */
export default function Canvas({ dashboard, editing, selectedId, onSelect, onOpenSettings, onLayout, onDuplicate, onRemove, renderBody, settingsContent }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);
  const rowH = dashboard.rowHeight || 80;
  const items = dashboard.components.map((c) => ({ id: c.id, ...c.layout }));
  const shown = drag?.preview || items;

  const begin = (e, id, mode) => {
    if (!editing) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ id, mode, sx: e.clientX, sy: e.clientY, orig: items.find((i) => i.id === id), preview: null });
    onSelect(id);
  };
  const move = (e) => {
    if (!drag || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (r.width + GAP) / COLS, py = rowH + GAP;
    const dx = Math.round((e.clientX - drag.sx) / px), dy = Math.round((e.clientY - drag.sy) / py);
    const o = drag.orig;
    const rect = drag.mode === 'move' ? { ...o, x: o.x + dx, y: o.y + dy } : { ...o, w: Math.max(2, Math.min(o.w + dx, COLS - o.x)), h: Math.max(2, o.h + dy) };
    setDrag((d) => ({ ...d, preview: settle(items.map((i) => (i.id === d.id ? { ...i, ...rect } : i)), d.id) }));
  };
  const end = () => { if (drag?.preview) onLayout(drag.preview.find((i) => i.id === drag.id), drag.id, drag.mode); setDrag(null); };
  const key = (e, id) => {
    const o = items.find((i) => i.id === id);
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d || !editing) return;
    e.preventDefault();
    onLayout(e.shiftKey ? { ...o, w: Math.max(2, Math.min(o.w + d[0], COLS - o.x)), h: Math.max(2, o.h + d[1]) } : { ...o, x: o.x + d[0], y: o.y + d[1] }, id, e.shiftKey ? 'resize' : 'move');
  };

  if (!dashboard.components.length) return <div className="empty-chart"><strong>This dashboard is empty</strong><p className="muted">{editing ? 'Add a chart, KPI, text block or filter from the toolbar above.' : 'Switch to Edit to add components.'}</p></div>;

  return (
    <div className={`dash-canvas-layout ${settingsContent ? 'settings-open' : ''}`}>
    <div ref={ref} className={`dash-grid ${editing ? 'editing' : ''}`} style={{ gridAutoRows: `${rowH}px`, gap: GAP }} onPointerMove={move} onPointerUp={end} onPointerCancel={() => setDrag(null)}>
      {dashboard.components.map((c) => {
        const l = shown.find((i) => i.id === c.id);
        const dragging = drag?.id === c.id;
        return (
          <div key={c.id} className={`dash-item type-${c.type} ${c.config?.compact && ['filter', 'kpi'].includes(c.type) ? 'compact' : ''} ${selectedId === c.id && editing ? 'selected' : ''} ${dragging ? 'dragging' : ''}`}
            style={{ gridColumn: `${l.x + 1} / span ${l.w}`, gridRow: `${l.y + 1} / span ${l.h}` }} onClick={() => editing && onSelect(c.id)}>
            {editing && (
              <div className="dash-head">
                <div className="drag-handle" role="button" tabIndex={0} aria-label={`Move ${c.title || labelOf[c.type]}. Arrow keys move, Shift plus arrow keys resize.`}
                  onPointerDown={(e) => begin(e, c.id, 'move')} onKeyDown={(e) => key(e, c.id)}><GripVertical size={14} aria-hidden /> {c.title || labelOf[c.type]}</div>
                <button className="iconbtn" aria-label="Component settings" onClick={(e) => { e.stopPropagation(); (onOpenSettings || onSelect)(c.id); }}><Settings size={14} aria-hidden /></button>
                <button className="iconbtn" aria-label="Duplicate component" onClick={(e) => { e.stopPropagation(); onDuplicate(c.id); }}><Copy size={14} aria-hidden /></button>
                <button className="iconbtn" aria-label="Remove component" onClick={(e) => { e.stopPropagation(); onRemove(c.id); }}><Trash2 size={14} aria-hidden /></button>
              </div>)}
            <div className="dash-body">{renderBody(c)}</div>
            {editing && <div className="resize-handle" aria-hidden onPointerDown={(e) => begin(e, c.id, 'resize')} />}
          </div>);
      })}
    </div>
    {editing && settingsContent && <div className="settings-popup-backdrop" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.querySelector('[aria-label=\"Close component settings\"]')?.click(); }}> <div className="settings-panel-wrap" onClick={(e) => e.stopPropagation()}>{settingsContent}</div></div>}
    </div>
  );
}
