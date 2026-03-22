/**
 * Property scoring — based on manual user input (beds, baths, rent).
 * No external API needed.
 */

/**
 * Score a property based on how well it matches user preferences.
 *
 * @param {object} property - actual property details
 * @param {number} property.beds - actual bedrooms
 * @param {number} property.baths - actual bathrooms
 * @param {number} property.rent - actual monthly rent
 * @param {object} preferences - user's desired values
 * @param {number} preferences.targetBeds - desired bedrooms
 * @param {number} preferences.targetBaths - desired bathrooms
 * @param {number} preferences.medianRent - area median rent
 * @returns {{score: number, breakdown: object}}
 */
export function scoreProperty(property, preferences) {
  const { beds = 0, baths = 0, rent = 0 } = property;
  const { targetBeds = 2, targetBaths = 1, medianRent = 2000 } = preferences;

  // Beds scoring (40 points)
  let bedsScore = 0;
  const bedDiff = Math.abs(beds - targetBeds);
  if (bedDiff === 0) bedsScore = 40;
  else if (bedDiff === 1) bedsScore = 28;
  else if (bedDiff === 2) bedsScore = 15;
  else bedsScore = 5;

  // Baths scoring (30 points)
  let bathsScore = 0;
  const bathDiff = Math.abs(baths - targetBaths);
  if (bathDiff === 0) bathsScore = 30;
  else if (bathDiff <= 0.5) bathsScore = 24;
  else if (bathDiff <= 1) bathsScore = 16;
  else if (bathDiff <= 1.5) bathsScore = 8;
  else bathsScore = 2;

  // Rent scoring (30 points)
  // Score based on rent vs. median: below median is ideal
  let rentScore = 0;
  if (rent <= 0 || medianRent <= 0) {
    rentScore = 15; // neutral if no data
  } else {
    const rentRatio = rent / medianRent;
    if (rentRatio <= 0.8) rentScore = 30;       // great deal (≤80% of median)
    else if (rentRatio <= 0.95) rentScore = 26; // good deal
    else if (rentRatio <= 1.05) rentScore = 20; // at median
    else if (rentRatio <= 1.2) rentScore = 12;  // above median
    else if (rentRatio <= 1.5) rentScore = 6;   // significantly above
    else rentScore = 0;                          // very expensive
  }

  const totalScore = bedsScore + bathsScore + rentScore;

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      beds: { score: bedsScore, max: 40, actual: beds, target: targetBeds },
      baths: { score: bathsScore, max: 30, actual: baths, target: targetBaths },
      rent: {
        score: rentScore,
        max: 30,
        actual: rent,
        median: medianRent,
        ratio: rent > 0 && medianRent > 0 ? (rent / medianRent).toFixed(2) : null,
      },
    },
  };
}

/**
 * Format currency for display.
 */
export function formatRent(amount) {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}
