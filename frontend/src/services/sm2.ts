export function calculateSM2(
  rating: number,
  intervalDays: number,
  repetitionCount: number,
  easeFactor: number
): { interval: number; repetitions: number; ease: number; nextReviewDate: string } {
  const q = Math.max(0, Math.min(5, rating));
  let newEase = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEase < 1.3) newEase = 1.3;

  let newInterval = 1;
  let newReps = 0;

  if (q >= 3) {
    if (repetitionCount === 0) {
      newInterval = 1;
    } else if (repetitionCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * newEase);
    }
    newReps = repetitionCount + 1;
  } else {
    newReps = 0;
    newInterval = 1;
  }

  const d = new Date();
  d.setDate(d.getDate() + newInterval);

  return {
    interval: newInterval,
    repetitions: newReps,
    ease: Math.round(newEase * 100) / 100,
    nextReviewDate: d.toISOString().split('T')[0],
  };
}
