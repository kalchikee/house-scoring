/**
 * Geocoding via Nominatim (OpenStreetMap) — free, no key required.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/**
 * Geocode a free-text address.
 * @param {string} address
 * @returns {Promise<{lat: number, lon: number, display_name: string, address: object}>}
 */
export async function geocodeAddress(address) {
  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'HouseScoring/1.0 (portfolio project)',
    },
  });

  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const data = await res.json();
  if (!data.length) throw new Error('No results found for that address.');

  const top = data[0];
  return {
    lat: parseFloat(top.lat),
    lon: parseFloat(top.lon),
    display_name: top.display_name,
    address: top.address || {},
    candidates: data.slice(0, 5).map((r) => ({
      display_name: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    })),
  };
}

/**
 * Reverse geocode lat/lon to address details.
 * @param {number} lat
 * @param {number} lon
 */
export async function reverseGeocode(lat, lon) {
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'HouseScoring/1.0 (portfolio project)',
    },
  });

  if (!res.ok) throw new Error(`Reverse geocoding failed: ${res.status}`);
  return res.json();
}

/**
 * Extract US state abbreviation from a Nominatim address object.
 */
export function getStateAbbr(nominatimAddress) {
  const stateMap = {
    Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
    Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
    Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
    Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
    Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
    Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
    Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
    Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
    Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
  };

  const state = nominatimAddress?.state;
  if (!state) return null;
  return stateMap[state] || state.substring(0, 2).toUpperCase();
}
