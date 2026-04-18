import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import Ember from '../ember/Ember.jsx';
void motion;

const PERIODS = [
  { id: 'day', label: 'Today', copy: 'Sparks from today' },
  { id: 'week', label: 'Week', copy: 'Last 7 days of wandering' },
  { id: 'month', label: 'Month', copy: 'A month of detours' },
  { id: 'year', label: 'Year', copy: 'Your year in Spark' },
  { id: 'lifetime', label: 'All', copy: 'Everything you\'ve opened' },
];

function periodStart(id) {
  const now = new Date();
  if (id === 'day') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (id === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
  if (id === 'month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
  if (id === 'year') { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
  return new Date(0);
}

export default function JourneyTimeline({ tracks = [], searches = [] }) {
  const [periodIdx, setPeriodIdx] = useState(1);
  const period = PERIODS[periodIdx];
  const nowRef = useRef(new Date());

  const events = useMemo(() => {
    const start = periodStart(period.id);
    const fallback = nowRef.current;
    const mapped = [
      ...tracks.map((t) => ({
        id: `track-${t.id}`,
        type: 'track',
        label: t.label,
        domain: t.domain,
        at: t.savedAt ? new Date(t.savedAt) : t.timestamp ? new Date(t.timestamp) : fallback,
      })),
      ...searches.map((s) => ({
        id: `search-${s.id}`,
        type: 'search',
        label: s.term,
        domain: null,
        at: s.timestamp ? new Date(s.timestamp) : fallback,
      })),
    ].filter((e) => e.at >= start)
      .sort((a, b) => b.at - a.at);
    return mapped;
  }, [tracks, searches, period.id]);

  const stats = useMemo(() => {
    const domainCount = new Set(events.filter((e) => e.domain).map((e) => e.domain));
    return {
      sparks: events.length,
      saves: events.filter((e) => e.type === 'track').length,
      worlds: domainCount.size,
    };
  }, [events]);

  const dominantDomain = useMemo(() => {
    const counts = {};
    events.forEach((e) => { if (e.domain) counts[e.domain] = (counts[e.domain] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0];
  }, [events]);

  return (
    <div className="rounded-[24px] border border-[rgba(255,255,255,0.78)] bg-[linear-gradient(135deg,rgba(255,253,247,0.92),rgba(255,244,226,0.85))] p-5 shadow-[0_16px_44px_rgba(72,49,10,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-muted">Journey</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-text-primary">
            {period.copy}
          </h3>
        </div>
        <Ember mood="proud" size="sm" glowIntensity={0.55} />
      </div>

      {/* Period scrubber */}
      <div className="mt-4">
        <div
          className="relative h-10 rounded-full bg-[rgba(42,42,42,0.06)] flex items-center"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={PERIODS.length - 1}
          aria-valuenow={periodIdx}
        >
          <motion.div
            className="absolute top-1 left-1 bottom-1 rounded-full shadow-[0_6px_14px_rgba(255,107,53,0.35)]"
            style={{
              background: 'linear-gradient(90deg, #FFD166 0%, #FF6B35 100%)',
              width: `calc(${((periodIdx + 1) / PERIODS.length) * 100}% - 0.5rem)`,
            }}
            animate={{ width: `calc(${((periodIdx + 1) / PERIODS.length) * 100}% - 0.5rem)` }}
            transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
          />
          <div className="relative z-10 grid w-full grid-cols-5">
            {PERIODS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPeriodIdx(i)}
                className={`relative flex items-center justify-center rounded-full py-2 text-[11px] font-body font-semibold transition-colors ${
                  i <= periodIdx ? 'text-white' : 'text-text-muted'
                }`}
                aria-pressed={i === periodIdx}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[14px] bg-[rgba(255,255,255,0.7)] px-2 py-2">
          <p className="font-display text-xl font-semibold text-text-primary">{stats.sparks}</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">sparks</p>
        </div>
        <div className="rounded-[14px] bg-[rgba(255,255,255,0.7)] px-2 py-2">
          <p className="font-display text-xl font-semibold text-text-primary">{stats.saves}</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">saved</p>
        </div>
        <div className="rounded-[14px] bg-[rgba(255,255,255,0.7)] px-2 py-2">
          <p className="font-display text-xl font-semibold text-text-primary">{stats.worlds}</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">worlds</p>
        </div>
      </div>

      {dominantDomain && (
        <div
          className="mt-4 rounded-[16px] border px-4 py-3"
          style={{
            background: `${DOMAIN_COLORS[dominantDomain] || '#FF6B35'}12`,
            borderColor: `${DOMAIN_COLORS[dominantDomain] || '#FF6B35'}30`,
          }}
        >
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Dominant thread</p>
          <p className="mt-1 font-display text-lg capitalize" style={{ color: DOMAIN_COLORS[dominantDomain] }}>
            {dominantDomain}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={period.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="mt-5"
        >
          {events.length === 0 ? (
            <div className="py-6 text-center text-sm font-body text-text-muted">
              Quiet stretch. One spark restarts it all.
            </div>
          ) : (
            <ol className="relative border-l-2 border-[rgba(255,107,53,0.22)] pl-4 space-y-3">
              {events.slice(0, 8).map((e, i) => {
                const color = e.domain ? DOMAIN_COLORS[e.domain] : '#FF6B35';
                return (
                  <motion.li
                    key={e.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative"
                  >
                    <span
                      className="absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-white"
                      style={{ background: color, boxShadow: `0 0 0 2px ${color}33` }}
                    />
                    <p className="font-body text-sm text-text-primary">{e.label}</p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-text-muted">
                      {e.type === 'track' ? 'saved' : 'searched'} · {e.at.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </motion.li>
                );
              })}
              {events.length > 8 && (
                <li className="font-body text-xs text-text-muted">+ {events.length - 8} more sparks</li>
              )}
            </ol>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
