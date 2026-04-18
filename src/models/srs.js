// SM-2 variant — transplanted and adapted from Zhongwen Learn
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

// rating: 'got_it' | 'kinda' | 'nope'
export function calculateNextReview(card, rating) {
  const ratingValue = { got_it: 3, kinda: 2, nope: 1 }[rating] ?? 1;
  let { interval = 1, easeFactor = DEFAULT_EASE, repetitions = 0 } = card;

  if (ratingValue >= 2) {
    // Correct — extend interval
    if (repetitions === 0)      interval = 1;
    else if (repetitions === 1) interval = 3;
    else                        interval = Math.round(interval * easeFactor);

    repetitions++;
    easeFactor = Math.max(
      MIN_EASE,
      easeFactor + (0.1 - (3 - ratingValue) * (0.08 + (3 - ratingValue) * 0.02))
    );
  } else {
    // Failed — reset
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    nextReview: nextReview.toISOString(),
    lastReview: new Date().toISOString(),
    lastRating: rating,
  };
}

// Seed initial SRS data from knowledge state
// new → short, heard_of → near-term, know_little → medium, know_well → long
export function seedSRSFromKnowledgeState(state) {
  const intervals = {
    new:          1,
    heard_of:     1,
    know_little:  3,
    know_well:    14,
  };
  const interval = intervals[state] ?? 1;
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    interval,
    easeFactor: DEFAULT_EASE,
    repetitions: 0,
    nextReview: nextReview.toISOString(),
    lastReview: null,
    lastRating: null,
  };
}

// Check if a card is due for review
export function isDue(srsData) {
  if (!srsData?.nextReview) return true;
  return new Date() >= new Date(srsData.nextReview);
}

// Get cards due today from a list of track nodes
export function getDueCards(tracks) {
  return tracks.filter((t) => t.srsData && isDue(t.srsData));
}

// Days until next review
export function daysUntilReview(srsData) {
  if (!srsData?.nextReview) return 0;
  const diff = new Date(srsData.nextReview) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
