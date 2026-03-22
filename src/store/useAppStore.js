import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS } from '../scoring/composite';

const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Theme ────────────────────────────────────────────────────────────────
      darkMode: true,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // ── Current search ───────────────────────────────────────────────────────
      searchAddress: '',
      setSearchAddress: (addr) => set({ searchAddress: addr }),

      // Geocoding result
      location: null, // { lat, lon, display_name, address }
      setLocation: (loc) => set({ location: loc }),

      // Loading states
      isGeocoding: false,
      setIsGeocoding: (v) => set({ isGeocoding: v }),

      isScoring: false,
      setIsScoring: (v) => set({ isScoring: v }),

      // ── Property form ─────────────────────────────────────────────────────────
      propertyForm: {
        beds: 2,
        baths: 1,
        rent: '',
        targetBeds: 2,
        targetBaths: 1,
        medianRent: '',
      },
      setPropertyForm: (updates) =>
        set((state) => ({
          propertyForm: { ...state.propertyForm, ...updates },
        })),

      // ── Weights ───────────────────────────────────────────────────────────────
      weights: { ...DEFAULT_WEIGHTS },
      setWeight: (key, value) =>
        set((state) => ({
          weights: { ...state.weights, [key]: value },
        })),
      resetWeights: () => set({ weights: { ...DEFAULT_WEIGHTS } }),

      // ── Current scores ────────────────────────────────────────────────────────
      scores: null, // { crime, walk, property, proximity, composite }
      scoreDetails: null, // raw API details
      setScores: (scores, details) => set({ scores, scoreDetails: details }),
      clearScores: () => set({ scores: null, scoreDetails: null }),

      // ── Trader Joe's result ──────────────────────────────────────────────────
      traderJoes: null,
      setTraderJoes: (tj) => set({ traderJoes: tj }),

      // ── Saved comparisons ────────────────────────────────────────────────────
      savedProperties: [], // array of { id, address, location, scores, scoreDetails, propertyForm, savedAt }

      saveCurrentProperty: () => {
        const state = get();
        if (!state.scores || !state.location) return;

        const entry = {
          id: Date.now().toString(),
          address: state.location.display_name,
          location: state.location,
          scores: state.scores,
          scoreDetails: state.scoreDetails,
          propertyForm: { ...state.propertyForm },
          traderJoes: state.traderJoes,
          savedAt: new Date().toISOString(),
        };

        set((s) => ({
          savedProperties: [entry, ...s.savedProperties].slice(0, 10), // keep last 10
        }));
        return entry.id;
      },

      removeSavedProperty: (id) =>
        set((s) => ({
          savedProperties: s.savedProperties.filter((p) => p.id !== id),
        })),

      clearSaved: () => set({ savedProperties: [] }),

      loadSavedProperty: (id) => {
        const state = get();
        const entry = state.savedProperties.find((p) => p.id === id);
        if (!entry) return;
        set({
          location: entry.location,
          scores: entry.scores,
          scoreDetails: entry.scoreDetails,
          propertyForm: entry.propertyForm,
          traderJoes: entry.traderJoes,
          searchAddress: entry.address,
        });
      },

      // ── Error state ──────────────────────────────────────────────────────────
      error: null,
      setError: (err) => set({ error: err }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'homescouter-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        savedProperties: state.savedProperties,
        weights: state.weights,
        propertyForm: state.propertyForm,
      }),
    }
  )
);

export default useAppStore;
