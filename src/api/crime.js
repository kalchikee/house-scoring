/**
 * FBI Crime Data Explorer API — state-level estimated crime rates.
 * Uses the /estimate/state/ endpoint which returns clean per-state totals.
 * No CORS issues — this endpoint works client-side.
 */

const FBI_BASE = 'https://api.usa.gov/crime/fbi/cde';
const FBI_API_KEY = import.meta.env.VITE_FBI_API_KEY || 'iiHnOKfno2Mgkt5AynpvPpUQTEyxE27b2BNYyxfmTn4';

// National average violent crime rate per 100k (FBI ~2020-2022)
const NATIONAL_AVG_RATE = 380;

/**
 * Fetch state-level estimated violent crime data.
 * @param {string} stateAbbr - e.g. 'IL', 'CA'
 * @returns {Promise<object>} score + detail breakdown
 */
export async function fetchCrimeScore(stateAbbr) {
  if (!stateAbbr) {
    return buildResult(NATIONAL_AVG_RATE, 'default', null, stateAbbr);
  }

  try {
    // The estimate endpoint returns state-level totals — much easier to parse
    const url = `${FBI_BASE}/estimate/state/${stateAbbr}?API_KEY=${FBI_API_KEY}&from=2019&to=2022`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`FBI API ${res.status}`);

    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data?.data ?? []);

    if (!rows.length) throw new Error('No data returned');

    // Use the most recent year with both violent_crime and population
    const valid = rows
      .filter((r) => r.violent_crime > 0 && r.population > 0)
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

    if (!valid.length) throw new Error('No usable rows');

    const row = valid[0];
    const rate = (row.violent_crime / row.population) * 100_000;

    const breakdown = {
      year: row.year,
      homicide: row.homicide ?? row.murder ?? null,
      rape: row.rape_revised ?? row.rape_legacy ?? row.rape ?? null,
      robbery: row.robbery ?? null,
      assault: row.aggravated_assault ?? row.agg_assault ?? null,
      violentTotal: row.violent_crime,
      propertyTotal: row.property_crime ?? null,
      population: row.population,
    };

    return buildResult(rate, 'api', breakdown, stateAbbr);
  } catch (err) {
    console.warn('FBI API error, using fallback:', err.message);
    const fallbackRate = STATE_CRIME_FALLBACK[stateAbbr] ?? NATIONAL_AVG_RATE;
    return buildResult(fallbackRate, 'fallback', null, stateAbbr);
  }
}

function buildResult(ratePerHundredK, source, breakdown, stateAbbr) {
  const score = Math.max(0, Math.min(100, Math.round(100 - ratePerHundredK / 8)));
  return {
    rate: Math.round(ratePerHundredK),
    score,
    source,
    breakdown,
    details: { state: stateAbbr },
  };
}

/**
 * Contextual label for a crime score.
 */
export function getCrimeLabel(score) {
  if (score >= 85) return 'Very Safe';
  if (score >= 70) return 'Safe';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Elevated Risk';
  return 'High Crime';
}

/**
 * Compare a rate to the national average.
 */
export function compareToNational(rate) {
  const diff = rate - NATIONAL_AVG_RATE;
  const pct = Math.abs(Math.round((diff / NATIONAL_AVG_RATE) * 100));
  if (diff <= -50) return { text: `${pct}% below national average`, positive: true };
  if (diff <= 50)  return { text: 'Near national average', positive: null };
  return { text: `${pct}% above national average`, positive: false };
}

export { NATIONAL_AVG_RATE };

// State-level fallback violent crime rates per 100k (~2020-2022 FBI estimates)
const STATE_CRIME_FALLBACK = {
  AL: 490, AK: 837, AZ: 480, AR: 550, CA: 440,
  CO: 400, CT: 200, DE: 400, FL: 385, GA: 340,
  HI: 250, ID: 230, IL: 420, IN: 370, IA: 270,
  KS: 410, KY: 230, LA: 580, ME: 115, MD: 440,
  MA: 330, MI: 440, MN: 260, MS: 310, MO: 510,
  MT: 440, NE: 290, NV: 510, NH: 150, NJ: 210,
  NM: 780, NY: 350, NC: 380, ND: 290, OH: 290,
  OK: 440, OR: 290, PA: 310, RI: 220, SC: 490,
  SD: 400, TN: 640, TX: 430, UT: 240, VT: 160,
  VA: 210, WA: 320, WV: 330, WI: 290, WY: 220,
  DC: 990,
};
