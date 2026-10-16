/**
 * Refined SM-2 (Spaced Repetition) Algorithm for MedFocus
 * 
 * Quality (q) mapping:
 * 1: AGAIN - Blackout, total failure to remember.
 * 2: HARD - Remembered with significant difficulty.
 * 3: GOOD - Remembered with moderate effort.
 * 4: EASY - Remembered with perfect ease.
 */

export const calculateSM2 = (card, quality) => {
  let { interval, easeFactor, repetitions } = card;

  // Default values for new cards
  interval = interval || 0;
  easeFactor = easeFactor || 2.5;
  repetitions = repetitions || 0;

  let nextInterval;
  let nextEaseFactor = easeFactor;
  let nextRepetitions = repetitions;

  if (quality < 2) {
    // AGAIN: Back to learning phase
    nextInterval = 0;
    nextRepetitions = 0;
    nextEaseFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // SUCCESS
    if (repetitions === 0) {
      // First successful repetition
      if (quality === 2) nextInterval = 1; // 1 day
      else if (quality === 3) nextInterval = 2; // 2 days
      else nextInterval = 4; // 4 days (EASY)
      nextRepetitions = 1;
    } else if (repetitions === 1) {
      // Second successful repetition
      if (quality === 2) nextInterval = 3;
      else if (quality === 3) nextInterval = 6;
      else nextInterval = 10;
      nextRepetitions = 2;
    } else {
      // Subsequent repetitions
      nextRepetitions = repetitions + 1;
      
      // Update Ease Factor based on quality
      // Standard SM2 adjustment: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
      // For our 1-4 scale, we map it to 2-5 for the standard formula
      const mappedQuality = quality + 1; 
      nextEaseFactor = easeFactor + (0.1 - (5 - mappedQuality) * (0.08 + (5 - mappedQuality) * 0.02));
      nextEaseFactor = Math.max(1.3, nextEaseFactor);

      if (quality === 2) {
        // HARD: 1.2x multiplier
        nextInterval = Math.ceil(interval * 1.2);
      } else if (quality === 3) {
        // GOOD: EF multiplier
        nextInterval = Math.ceil(interval * easeFactor);
      } else {
        // EASY: EF * 1.3 bonus multiplier
        nextInterval = Math.ceil(interval * easeFactor * 1.3);
      }
    }
  }

  const nextReview = new Date();
  if (nextInterval === 0) {
    // Still in learning phase, review in 10 minutes
    nextReview.setMinutes(nextReview.getMinutes() + 10);
  } else {
    nextReview.setDate(nextReview.getDate() + nextInterval);
    nextReview.setHours(0, 0, 0, 0); // Reset time to start of day for consistency
  }

  return {
    interval: nextInterval,
    easeFactor: parseFloat(nextEaseFactor.toFixed(2)),
    repetitions: nextRepetitions,
    nextReview: nextReview.toISOString(),
  };
};

export const getIntervalPreviews = (card) => {
  return {
    again: calculateSM2(card, 1).interval,
    hard: calculateSM2(card, 2).interval,
    good: calculateSM2(card, 3).interval,
    easy: calculateSM2(card, 4).interval,
  };
};
