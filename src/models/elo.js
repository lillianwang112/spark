import { ELO_CONFIG, DOMAINS } from '../utils/constants.js';

const { K, BASE, RECENCY_BOOST } = ELO_CONFIG;

// Expected score for player A vs player B
const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));

// Update Elo scores: winner vs each loser shown in this round
export function updateElo(winnerId, loserIds, scores, round, totalRounds) {
  const updated = { ...scores };
  const recencyWeight = 1 + (RECENCY_BOOST - 1) * (round / totalRounds);

  for (const loserId of loserIds) {
    const e = expected(updated[winnerId] ?? BASE, updated[loserId] ?? BASE);
    updated[winnerId] = (updated[winnerId] ?? BASE) + K * recencyWeight * (1 - e);
    updated[loserId]  = (updated[loserId]  ?? BASE) + K * recencyWeight * (0 - (1 - e));
  }
  return updated;
}

// Initialize all domains at BASE score
export function initEloScores() {
  return Object.fromEntries(DOMAINS.map((d) => [d, BASE]));
}

// Get ranked list of domains by score (descending)
export function getRankedDomains(scores) {
  return DOMAINS
    .map((d) => ({ domain: d, score: scores[d] ?? BASE }))
    .sort((a, b) => b.score - a.score);
}

// Get top N domains
export function getTopDomains(scores, n = 3) {
  return getRankedDomains(scores).slice(0, n).map((x) => x.domain);
}

// Get bottom N domains (least interested)
export function getBottomDomains(scores, n = 3) {
  return getRankedDomains(scores).slice(-n).map((x) => x.domain);
}

// Boost score for saving to Tracks (equivalent to winning 2 comparisons)
export function applyTrackSaveBoost(domain, scores) {
  const updated = { ...scores };
  updated[domain] = (updated[domain] ?? BASE) + (ELO_CONFIG.TRACKS_SAVE_BONUS ?? 64);
  return updated;
}

// Normalize scores to 0-100 range for display
export function normalizeScores(scores) {
  const values = Object.values(scores);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, ((v - min) / range) * 100])
  );
}
