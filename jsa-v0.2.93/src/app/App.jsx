import { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Database, Home, Eraser, Calculator, BarChart3, LayoutDashboard, Lightbulb, Download, ChevronDown, FileJson, FileSpreadsheet, Share2, ExternalLink } from 'lucide-react';
import { DatasetProvider, useDatasets } from './DatasetContext.jsx';
import { DialogProvider } from './DialogProvider.jsx';
import { datasetToCsv, datasetToJson, safeExportName } from '../core/export/datasetExport.js';
import HomePage from '../pages/HomePage.jsx';
import DatasetPage from '../pages/DatasetPage.jsx';
import CleanPage from '../pages/CleanPage.jsx';
import AnalysisPage from '../pages/AnalysisPage.jsx';
import VisualizationPage from '../pages/VisualizationPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import InsightsPage from '../pages/InsightsPage.jsx';

function StorageBanner() {
  const { storageError, ready } = useDatasets();
  if (!ready) return null;
  return storageError ? <div role="alert" className="alert error">{storageError}</div> : null;
}

function downloadFile(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ExportMenu() {
  const { datasets } = useDatasets();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const segments = location.pathname.split('/').filter(Boolean);
  const routeId = segments.length > 1 ? segments[1] : null;
  const ds = datasets.find((item) => item.id === routeId) || datasets[0] || null;
  const page = segments[0] || 'home';
  const pageLabel = ({ dataset: 'Datasets', clean: 'Clean', analysis: 'Analysis', charts: 'Charts', dashboards: 'Dashboards', insights: 'Insights' })[page] || 'Home';

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => { if (root.current && !root.current.contains(event.target)) setOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const exportDataset = (kind, format) => {
    if (!ds) return;
    const source = kind === 'original' ? ds.originalDataset : ds;
    const suffix = kind === 'original' ? 'original' : 'cleaned';
    const name = `${safeExportName(ds.name)}-${suffix}`;
    if (format === 'csv') downloadFile(datasetToCsv(source), `${name}.csv`, 'text/csv;charset=utf-8;');
    else downloadFile(datasetToJson(source), `${name}.json`, 'application/json;charset=utf-8;');
    setOpen(false);
  };
  const scrollTo = (id) => {
    setOpen(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  return <div className="export-menu" ref={root}>
    <button type="button" className={`navlink export-menu-trigger${open ? ' active' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
      <Download size={16} aria-hidden /> <span>Export &amp; Publish</span><ChevronDown size={14} aria-hidden className={`export-chevron${open ? ' open' : ''}`} />
    </button>
    {open && <div className="export-dropdown" role="menu" aria-label="Export and publish options">
      <div className="export-dropdown-heading"><span>Export data</span><span className="muted small">{ds ? ds.name : 'No dataset selected'}</span></div>
      {!ds ? <p className="muted small export-empty">Import a dataset to enable exports.</p> : <>
        <div className="export-section-label">Cleaned dataset · {ds.rowCount.toLocaleString()} rows</div>
        <button role="menuitem" className="export-option" onClick={() => exportDataset('cleaned', 'csv')}><FileSpreadsheet size={16} aria-hidden /><span><strong>Cleaned dataset (CSV)</strong><small>Current data after all successful cleaning steps</small></span></button>
        <button role="menuitem" className="export-option" onClick={() => exportDataset('cleaned', 'json')}><FileJson size={16} aria-hidden /><span><strong>Cleaned dataset (JSON)</strong><small>Re-importable array of row objects</small></span></button>
        <div className="export-section-label">Original dataset · {(ds.originalDataset?.rowCount ?? ds.sourceRowCount).toLocaleString()} rows</div>
        <button role="menuitem" className="export-option" onClick={() => exportDataset('original', 'csv')}><FileSpreadsheet size={16} aria-hidden /><span><strong>Original dataset (CSV)</strong><small>Untouched imported data</small></span></button>
        <button role="menuitem" className="export-option" onClick={() => exportDataset('original', 'json')}><FileJson size={16} aria-hidden /><span><strong>Original dataset (JSON)</strong><small>Untouched imported data</small></span></button>
      </>}
      {page === 'analysis' && <button role="menuitem" className="export-option" onClick={() => scrollTo('analysis-export-actions')}><ExternalLink size={16} aria-hidden /><span><strong>Analysis exports</strong><small>Jump to the current analysis results</small></span></button>}
      {page === 'charts' && <button role="menuitem" className="export-option" onClick={() => scrollTo('chart-export-actions')}><ExternalLink size={16} aria-hidden /><span><strong>Chart data export</strong><small>Download the current chart's plotted data</small></span></button>}
      {page === 'dashboards' && <button role="menuitem" className="export-option" onClick={() => scrollTo('dashboard-export-actions')}><ExternalLink size={16} aria-hidden /><span><strong>Dashboard exports</strong><small>Configuration, static HTML and interactive HTML</small></span></button>}
      <div className="export-publish-note"><Share2 size={15} aria-hidden /><span><strong>Publish online</strong><small>Hosted share links aren't available yet. Export a dashboard file to share it manually.</small></span></div>
      <div className="export-dropdown-footer">Context: {pageLabel}</div>
    </div>}
  </div>;
}

function AppRoutes() {
  const { ready } = useDatasets();
  if (!ready) return <p className="muted" role="status">Loading your saved work…</p>;
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dataset" element={<DatasetPage />} />
      <Route path="/dataset/:id" element={<DatasetPage />} />
      <Route path="/clean" element={<CleanPage />} />
      <Route path="/clean/:id" element={<CleanPage />} />
      <Route path="/charts" element={<VisualizationPage />} />
      <Route path="/charts/:id" element={<VisualizationPage />} />
      <Route path="/insights" element={<InsightsPage />} />
      <Route path="/insights/:id" element={<InsightsPage />} />
      <Route path="/dashboards" element={<DashboardPage />} />
      <Route path="/dashboards/:id" element={<DashboardPage />} />
      <Route path="/dashboards/:id/:did" element={<DashboardPage />} />
      <Route path="/analysis" element={<AnalysisPage />} />
      <Route path="/analysis/:id" element={<AnalysisPage />} />
    </Routes>
  );
}

export default function App({ initialSources, persist }) {
  return (
    <DatasetProvider initialSources={initialSources} persist={persist}>
      <DialogProvider>
        <div className="shell">
          <nav className="sidebar" aria-label="Main">
            <div className="brand">JSA</div>
            <NavLink to="/" end className="navlink"><Home size={16} aria-hidden /> Home</NavLink>
            <NavLink to="/dataset" className="navlink"><Database size={16} aria-hidden /> Datasets</NavLink>
            <NavLink to="/clean" className="navlink"><Eraser size={16} aria-hidden /> Clean</NavLink>
            <NavLink to="/analysis" className="navlink"><Calculator size={16} aria-hidden /> Analysis</NavLink>
            <NavLink to="/charts" className="navlink"><BarChart3 size={16} aria-hidden /> Charts</NavLink>
            <NavLink to="/insights" className="navlink"><Lightbulb size={16} aria-hidden /> Insights</NavLink>
            <NavLink to="/dashboards" className="navlink"><LayoutDashboard size={16} aria-hidden /> Dashboards</NavLink>
            <div className="navgroup">Workspace</div>
            <ExportMenu />
          </nav>
          <main className="main">
            <StorageBanner />
            <AppRoutes />
          </main>
        </div>
      </DialogProvider>
    </DatasetProvider>
  );
}
