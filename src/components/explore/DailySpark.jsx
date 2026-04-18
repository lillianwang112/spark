import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
import Sparkles from '../common/Sparkles.jsx';
import ProgressRing from '../common/ProgressRing.jsx';
void motion;

// Daily spark: a single big "what are you curious about today?" card with
// the streak ring, quick prompts, and the day's freshest rabbit hole.
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.74)] shadow-[0_28px_70px_rgba(72,49,10,0.14)]"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,233,196,0.94) 0%, rgba(255,214,158,0.9) 45%, rgba(255,249,238,0.95) 100%)',
      }}
    >
      <Sparkles count={8} color="#FFD166" />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative flex-shrink-0">
            <div className="rounded-[20px] bg-[rgba(255,255,255,0.65)] p-2 shadow-[0_10px_24px_rgba(255,107,53,0.22)]">
              <Ember mood="encouraging" size="lg" glowIntensity={1} />
            </div>
            <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-spark-ember shadow-sm border border-[rgba(255,107,53,0.2)]">
              Today
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-spark-ember">
              Daily Spark
            </p>
            <h2 className={`mt-1 font-display font-semibold text-text-primary leading-tight ${isKids ? 'text-2xl' : 'text-[1.65rem]'}`}>
              {userName ? `${userName}, ${hook.toLowerCase()}` : hook}
            </h2>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary max-w-md">
              {suggestion?.body || 'Tap one of these, or surprise me. The tree remembers what tugs on your attention.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSearch?.(prompt)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,107,53,0.18)] bg-[rgba(255,255,255,0.88)] px-3 py-1.5 text-sm font-body font-semibold text-spark-ember shadow-[0_4px_10px_rgba(255,107,53,0.12)] transition-all hover:shadow-[0_8px_18px_rgba(255,107,53,0.25)] hover:-translate-y-0.5"
                >
                  <span aria-hidden="true">✨</span>
                  <span>{prompt}</span>
                </button>
              ))}
              <button
                onClick={() => onStartDiscovery?.()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(42,42,42,0.85)] px-3 py-1.5 text-sm font-body font-semibold text-white shadow-[0_6px_14px_rgba(42,42,42,0.25)] transition hover:bg-[#111] hover:-translate-y-0.5"
              >
                Surprise me →
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="flex flex-col items-center rounded-[22px] bg-[rgba(255,255,255,0.72)] px-4 py-3 border border-[rgba(255,181,94,0.2)]">
            <ProgressRing value={Math.min(sparksToday, dailyGoal)} max={dailyGoal} size={58} stroke={6}>
              <span className="font-display text-lg font-semibold text-text-primary">
                {sparksToday}
              </span>
            </ProgressRing>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">
              of {dailyGoal} sparks
            </p>
          </div>
          <div className="flex flex-col items-center rounded-[22px] bg-[rgba(255,255,255,0.72)] px-4 py-3 border border-[rgba(255,181,94,0.2)]">
            <span className="font-display text-2xl font-semibold text-ember-gradient">{streak}</span>
            <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">day streak</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
