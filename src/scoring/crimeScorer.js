/**
 * Crime scoring utilities.
 */

const NATIONAL_AVG = 380; // per 100k

/**
 * Convert a raw violent crime rate (per 100k) to a 0-100 score.
 * @param {number} ratePerHundredK
 * @returns {number}
 */
export function rateToScore(ratePerHundredK) {
  return Math.max(0, Math.min(100, Math.round(100 - ratePerHundredK / 8)));
}

/**
 * Get a descriptive label for a crime score.
 * @param {number} score
 * @returns {string}
 */
export function getCrimeLabel(score) {
  if (score >= 85) return 'Very Safe';
  if (score >= 70) return 'Safe';
  if (score >= 55) return 'Average';
  if (score >= 40) return 'Below Average';
  if (score >= 25) return 'Concerning';
  return 'High Crime';
}

/**
 * Relative comparison to national average.
 * @param {number} rate
 * @returns {string}
 */
export function compareToNational(rate) {
  const ratio = rate / NATIONAL_AVG;
  if (ratio < 0.5) return '50%+ below national avg';
  if (ratio < 0.8) return 'Below national avg';
  if (ratio < 1.2) return 'Near national avg';
  if (ratio < 1.5) return 'Above national avg';
  return '50%+ above national avg';
}
