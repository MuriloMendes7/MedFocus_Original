/**
 * Algoritmo SM-2 refinado para MedFocus.
 *
 * Quality (q):
 * 1: AGAIN (Errei)   -> revisa em 10 minutos
 * 2: HARD  (Difícil) -> multiplicador menor
 * 3: GOOD  (Bom)     -> multiplicador padrão (EF)
 * 4: EASY  (Fácil)   -> multiplicador com bônus (EF * 1.3)
 */
export function calculateSM2(progress, quality) {
  const interval = Number(progress?.interval ?? 0);
  const easeFactor = Number(progress?.easeFactor ?? 2.5);
  const repetitions = Number(progress?.repetitions ?? 0);
  const lapses = Number(progress?.lapses ?? 0);

  let nextInterval = 0;
  let nextEaseFactor = easeFactor;
  let nextRepetitions = repetitions;
  let nextLapses = lapses;

  if (quality < 2) {
    nextInterval = 0;
    nextRepetitions = 0;
    nextLapses = lapses + 1;
    nextEaseFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (repetitions === 0) {
      nextInterval = quality === 2 ? 1 : quality === 3 ? 2 : 4;
      nextRepetitions = 1;
    } else if (repetitions === 1) {
      nextInterval = quality === 2 ? 3 : quality === 3 ? 6 : 10;
      nextRepetitions = 2;
    } else {
      nextRepetitions = repetitions + 1;
      const mapped = quality + 1;
      nextEaseFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - mapped) * (0.08 + (5 - mapped) * 0.02)),
      );

      if (quality === 2) {
        nextInterval = Math.max(1, Math.ceil(interval * 1.2));
      } else if (quality === 3) {
        nextInterval = Math.max(1, Math.ceil(interval * nextEaseFactor));
      } else {
        nextInterval = Math.max(1, Math.ceil(interval * nextEaseFactor * 1.3));
      }
    }
  }

  const now = new Date();
  const nextReview = new Date(now);
  if (nextInterval === 0) {
    nextReview.setMinutes(nextReview.getMinutes() + 10);
  } else {
    nextReview.setDate(nextReview.getDate() + nextInterval);
    nextReview.setHours(4, 0, 0, 0);
  }

  return {
    interval: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
    repetitions: nextRepetitions,
    lapses: nextLapses,
    lastReview: now,
    nextReview,
  };
}
