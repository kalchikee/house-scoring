import { useState } from 'react';
import useAppStore from '../store/useAppStore';
import { scoreProperty } from '../api/property';
import { calculateComposite } from '../scoring/composite';
import { fetchWalkScore } from '../api/walkScore';
import { fetchCrimeScore } from '../api/crime';
import { findNearestTraderJoes } from '../api/places';
import { getStateAbbr } from '../api/geocoding';

const BATH_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4];

export default function PropertyForm() {
  const {
    propertyForm, setPropertyForm,
    location, scores, setScores, setTraderJoes, traderJoes,
    weights, scoreDetails,
    isScoring, setIsScoring,
  } = useAppStore();

  const [collapsed, setCollapsed] = useState(false);

  const handleChange = (field, value) => {
    setPropertyForm({ [field]: value });
  };

  // Re-run property score and update composite whenever form changes
  const handleRecalculate = () => {
    if (!scores) return;

    const propResult = scoreProperty(
      {
        beds: propertyForm.beds,
        baths: propertyForm.baths,
        rent: Number(propertyForm.rent) || 0,
      },
      {
        targetBeds: propertyForm.targetBeds,
        targetBaths: propertyForm.targetBaths,
        medianRent: Number(propertyForm.medianRent) || 0,
      }
    );

    const newRawScores = {
      crime: scores.crime,
      walk: scores.walk,
      property: propResult.score,
      proximity: scores.proximity,
    };

    const composite = calculateComposite(newRawScores, weights);

    setScores(
      { ...newRawScores, composite },
      { ...scoreDetails, property: propResult }
    );
  };

  const StepButton = ({ value, onInc, onDec, label, min = 0, max = 10 }) => (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <div className="flex items-center gap-2">
        <button
          onClick={onDec}
          disabled={value <= min}
          className="
            w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50
            text-slate-300 hover:text-white font-bold
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150 flex items-center justify-center
          "
        >−</button>
        <span className="text-base font-bold text-slate-100 w-6 text-center">{value}</span>
        <button
          onClick={onInc}
          disabled={value >= max}
          className="
            w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50
            text-slate-300 hover:text-white font-bold
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-150 flex items-center justify-center
          "
        >+</button>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🏠</span>
          <span className="text-sm font-semibold text-slate-300">Property Details</span>
        </div>
        <div className="flex items-center gap-2">
          {scores && (
            <span className="text-xs text-slate-500 bg-slate-700/40 px-2 py-0.5 rounded-md">
              Score: {scores.property}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Your Requirements */}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Your Requirements
            </div>
            <div className="flex gap-6">
              <StepButton
                label="Target Beds"
                value={propertyForm.targetBeds}
                min={0} max={8}
                onInc={() => handleChange('targetBeds', propertyForm.targetBeds + 1)}
                onDec={() => handleChange('targetBeds', propertyForm.targetBeds - 1)}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Target Baths</span>
                <select
                  value={propertyForm.targetBaths}
                  onChange={(e) => handleChange('targetBaths', Number(e.target.value))}
                  className="bg-slate-700/50 border border-slate-600/30 text-slate-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                >
                  {BATH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actual Property */}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              This Property
            </div>
            <div className="flex gap-6 mb-3">
              <StepButton
                label="Beds"
                value={propertyForm.beds}
                min={0} max={8}
                onInc={() => handleChange('beds', propertyForm.beds + 1)}
                onDec={() => handleChange('beds', propertyForm.beds - 1)}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Baths</span>
                <select
                  value={propertyForm.baths}
                  onChange={(e) => handleChange('baths', Number(e.target.value))}
                  className="bg-slate-700/50 border border-slate-600/30 text-slate-200 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                >
                  {BATH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rent inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Monthly Rent ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    value={propertyForm.rent}
                    onChange={(e) => handleChange('rent', e.target.value)}
                    placeholder="e.g. 2200"
                    className="
                      w-full pl-7 pr-3 py-2 rounded-lg text-sm
                      bg-slate-700/50 border border-slate-600/30
                      text-slate-200 placeholder-slate-600
                      focus:outline-none focus:ring-1 focus:ring-indigo-500/50
                    "
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500">Area Median ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    value={propertyForm.medianRent}
                    onChange={(e) => handleChange('medianRent', e.target.value)}
                    placeholder="e.g. 1900"
                    className="
                      w-full pl-7 pr-3 py-2 rounded-lg text-sm
                      bg-slate-700/50 border border-slate-600/30
                      text-slate-200 placeholder-slate-600
                      focus:outline-none focus:ring-1 focus:ring-indigo-500/50
                    "
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recalculate button */}
          {scores && (
            <button
              onClick={handleRecalculate}
              className="
                w-full py-2 rounded-xl text-sm font-semibold
                bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300
                border border-indigo-500/30 hover:border-indigo-500/50
                transition-all duration-200
              "
            >
              Recalculate Score
            </button>
          )}
        </div>
      )}
    </div>
  );
}
