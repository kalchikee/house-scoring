import useAppStore from '../store/useAppStore';

const CATEGORIES = [
  { key: 'crime', label: 'Crime Safety', icon: '🛡️', color: 'indigo' },
  { key: 'walk', label: 'Walkability', icon: '🚶', color: 'violet' },
  { key: 'property', label: 'Property', icon: '🏠', color: 'purple' },
  { key: 'proximity', label: "Trader Joe's", icon: '🛒', color: 'fuchsia' },
];

const colorMap = {
  indigo: 'from-indigo-500 to-indigo-600',
  violet: 'from-violet-500 to-violet-600',
  purple: 'from-purple-500 to-purple-600',
  fuchsia: 'from-fuchsia-500 to-fuchsia-600',
};

const thumbColorMap = {
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
};

export default function WeightSliders() {
  const { weights, setWeight, resetWeights } = useAppStore();

  const total = Object.values(weights).reduce((s, v) => s + v, 0);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">Score Weights</h3>
          <p className="text-xs text-slate-500 mt-0.5">Adjust what matters most to you</p>
        </div>
        <button
          onClick={resetWeights}
          className="
            text-xs text-slate-400 hover:text-indigo-400 px-2 py-1
            rounded-lg border border-slate-600/30 hover:border-indigo-500/30
            transition-all duration-200
          "
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map(({ key, label, icon, color }) => {
          const pct = total > 0 ? Math.round((weights[key] / total) * 100) : 25;
          const hexColor = thumbColorMap[color];

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span className="text-xs font-medium text-slate-300">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400 w-8 text-right">{pct}%</span>
                  <span className="text-xs text-slate-600">({weights[key]})</span>
                </div>
              </div>

              {/* Slider */}
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights[key]}
                  onChange={(e) => setWeight(key, Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${hexColor} 0%, ${hexColor} ${weights[key]}%, rgba(71,85,105,0.5) ${weights[key]}%, rgba(71,85,105,0.5) 100%)`,
                    WebkitAppearance: 'none',
                  }}
                />
              </div>

              {/* Progress bar visualization */}
              <div className="mt-1.5 h-1 rounded-full bg-slate-700/40 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colorMap[color]} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Weight distribution pie-like visualization */}
      <div className="mt-4 pt-3 border-t border-slate-700/30">
        <div className="text-xs text-slate-500 mb-2">Distribution</div>
        <div className="flex rounded-full overflow-hidden h-2 gap-px">
          {CATEGORIES.map(({ key, color }) => {
            const pct = total > 0 ? (weights[key] / total) * 100 : 25;
            const hexColor = thumbColorMap[color];
            return (
              <div
                key={key}
                className="transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: hexColor }}
              />
            );
          })}
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          {CATEGORIES.map(({ key, label, icon }) => {
            const hexColor = thumbColorMap[CATEGORIES.find((c) => c.key === key)?.color];
            const pct = total > 0 ? Math.round((weights[key] / total) * 100) : 25;
            return (
              <div key={key} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hexColor }} />
                <span className="text-xs text-slate-500">{label.split(' ')[0]} {pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid currentColor;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
