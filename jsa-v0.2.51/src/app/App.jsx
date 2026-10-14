import { Routes, Route, NavLink } from 'react-router-dom';
import { Database, Home, Lock, Eraser, Calculator, BarChart3, LayoutDashboard, Lightbulb } from 'lucide-react';
import { DatasetProvider, useDatasets } from './DatasetContext.jsx';
import HomePage from '../pages/HomePage.jsx';
import DatasetPage from '../pages/DatasetPage.jsx';
import CleanPage from '../pages/CleanPage.jsx';
import AnalysisPage from '../pages/AnalysisPage.jsx';
import VisualizationPage from '../pages/VisualizationPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import InsightsPage from '../pages/InsightsPage.jsx';

const upcoming = ['Export & publish'];

function StorageBanner() {
  const { storageError, ready } = useDatasets();
  if (!ready) return <p className="muted" role="status">Loading your saved work…</p>;
  return storageError ? <div role="alert" className="alert error">{storageError}</div> : null;
}

export default function App({ initialSources, persist }) {
  return (
    <DatasetProvider initialSources={initialSources} persist={persist}>
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
          <div className="navgroup">Coming in later phases</div>
          {upcoming.map((n) => (
            <span key={n} className="navlink disabled" aria-disabled="true"><Lock size={14} aria-hidden /> {n}</span>
          ))}
        </nav>
        <main className="main">
          <StorageBanner />
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
        </main>
      </div>
    </DatasetProvider>
  );
}
