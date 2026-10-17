import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FlaskConical, ArrowUpRight, Database, Rows3, Columns3, Sparkles, Eraser, Calculator, BarChart3, LayoutDashboard, ShieldCheck, Clock3, FileSpreadsheet, WandSparkles, ArrowRight, HardDrive, CircleCheck, LoaderCircle } from 'lucide-react';
import { useDatasets } from '../app/DatasetContext.jsx';

const workflows = [
  { label: 'Clean data', detail: 'Fix types, filter rows and prepare columns.', to: '/clean', icon: Eraser, number: '01' },
  { label: 'Analyze', detail: 'Summarize values and compare groups.', to: '/analysis', icon: Calculator, number: '02' },
  { label: 'Visualize', detail: 'Build charts that explain the story.', to: '/charts', icon: BarChart3, number: '03' },
  { label: 'Create dashboard', detail: 'Bring key metrics into one view.', to: '/dashboards', icon: LayoutDashboard, number: '04' },
];

function WelcomeArtwork() {
  return <div className="home-welcome-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-panel art-panel-back"><span /><span /><span /><span /></div><div className="art-panel art-panel-front"><div className="art-panel-head"><i /><i /><i /></div><div className="art-bars"><i /><i /><i /><i /><i /><i /><i /></div><div className="art-panel-foot"><span /><span /></div></div><div className="art-spark"><Sparkles size={19} /></div></div>;
}

export default function HomePage() {
  const { importFile, loadSample, error, datasets, ready, persistent, storageError } = useDatasets();
  const input = useRef(null);
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const hasDatasets = ready && datasets.length > 0;
  const go = (ds) => ds && nav(`/dataset/${ds.id}`);
  const openSample = async () => {
    if (busy) return;
    setBusy(true);
    try { go(await loadSample()); } finally { setBusy(false); }
  };
  const openFile = async (file) => {
    if (!file || busy) return;
    setBusy(true);
    try { go(await importFile(file)); } finally { setBusy(false); }
  };
  const totalRows = datasets.reduce((sum, d) => sum + (Number(d.rowCount) || 0), 0);
  const totalColumns = datasets.reduce((sum, d) => sum + (Number(d.columns?.length) || 0), 0);
  const number = (value) => value.toLocaleString();

  return (
    <div className={`page wide home-dashboard ${hasDatasets ? 'home-returning' : 'home-onboarding'}`}>
      {!ready ? (
        <section className="home-loading-state" role="status"><span className="home-loading-icon"><LoaderCircle size={21} /></span><div><strong>Checking your workspace…</strong><p>Looking for datasets saved in this browser.</p></div></section>
      ) : hasDatasets ? (
        <section className="home-returning-hero">
          <div className="home-returning-copy">
            <span className="eyebrow home-eyebrow"><CircleCheck size={13} aria-hidden="true" /> WORKSPACE READY</span>
            <h1>Welcome back<span className="home-title-accent">.</span></h1>
            <p>Your work is here. Open a dataset to continue, or bring in something new.</p>
            <div className="home-returning-actions"><button className="btn primary home-import-btn" disabled={busy} onClick={() => input.current?.click()}><Upload size={16} aria-hidden="true" /> Import another dataset</button><span className="home-saved-note"><HardDrive size={14} aria-hidden="true" /> {persistent ? 'Saved in this browser' : 'Available in this session'}</span></div>
          </div>
          <WelcomeArtwork />
          <input ref={input} type="file" accept=".csv,.tsv,.txt,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; await openFile(f); }} />
        </section>
      ) : (
        <section className="home-welcome">
          <div className="home-welcome-copy">
            <span className="eyebrow home-eyebrow"><Sparkles size={13} aria-hidden="true" /> YOUR ANALYTICS WORKSPACE</span>
            <h1>Your next insight<span className="home-title-accent"> starts here.</span></h1>
            <p>Bring your data in, find the story, and turn it into clear charts and dashboards — without leaving your browser.</p>
            <div className="home-privacy"><ShieldCheck size={15} aria-hidden="true" /> Your files stay on this device. JSA doesn't upload your data.</div>
          </div>
          <WelcomeArtwork />
          <input ref={input} type="file" accept=".csv,.tsv,.txt,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; await openFile(f); }} />
        </section>
      )}

      {ready && <section className="home-stat-grid" aria-label="Workspace summary">
        <article className="home-stat-card"><div className="home-stat-icon violet"><Database size={18} aria-hidden="true" /></div><div><span>Open datasets</span><strong>{number(datasets.length)}</strong><small>{persistent ? 'Saved in this browser' : 'In this session'}</small></div></article>
        <article className="home-stat-card"><div className="home-stat-icon blue"><Rows3 size={18} aria-hidden="true" /></div><div><span>Total rows</span><strong>{number(totalRows)}</strong><small>Across open datasets</small></div></article>
        <article className="home-stat-card"><div className="home-stat-icon green"><Columns3 size={18} aria-hidden="true" /></div><div><span>Columns</span><strong>{number(totalColumns)}</strong><small>Across open datasets</small></div></article>
        <article className="home-stat-card"><div className="home-stat-icon amber"><FileSpreadsheet size={18} aria-hidden="true" /></div><div><span>Supported files</span><strong>CSV · TSV · JSON</strong><small>Up to 25 MB per file</small></div></article>
      </section>}

      {ready && <section className="home-primary-grid">
        <article className="home-panel home-import-panel">
          <div className="home-section-heading"><div><span className="eyebrow">{hasDatasets ? 'KEEP GOING' : 'START HERE'}</span><h2>{hasDatasets ? 'Add to your workspace' : 'Start with your data'}</h2></div><span className="home-step-badge">01</span></div>
          <p className="muted">{hasDatasets ? 'Bring in another file whenever you are ready.' : 'Import your own file or explore JSA with the sample sales dataset.'}</p>
          <div className={`home-dropzone ${hasDatasets ? 'home-dropzone-compact' : ''}`}>
            <div className="home-upload-icon"><Upload size={22} aria-hidden="true" /></div>
            <strong>{hasDatasets ? 'Have another dataset?' : 'Bring your data into JSA'}</strong>
            <span>CSV, TSV or JSON · Maximum 25 MB</span>
            <button className="btn primary home-import-btn" disabled={busy} onClick={() => input.current?.click()}><Upload size={16} aria-hidden="true" /> {hasDatasets ? 'Import dataset' : 'Import a dataset'} <ArrowUpRight size={15} aria-hidden="true" /></button>
          </div>
          <div className="home-import-footer"><button className="home-text-action" disabled={busy} onClick={openSample}><FlaskConical size={16} aria-hidden="true" /> {busy ? 'Preparing dataset…' : 'Try the sample sales dataset'} <ArrowUpRight size={14} aria-hidden="true" /></button><span className="home-format-note">No account needed</span></div>
          {busy && <p className="import-status muted" role="status">Reading and preparing your dataset… Please keep JSA open.</p>}
          {error && <div role="alert" className="alert error">{error}</div>}
        </article>

        <article className="home-panel home-workflow-panel">
          <div className="home-section-heading"><div><span className="eyebrow">YOUR WORKFLOW</span><h2>{hasDatasets ? 'What would you like to do?' : 'From data to decisions'}</h2></div><span className="home-step-badge">02</span></div>
          <div className="home-workflow-list">
            {workflows.map(({ label, detail, to, icon: Icon, number: step }) => <button className="home-workflow-item" key={to} onClick={() => nav(to)}><span className="workflow-icon"><Icon size={18} aria-hidden="true" /></span><span className="workflow-copy"><strong>{label}</strong><small>{detail}</small></span><span className="workflow-number">{step}</span><ArrowUpRight size={16} className="workflow-arrow" aria-hidden="true" /></button>)}
          </div>
        </article>
      </section>}

      {ready && <section className="home-panel home-datasets-panel">
        <div className="home-section-heading home-datasets-heading"><div><span className="eyebrow">{hasDatasets ? 'PICK UP WHERE YOU LEFT OFF' : 'YOUR WORKSPACE'}</span><h2>{hasDatasets ? 'Your datasets' : 'Your datasets will live here'}</h2><p className="muted">{hasDatasets ? 'Open a dataset to continue cleaning, analysis and reporting.' : 'Once you import a file, JSA can keep it available in this browser for your next visit.'}</p></div>{hasDatasets && <button className="btn home-view-all" onClick={() => nav('/dataset')}><Database size={15} aria-hidden="true" /> Dataset explorer <ArrowUpRight size={14} aria-hidden="true" /></button>}</div>
        {datasets.length === 0 ? <div className="home-empty-state"><div className="home-empty-icon"><Clock3 size={21} aria-hidden="true" /></div><div><strong>No datasets yet</strong><p>Import a file or load the sample sales data to start your first analysis.</p></div><button className="btn" disabled={busy} onClick={() => input.current?.click()}>Import first dataset <ArrowRight size={14} aria-hidden="true" /></button></div> : <div className="home-dataset-list">{datasets.map((d, index) => <button className="home-dataset-row" key={d.id} onClick={() => go(d)}><span className="dataset-file-icon"><FileSpreadsheet size={18} aria-hidden="true" /></span><span className="home-dataset-name"><strong>{d.name}</strong><small>{d.columns.length} columns <span>·</span> {d.pipeline?.steps?.length || 0} cleaning steps</small></span><span className="home-dataset-rows"><strong>{number(d.rowCount)}</strong><small>rows</small></span><span className="home-dataset-index">{String(index + 1).padStart(2, '0')}</span><ArrowUpRight size={17} className="workflow-arrow" aria-hidden="true" /></button>)}</div>}
      </section>}

      {ready && !hasDatasets && <section className="home-discovery-strip" aria-label="JSA features"><span className="home-discovery-icon"><WandSparkles size={17} aria-hidden="true" /></span><div><strong>One workspace. A complete data workflow.</strong><p>Clean, analyze, visualize and assemble dashboards from the same dataset.</p></div><span className="home-discovery-tag">Made for your data</span></section>}
      {ready && hasDatasets && <section className="home-returning-tip"><Sparkles size={15} aria-hidden="true" /><span><strong>Quick tip:</strong> Clean your data before analysis for more reliable results.</span><button onClick={() => nav('/clean')}>Explore cleaning <ArrowUpRight size={13} aria-hidden="true" /></button></section>}

      {storageError && <div className="alert error home-storage-alert" role="status">{storageError}</div>}
      <footer className="home-footer"><span><ShieldCheck size={14} aria-hidden="true" /> Private by design</span><span>JSA · JavaScript Analytics workspace</span></footer>
    </div>
  );
}
