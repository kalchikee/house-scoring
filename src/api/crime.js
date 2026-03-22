/**
 * FBI Crime Data Explorer API.
 * Endpoint works client-side (no CORS issues).
 * Fetches state-level violent crime summary data.
 */

const FBI_BASE = 'https://api.usa.gov/crime/fbi/cde';
const FBI_API_KEY = import.meta.env.VITE_FBI_API_KEY || 'iiHnOKfno2Mgkt5AynpvPpUQTEyxE27b2BNYyxfmTn4';

// National average violent crime rate per 100k (FBI, ~2019-2022 avg)
const NATIONAL_AVG_RATE = 380;

/**
 * Fetch state-level violent crime data.
 * @param {string} stateAbbr - e.g. 'IL', 'CA'
 * @returns {Promise<{rate: number, score: number, details: object}>}
 */
export async function fetchCrimeScore(stateAbbr) {
  if (!stateAbbr) {
    return { rate: NATIONAL_AVG_RATE, score: 50, details: null, source: 'default' };
  }

  try {
    const url = `${FBI_BASE}/summarized/agency/byStateAbbr/${stateAbbr}?API_KEY=${FBI_API_KEY}&from=2019&to=2022`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`FBI API error: ${res.status}`);
    const data = await res.json();

    // data is an array of agency records with offense counts
    // Sum all violent crime offenses and get estimated population
    const violentOffenseTypes = ['violent-crime', 'aggravated-assault', 'robbery', 'rape', 'murder'];

    let totalViolent = 0;
    let totalPopulation = 0;
    let recordCount = 0;

    if (Array.isArray(data)) {
      data.forEach((record) => {
        const offense = (record.offense || '').toLowerCase();
        if (violentOffenseTypes.some((t) => offense.includes(t.replace('-', ' ')))) {
          totalViolent += record.actual || 0;
        }
        if (record.population > 0) {
          totalPopulation = Math.max(totalPopulation, record.population);
        }
        recordCount++;
      });
    }

    // If we couldn't extract meaningful data, fall back
    if (totalPopulation === 0 || totalViolent === 0) {
      // Use a state-level lookup fallback
      const fallbackRate = STATE_CRIME_FALLBACK[stateAbbr] || NATIONAL_AVG_RATE;
      const score = Math.max(0, Math.min(100, Math.round(100 - (fallbackRate / 8))));
      return {
        rate: fallbackRate,
        score,
        source: 'fallback',
        details: { state: stateAbbr, note: 'Using historical average' },
      };
    }

    const ratePerHundredK = (totalViolent / totalPopulation) * 100000;
    // Score formula: 100 - (rate / 8), clamped 0-100
    const score = Math.max(0, Math.min(100, Math.round(100 - (ratePerHundredK / 8))));

    return {
      rate: Math.round(ratePerHundredK),
      score,
      source: 'api',
      details: {
        state: stateAbbr,
        totalViolent,
        population: totalPopulation,
        records: recordCount,
      },
    };
  } catch (err) {
    const fallbackRate = STATE_CRIME_FALLBACK[stateAbbr] || NATIONAL_AVG_RATE;
    const score = Math.max(0, Math.min(100, Math.round(100 - (fallbackRate / 8))));
    return {
      rate: fallbackRate,
      score,
      source: 'fallback',
      error: err.message,
      details: { state: stateAbbr },
    };
  }
}

// State-level violent crime fallback rates (per 100k, ~2020-2022 FBI estimates)
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
