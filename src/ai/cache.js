// Client-side AI response cache with TTL
// Uses localStorage for persistence across sessions

const CACHE_PREFIX = 'spark_ai_';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days for most content

const TTL_BY_TYPE = {
  discoveryCards:     1000 * 60 * 60 * 2,        // 2 hours (personalized, refreshed often)
  nodeChildren:       1000 * 60 * 60 * 24 * 30,  // 30 days (stable content)
  explainer:          1000 * 60 * 60 * 24 * 14,  // 14 days (stable per profile)
  personalitySummary: 1000 * 60 * 60 * 24 * 1,   // 1 day (refreshes as behavior changes)
  journeyNarrative:   1000 * 60 * 60 * 24 * 7,   // 7 days per period
  interactiveDiagram: 1000 * 60 * 60 * 24 * 30,  // 30 days (diagram for a concept is stable)
};

const AICache = {
  get(type, key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const { value, expires } = JSON.parse(raw);
      if (Date.now() > expires) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  },

  set(type, key, value) {
    try {
      const ttl = TTL_BY_TYPE[type] ?? DEFAULT_TTL_MS;
      const entry = { value, expires: Date.now() + ttl };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // localStorage full — evict oldest entries
      this.evictOldest(5);
    }
  },

  evictOldest(n) {
    try {
      const entries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k?.startsWith(CACHE_PREFIX)) continue;
        try {
          const { expires } = JSON.parse(localStorage.getItem(k));
          entries.push({ key: k, expires });
        } catch {
          localStorage.removeItem(k);
        }
      }
      entries.sort((a, b) => a.expires - b.expires);
      entries.slice(0, n).forEach(({ key }) => localStorage.removeItem(key));
    } catch {
      // Ignore
    }
  },

  clear() {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  },
};

export default AICache;
