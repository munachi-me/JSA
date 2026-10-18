import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Database, Plus, Search, Trash2, Save, Activity } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';
import { typeInfo, CHART_TYPES } from '../core/visualization/chartRegistry.js';
import { normalizeSpec } from '../core/visualization/chartSpec.js';
import { buildChartData } from '../core/visualization/chartData.js';
import ChartRenderer from '../components/charts/ChartRenderer.jsx';
import DatasetPicker, { useActiveDataset, NoDataset } from '../components/data/DatasetPicker.jsx';

export default function VisualizationPage() {
  const ds = useActiveDataset();
  if (!ds) return <NoDataset title="Charts" />;
  return <ChartLibrary key={ds.id} ds={ds} />;
}

function ChartLibrary({ ds }) {
  const { deleteViz } = useDatasets();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => ds.visualizations.filter((v) => `${v.title || ''} ${v.description || ''} ${typeInfo(v.type)?.label || v.type}`.toLowerCase().includes(query.trim().toLowerCase())), [ds.visualizations, query]);
  return <div className="page wide charts-page charts-library-page">
    <div className="dataset-page-heading charts-page-heading">
      <div className="dataset-heading-copy">
        <div className="dataset-eyebrow"><Database size={14} /> DATA WORKSPACE <span> / </span> CHART STUDIO</div>
        <h1>{ds.name}</h1>
        <p>Manage your visualizations, edit saved charts, and build new views of your data.</p>
      </div>
      <div className="dataset-heading-actions charts-heading-actions">
        <DatasetPicker ds={ds} base="charts" />
        <Link className="btn primary dataset-primary-action" to={`/chart-builder/${ds.id}`}><Plus size={16} /> Build chart <ArrowRight size={15} /></Link>
      </div>
    </div>

    <div className="charts-summary-grid" aria-label="Chart library summary">
      <div className="charts-summary-card"><span className="charts-summary-icon violet"><BarChart3 size={18} /></span><div><span>Saved charts</span><strong>{ds.visualizations.length.toLocaleString()}</strong><small>Saved in this workspace</small></div></div>
      <div className="charts-summary-card"><span className="charts-summary-icon blue"><Database size={18} /></span><div><span>Dataset size</span><strong>{ds.rowCount.toLocaleString()}</strong><small>Rows available for charts</small></div></div>
      <div className="charts-summary-card"><span className="charts-summary-icon green"><Activity size={18} /></span><div><span>Chart types</span><strong>{new Set(ds.visualizations.map((v) => v.type)).size}</strong><small>Of {CHART_TYPES.length} supported types used</small></div></div>
    </div>

    <section className="charts-saved-section charts-library-section">
      <div className="charts-saved-heading"><div><span className="charts-section-kicker">YOUR VISUALIZATIONS</span><h2><Save size={18} /> Chart library</h2><p>Open a chart to edit its configuration, or add it to a dashboard.</p></div><span className="charts-saved-count">{ds.visualizations.length} saved</span></div>
      {ds.visualizations.length > 0 && <label className="charts-search"><Search size={16} aria-hidden="true" /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search charts by name, description, or type" aria-label="Search saved charts" /></label>}
      {ds.visualizations.length === 0 ? <div className="charts-empty-saved charts-library-empty"><div className="charts-empty-icon"><BarChart3 size={22} /></div><div><h3>Your chart library is ready</h3><p>Create your first visualization from the current dataset. Preview it, adjust the settings, and save it here for reuse in dashboards.</p></div><Link className="btn primary" to={`/chart-builder/${ds.id}`}><Plus size={15} /> Build your first chart <ArrowRight size={14} /></Link></div>
        : filtered.length === 0 ? <div className="charts-no-results"><Search size={20} /><strong>No matching charts</strong><span>Try a different search term.</span><button className="btn" onClick={() => setQuery('')}>Clear search</button></div>
        : <div className="charts-saved-grid charts-library-grid">{filtered.map((v) => <SavedChartCard key={v.id} ds={ds} chart={v} onDelete={() => deleteViz(ds.id, v.id)} />)}</div>}
      <p className="muted small charts-storage-note">Saved charts are stored in this browser and can be added to dashboards.</p>
    </section>
  </div>;
}

function SavedChartCard({ ds, chart, onDelete }) {
  const spec = normalizeSpec(ds, chart);
  const preview = useMemo(() => { try { return { data: buildChartData(ds, spec) }; } catch (error) { return { error: error.message }; } }, [ds, spec]);
  return <article className="charts-saved-card charts-library-card">
    <div className="charts-saved-card-top"><span className="charts-saved-type"><BarChart3 size={14} /> {typeInfo(chart.type)?.label || chart.type}</span><button className="iconbtn" aria-label={`Delete chart ${chart.title || 'Untitled chart'}`} title="Delete chart" onClick={onDelete}><Trash2 size={14} aria-hidden="true" /></button></div>
    <h3 className="charts-library-card-title">{chart.title || 'Untitled chart'}</h3>
    <div className="charts-library-preview">{preview.error ? <div className="charts-library-preview-error">Preview unavailable: {preview.error}</div> : <ChartRenderer data={preview.data} spec={spec} />}</div>
    <p>{chart.description || 'Saved visualization ready to reuse in a dashboard.'}</p>
    <div className="charts-library-card-actions"><Link className="btn primary" to={`/chart-builder/${ds.id}?chart=${encodeURIComponent(chart.id)}`}>Edit chart <ArrowRight size={14} /></Link><Link className="btn" to={`/dashboards/${ds.id}`}>Open dashboards</Link></div>
  </article>;
}
