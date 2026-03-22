import { useState, useRef, useEffect } from 'react';
import useAppStore from '../store/useAppStore';
import { geocodeAddress, getStateAbbr } from '../api/geocoding';
import { fetchWalkScore } from '../api/walkScore';
import { fetchCrimeScore } from '../api/crime';
import { findNearestTraderJoes, proximityScore } from '../api/places';
import { scoreProperty } from '../api/property';
import { calculateComposite } from '../scoring/composite';

export default function AddressSearch({ compact = false }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const {
    isGeocoding, setIsGeocoding,
    isScoring, setIsScoring,
    setLocation, setScores, setTraderJoes,
    setError, clearError,
    weights, propertyForm,
  } = useAppStore();

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await geocodeAddress(val);
        setSuggestions(result.candidates || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const runFullScoring = async (lat, lon, address, nominatimAddr) => {
    setIsScoring(true);
    clearError();

    try {
      const stateAbbr = getStateAbbr(nominatimAddr);

      // Run all API calls in parallel
      const [walkResult, crimeResult, tjResult] = await Promise.all([
        fetchWalkScore(address, lat, lon, nominatimAddr),
        fetchCrimeScore(stateAbbr),
        findNearestTraderJoes(lat, lon),
      ]);

      setTraderJoes(tjResult);

      // Property scoring from form
      const propForm = propertyForm;
      const propResult = scoreProperty(
        { beds: propForm.beds, baths: propForm.baths, rent: Number(propForm.rent) || 0 },
        { targetBeds: propForm.targetBeds, targetBaths: propForm.targetBaths, medianRent: Number(propForm.medianRent) || 0 }
      );

      const rawScores = {
        crime: crimeResult.score,
        walk: walkResult.score,
        property: propResult.score,
        proximity: tjResult.score ?? 50,
      };

      const composite = calculateComposite(rawScores, weights);

      setScores(
        { ...rawScores, composite },
        {
          crime: crimeResult,
          walk: walkResult,
          property: propResult,
          proximity: tjResult,
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScoring(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    setInputValue(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);

    setIsGeocoding(true);
    clearError();

    try {
      const full = await geocodeAddress(suggestion.display_name);
      setLocation(full);
      await runFullScoring(full.lat, full.lon, full.display_name, full.address);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    setIsGeocoding(true);
    clearError();
    setShowSuggestions(false);

    try {
      const result = await geocodeAddress(inputValue);
      setLocation(result);
      setInputValue(result.display_name);
      await runFullScoring(result.lat, result.lon, result.display_name, result.address);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const isLoading = isGeocoding || isScoring;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          {/* Search icon */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Enter an address, city, or neighborhood..."
            disabled={isLoading}
            className={`
              w-full pl-11 pr-4 rounded-xl
              bg-slate-800/60 border border-slate-700/50
              text-slate-100 placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              backdrop-blur-sm text-sm
              ${compact ? 'py-2' : 'py-3.5'}
            `}
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading || !inputValue.trim()}
          className={`
            rounded-xl font-semibold text-sm
            bg-gradient-to-r from-indigo-600 to-violet-600
            hover:from-indigo-500 hover:to-violet-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-glow
            hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]
            active:scale-95 whitespace-nowrap
            ${compact ? 'px-4 py-2' : 'px-6 py-3.5'}
          `}
        >
          {isLoading ? 'Scoring…' : 'Score It'}
        </button>
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-2 z-50
          bg-slate-800 border border-slate-700/50 rounded-xl
          shadow-2xl overflow-hidden animate-fade-in
        ">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelectSuggestion(s)}
              className="
                w-full px-4 py-3 text-left text-sm
                text-slate-300 hover:text-white
                hover:bg-indigo-600/20 border-b border-slate-700/30
                last:border-0 transition-colors duration-150
                flex items-start gap-3
              "
            >
              <svg className="w-4 h-4 mt-0.5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-2">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
