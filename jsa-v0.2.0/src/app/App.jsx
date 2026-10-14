import { Routes, Route, NavLink } from 'react-router-dom';
import { Database, Home, Lock } from 'lucide-react';
import { DatasetProvider } from './DatasetContext.jsx';
import HomePage from '../pages/HomePage.jsx';
import DatasetPage from '../pages/DatasetPage.jsx';

const upcoming = ['Analysis', 'Charts', 'Dashboards'];

export default function App() {
  return (
    <DatasetProvider>
      <div className="shell">
        <nav className="sidebar" aria-label="Main">
          <div className="brand">JSA</div>
          <NavLink to="/" end className="navlink"><Home size={16} aria-hidden /> Home</NavLink>
          <NavLink to="/dataset" className="navlink"><Database size={16} aria-hidden /> Datasets</NavLink>
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
          </Routes>
        </main>
      </div>
    </DatasetProvider>
  );
}
