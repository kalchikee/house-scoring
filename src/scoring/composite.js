/**
 * Composite scoring engine.
 * Combines crime, walkability, property, and proximity scores
 * using user-adjustable weights.
 */

/**
 * Calculate the weighted composite score.
 * @param {object} scores - individual category scores (0-100 each)
 * @param {number} scores.crime
 * @param {number} scores.walk
 * @param {number} scores.property
 * @param {number} scores.proximity
 * @param {object} weights - relative weights (any positive numbers)
 * @param {number} weights.crime
 * @param {number} weights.walk
 * @param {number} weights.property
 * @param {number} weights.proximity
 * @returns {number} composite score 0-100
 */
export function calculateComposite(scores, weights) {
  const activeEntries = Object.entries(weights).filter(([key]) => scores[key] != null);
  const total = activeEntries.reduce((sum, [, w]) => sum + w, 0);
  if (total === 0) return 0;

  const weighted = activeEntries.reduce((sum, [key, w]) => sum + (scores[key] ?? 0) * w, 0);
  return Math.round(weighted / total);
}

/**
 * Return grade object for a given composite score.
 * @param {number} score
 * @returns {{grade: string, label: string, color: string, bgClass: string, textClass: string}}
 */
export function getGrade(score) {
  if (score >= 90) return {
    grade: 'A',
    label: 'Excellent',
    color: '#22c55e',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/50',
    glowClass: 'shadow-glow-green',
  };
  if (score >= 80) return {
    grade: 'B',
    label: 'Great',
    color: '#84cc16',
    bgClass: 'bg-lime-500/20',
    textClass: 'text-lime-400',
    borderClass: 'border-lime-500/50',
    glowClass: 'shadow-[0_0_20px_rgba(132,204,22,0.4)]',
  };
  if (score >= 70) return {
    grade: 'C',
    label: 'Good',
    color: '#eab308',
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/50',
    glowClass: 'shadow-glow-yellow',
  };
  if (score >= 60) return {
    grade: 'D',
    label: 'Fair',
    color: '#f97316',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/50',
    glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]',
  };
  return {
    grade: 'F',
    label: 'Poor',
    color: '#ef4444',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/50',
    glowClass: 'shadow-glow-red',
  };
}

/**
 * Get a color for a score value (used for individual category displays).
 * @param {number} score
 * @returns {string} hex color
 */
export function getScoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

/**
 * Default weights for each scoring category.
 */
export const DEFAULT_WEIGHTS = {
  crime: 25,
  walk: 25,
  property: 25,
  proximity: 25,
};
