import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StreakFlame from '../common/StreakFlame.jsx';
import ProgressRing from '../common/ProgressRing.jsx';
import Ember from '../ember/Ember.jsx';
void motion;

export default function Topbar({
  userName,
  ageGroup,
  streak = 1,
  sparksToday = 0,
  dailyGoal = 3,
  onTapEmber,
  emberMood = 'idle',
  label = 'Curiosity Engine',
  theme = 'light',
  onToggleTheme,
}) {
  const isKids = ageGroup === 'little_explorer';
  const goalMet = sparksToday >= dailyGoal;

  const [showGoalBadge, setShowGoalBadge] = useState(false);
  const prevGoalMetRef = useRef(false);
  useEffect(() => {
    const wasGoalMet = prevGoalMetRef.current;
    if (goalMet && !wasGoalMet) {
      const showTimer = setTimeout(() => setShowGoalBadge(true), 0);
      const t = setTimeout(() => setShowGoalBadge(false), 2800);
      prevGoalMetRef.current = true;
      return () => {
        clearTimeout(showTimer);
        clearTimeout(t);
      };
    }
    if (!goalMet) prevGoalMetRef.current = false;
  }, [goalMet]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-20 mx-2 mt-2 flex items-center justify-between gap-2 rounded-[24px] border px-3 pt-3 pb-2.5 sm:mx-4 sm:gap-3 sm:px-6 sm:pt-5 sm:pb-3"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,247,235,0.72))',
        borderColor: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 10px 34px rgba(72,49,10,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      {/* Brand + Ember */}
      <button
        type="button"
        onClick={onTapEmber}
        className="group flex items-center gap-3 rounded-[18px] px-1 py-1 transition-all focus-visible:outline-spark-ember"
        aria-label="Spark home"
      >
        <div className="relative">
          <motion.div
            animate={{ boxShadow: ['0 0 0px rgba(255,107,53,0)', '0 0 22px rgba(255,107,53,0.35)', '0 0 0px rgba(255,107,53,0)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full"
          >
            <Ember mood={emberMood} size="sm" glowIntensity={0.9} />
          </motion.div>
        </div>

        <div className="min-w-0 text-left overflow-hidden">
          <p className="font-display text-[1.08rem] leading-none font-bold">
            <span
              style={{
                background: 'linear-gradient(135deg, #FF8A5A 0%, #FF6B35 45%, #FFD166 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {isKids && userName ? `Hi, ${userName}!` : 'Spark'}
            </span>
          </p>
          <motion.p
            key={label}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.14em] sm:tracking-[0.22em] text-text-muted truncate max-w-[90px] sm:max-w-none"
          >
            {label}
          </motion.p>
        </div>
      </button>

      {/* Right side — collapses gracefully on small screens */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Theme toggle — icon-only on mobile */}
        <button
          onClick={onToggleTheme}
          className="rounded-full p-1.5 sm:px-2.5 sm:py-1.5 transition-colors"
          style={{
            background: theme === 'dark' ? 'rgba(255,209,102,0.16)' : 'rgba(42,42,42,0.06)',
            color: theme === 'dark' ? '#FFD166' : 'rgba(72,49,10,0.72)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,209,102,0.32)' : 'rgba(42,42,42,0.12)'}`,
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="text-[13px] leading-none">{theme === 'dark' ? '☀' : '🌙'}</span>
          <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.14em] ml-1">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        {/* Daily goal ring — compact on mobile */}
        <div
          className="relative flex items-center gap-1.5 rounded-full px-2 py-1.5 sm:px-2.5 transition-all"
          style={{
            background: goalMet ? 'rgba(255,209,102,0.18)' : 'rgba(255,255,255,0.82)',
            border: goalMet ? '1px solid rgba(255,209,102,0.50)' : '1px solid rgba(255,181,94,0.18)',
            boxShadow: goalMet ? '0 0 16px rgba(255,209,102,0.28)' : '0 2px 8px rgba(72,49,10,0.06)',
          }}
          title={`${sparksToday}/${dailyGoal} sparks today`}
        >
          <ProgressRing value={Math.min(sparksToday, dailyGoal)} max={dailyGoal} size={28} stroke={3}>
            <span className="text-[9px] font-mono font-bold" style={{ color: goalMet ? '#B8860B' : 'var(--text-secondary)' }}>
              {sparksToday}
            </span>
          </ProgressRing>
          {/* Progress bar + label only on sm+ */}
          <div className="hidden sm:flex flex-col gap-0.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">
              {goalMet ? '✓ Day won' : `${dailyGoal - sparksToday} to go`}
            </span>
            {dailyGoal > 0 && (
              <div className="relative h-1 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(42,42,42,0.08)' }}>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: goalMet ? 'linear-gradient(90deg,#FFD166,#FFA62B)' : 'linear-gradient(90deg,#FF8A5A,#FF6B35)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (sparksToday / dailyGoal) * 100)}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
          <AnimatePresence>
            {showGoalBadge && (
              <motion.span
                key="goal-badge"
                initial={{ opacity: 0, scale: 0.7, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-mono font-bold shadow-lg"
                style={{ background: 'linear-gradient(135deg,#FFD166,#FF6B35)', color: '#fff', boxShadow: '0 8px 20px rgba(255,107,53,0.4)' }}
              >
                ✓ Goal met!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Streak pill */}
        <motion.div
          whileHover={{ scale: 1.06, y: -1 }}
          className="flex items-center gap-1 rounded-full px-2 py-1.5 cursor-default"
          style={{
            background: 'linear-gradient(135deg, rgba(255,220,168,0.60), rgba(255,176,110,0.32))',
            border: '1px solid rgba(255,107,53,0.26)',
            boxShadow: streak > 3 ? '0 0 16px rgba(255,107,53,0.28)' : '0 4px 12px rgba(255,107,53,0.15)',
          }}
          title={`${streak} day curiosity streak`}
        >
          <StreakFlame streak={streak} size="sm" pulse={streak > 0} />
          <span className="text-[10px] font-mono font-bold text-spark-ember">{streak}</span>
          <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.1em] text-spark-ember opacity-70">d</span>
        </motion.div>
      </div>
    </motion.header>
  );
}
