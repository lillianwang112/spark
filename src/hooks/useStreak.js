import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'spark:streak';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function daysApart(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

function readStreak() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStreak(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Tracks a daily curiosity streak.
 * Any activity (a search, a save, a tap) triggers `pingStreak()`; calendar days
 * are the unit. A missed day resets the streak but we keep longest ever.
 */
export default function useStreak() {
  const [state, setState] = useState(() => readStreak() || {
    current: 1,
    longest: 1,
    lastActive: todayKey(),
    sparksToday: 0,
    lifetime: 0,
    dailyGoal: 3,
  });

  useEffect(() => {
    writeStreak(state);
  }, [state]);

  const pingStreak = useCallback(() => {
    setState((prev) => {
      const today = todayKey();
      if (prev.lastActive === today) {
        const nextSparks = (prev.sparksToday || 0) + 1;
        return {
          ...prev,
          sparksToday: nextSparks,
          lifetime: (prev.lifetime || 0) + 1,
        };
      }

      const gap = daysApart(prev.lastActive, new Date());
      const nextCurrent = gap === 1 ? (prev.current || 0) + 1 : 1;
      const nextLongest = Math.max(prev.longest || 0, nextCurrent);

      return {
        ...prev,
        current: nextCurrent,
        longest: nextLongest,
        lastActive: today,
        sparksToday: 1,
        lifetime: (prev.lifetime || 0) + 1,
      };
    });
  }, []);

  const setDailyGoal = useCallback((goal) => {
    setState((prev) => ({ ...prev, dailyGoal: Math.max(1, Math.min(10, goal)) }));
  }, []);

  const resetStreak = useCallback(() => {
    setState({
      current: 1,
      longest: 1,
      lastActive: todayKey(),
      sparksToday: 0,
      lifetime: 0,
      dailyGoal: state.dailyGoal || 3,
    });
  }, [state.dailyGoal]);

  // If we opened today but the calendar day rolled over, start fresh today count
  useEffect(() => {
    const today = todayKey();
    if (state.lastActive !== today) {
      const gap = daysApart(state.lastActive, new Date());
      if (gap > 1) {
        setState((prev) => ({ ...prev, current: 0, sparksToday: 0, lastActive: today }));
      }
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    streak: state.current,
    longest: state.longest,
    sparksToday: state.sparksToday,
    lifetime: state.lifetime,
    dailyGoal: state.dailyGoal,
    pingStreak,
    setDailyGoal,
    resetStreak,
  };
}
