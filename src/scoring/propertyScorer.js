/**
 * Property scoring helpers and labels.
 */

/**
 * Get a descriptive label for a property score.
 * @param {number} score
 * @returns {string}
 */
export function getPropertyLabel(score) {
  if (score >= 90) return 'Perfect Match';
  if (score >= 75) return 'Great Fit';
  if (score >= 60) return 'Good Option';
  if (score >= 45) return 'Acceptable';
  if (score >= 30) return 'Some Compromises';
  return 'Poor Match';
}

/**
 * Get rent comparison label.
 * @param {number} actualRent
 * @param {number} medianRent
 * @returns {string}
 */
export function getRentLabel(actualRent, medianRent) {
  if (!actualRent || !medianRent) return 'No data';
  const ratio = actualRent / medianRent;
  if (ratio <= 0.8) return 'Great deal';
  if (ratio <= 0.95) return 'Below median';
  if (ratio <= 1.05) return 'At median';
  if (ratio <= 1.2) return 'Above median';
  return 'Significantly above median';
}
