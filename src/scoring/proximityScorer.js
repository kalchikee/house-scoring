/**
 * Proximity scoring for Trader Joe's (and future amenities).
 */

/**
 * Tier definitions for proximity scoring.
 */
export const PROXIMITY_TIERS = [
  { maxMiles: 0.5, score: 100, label: 'Walking distance' },
  { maxMiles: 1, score: 85, label: 'Very close' },
  { maxMiles: 2, score: 65, label: 'Close' },
  { maxMiles: 5, score: 40, label: 'Moderate' },
  { maxMiles: 10, score: 15, label: 'Far' },
  { maxMiles: Infinity, score: 0, label: 'Very far' },
];

/**
 * Get proximity tier info for a given distance.
 * @param {number} miles
 * @returns {{score: number, label: string, maxMiles: number}}
 */
export function getProximityTier(miles) {
  if (miles == null || isNaN(miles)) {
    return { score: 0, label: 'Unknown', maxMiles: null };
  }
  return PROXIMITY_TIERS.find((t) => miles < t.maxMiles) || PROXIMITY_TIERS[PROXIMITY_TIERS.length - 1];
}
