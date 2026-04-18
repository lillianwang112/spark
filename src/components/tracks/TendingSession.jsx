import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
import Confetti from '../common/Confetti.jsx';
import BloomBurst from '../common/BloomBurst.jsx';
import BranchStateBadge from './BranchStateBadge.jsx';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { BRANCH_STATES } from '../../utils/constants.js';
import { deriveBranchState } from '../../hooks/useBranchState.js';
void motion;

// The Tending Session: water, sunlight, or connection actions per branch.
// Ember reacts to each action; completion triggers bloom/confetti.
export default function TendingSession({ tracks, onTend, onFinish }) {
  const [index, setIndex] = useState(0);
  const [actionsTaken, setActionsTaken] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [dropletActive, setDropletActive] = useState(false);
  const [sunActive, setSunActive] = useState(false);

  const list = useMemo(() => tracks.slice(0, 8), [tracks]);
  const current = list[index];
  const total = list.length;

  const advance = useCallback(() => {
    setTimeout(() => {
      setDropletActive(false);
      setSunActive(false);
      if (index + 1 >= total) {
        setCelebrate(true);
        setCompleted(true);
      } else {
        setIndex(index + 1);
      }
    }, 850);
  }, [index, total]);

  const handleWater = () => {
    if (!current) return;
    setDropletActive(true);
    setActionsTaken((n) => n + 1);
    onTend?.(current, 'water');
    advance();
  };

  const handleSunlight = () => {
    if (!current) return;
    setSunActive(true);
    setActionsTaken((n) => n + 1);
    onTend?.(current, 'sunlight');
    advance();
  };

  const handleSkip = () => {
    advance();
  };

  if (!current && !completed) {
    return (
      <div className="py-10 text-center text-text-muted font-body">Nothing needs tending right now.</div>
    );
  }

  if (completed) {
    return (
      <div className="relative flex flex-col items-center gap-5 py-10">
        <Confetti active={celebrate} count={70} />
        <div className="relative flex h-[180px] w-[180px] items-center justify-center">
          <BloomBurst active size={180} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Ember mood="celebrating" size="xl" glowIntensity={1.2} />
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-display text-2xl font-semibold text-text-primary">Canopy tended</h3>
          <p className="mt-1 font-body text-sm text-text-secondary max-w-sm mx-auto">
            {actionsTaken} branch{actionsTaken === 1 ? '' : 'es'} revived. Your tree feels the difference.
          </p>
        </div>
        <button
          onClick={onFinish}
          className="btn btn-primary px-6"
        >
          Back to Tracks
        </button>
      </div>
    );
  }

  const color = DOMAIN_COLORS[current.domain] || '#FF6B35';
  const state = deriveBranchState(current);
  const stateLabels = {
    [BRANCH_STATES.THIRSTY]: 'A quick check-in keeps the branch saturated.',
    [BRANCH_STATES.WILTING]: 'This one needs attention — a review or a small revive.',
    [BRANCH_STATES.DORMANT]: 'Long dormant. One honest look wakes the whole branch.',
    [BRANCH_STATES.HEALTHY]: 'Strong pulse. A drop of water keeps it that way.',
  };

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col gap-5 px-1 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">Tending Session</p>
          <p className="mt-0.5 font-body text-sm text-text-secondary">
            {index + 1} / {total} · take it at your own pace
          </p>
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="rounded-full bg-[rgba(42,42,42,0.05)] px-3 py-1.5 text-xs font-body text-text-muted hover:bg-[rgba(42,42,42,0.1)]"
        >
          End early
        </button>
      </div>

      <div className="h-2 w-full rounded-full bg-[rgba(42,42,42,0.08)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #FFD166, #FF6B35)' }}
          initial={{ width: 0 }}
          animate={{ width: `${((index) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
          className="relative overflow-hidden rounded-[24px] border shadow-warm"
          style={{
            borderColor: `${color}30`,
            background: `linear-gradient(135deg, ${color}12 0%, rgba(255,253,247,0.95) 60%)`,
          }}
        >
          {/* Water droplet animation */}
          <AnimatePresence>
            {dropletActive && (
              <motion.span
                className="pointer-events-none absolute left-1/2 top-0 z-10 block"
                initial={{ y: -40, opacity: 0, scale: 0.6 }}
                animate={{ y: 220, opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeIn' }}
                style={{
                  width: 22,
                  height: 28,
                  marginLeft: -11,
                  borderRadius: '50% 50% 50% 50% / 70% 70% 45% 45%',
                  background: 'linear-gradient(180deg, #A8D5FF, #4A6FA5)',
                  boxShadow: '0 6px 18px rgba(74,111,165,0.45)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Sunlight sweep */}
          <AnimatePresence>
            {sunActive && (
              <motion.span
                className="pointer-events-none absolute inset-x-0 top-0 z-10 block"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.85, 0] }}
                transition={{ duration: 0.8 }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(180deg, rgba(255,214,102,0.55) 0%, rgba(255,255,255,0) 60%)',
                }}
              />
            )}
          </AnimatePresence>

          <div className="relative z-0 p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted capitalize">
                {current.domain}
              </span>
              <BranchStateBadge state={state} hideHealthy={false} size="sm" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-text-primary leading-tight">
              {current.label}
            </h3>
            {current.description && (
              <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary">
                {current.description}
              </p>
            )}

            <div className="mt-4 rounded-[16px] bg-[rgba(255,255,255,0.7)] px-4 py-3 border border-[rgba(42,42,42,0.06)]">
              <p className="font-body text-sm text-text-secondary">{stateLabels[state] || stateLabels.healthy}</p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                onClick={handleWater}
                className="group relative inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#8ec5fc,#4A6FA5)] px-4 py-2 font-body text-sm font-semibold text-white shadow-[0_8px_20px_rgba(74,111,165,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(74,111,165,0.45)]"
              >
                <span aria-hidden="true">💧</span>
                Water
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-80">Review</span>
              </button>
              <button
                onClick={handleSunlight}
                className="group relative inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ffd166,#ff8a5a)] px-4 py-2 font-body text-sm font-semibold text-[#6b4b10] shadow-[0_8px_20px_rgba(255,166,43,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(255,166,43,0.45)]"
              >
                <span aria-hidden="true">☀️</span>
                Sunlight
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-80">Go deeper</span>
              </button>
              <button
                onClick={handleSkip}
                className="inline-flex items-center gap-2 rounded-full bg-[rgba(42,42,42,0.06)] px-4 py-2 font-body text-sm font-semibold text-text-muted hover:bg-[rgba(42,42,42,0.12)]"
              >
                Skip
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-3">
        <Ember mood={dropletActive ? 'attentive' : sunActive ? 'proud' : 'encouraging'} size="sm" glowIntensity={0.7} />
        <p className="font-body text-sm text-text-secondary max-w-sm">
          {dropletActive
            ? 'Water trickles back into the branch.'
            : sunActive
              ? 'Sunlight reaches from root to leaf.'
              : 'Pick a care action. Small gestures make the tree remember you.'}
        </p>
      </div>
    </div>
  );
}
