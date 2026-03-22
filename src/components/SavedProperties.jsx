import { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { getGrade, getScoreColor } from '../scoring/composite';

export default function SavedProperties() {
  const { savedProperties, removeSavedProperty, loadSavedProperty, clearSaved } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  if (savedProperties.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-semibold text-slate-300">Saved ({savedProperties.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); clearSaved(); }}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-0.5 rounded border border-red-500/20 hover:border-red-400/30 transition-all"
          >
            Clear all
          </button>
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-2 animate-fade-in">
          {savedProperties.map((p) => {
            const gradeInfo = getGrade(p.scores.composite);
            const shortAddr = p.address.split(',').slice(0, 2).join(',');
            const savedDate = new Date(p.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 border border-slate-600/20 hover:border-slate-600/40 transition-all group"
              >
                {/* Grade badge */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 border ${gradeInfo.borderClass} ${gradeInfo.bgClass} ${gradeInfo.textClass}`}
                >
                  {gradeInfo.grade}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{shortAddr}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: gradeInfo.color }}>
                      {p.scores.composite}/100
                    </span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">
                      {p.propertyForm.beds}bd/{p.propertyForm.baths}ba
                    </span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-600">{savedDate}</span>
                  </div>
                  {/* Mini score bars */}
                  <div className="flex gap-1 mt-1.5">
                    {[p.scores.crime, p.scores.walk, p.scores.property, p.scores.proximity].map((s, i) => (
                      <div key={i} className="flex-1 h-1 rounded-full bg-slate-600/30 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${s}%`, backgroundColor: getScoreColor(s) }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => loadSavedProperty(p.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => removeSavedProperty(p.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
