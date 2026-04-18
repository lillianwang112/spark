// ── Debounce ──
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── Fuzzy match (for search) ──
// Returns a score 0-1: 1 = exact, 0 = no match
export function fuzzyScore(needle, haystack) {
  if (!needle || !haystack) return 0;
  const n = needle.toLowerCase().trim();
  const h = haystack.toLowerCase().trim();
  if (h === n) return 1;
  if (h.startsWith(n)) return 0.9;
  if (h.includes(n)) return 0.7;
  // character-level fuzzy
  let ni = 0;
  let score = 0;
  for (let hi = 0; hi < h.length && ni < n.length; hi++) {
    if (h[hi] === n[ni]) { score++; ni++; }
  }
  return ni === n.length ? score / h.length * 0.6 : 0;
}

export function fuzzySearch(query, items, keyFn = (x) => x) {
  if (!query) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(query, keyFn(item)) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

// ── Path hashing (for cache keys) ──
export function hashPath(path) {
  if (!Array.isArray(path)) return String(path);
  return path.join('::').toLowerCase().replace(/\s+/g, '_');
}

// ── Safe JSON parse (AI output often has markdown fences) ──
export function parseAIJson(text) {
  if (!text) return null;
  try {
    // Strip ```json ... ``` fences
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── Clamp ──
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ── Random from array ──
export function pickRandom(arr, n = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}

// ── Capitalize first letter ──
export function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Days since date ──
export function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

// ── Format relative time ──
export function relativeTime(dateStr) {
  const d = daysSince(dateStr);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
  if (d < 365) return `${Math.floor(d / 30)} months ago`;
  return `${Math.floor(d / 365)} years ago`;
}

// ── Generate unique ID ──
export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
