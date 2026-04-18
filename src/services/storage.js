// Local persistence — IndexedDB via simple localStorage fallback
// Used for offline support and when Firebase is not configured

const STORAGE_KEYS = {
  USER: 'spark_user',
  TRACKS: 'spark_tracks',
  ELO: 'spark_elo',
  KNOWLEDGE: 'spark_knowledge',
  SEARCHES: 'spark_searches',
};

export const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  // Convenience: user profile
  getUser:    () => storage.get(STORAGE_KEYS.USER),
  saveUser:   (u) => storage.set(STORAGE_KEYS.USER, u),

  // Tracks
  getTracks:     () => storage.get(STORAGE_KEYS.TRACKS) || [],
  saveTracks:    (t) => storage.set(STORAGE_KEYS.TRACKS, t),
  addTrack(track) {
    const tracks = this.getTracks();
    const idx = tracks.findIndex((t) => t.id === track.id);
    if (idx >= 0) tracks[idx] = track;
    else tracks.push(track);
    this.saveTracks(tracks);
  },
  removeTrack(trackId) {
    this.saveTracks(this.getTracks().filter((t) => t.id !== trackId));
  },

  // Elo scores
  getElo:    () => storage.get(STORAGE_KEYS.ELO) || {},
  saveElo:   (e) => storage.set(STORAGE_KEYS.ELO, e),

  // Knowledge states
  getKnowledge:  () => storage.get(STORAGE_KEYS.KNOWLEDGE) || {},
  saveKnowledge: (k) => storage.set(STORAGE_KEYS.KNOWLEDGE, k),

  // Search history
  getSearches: () => storage.get(STORAGE_KEYS.SEARCHES) || [],
  addSearch(entry) {
    const searches = this.getSearches();
    searches.unshift(entry);
    this.set(STORAGE_KEYS.SEARCHES, searches.slice(0, 200));
  },
  updateSearch(searchId, updates) {
    const searches = this.getSearches().map((entry) =>
      entry.id === searchId ? { ...entry, ...updates } : entry
    );
    this.set(STORAGE_KEYS.SEARCHES, searches);
  },
};

export default storage;
