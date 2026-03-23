/**
 * Nearest grocery store via Google Maps JavaScript API (Places library).
 * The JS API loader approach works client-side.
 * Falls back gracefully if no API key is set.
 */

import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance = null;
let placesServiceEl = null;
let placesService = null;
let googleLoaded = false;

async function initGoogle(apiKey) {
  if (googleLoaded) return true;

  loaderInstance = new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  try {
    await loaderInstance.load();
    placesServiceEl = document.createElement('div');
    document.body.appendChild(placesServiceEl);
    const map = new window.google.maps.Map(placesServiceEl, { center: { lat: 0, lng: 0 }, zoom: 1 });
    placesService = new window.google.maps.places.PlacesService(map);
    googleLoaded = true;
    return true;
  } catch (err) {
    console.error('Google Maps failed to load:', err);
    return false;
  }
}

/**
 * Find the nearest grocery store to a given lat/lon.
 */
export async function findNearestGrocery(lat, lon) {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY;

  if (!apiKey) {
    return {
      found: false,
      source: 'no-key',
      score: null,
      message: 'Add VITE_GOOGLE_PLACES_KEY to enable grocery proximity scoring',
    };
  }

  const loaded = await initGoogle(apiKey);
  if (!loaded) {
    return { found: false, source: 'load-error', score: null, message: 'Google Maps failed to initialize' };
  }

  return new Promise((resolve) => {
    const location = new window.google.maps.LatLng(lat, lon);
    const request = {
      location,
      radius: 25000, // 25km (~15.5 miles)
      type: 'supermarket',
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !results?.length) {
        resolve({
          found: false,
          source: 'api',
          score: 0,
          message: 'No grocery stores found within 15 miles',
        });
        return;
      }

      const closest = results[0];
      const storeLocation = closest.geometry.location;
      const distanceMeters = window.google.maps.geometry.spherical.computeDistanceBetween(
        location,
        storeLocation
      );
      const distanceMiles = distanceMeters / 1609.34;

      resolve({
        found: true,
        source: 'api',
        name: closest.name,
        address: closest.vicinity,
        distance: distanceMiles,
        score: proximityScore(distanceMiles),
        lat: storeLocation.lat(),
        lon: storeLocation.lng(),
      });
    });
  });
}

// Keep old name as alias so nothing else breaks during transition
export const findNearestTraderJoes = findNearestGrocery;

export function proximityScore(miles) {
  if (miles < 0.5) return 100;
  if (miles < 1)   return 85;
  if (miles < 2)   return 65;
  if (miles < 5)   return 40;
  if (miles < 10)  return 15;
  return 0;
}

export function formatDistance(miles) {
  if (!miles && miles !== 0) return 'Unknown';
  if (miles < 0.1) return `${Math.round(miles * 5280)} ft`;
  return `${miles.toFixed(1)} mi`;
}
