import { useState, useEffect } from 'react';
// Import pages
import IngestionPage from './pages/IngestionPage';
import DashboardPage from './pages/DashboardPage';
import InvestigationPage from './pages/InvestigationPage';
import Navbar from './components/Navbar';

export default function App() {
  const [page, setPage] = useState('ingestion'); // 'ingestion' | 'dashboard' | 'investigation'

  function handleAnalysisComplete() {
    // Redirect to dashboard after upload
    setPage('dashboard');
  }

  function handleNavigate(target) {
    if (target) setPage(target);
  }

  // Listen for sidebar navigation events
  useEffect(() => {
    const handleCustomNav = (e) => {
      if (e.detail) setPage(e.detail);
    };

    window.addEventListener('navigate', handleCustomNav);
    return () => window.removeEventListener('navigate', handleCustomNav);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {page === 'ingestion' ? (
        <>
          {/* Ingestion Layout (Legacy/First Style) */}
          <Navbar activeLink="Ingestion" onNavigate={handleNavigate} />
          <IngestionPage onAnalysisComplete={handleAnalysisComplete} />
        </>
      ) : page === 'dashboard' ? (
        /* Dashboard Layout (New Style) */
        <DashboardPage />
      ) : page === 'investigation' ? (
        /* Investigation Layout */
        <InvestigationPage />
      ) : (
        <DashboardPage />
      )}
    </div>
  );
}
