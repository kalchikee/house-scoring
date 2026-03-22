import { useEffect, useState, Suspense, lazy } from 'react';
import useAppStore from './store/useAppStore';
import AddressSearch from './components/AddressSearch';
import ScoreCard from './components/ScoreCard';
import RadarChart from './components/RadarChart';
import WeightSliders from './components/WeightSliders';
import PropertyForm from './components/PropertyForm';
import SavedProperties from './components/SavedProperties';
import ApiStatus from './components/ApiStatus';

const MapView = lazy(() => import('./components/MapView'));

function ErrorBanner() {
  const { error, clearError } = useAppStore();
  if (!error) return null;
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[2000] animate-slide-up w-full max-w-lg px-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm backdrop-blur-md shadow-xl">
        <span>⚠️</span>
        <span className="flex-1">{error}</span>
        <button onClick={clearError} className="text-red-300 hover:text-red-100">✕</button>
      </div>
    </div>
  );
}

// Left panel — controls
function LeftPanel({ open, onToggle }) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="
          fixed left-3 top-1/2 -translate-y-1/2 z-[1500]
          w-8 h-16 rounded-r-xl
          bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-md
          border border-l-0 border-slate-700/50
          text-slate-400 hover:text-slate-200
          flex items-center justify-center
          transition-all duration-200 shadow-xl
        "
        style={{ left: open ? '17rem' : '0' }}
        title={open ? 'Close panel' : 'Open controls'}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Panel */}
      <div
        className={`
          fixed left-0 top-14 bottom-0 z-[1400] w-72
          bg-slate-950/90 backdrop-blur-xl border-r border-slate-700/40
          transition-transform duration-300 ease-in-out
          overflow-y-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-3 space-y-3">
          <ApiStatus />
          <PropertyForm />
          <WeightSliders />
          <SavedProperties />
        </div>
      </div>
    </>
  );
}

// Right panel — scores
function RightPanel({ open, onToggle }) {
  const { scores } = useAppStore();

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`
          fixed right-3 top-1/2 -translate-y-1/2 z-[1500]
          w-8 h-16 rounded-l-xl
          bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-md
          border border-r-0 border-slate-700/50
          text-slate-400 hover:text-slate-200
          flex items-center justify-center
          transition-all duration-200 shadow-xl
        `}
        style={{ right: open ? '17rem' : '0' }}
        title={open ? 'Close scores' : 'Open scores'}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${open ? '' : 'rotate-180'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Panel */}
      <div
        className={`
          fixed right-0 top-14 bottom-0 z-[1400] w-72
          bg-slate-950/90 backdrop-blur-xl border-l border-slate-700/40
          transition-transform duration-300 ease-in-out
          overflow-y-auto
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-3 space-y-3">
          {scores ? (
            <>
              <ScoreCard />
              <RadarChart />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700/50 bg-slate-800/20 p-6 text-center mt-4">
              <div className="text-4xl mb-3">🏆</div>
              <div className="text-slate-400 font-medium mb-1 text-sm">Scores appear here</div>
              <div className="text-slate-600 text-xs">Search any address to begin</div>
              <div className="mt-5 grid grid-cols-5 gap-1.5">
                {[
                  { grade: 'A', range: '90+', color: '#22c55e' },
                  { grade: 'B', range: '80s', color: '#84cc16' },
                  { grade: 'C', range: '70s', color: '#eab308' },
                  { grade: 'D', range: '60s', color: '#f97316' },
                  { grade: 'F', range: '<60', color: '#ef4444' },
                ].map(({ grade, range, color }) => (
                  <div key={grade} className="flex flex-col items-center gap-1">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-base border"
                      style={{ color, borderColor: `${color}50`, backgroundColor: `${color}15` }}
                    >
                      {grade}
                    </div>
                    <span className="text-xs text-slate-600">{range}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const { darkMode, toggleDarkMode, scores } = useAppStore();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Auto-open right panel when scores arrive
  useEffect(() => {
    if (scores) setRightOpen(true);
  }, [scores?.composite]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Handle URL share params on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('s') && params.has('c')) {
      const sharedScores = {
        composite: Number(params.get('s')),
        crime: Number(params.get('c')),
        walk: Number(params.get('w')),
        property: Number(params.get('p')),
        proximity: Number(params.get('x')),
      };
      const addr = params.get('addr');
      if (addr) {
        useAppStore.getState().setSearchAddress(addr);
        useAppStore.getState().setLocation({ display_name: addr, lat: 0, lon: 0, address: {} });
        useAppStore.getState().setScores(sharedScores, null);
      }
    }
  }, []);

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      {/* ── Topbar ── */}
      <header className="fixed top-0 left-0 right-0 z-[1600] h-14 flex items-center px-4 gap-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
            </svg>
          </div>
          <span className="font-bold text-slate-100 text-sm hidden sm:block">House Scoring</span>
        </div>

        {/* Search bar — center, expands */}
        <div className="flex-1 max-w-xl mx-auto">
          <AddressSearch compact />
        </div>

        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 text-slate-400 hover:text-slate-200 transition-all"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14A7 7 0 0012 5z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      {/* ── Full-screen map ── */}
      <div className="fixed inset-0 top-14">
        <Suspense fallback={
          <div className="w-full h-full bg-slate-950 flex items-center justify-center">
            <div className="text-slate-500 text-sm animate-pulse">Loading map…</div>
          </div>
        }>
          <MapView fullscreen />
        </Suspense>
      </div>

      {/* ── Floating panels ── */}
      <ErrorBanner />
      <LeftPanel open={leftOpen} onToggle={() => setLeftOpen(v => !v)} />
      <RightPanel open={rightOpen} onToggle={() => setRightOpen(v => !v)} />
    </div>
  );
}
