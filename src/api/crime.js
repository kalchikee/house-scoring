/**
 * FBI Crime Data Explorer API — city-level crime scores.
 *
 * Lookup chain:
 *  1. City-level: find the city's police agency ORI → fetch crime for that ORI
 *  2. State-level: /estimate/state/{stateAbbr} if city lookup fails
 *  3. Hardcoded fallback table if both API calls fail
 */

const FBI_BASE = 'https://api.usa.gov/crime/fbi/cde';
const FBI_API_KEY = import.meta.env.VITE_FBI_API_KEY || 'iiHnOKfno2Mgkt5AynpvPpUQTEyxE27b2BNYyxfmTn4';

export const NATIONAL_AVG_RATE = 380;

// ── In-memory cache so we only fetch agency list once per state per session ──
const agencyCache = {};

async function getAgenciesForState(stateAbbr) {
  if (agencyCache[stateAbbr]) return agencyCache[stateAbbr];

  const url = `${FBI_BASE}/agency/byStateAbbr/${stateAbbr}?API_KEY=${FBI_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Agency lookup failed: ${res.status}`);

  const raw = await res.json();
  const agencies = Array.isArray(raw) ? raw : (raw?.data ?? []);
  agencyCache[stateAbbr] = agencies;
  return agencies;
}

/**
 * Match a city name against the agency list.
 * Prefers city police departments over county sheriffs.
 */
function findBestAgency(agencies, cityName) {
  if (!cityName || !agencies.length) return null;

  const city = cityName.toLowerCase().trim();

  const scored = agencies
    .map((a) => {
      const agencyCity = (a.city_name || '').toLowerCase().trim();
      const agencyName = (a.agency_name || a.pub_agency_name || '').toLowerCase();
      const agencyType = (a.agency_type_name || a.agency_type || '').toLowerCase();

      let score = 0;
      // City name match
      if (agencyCity === city) score += 10;
      else if (agencyCity.startsWith(city) || city.startsWith(agencyCity)) score += 6;
      else if (agencyCity.includes(city) || city.includes(agencyCity)) score += 3;

      // Agency name contains city
      if (agencyName.includes(city)) score += 2;

      // Prefer city police departments
      if (agencyType === 'city') score += 3;
      if (agencyName.includes('police dept') || agencyName.includes('police department')) score += 2;
      if (agencyName.includes('sheriff')) score -= 2;

      return { agency: a, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.agency ?? null;
}

/**
 * Parse offense records returned by the ORI endpoint into a usable crime summary.
 * Each record = one offense type for one year.
 */
function parseORIRecords(records) {
  // Group by year
  const byYear = {};
  for (const r of records) {
    const year = r.data_year ?? r.year;
    if (!year) continue;
    if (!byYear[year]) byYear[year] = { year, offenses: {}, population: 0 };
    const offense = (r.offense ?? '').toLowerCase().replace(/ /g, '-');
    byYear[year].offenses[offense] = (byYear[year].offenses[offense] ?? 0) + (r.actual ?? 0);
    if ((r.population ?? 0) > byYear[year].population) {
      byYear[year].population = r.population;
    }
  }

  // Find the most recent year that has violent crime data and a population
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);
  for (const year of years) {
    const { offenses, population } = byYear[year];
    if (population <= 0) continue;

    const violent =
      offenses['violent-crime'] ??
      ((offenses['homicide'] ?? offenses['murder'] ?? 0) +
        (offenses['rape-revised'] ?? offenses['rape-legacy'] ?? offenses['rape'] ?? 0) +
        (offenses['robbery'] ?? 0) +
        (offenses['aggravated-assault'] ?? 0));

    if (violent > 0) {
      return {
        year,
        violent,
        population,
        homicide: offenses['homicide'] ?? offenses['murder'] ?? null,
        rape: offenses['rape-revised'] ?? offenses['rape-legacy'] ?? offenses['rape'] ?? null,
        robbery: offenses['robbery'] ?? null,
        assault: offenses['aggravated-assault'] ?? null,
        propertyTotal: offenses['property-crime'] ?? null,
      };
    }
  }
  return null;
}

/** Try city-level lookup via ORI */
async function tryCityLevel(stateAbbr, cityName) {
  const agencies = await getAgenciesForState(stateAbbr);
  const agency = findBestAgency(agencies, cityName);
  if (!agency) throw new Error(`No agency found for "${cityName}"`);

  const ori = agency.ori;
  const url = `${FBI_BASE}/summarized/agency/byORI/${ori}?API_KEY=${FBI_API_KEY}&from=2019&to=2022`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ORI fetch failed: ${res.status}`);

  const raw = await res.json();
  const records = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const parsed = parseORIRecords(records);
  if (!parsed) throw new Error('No usable crime data for agency');

  const rate = (parsed.violent / parsed.population) * 100_000;
  return {
    rate: Math.round(rate),
    score: rateToScore(rate),
    source: 'city',
    breakdown: {
      year: parsed.year,
      homicide: parsed.homicide,
      rape: parsed.rape,
      robbery: parsed.robbery,
      assault: parsed.assault,
      violentTotal: parsed.violent,
      propertyTotal: parsed.propertyTotal,
      population: parsed.population,
    },
    agencyName: agency.agency_name ?? agency.pub_agency_name,
    details: { state: stateAbbr, city: cityName },
  };
}

/** Try state-level estimate endpoint */
async function tryStateLevel(stateAbbr) {
  const url = `${FBI_BASE}/estimate/state/${stateAbbr}?API_KEY=${FBI_API_KEY}&from=2019&to=2022`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`State estimate failed: ${res.status}`);

  const raw = await res.json();
  const rows = Array.isArray(raw) ? raw : (raw?.data ?? []);

  const valid = rows
    .filter((r) => r.violent_crime > 0 && r.population > 0)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  if (!valid.length) throw new Error('No state estimate data');

  const row = valid[0];
  const rate = (row.violent_crime / row.population) * 100_000;
  return {
    rate: Math.round(rate),
    score: rateToScore(rate),
    source: 'state',
    breakdown: {
      year: row.year,
      homicide: row.homicide ?? row.murder ?? null,
      rape: row.rape_revised ?? row.rape_legacy ?? row.rape ?? null,
      robbery: row.robbery ?? null,
      assault: row.aggravated_assault ?? row.agg_assault ?? null,
      violentTotal: row.violent_crime,
      propertyTotal: row.property_crime ?? null,
      population: row.population,
    },
    details: { state: stateAbbr },
  };
}

function rateToScore(rate) {
  return Math.max(0, Math.min(100, Math.round(100 - rate / 8)));
}

/**
 * Main export — fetch crime score, city-level when possible.
 * @param {string} stateAbbr - e.g. 'IL'
 * @param {string|null} cityName - e.g. 'Chicago'
 */
export async function fetchCrimeScore(stateAbbr, cityName) {
  if (!stateAbbr) {
    return { rate: NATIONAL_AVG_RATE, score: 50, source: 'default', details: null };
  }

  // Tier 1 — city-level ORI data
  if (cityName) {
    try {
      const result = await tryCityLevel(stateAbbr, cityName);
      console.info(`Crime: city-level data for ${cityName} (${result.agencyName}), score ${result.score}`);
      return result;
    } catch (err) {
      console.warn(`Crime city lookup failed for "${cityName}":`, err.message);
    }
  }

  // Tier 2 — state estimate
  try {
    const result = await tryStateLevel(stateAbbr);
    console.info(`Crime: state-level estimate for ${stateAbbr}, score ${result.score}`);
    return result;
  } catch (err) {
    console.warn(`Crime state estimate failed for ${stateAbbr}:`, err.message);
  }

  // Tier 3 — hardcoded fallback
  const fallbackRate = STATE_CRIME_FALLBACK[stateAbbr] ?? NATIONAL_AVG_RATE;
  return {
    rate: fallbackRate,
    score: rateToScore(fallbackRate),
    source: 'fallback',
    breakdown: null,
    details: { state: stateAbbr },
  };
}

export function getCrimeLabel(score) {
  if (score >= 85) return 'Very Safe';
  if (score >= 70) return 'Safe';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Elevated Risk';
  return 'High Crime';
}

export function compareToNational(rate) {
  const diff = rate - NATIONAL_AVG_RATE;
  const pct = Math.abs(Math.round((diff / NATIONAL_AVG_RATE) * 100));
  if (diff <= -50) return { text: `${pct}% below national average`, positive: true };
  if (diff <= 50)  return { text: 'Near national average', positive: null };
  return { text: `${pct}% above national average`, positive: false };
}

// State-level violent crime fallback rates per 100k (~2020-2022 FBI estimates)
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
