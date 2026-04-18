import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StreakFlame from '../common/StreakFlame.jsx';
import ProgressRing from '../common/ProgressRing.jsx';
import Ember from '../ember/Ember.jsx';

export default function Topbar({
  userName,
  ageGroup,
  streak = 1,
  sparksToday = 0,
  dailyGoal = 3,
  onTapEmber,
  emberMood = 'idle',
  label = 'Curiosity Engine',
}) {
  const isKids = ageGroup === 'little_explorer';
  const goalMet = sparksToday >= dailyGoal;

  // Show "Goal met!" badge briefly when goal is first reached
  const [showGoalBadge, setShowGoalBadge] = useState(false);
  const prevGoalMetRef = useState(false);
  useEffect(() => {
    const wasGoalMet = prevGoalMetRef[0];
    if (goalMet && !wasGoalMet) {
      setShowGoalBadge(true);
      const t = setTimeout(() => setShowGoalBadge(false), 2800);
      prevGoalMetRef[0] = true;
      return () => clearTimeout(t);
    }
    if (!goalMet) {
      prevGoalMetRef[0] = false;
    }
  }, [goalMet, prevGoalMetRef]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
      className="relative z-20 flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-6 sm:pt-5"
    >
      {/* Brand + Ember */}
      <button
        type="button"
        onClick={onTapEmber}
        className="group flex items-center gap-3 rounded-[18px] px-1 py-1 transition-colors focus-visible:outline-spark-ember"
        aria-label="Spark home"
      >
        <div className="relative">
          <Ember mood={emberMood} size="sm" glowIntensity={0.85} />
          <span className="pointer-events-none absolute inset-0 rounded-full animate-glow-breathe" />
        </div>
        <div className="min-w-0 text-left">
          <p className="font-display text-[1.05rem] leading-none font-semibold text-text-primary">
            {isKids && userName ? `Hi, ${userName}!` : 'Spark'}
          </p>
          <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted">
            {label}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-2">
        {/* Daily goal ring */}
        <div
          className={`relative flex items-center gap-2 rounded-full px-2.5 py-1.5 ${
            goalMet
              ? 'bg-[rgba(255,209,102,0.2)] border border-[rgba(255,209,102,0.45)]'
              : 'bg-[rgba(255,255,255,0.8)] border border-[rgba(255,181,94,0.2)]'
          }`}
          title={`${sparksToday}/${dailyGoal} sparks today`}
        >
          <ProgressRing value={Math.min(sparksToday, dailyGoal)} max={dailyGoal} size={30} stroke={3}>
            <span className="text-[10px] font-mono font-semibold text-text-secondary">
              {sparksToday}
            </span>
          </ProgressRing>

          <div className="flex flex-col gap-0.5">
            <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">
              {goalMet ? 'Day won' : `${dailyGoal - sparksToday} to go`}
            </span>
            {/* Daily goal progress bar */}
            {dailyGoal > 0 && (
              <div className="relative h-1 w-16 sm:w-20 rounded-full bg-[rgba(42,42,42,0.08)] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FFD166, #FF6B35)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (sparksToday / dailyGoal) * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>

          {/* Goal-met celebration badge */}
          <AnimatePresence>
            {showGoalBadge && (
              <motion.span
                key="goal-badge"
                initial={{ opacity: 0, scale: 0.7, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-mono font-semibold shadow-md"
                style={{ background: 'linear-gradient(135deg, #FFD166, #FF6B35)', color: '#fff' }}
              >
                ✓ Goal met!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Streak pill */}
        <div
          className="flex items-center gap-1.5 rounded-full border border-[rgba(255,107,53,0.22)] bg-[linear-gradient(135deg,rgba(255,221,168,0.55),rgba(255,176,110,0.28))] px-2.5 py-1.5 shadow-[0_4px_12px_rgba(255,107,53,0.18)]"
          title={`${streak} day curiosity streak`}
        >
          <StreakFlame streak={streak} size="sm" pulse={streak > 0} />
          <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.14em] text-spark-ember font-semibold">
            Streak
          </span>
        </div>
      </div>
    </motion.header>
  );
}
