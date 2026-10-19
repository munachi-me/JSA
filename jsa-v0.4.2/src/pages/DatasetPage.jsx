import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatasets } from '../app/DatasetContext.jsx';
import DatasetPicker, { NoDataset } from '../components/data/DatasetPicker.jsx';
import { useDialogs } from '../app/DialogProvider.jsx';
import { TYPES, isNumericType } from '../core/data/dataTypes.js';
import { describe, describeCategorical } from '../core/analytics/descriptive.js';
import { profileDataset } from '../core/data/profile.js';
import { ArrowRight, ArrowLeft, Columns3, Database, Search, Rows3, AlertTriangle, Copy, Table2, SlidersHorizontal, Trash2, PencilLine, ChevronLeft, ChevronRight, Sparkles, MoreHorizontal, MoveHorizontal, X } from 'lucide-react';

const PAGE = 25;
const fmt = (n, precision = 3) => (n === null || n === undefined ? '—' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: precision }) : String(n));

export default function DatasetPage() {
  const { id } = useParams();
  const { datasets, overrideType, remove, addStep } = useDatasets();
  const dialogs = useDialogs();
  const ds = id ? datasets.find((d) => d.id === id) : datasets[0];
  const [page, setPage] = useState(0);
  const [columnQuery, setColumnQuery] = useState('');
  const [activeColumnId, setActiveColumnId] = useState(null);
  const [targetPosition, setTargetPosition] = useState('');
  const profile = useMemo(() => (ds ? profileDataset(ds) : null), [ds]);

  // Switching datasets must always start at the first page; otherwise a high page
  // number from a larger dataset can make a smaller dataset look empty.
  useEffect(() => { setPage(0); }, [ds?.id]);
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil((ds?.rowCount ?? 0) / PAGE) - 1);
    setPage((current) => Math.min(current, maxPage));
  }, [ds?.rowCount]);

  if (!ds) return <NoDataset title="Dataset Explorer" />;

  const pages = Math.max(1, Math.ceil(ds.rowCount / PAGE));
  const start = page * PAGE;
  const end = Math.min(start + PAGE, ds.rowCount);
  const visibleColumns = ds.columns.filter((c) => c.name.toLocaleLowerCase().includes(columnQuery.trim().toLocaleLowerCase()));
  const missingPercent = ds.rowCount && ds.columns.length ? Math.min(100, (profile.totalMissing / (ds.rowCount * ds.columns.length)) * 100) : 0;

  return (
    <div className="page wide dataset-page">
      <div className="dataset-page-heading">
        <div className="dataset-heading-copy">
          <div className="dataset-eyebrow"><Database size={14} /> DATA WORKSPACE <span> / </span> DATASET EXPLORER</div>
          <h1>{ds.name}</h1>
          <p>Explore your data, review column quality, and inspect records before analysis.</p>
        </div>
        <div className="dataset-heading-actions">
          <DatasetPicker ds={ds} base="dataset" />
          <Link className="btn dataset-primary-action" to={`/clean/${ds.id}`}><SlidersHorizontal size={15} /> Clean data <ArrowRight size={15} /></Link>
        </div>
      </div>

      <div className="dataset-summary-grid" aria-label="Dataset summary">
        <div className="dataset-summary-card"><span className="dataset-summary-icon violet"><Rows3 size={18} /></span><div><span>Total rows</span><strong>{ds.rowCount.toLocaleString()}</strong><small>{ds.pipeline.steps.length ? 'After cleaning' : 'Records loaded'}</small></div></div>
        <div className="dataset-summary-card"><span className="dataset-summary-icon blue"><Columns3 size={18} /></span><div><span>Columns</span><strong>{ds.columns.length.toLocaleString()}</strong><small>Fields available</small></div></div>
        <div className="dataset-summary-card"><span className="dataset-summary-icon amber"><AlertTriangle size={18} /></span><div><span>Missing cells</span><strong>{profile.totalMissing.toLocaleString()}</strong><small>{missingPercent.toFixed(1)}% of all cells</small></div></div>
        <div className="dataset-summary-card"><span className="dataset-summary-icon green"><Copy size={18} /></span><div><span>Duplicate rows</span><strong>{profile.duplicateRows.toLocaleString()}</strong><small>{profile.duplicateRows ? 'Worth reviewing' : 'No duplicates found'}</small></div></div>
      </div>

      {ds.pipeline.steps.length > 0 && <div className="dataset-cleaning-note"><Sparkles size={16} /><span><strong>Cleaned view</strong> This dataset includes {ds.pipeline.steps.length} cleaning step(s). The original source contained {ds.sourceRowCount.toLocaleString()} rows.</span><Link to={`/clean/${ds.id}`}>Review steps <ArrowRight size={14} /></Link></div>}
      {ds.warnings.length > 0 && <div role="status" className="alert warn"><strong>Import warnings</strong><ul>{ds.warnings.slice(0, 5).map((w, i) => <li key={i}>{w.message}</li>)}</ul>{ds.warnings.length > 5 && <span>…and {ds.warnings.length - 5} more.</span>}</div>}
      {profile.issues.length > 0 && <div role="status" className="alert warn"><strong>Data quality</strong><ul>{profile.issues.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}

      <section className="dataset-section">
        <div className="dataset-section-heading">
          <div><span className="dataset-section-kicker">SCHEMA OVERVIEW</span><h2>Columns</h2><p>Understand each field's type and statistical profile.</p></div>
          <label className="dataset-search"><Search size={16} /><input aria-label="Search columns" placeholder="Search columns…" value={columnQuery} onChange={(e) => setColumnQuery(e.target.value)} /><span>{visibleColumns.length}</span></label>
        </div>
        <div className="scroll dataset-table-scroll"><table className="dataset-columns-table">
          <thead><tr><th>Column</th><th>Data type</th><th>Missing</th><th>Distinct</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th><th>Std dev</th><th>Actions</th></tr></thead>
          <tbody>{visibleColumns.map((c) => {
            const vals = ds.data[c.id];
            const num = isNumericType(c.type);
            const s = num ? describe(vals) : null;
            const cat = !num ? describeCategorical(vals) : null;
            return (
              <tr key={c.id}>
                <td><span className="dataset-column-name">{c.name}</span><small className="dataset-column-id">{c.id}</small></td>
                <td><select aria-label={`Type for ${c.name}`} value={c.type} title={c.typeReason}
                  onChange={(e) => overrideType(ds.id, c.id, e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></td>
                <td className="num">{(num ? s.missing : cat.missing).toLocaleString()}</td>
                <td className="num">{(num ? s.distinct : cat.distinct).toLocaleString()}</td>
                {num ? <><td className="num">{fmt(s.mean, c.precision ?? 3)}</td><td className="num">{fmt(s.median, c.precision ?? 3)}</td><td className="num">{fmt(s.min, c.precision ?? 3)}</td><td className="num">{fmt(s.max, c.precision ?? 3)}</td><td className="num">{fmt(s.stdDev, c.precision ?? 3)}</td></>
                  : <td colSpan={5} className="dataset-top-values"><span>Top values</span> {cat.top.map((t) => `${t.value} (${t.count})`).join(', ') || '—'}</td>}
                <td>
                  <button type="button" className="btn icon-btn column-options-trigger" aria-label={`Open options for ${c.name}`} title={`Column options: ${c.name}`} onClick={() => { setActiveColumnId(c.id); setTargetPosition(String(ds.columns.findIndex((x) => x.id === c.id) + 1)); }}><MoreHorizontal size={18} /><span>Options</span></button>
                </td>
              </tr>);
          })}</tbody>
        </table>{visibleColumns.length === 0 && <div className="dataset-no-results">No columns match “{columnQuery}”. Try another search.</div>}</div>
        <p className="dataset-table-footnote">Standard deviation uses the sample formula (n−1). Column order and decimal precision are saved as reversible pipeline steps; precision changes display only, not the stored values or calculations.</p>
      </section>

      {activeColumnId && ds.columns.some((c) => c.id === activeColumnId) && (() => {
        const c = ds.columns.find((x) => x.id === activeColumnId);
        const position = ds.columns.findIndex((x) => x.id === c.id) + 1;
        const close = () => setActiveColumnId(null);
        return <div className="column-settings-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <section className="column-settings-panel settings-redesign" role="dialog" aria-modal="true" aria-labelledby="column-settings-title">
            <div className="column-settings-title"><div><strong id="column-settings-title">Column settings</strong><span>{c.name} · {c.type}</span></div><button type="button" className="iconbtn" aria-label="Close column settings" onClick={close}><X size={17} /></button></div>
            <div className="column-action-group"><span className="column-action-heading">Column position</span>
              <div className="column-icon-actions"><button type="button" className="btn icon-btn" aria-label={`Move ${c.name} left`} title="Move column left" disabled={position === 1} onClick={() => { addStep(ds.id, 'reorderColumns', { column: c.id, direction: 'left' }); close(); }}><ArrowLeft size={15} /></button><button type="button" className="btn icon-btn" aria-label={`Move ${c.name} right`} title="Move column right" disabled={position === ds.columns.length} onClick={() => { addStep(ds.id, 'reorderColumns', { column: c.id, direction: 'right' }); close(); }}><ArrowRight size={15} /></button></div>
              <div className="column-position-control"><label htmlFor="column-target-position">Move to position</label><input id="column-target-position" type="number" min="1" max={ds.columns.length} step="1" inputMode="numeric" value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)} /><button type="button" className="btn icon-btn" aria-label={`Move ${c.name} to specified position`} title="Move to entered position" onClick={async () => { const n = Number(targetPosition); if (!Number.isInteger(n) || n < 1 || n > ds.columns.length) { await dialogs.alert(`Enter a position from 1 to ${ds.columns.length}.`, { title: 'Invalid column position', tone: 'error' }); return; } if (n !== position) addStep(ds.id, 'reorderColumns', { column: c.id, targetPosition: n }); close(); }}><MoveHorizontal size={15} /></button></div>
            </div>
            {isNumericType(c.type) && <label className="column-precision-control">Decimal places <select aria-label={`Decimal precision for ${c.name}`} value={String(c.precision ?? 3)} onChange={(e) => { addStep(ds.id, 'setPrecision', { column: c.id, precision: e.target.value }); close(); }}>{Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}</select></label>}
            <div className="column-icon-actions column-edit-actions"><button type="button" className="btn icon-btn" aria-label={`Rename ${c.name}`} title="Rename column" onClick={async () => { const next = await dialogs.prompt(`Rename column “${c.name}” to:`, c.name, { title: 'Rename column', confirmText: 'Save name' }); if (next === null) return; const name = next.trim(); if (!name) { await dialogs.alert('Column name cannot be empty.', { title: 'Invalid column name', tone: 'error' }); return; } if (ds.columns.some((other) => other.id !== c.id && other.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) { await dialogs.alert(`A column named “${name}” already exists.`, { title: 'Duplicate column name', tone: 'error' }); return; } if (name !== c.name) addStep(ds.id, 'renameColumn', { column: c.id, name }); close(); }}><PencilLine size={15} /><span>Rename</span></button><button type="button" className="btn icon-btn danger" aria-label={`Delete ${c.name}`} title="Delete column" disabled={ds.columns.length <= 1} onClick={async () => { if (await dialogs.confirm(`Delete column “${c.name}”? This adds a reversible cleaning step; you can remove that step from Clean data.`, { title: 'Delete column', confirmText: 'Delete column' })) { addStep(ds.id, 'deleteColumn', { column: c.id }); close(); } }}><Trash2 size={15} /><span>Delete</span></button></div>
          </section>
        </div>;
      })()}

      <section className="dataset-section dataset-preview-section">
        <div className="dataset-section-heading">
          <div><span className="dataset-section-kicker">RECORD INSPECTOR</span><h2><Table2 size={19} /> Data preview</h2><p>Inspect a page of records from the current dataset.</p></div>
          <div className="dataset-preview-count"><span className="dataset-live-dot" /> Showing {ds.rowCount.toLocaleString()} records</div>
        </div>
        <div className="scroll dataset-table-scroll"><table className="dataset-preview-table">
          <thead><tr><th className="dataset-row-number">#</th>{ds.columns.map((c) => <th key={c.id}>{c.name}</th>)}</tr></thead>
          <tbody>{Array.from({ length: end - start }, (_, k) => start + k).map((i) => (
            <tr key={i}><td className="dataset-row-number">{(i + 1).toLocaleString()}</td>{ds.columns.map((c, ci) => { const v = ds.data[c.id][i]; return <td key={c.id} className={isNumericType(c.type) ? 'num' : ''}>{v === null ? <span className="muted">null</span> : typeof v === 'number' ? fmt(v, c.precision ?? 3) : String(v)}</td>; })}</tr>
          ))}</tbody>
        </table></div>
        <div className="dataset-footer-actions">
          <div className="dataset-pager"><button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /> Previous</button><span>Page <strong>{page + 1}</strong> of <strong>{pages}</strong><small> · Rows {(start + 1).toLocaleString()}–{end.toLocaleString()} of {ds.rowCount.toLocaleString()}</small></span><button className="btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next <ChevronRight size={15} /></button></div>
          <button className="btn danger dataset-delete-action" onClick={async () => { if (await dialogs.confirm(`Delete ${ds.name} and its cleaning steps, analyses, charts and dashboards from this browser?`, { title: 'Delete dataset', confirmText: 'Delete dataset' })) remove(ds.id); }}><Trash2 size={14} /> Delete dataset</button>
        </div>
      </section>
    </div>
  );
}
