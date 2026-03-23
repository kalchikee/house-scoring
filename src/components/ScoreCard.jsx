import { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { getGrade, getScoreColor } from '../scoring/composite';
import { getCrimeLabel } from '../api/crime';
import { getPropertyLabel } from '../scoring/propertyScorer';
import { formatDistance } from '../api/places';
import CrimeDetailPanel from './CrimeDetailPanel';

function ScoreRow({ icon, label, score, detail, source, warning, onClick, expanded }) {
  const color = getScoreColor(score);
  const clickable = !!onClick;

  return (
    <div
      className={`py-3 border-b border-slate-700/30 last:border-0 ${clickable ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg w-7 flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium text-slate-200 ${clickable ? 'group-hover:text-white' : ''}`}>
              {label}
            </span>
            {source === 'estimate' && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-md border border-yellow-500/20">
                Est.
              </span>
            )}
            {source === 'fallback' && (
              <span className="text-xs px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded-md border border-orange-500/20">
                Avg.
              </span>
            )}
            {warning && (
              <span title={warning} className="text-yellow-400 text-xs cursor-help">⚠️</span>
            )}
            {clickable && (
              <span className="text-xs text-slate-600 group-hover:text-slate-400 ml-auto">
                {expanded ? '▲ less' : '▼ details'}
              </span>
            )}
          </div>
          {detail && <div className="text-xs text-slate-500 mt-0.5 truncate">{detail}</div>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-sm font-bold w-8 text-right" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ScoreCard() {
  const { scores, scoreDetails, location, saveCurrentProperty } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [shareText, setShareText] = useState('Share');
  const [crimeExpanded, setCrimeExpanded] = useState(false);

  if (!scores) return null;

  const gradeInfo = getGrade(scores.composite);
  const { crime: crimeDetail, walk: walkDetail, property: propDetail, proximity: groceryDetail } = scoreDetails || {};

  const handleSave = () => {
    saveCurrentProperty();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleShare = () => {
    const params = new URLSearchParams({
      addr: location?.display_name || '',
      s: scores.composite,
      c: scores.crime,
      w: scores.walk,
      p: scores.property,
      x: scores.proximity,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard?.writeText(url).then(() => {
      setShareText('Copied!');
      setTimeout(() => setShareText('Share'), 2000);
    });
  };

  return (
    <div className="animate-slide-up space-y-4">
      {/* Composite score hero */}
      <div className={`
        relative overflow-hidden rounded-2xl border p-6
        bg-gradient-to-br from-slate-800/80 to-slate-900/80
        backdrop-blur-sm ${gradeInfo.borderClass}
      `}>
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: gradeInfo.color }}
        />

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className={`
              w-24 h-24 rounded-2xl flex flex-col items-center justify-center
              border-2 ${gradeInfo.borderClass} ${gradeInfo.bgClass}
            `}>
              <span className={`text-4xl font-black ${gradeInfo.textClass}`}>
                {gradeInfo.grade}
              </span>
            </div>
            <span className={`text-xs font-semibold ${gradeInfo.textClass}`}>{gradeInfo.label}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-5xl font-black ${gradeInfo.textClass}`}>{scores.composite}</span>
              <span className="text-slate-500 text-lg font-medium">/100</span>
            </div>
            <div className="text-slate-300 font-medium text-sm mb-3 truncate">
              {location?.display_name?.split(',').slice(0, 2).join(',')}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Crime', score: scores.crime },
                { label: 'Walk', score: scores.walk },
                { label: 'Property', score: scores.property },
                { label: 'Grocery', score: scores.proximity },
              ].map(({ label, score }) => (
                <div
                  key={label}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/50 border border-slate-600/30"
                >
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-bold" style={{ color: getScoreColor(score) }}>{score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className={`
              flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${saved
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'bg-slate-700/50 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-600/30 hover:border-indigo-500/30'
              }
            `}
          >
            {saved ? '✓ Saved' : '+ Save'}
          </button>
          <button
            onClick={handleShare}
            className="
              flex-1 py-2 rounded-xl text-sm font-semibold
              bg-slate-700/50 hover:bg-slate-600/50 text-slate-300
              border border-slate-600/30 transition-all duration-200
            "
          >
            {shareText === 'Copied!' ? '✓ Copied!' : '↗ Share'}
          </button>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/30">
          <h3 className="text-sm font-semibold text-slate-300">Score Breakdown</h3>
        </div>
        <div className="px-4">

          {/* Crime — clickable with expandable detail */}
          <ScoreRow
            icon="🛡️"
            label="Crime Safety"
            score={scores.crime}
            detail={[
              crimeDetail?.rate && `${crimeDetail.rate.toLocaleString()}/100k violent`,
              crimeDetail?.details?.state && `State: ${crimeDetail.details.state}`,
              crimeDetail?.score && getCrimeLabel(crimeDetail.score),
            ].filter(Boolean).join(' · ')}
            source={crimeDetail?.source}
            warning={crimeDetail?.source === 'fallback' ? 'Using historical state average — FBI API unavailable' : null}
            onClick={() => setCrimeExpanded(v => !v)}
            expanded={crimeExpanded}
          />
          {crimeExpanded && (
            <div className="pb-3">
              <CrimeDetailPanel crimeDetail={crimeDetail} score={scores.crime} />
            </div>
          )}

          <ScoreRow
            icon="🚶"
            label="Walkability"
            score={scores.walk}
            detail={walkDetail?.description || 'Walk Score'}
            source={walkDetail?.source}
            warning={walkDetail?.source === 'estimate' ? 'Estimated — add Walk Score API key for exact data' : null}
          />

          <ScoreRow
            icon="🏠"
            label="Property Match"
            score={scores.property}
            detail={propDetail?.breakdown ? [
              `${propDetail.breakdown.beds.actual}bd / ${propDetail.breakdown.baths.actual}ba`,
              propDetail.breakdown.rent.actual > 0 && `$${propDetail.breakdown.rent.actual.toLocaleString()}/mo`,
              propDetail.breakdown.rent.median > 0 && `Median: $${propDetail.breakdown.rent.median.toLocaleString()}`,
            ].filter(Boolean).join(' · ') : 'Enter property details'}
            source="manual"
          />

          <ScoreRow
            icon="🛒"
            label="Nearest Grocery"
            score={scores.proximity}
            detail={
              groceryDetail?.found
                ? `${groceryDetail.name || 'Grocery Store'} — ${formatDistance(groceryDetail.distance)}`
                : groceryDetail?.message || 'Add Google Places key'
            }
            source={groceryDetail?.source}
            warning={!import.meta.env.VITE_GOOGLE_PLACES_KEY ? 'Add VITE_GOOGLE_PLACES_KEY to enable' : null}
          />

        </div>
      </div>
    </div>
  );
}
