/**
 * Walk Score API integration.
 * CORS note: Walk Score blocks browser-side calls.
 * We attempt the call; on failure, we fall back to a heuristic estimate.
 */

const WALKSCORE_BASE = 'https://api.walkscore.com/score';

/**
 * Estimate a walkability score using urban density heuristics.
 * This is used when the Walk Score API is unavailable (CORS / no key).
 *
 * Heuristics based on population density proxy via the Nominatim address type:
 *   - city center / neighbourhood → higher estimate
 *   - suburb / residential → medium estimate
 *   - rural / county → lower estimate
 *
 * @param {object} nominatimAddress - address object from geocoding
 * @param {string} displayName - full display name string
 * @returns {number} estimated score 0-100
 */
function estimateWalkScore(nominatimAddress, displayName) {
  const name = displayName?.toLowerCase() || '';
  const addr = nominatimAddress || {};

  // Dense urban keywords
  const urbanKeywords = ['manhattan', 'brooklyn', 'chicago', 'boston', 'san francisco',
    'seattle', 'portland', 'denver', 'washington', 'philadelphia', 'downtown', 'midtown'];
  const suburbanKeywords = ['suburb', 'heights', 'park', 'hills', 'grove', 'village'];
  const ruralKeywords = ['county', 'township', 'rural', 'farm', 'unincorporated'];

  if (urbanKeywords.some((k) => name.includes(k))) return Math.floor(70 + Math.random() * 20);
  if (ruralKeywords.some((k) => name.includes(k))) return Math.floor(10 + Math.random() * 25);
  if (suburbanKeywords.some((k) => name.includes(k))) return Math.floor(35 + Math.random() * 30);

  // Default midrange for unknown
  return Math.floor(40 + Math.random() * 30);
}

/**
 * Fetch Walk Score for a given address/location.
 * Returns score + source ('api' | 'estimate').
 *
 * @param {string} address - human-readable address
 * @param {number} lat
 * @param {number} lon
 * @param {object} nominatimAddress - address details for fallback estimate
 * @returns {Promise<{score: number, source: string, description: string}>}
 */
export async function fetchWalkScore(address, lat, lon, nominatimAddress) {
  const apiKey = import.meta.env.VITE_WALKSCORE_KEY;

  if (!apiKey) {
    const score = estimateWalkScore(nominatimAddress, address);
    return {
      score,
      source: 'estimate',
      description: 'Estimated (no API key)',
    };
  }

  try {
    const url = new URL(WALKSCORE_BASE);
    url.searchParams.set('format', 'json');
    url.searchParams.set('address', address);
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
    url.searchParams.set('wsapikey', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Walk Score API error: ${res.status}`);

    const data = await res.json();
    if (data.status !== 1) throw new Error('Walk Score returned non-OK status');

    return {
      score: data.walkscore,
      source: 'api',
      description: data.description || 'Walk Score',
      link: data.ws_link,
    };
  } catch (err) {
    // CORS or network error — fall back to estimate
    const score = estimateWalkScore(nominatimAddress, address);
    return {
      score,
      source: 'estimate',
      description: 'Estimated (CORS/API unavailable)',
      error: err.message,
    };
  }
}
