import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import Ember from '../ember/Ember.jsx';
import AIService from '../../ai/ai.service.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { DOMAIN_EMOJIS } from '../../utils/constants.js';

const DOMAIN_DISPOSITIONS = {
  math: 'You gravitate toward problems with definite answers — and the thrill of proving something.',
  science: 'You like understanding how things actually work beneath the surface.',
  cs: 'You want to build things and fix things — problems that have right answers, eventually.',
  philosophy: 'You pick the cards with no clean answer — you like sitting with hard questions.',
  history: 'You care about why things happened, not just that they did.',
  literature: 'You respond to language and story as ways of understanding people.',
  economics: 'You think in systems and incentives — why do people do what they do?',
  music: 'You connect through patterns and emotion — structure that moves.',
  art: 'You think visually and care about how things are communicated, not just what.',
  engineering: 'You want to make things that work — tangible, useful, real.',
  languages: "You're drawn to how different cultures frame the world differently.",
  default: 'Your curiosity cuts across boundaries — you like connecting ideas.',
};

export default function MajorDecisionLayer({ ranked, majorField, ageGroup, personality, onContinue }) {
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [selectedField, setSelectedField] = useState(null);

  const top3 = (ranked || []).slice(0, 3);

  useEffect(() => {
    let cancelled = false;
    setAiLoading(true);

    AIService.call('majorDecision', {
      topDomains: (ranked || []).slice(0, 4).map((r) => r.domain),
      majorField,
      ageGroup,
      personality,
    })
      .then((result) => {
        if (!cancelled) {
          setAiResult(result);
          setAiLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setAiLoading(false);
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFieldPick(field) {
    setSelectedField(field.name);
    setTimeout(() => onContinue?.(field.name), 400);
  }

  function handleContinue() {
    const fallback = ranked?.[0]?.domain || 'science';
    onContinue?.(selectedField || majorField || fallback);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.42, ease: [0.25, 0.8, 0.25, 1] }}
      className="flex w-full max-w-2xl flex-col items-center gap-6 px-0 py-2"
    >
      {/* Header card */}
      <div className="w-full rounded-[26px] border border-[rgba(255,255,255,0.7)] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,248,237,0.96))] px-5 py-5 shadow-[0_24px_60px_rgba(72,49,10,0.08)]">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <span className="rounded-full bg-[rgba(42,42,42,0.06)] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">
              What I see in you
            </span>
            <h2 className="mt-3 mb-1 font-display text-[1.9rem] font-semibold text-text-primary leading-tight">
              I've been watching what you picked.
            </h2>
            <p className="font-body text-[15px] text-text-secondary max-w-xl">
              Here's what I see.
            </p>
          </div>
          <div className="rounded-[22px] bg-[rgba(255,107,53,0.08)] px-4 py-3 text-center shrink-0">
            <Ember mood="proud" size="md" glowIntensity={0.6} />
          </div>
        </div>

        {/* Top 3 domain insights */}
        {top3.length > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            {top3.map(({ domain }, i) => {
              const color = DOMAIN_COLORS[domain] || '#FF6B35';
              const emoji = DOMAIN_EMOJIS[domain] || '✨';
              const disposition = DOMAIN_DISPOSITIONS[domain] || DOMAIN_DISPOSITIONS.default;
              return (
                <motion.div
                  key={domain}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.32, ease: [0.25, 0.8, 0.25, 1] }}
                  className="flex items-center gap-3 rounded-[16px] px-4 py-3"
                  style={{ background: `${color}12`, border: `1px solid ${color}22` }}
                >
                  <span className="text-2xl shrink-0">{emoji}</span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold capitalize text-text-primary">{domain}</p>
                    <p className="font-body text-xs text-text-secondary leading-snug">{disposition}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI insight + field suggestions */}
      <div className="w-full rounded-[26px] border border-[rgba(255,255,255,0.7)] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,248,237,0.96))] px-5 py-5 shadow-[0_24px_60px_rgba(72,49,10,0.08)]">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Fields that might fit</p>

        <AnimatePresence mode="wait">
          {aiLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {/* Insight skeleton */}
              <div className="rounded-[14px] bg-[rgba(42,42,42,0.06)] px-4 py-3 space-y-2">
                <div className="h-3 w-3/4 rounded-full bg-[rgba(42,42,42,0.08)] animate-pulse" />
                <div className="h-3 w-full rounded-full bg-[rgba(42,42,42,0.08)] animate-pulse" />
                <div className="h-3 w-2/3 rounded-full bg-[rgba(42,42,42,0.08)] animate-pulse" />
              </div>
              {/* Field card skeletons */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-[18px] border border-[rgba(42,42,42,0.06)] bg-[rgba(255,255,255,0.6)] px-4 py-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[rgba(42,42,42,0.08)] animate-pulse" />
                    <div className="h-4 w-32 rounded-full bg-[rgba(42,42,42,0.08)] animate-pulse" />
                  </div>
                  <div className="h-3 w-full rounded-full bg-[rgba(42,42,42,0.06)] animate-pulse" />
                  <div className="h-3 w-4/5 rounded-full bg-[rgba(42,42,42,0.06)] animate-pulse" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-3"
            >
              {/* AI insight paragraph */}
              {aiResult?.insight && (
                <div className="rounded-[14px] bg-[rgba(255,107,53,0.06)] border border-[rgba(255,107,53,0.12)] px-4 py-3">
                  <p className="font-body text-sm text-text-secondary leading-relaxed">{aiResult.insight}</p>
                </div>
              )}

              {/* Field suggestion cards */}
              {(aiResult?.fields || []).map((field, i) => {
                const isStrong = field.match === 'strong';
                const isPicked = selectedField === field.name;
                return (
                  <motion.button
                    key={field.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(72,49,10,0.10)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFieldPick(field)}
                    className="w-full text-left rounded-[18px] border px-4 py-4 transition-all"
                    style={{
                      background: isPicked
                        ? 'rgba(255,107,53,0.09)'
                        : 'rgba(255,255,255,0.7)',
                      borderColor: isPicked
                        ? 'rgba(255,107,53,0.35)'
                        : 'rgba(42,42,42,0.08)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{field.emoji}</span>
                        <span className="font-display text-[15px] font-semibold text-text-primary leading-tight">
                          {field.name}
                        </span>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-body font-semibold uppercase tracking-wide"
                        style={{
                          background: isStrong ? 'rgba(45,147,108,0.12)' : 'rgba(211,133,47,0.12)',
                          color: isStrong ? '#2D936C' : '#D3852F',
                        }}
                      >
                        {isStrong ? 'strong match' : 'moderate'}
                      </span>
                    </div>
                    {field.why && (
                      <p className="mt-2 font-body text-sm text-text-secondary leading-snug">{field.why}</p>
                    )}
                    {field.tradeoff && (
                      <p className="mt-1.5 font-body text-xs text-text-muted leading-snug">
                        Trade-off: {field.tradeoff}
                      </p>
                    )}
                  </motion.button>
                );
              })}

              {/* Fallback if AI gave nothing useful */}
              {!aiResult?.fields?.length && (
                <p className="font-body text-sm text-text-muted text-center py-2">
                  Couldn't load suggestions — tap "Start exploring" to continue.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Archive note */}
      <p className="font-body text-xs text-text-muted text-center max-w-xs leading-relaxed">
        Your picks are saved. You can revisit this recommendation anytime from your curiosity history.
      </p>

      {/* Continue button */}
      <motion.button
        whileHover={{ scale: 1.03, boxShadow: '0 12px 32px rgba(255,107,53,0.32)' }}
        whileTap={{ scale: 0.97 }}
        onClick={handleContinue}
        className="btn px-8 py-3 text-[15px]"
        style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
          color: 'white',
          boxShadow: '0 10px 24px rgba(255,107,53,0.28)',
          borderRadius: '100px',
        }}
      >
        Start exploring →
      </motion.button>
    </motion.div>
  );
}
