import { Routes, Route, NavLink } from 'react-router-dom';
import { Database, Home, Lock, Eraser, Calculator } from 'lucide-react';
import { DatasetProvider } from './DatasetContext.jsx';
import HomePage from '../pages/HomePage.jsx';
import DatasetPage from '../pages/DatasetPage.jsx';
import CleanPage from '../pages/CleanPage.jsx';
import AnalysisPage from '../pages/AnalysisPage.jsx';

const upcoming = ['Charts', 'Dashboards'];

export default function App({ initialSources }) {
  return (
    <DatasetProvider initialSources={initialSources}>
      <div className="shell">
        <nav className="sidebar" aria-label="Main">
          <div className="brand">JSA</div>
          <NavLink to="/" end className="navlink"><Home size={16} aria-hidden /> Home</NavLink>
          <NavLink to="/dataset" className="navlink"><Database size={16} aria-hidden /> Datasets</NavLink>
          <NavLink to="/clean" className="navlink"><Eraser size={16} aria-hidden /> Clean</NavLink>
          <NavLink to="/analysis" className="navlink"><Calculator size={16} aria-hidden /> Analysis</NavLink>
          <div className="navgroup">Coming in later phases</div>
          {upcoming.map((n) => (
            <span key={n} className="navlink disabled" aria-disabled="true"><Lock size={14} aria-hidden /> {n}</span>
          ))}
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dataset" element={<DatasetPage />} />
            <Route path="/dataset/:id" element={<DatasetPage />} />
            <Route path="/clean" element={<CleanPage />} />
            <Route path="/clean/:id" element={<CleanPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/analysis/:id" element={<AnalysisPage />} />
          </Routes>
        </main>
      </div>
    </DatasetProvider>
  );
}
