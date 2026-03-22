/**
 * Small banner showing which APIs are configured.
 */
export default function ApiStatus() {
  const hasWalkScore = !!import.meta.env.VITE_WALKSCORE_KEY;
  const hasGooglePlaces = !!import.meta.env.VITE_GOOGLE_PLACES_KEY;
  const hasFBI = !!(import.meta.env.VITE_FBI_API_KEY || true); // has default key

  const apis = [
    { name: 'Crime (FBI)', active: hasFBI, icon: '🛡️' },
    { name: 'Walk Score', active: hasWalkScore, icon: '🚶', hint: 'Add VITE_WALKSCORE_KEY' },
    { name: "Trader Joe's", active: hasGooglePlaces, icon: '🛒', hint: 'Add VITE_GOOGLE_PLACES_KEY' },
    { name: 'Geocoding', active: true, icon: '📍' },
  ];

  const allActive = apis.every((a) => a.active);
  if (allActive) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-amber-400 mb-1.5">Some APIs not configured</div>
          <div className="flex flex-wrap gap-2">
            {apis.map(({ name, active, icon, hint }) => (
              <div
                key={name}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border
                  ${active
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-slate-700/30 border-slate-600/20 text-slate-400'
                  }`}
                title={!active && hint ? hint : ''}
              >
                <span>{icon}</span>
                <span>{name}</span>
                <span>{active ? '✓' : '○'}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            App still works — unconfigured scores use estimates. See{' '}
            <code className="text-slate-400">.env.example</code> for setup.
          </p>
        </div>
      </div>
    </div>
  );
}
