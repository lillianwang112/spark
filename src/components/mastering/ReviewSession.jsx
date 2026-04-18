// Spaced repetition review session
// Uses SM-2 algorithm from src/models/srs.js
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import Ember from '../ember/Ember.jsx';
import { calculateNextReview } from '../../models/srs.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import AIService from '../../ai/ai.service.js';

const RATING_OPTIONS = [
  { id: 'got_it', label: 'Got it', emoji: '✅', color: '#2D936C', description: 'Solid — no hesitation' },
  { id: 'kinda',  label: 'Kinda',  emoji: '🤔', color: '#FFA62B', description: 'Got there eventually' },
  { id: 'nope',   label: 'Nope',   emoji: '❌', color: '#E63946', description: 'Needed to look it up' },
];

function FlashCard({ track, userContextObj, onRate }) {
  const [flipped, setFlipped] = useState(false);
  const [explanation, setExplanation] = useState(track.explainerCache?.text || null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const color = DOMAIN_COLORS[track.domain] || '#FF6B35';

  const handleFlip = useCallback(async () => {
    setFlipped(true);
    if (!explanation) {
      setLoadingExplanation(true);
      try {
        const result = await AIService.call('explainer', {
          currentNode:      track.label,
          currentPath:      track.path || [track.label],
          ageGroup:         userContextObj?.ageGroup || 'college',
          name:             userContextObj?.name || 'Explorer',
          knowledgeState:   track.knowledgeState || null,
          topInterests:     userContextObj?.topInterests || [],
          explorationStyle: userContextObj?.explorationStyle || 'balanced',
          personality:      userContextObj?.personality || 'spark',
        });
        setExplanation(result);
      } catch {
        setExplanation(track.description || `This is ${track.label}. Keep exploring to learn more.`);
      } finally {
        setLoadingExplanation(false);
      }
    }
  }, [track, userContextObj, explanation]);

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Breadcrumb path */}
      {track.path?.length > 1 && (
        <p className="text-[11px] text-text-muted font-mono text-center mb-3 truncate" style={{ color: `${color}88` }}>
          {track.path.slice(0, -1).join(' › ')}
        </p>
      )}

      {/* Card with 3D flip */}
      <div className="relative" style={{ perspective: 1000 }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, type: 'spring', stiffness: 180, damping: 22 }}
          style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: 240 }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-[22px] overflow-hidden shadow-[0_16px_48px_rgba(42,42,42,0.12)]"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            {/* Domain color gradient header */}
            <div
              className="h-24 relative flex items-end px-5 pb-3"
              style={{ background: `linear-gradient(135deg, ${color}28 0%, ${color}14 60%, transparent 100%)` }}
            >
              <div
                className="pointer-events-none absolute top-0 right-0 w-24 h-24"
                style={{ background: `radial-gradient(circle at 80% 20%, ${color}30, transparent 70%)` }}
                aria-hidden="true"
              />
              <p
                className="text-[10px] font-mono uppercase tracking-[0.18em] relative"
                style={{ color: `${color}AA` }}
              >
                {track.domain}
              </p>
            </div>
            <div className="flex flex-col items-center gap-5 px-6 py-5 bg-bg-secondary -mt-0.5">
              <h3 className="font-display font-semibold text-[1.5rem] text-text-primary text-center leading-tight">
                {track.label}
              </h3>
              <motion.button
                onClick={handleFlip}
                whileHover={{ scale: 1.05, boxShadow: `0 8px 24px ${color}40` }}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-2.5 rounded-full text-white text-sm font-semibold min-h-[40px]"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
              >
                Flip to reveal →
              </motion.button>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-[22px] overflow-hidden shadow-[0_16px_48px_rgba(42,42,42,0.12)]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div
              className="h-2"
              style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
            />
            <div className="flex flex-col p-5 bg-bg-secondary" style={{ minHeight: 238 }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: `${color}99` }}>
                  {track.domain}
                </p>
              </div>
              <h3 className="font-display font-semibold text-lg text-text-primary mb-3">{track.label}</h3>
              {loadingExplanation ? (
                <div className="flex items-center gap-3 py-2">
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="font-body text-sm text-text-muted">Ember is thinking...</span>
                </div>
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="font-body text-text-secondary text-sm leading-relaxed line-clamp-5"
                >
                  {explanation}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {flipped && !loadingExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 26 }}
            className="mt-4"
          >
            <p className="text-[11px] text-text-muted text-center mb-3 font-mono uppercase tracking-[0.14em]">
              How did that feel?
            </p>
            <div className="flex gap-2 justify-center">
              {RATING_OPTIONS.map((opt, i) => (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 340, damping: 22 }}
                  whileHover={{ scale: 1.08, y: -3, boxShadow: `0 8px 20px ${opt.color}30` }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => onRate(track, opt.id)}
                  className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-[18px] border-2 min-w-[76px] transition-colors"
                  style={{
                    borderColor: `${opt.color}35`,
                    background: `${opt.color}08`,
                  }}
                  aria-label={opt.description}
                >
                  <motion.span
                    className="text-xl"
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.5, delay: i * 0.1 + 0.4 }}
                  >
                    {opt.emoji}
                  </motion.span>
                  <span className="text-xs font-body font-semibold" style={{ color: opt.color }}>{opt.label}</span>
                  <span className="text-[9px] font-body text-text-muted text-center leading-tight hidden sm:block">{opt.description}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReviewSession({ dueCards, userContextObj, onUpdateCard, onFinish }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]); // { card, rating, newSrs }
  const [emberMood, setEmberMood] = useState('attentive');
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentCard = dueCards[currentIdx];
  const progress = currentIdx / dueCards.length;

  const handleRate = useCallback((card, rating) => {
    const newSrs = calculateNextReview(card.srsData || {}, rating);
    const newLastTended = new Date().toISOString();
    const result = { card, rating, newSrs };
    setResults((prev) => [...prev, result]);

    // Update the card in parent state
    onUpdateCard?.({ ...card, srsData: newSrs, lastTended: newLastTended });

    // Ember reacts
    if (rating === 'got_it') setEmberMood('celebrating');
    else if (rating === 'kinda') setEmberMood('encouraging');
    else setEmberMood('sheepish');

    setTimeout(() => {
      setEmberMood('attentive');
      const nextIdx = currentIdx + 1;
      if (nextIdx >= dueCards.length) {
        setSessionComplete(true);
        setEmberMood('proud');
      } else {
        setCurrentIdx(nextIdx);
      }
    }, 600);
  }, [currentIdx, dueCards.length, onUpdateCard]);

  if (sessionComplete) {
    const gotIt = results.filter((r) => r.rating === 'got_it').length;
    const kinda  = results.filter((r) => r.rating === 'kinda').length;
    const nope   = results.filter((r) => r.rating === 'nope').length;
    const pct = Math.round((gotIt / dueCards.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="flex flex-col items-center gap-5 py-8 max-w-sm mx-auto"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Ember mood="celebrating" size="lg" glowIntensity={1.0} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h3 className="font-display font-semibold text-2xl text-text-primary mb-1">
            {pct === 100 ? 'Perfect session.' : pct >= 70 ? 'Strong session.' : 'Session complete.'}
          </h3>
          <p className="font-body text-text-muted text-sm">
            {dueCards.length} {dueCards.length === 1 ? 'card' : 'cards'} reviewed
          </p>
        </motion.div>

        {/* Animated results bars */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full rounded-[20px] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.86), rgba(255,248,237,0.9))',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: '0 8px 28px rgba(72,49,10,0.08)',
          }}
        >
          <div className="p-4 space-y-3">
            {[
              { label: 'Got it', count: gotIt, color: '#2D936C', emoji: '✅' },
              { label: 'Kinda', count: kinda, color: '#FFA62B', emoji: '🤔' },
              { label: 'Nope', count: nope, color: '#E63946', emoji: '❌' },
            ].filter((r) => r.count > 0).map((r, i) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{r.emoji}</span>
                <div className="flex-1 h-2 rounded-full bg-[rgba(42,42,42,0.07)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.count / dueCards.length) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                </div>
                <span className="text-sm font-mono font-semibold w-4 text-right" style={{ color: r.color }}>{r.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-body text-text-muted text-sm text-center italic max-w-[240px] leading-relaxed"
        >
          {gotIt === dueCards.length
            ? "You actually know this now. The intervals just got longer."
            : gotIt > dueCards.length / 2
            ? "Solid session. Keep tending — the hard ones remember you."
            : "The hard ones are the ones worth reviewing. See you soon."}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(255,107,53,0.3)' }}
          whileTap={{ scale: 0.96 }}
          onClick={onFinish}
          className="px-8 py-3 rounded-full bg-spark-ember text-white font-body font-semibold hover:bg-orange-600 transition-colors min-h-[44px]"
        >
          Back to Tracks →
        </motion.button>
      </motion.div>
    );
  }

  const currentColor = DOMAIN_COLORS[currentCard?.domain] || '#FF6B35';

  return (
    <div className="flex flex-col gap-5 py-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ember mood={emberMood} size="xs" glowIntensity={0.6} />
          <span className="font-body text-sm text-text-muted">
            {currentIdx + 1} <span className="text-text-muted/50">/</span> {dueCards.length}
          </span>
        </div>
        <button
          onClick={onFinish}
          className="text-sm text-text-muted hover:text-text-primary transition-colors font-body"
        >
          End session
        </button>
      </div>

      {/* Progress bar with domain color */}
      <div className="h-1.5 bg-[rgba(42,42,42,0.08)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${currentColor}, ${currentColor}CC)` }}
        />
      </div>

      {/* Current card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <FlashCard
            track={currentCard}
            userContextObj={userContextObj}
            onRate={handleRate}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
