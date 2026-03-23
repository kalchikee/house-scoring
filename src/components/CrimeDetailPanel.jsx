import { NATIONAL_AVG_RATE, compareToNational, getCrimeLabel } from '../api/crime';
import { getScoreColor } from '../scoring/composite';

function Bar({ label, value, total, color }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-slate-400 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-16 text-right text-slate-300 font-mono">{value?.toLocaleString() ?? '—'}</span>
    </div>
  );
}

export default function CrimeDetailPanel({ crimeDetail, score }) {
  if (!crimeDetail) return null;

  const rate = crimeDetail.rate ?? 0;
  const comparison = compareToNational(rate);
  const label = getCrimeLabel(score);
  const color = getScoreColor(score);
  const { breakdown, source, details } = crimeDetail;
  const stateAbbr = details?.state ?? '??';

  const nationalBar = Math.min(100, (NATIONAL_AVG_RATE / 1000) * 100);
  const localBar = Math.min(100, (rate / 1000) * 100);

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-4 animate-fade-in">

      {/* Rate vs national average */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Violent Crime Rate (per 100k)</span>
          {source === 'fallback' && (
            <span className="text-xs px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/20">
              Historical avg
            </span>
          )}
          {source === 'api' && (
            <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">
              FBI {breakdown?.year ?? ''}
            </span>
          )}
        </div>

        {/* Local vs national bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20 text-slate-400 flex-shrink-0">{stateAbbr}</span>
            <div className="flex-1 h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${localBar}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-12 text-right font-mono text-slate-200 text-xs">{rate.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20 text-slate-500 flex-shrink-0">National avg</span>
            <div className="flex-1 h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-500 transition-all duration-700"
                style={{ width: `${nationalBar}%` }}
              />
            </div>
            <span className="w-12 text-right font-mono text-slate-500 text-xs">{NATIONAL_AVG_RATE.toLocaleString()}</span>
          </div>
        </div>

        <p
          className="text-xs mt-2 font-medium"
          style={{ color: comparison.positive === true ? '#22c55e' : comparison.positive === false ? '#f97316' : '#94a3b8' }}
        >
          {comparison.text}
        </p>
      </div>

      {/* Offense breakdown (only if we have real API data) */}
      {breakdown && (
        <div>
          <div className="text-xs font-medium text-slate-400 mb-2">Offense Breakdown (incidents)</div>
          <div className="space-y-1.5">
            <Bar label="Aggravated Assault" value={breakdown.assault}  total={breakdown.violentTotal} color="#f97316" />
            <Bar label="Robbery"            value={breakdown.robbery}  total={breakdown.violentTotal} color="#eab308" />
            <Bar label="Rape"               value={breakdown.rape}     total={breakdown.violentTotal} color="#a855f7" />
            <Bar label="Homicide"           value={breakdown.homicide} total={breakdown.violentTotal} color="#ef4444" />
          </div>
        </div>
      )}

      {/* Population note */}
      {breakdown?.population && (
        <p className="text-xs text-slate-600">
          State population: {(breakdown.population / 1_000_000).toFixed(1)}M ·{' '}
          {breakdown.violentTotal?.toLocaleString()} violent incidents
        </p>
      )}

      <a
        href="https://cde.ucr.cjis.gov/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        Source: FBI Crime Data Explorer ↗
      </a>
    </div>
  );
}
