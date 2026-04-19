import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
import ProgressRing from '../common/ProgressRing.jsx';
void motion;

const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  size: 1 + (i % 3) * 0.8,
  delay: (i * 0.23) % 3.5,
  duration: 1.8 + (i % 4) * 0.6,
}));

export default function DailySpark({
  userName,
  sparksToday = 0,
  dailyGoal = 3,
  streak = 1,
  suggestion,
  onSearch,
  onStartDiscovery,
  isKids = false,
}) {
  const prompts = useMemo(() => suggestion?.prompts || [
    'why hexagons feel everywhere',
    'what makes a sentence beautiful',
    'music that sounds like memory',
  ], [suggestion]);

  const hook = suggestion?.hook
    || (isKids ? 'Let\'s chase something weird today.' : 'One idea, pulled gently into daylight.');
  const body = suggestion?.body || 'Tap one of these, or surprise me. Every spark counts toward today.';
  const pct = Math.min(100, (sparksToday / Math.max(dailyGoal, 1)) * 100);
  const goalMet = sparksToday >= dailyGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[28px]"
      style={{
        background: 'linear-gradient(145deg, #2D1000 0%, #4A1A00 38%, #3B1400 70%, #220C00 100%)',
        border: '1px solid rgba(255,138,90,0.28)',
        boxShadow:
          '0 48px 100px rgba(255,107,53,0.30), 0 16px 40px rgba(200,60,0,0.22), inset 0 1px 0 rgba(255,209,102,0.15)',
      }}
    >
      {/* Aurora sweep */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse 90% 55% at 15% 35%, rgba(255,107,53,0.22) 0%, transparent 68%)',
            'radial-gradient(ellipse 90% 55% at 85% 65%, rgba(255,166,43,0.18) 0%, transparent 68%)',
            'radial-gradient(ellipse 90% 55% at 50% 15%, rgba(255,209,102,0.14) 0%, transparent 68%)',
            'radial-gradient(ellipse 90% 55% at 15% 35%, rgba(255,107,53,0.22) 0%, transparent 68%)',
          ],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      {/* Star field */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {STARS.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%` }}
            animate={{ opacity: [0.12, 0.85, 0.12], scale: [0.7, 1.3, 0.7] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Bottom ember glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 opacity-40"
        style={{ background: 'radial-gradient(ellipse at center bottom, rgba(255,107,53,0.45), transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6">
        {/* Top row: ember + text */}
        <div className="flex items-start gap-4">
          {/* Ember */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(255,107,53,0.4)', '0 0 44px rgba(255,166,43,0.6)', '0 0 20px rgba(255,107,53,0.4)'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-[20px] p-2.5"
              style={{
                background: 'rgba(255,107,53,0.15)',
                border: '1px solid rgba(255,138,90,0.28)',
              }}
            >
              <Ember mood="encouraging" size="lg" glowIntensity={1.2} />
            </motion.div>
            <span
              className="absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #FFD166, #FF6B35)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Today
            </span>
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-mono uppercase tracking-[0.24em]"
              style={{ color: 'rgba(255,138,90,0.85)' }}
            >
              Daily Spark
            </p>
            <h2
              className={`mt-1 font-display font-bold leading-tight ${isKids ? 'text-2xl' : 'text-[1.72rem]'}`}
              style={{ color: '#FFF7EC' }}
            >
              {userName ? `${userName}, ${hook.toLowerCase()}` : hook}
            </h2>
            <p
              className="mt-1.5 font-body text-sm leading-relaxed max-w-md"
              style={{ color: 'rgba(255,220,170,0.72)' }}
            >
              {body}
            </p>

            {/* Prompt chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {prompts.map((prompt, i) => (
                <motion.button
                  key={prompt}
                  initial={{ opacity: 0, y: 8, scale: 0.93 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.18 + i * 0.08, type: 'spring', stiffness: 280, damping: 24 }}
                  whileHover={{
                    y: -4,
                    scale: 1.04,
                    boxShadow: '0 12px 28px rgba(255,107,53,0.3), 0 0 0 1px rgba(255,209,102,0.45)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSearch?.(prompt)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-body font-semibold transition-all"
                  style={{
                    background: 'rgba(255,166,43,0.12)',
                    border: '1px solid rgba(255,209,102,0.30)',
                    color: '#FFD166',
                    boxShadow: '0 4px 14px rgba(255,107,53,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <motion.span
                    aria-hidden="true"
                    animate={{ rotate: [0, 14, -8, 0], scale: [1, 1.22, 1] }}
                    transition={{ duration: 2.2, delay: 0.4 + i * 0.4, repeat: Infinity, repeatDelay: 5 }}
                  >
                    ✨
                  </motion.span>
                  {prompt}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.42, type: 'spring', stiffness: 280, damping: 24 }}
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStartDiscovery?.()}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-body font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,240,220,0.88)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                Surprise me →
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div
            className="flex items-center gap-3 rounded-[18px] px-4 py-2.5 flex-1"
            style={{
              background: goalMet
                ? 'rgba(255,209,102,0.14)'
                : 'rgba(255,107,53,0.10)',
              border: goalMet
                ? '1px solid rgba(255,209,102,0.32)'
                : '1px solid rgba(255,107,53,0.22)',
            }}
          >
            <ProgressRing value={Math.min(sparksToday, dailyGoal)} max={dailyGoal} size={46} stroke={5}>
              <span
                className="font-display text-base font-bold"
                style={{ color: goalMet ? '#FFD166' : '#FF8A5A' }}
              >
                {sparksToday}
              </span>
            </ProgressRing>
            <div>
              <p
                className="text-[11px] font-mono uppercase tracking-[0.14em]"
                style={{ color: goalMet ? '#FFD166' : '#FF8A5A' }}
              >
                {goalMet ? '✓ Day won' : `${dailyGoal - sparksToday} to go`}
              </p>
              {/* Mini bar */}
              <div
                className="mt-1 h-1 w-20 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: goalMet ? 'linear-gradient(90deg,#FFD166,#FFA62B)' : 'linear-gradient(90deg,#FF8A5A,#FF6B35)' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Streak */}
          <motion.div
            whileHover={{ scale: 1.06 }}
            className="flex flex-col items-center rounded-[18px] px-4 py-2.5 flex-shrink-0"
            style={{
              background: 'rgba(255,107,53,0.12)',
              border: '1px solid rgba(255,107,53,0.28)',
              boxShadow: streak > 3 ? '0 0 24px rgba(255,107,53,0.2)' : 'none',
            }}
          >
            <motion.span
              className="font-display text-2xl font-bold"
              style={{ color: '#FF8A5A' }}
              key={streak}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 340 }}
            >
              {streak}
            </motion.span>
            <p
              className="mt-0 text-[9px] font-mono uppercase tracking-[0.14em]"
              style={{ color: 'rgba(255,166,43,0.6)' }}
            >
              day streak
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
