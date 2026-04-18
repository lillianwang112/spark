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
        <p className="text-xs text-text-muted font-mono text-center mb-3 truncate">
          {track.path.slice(0, -1).join(' → ')}
        </p>
      )}

      {/* Card */}
      <div className="relative" style={{ perspective: 1000 }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
          style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: 220 }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-card shadow-card overflow-hidden"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="h-1.5" style={{ background: color }} />
            <div className="flex flex-col items-center justify-center h-full p-8 bg-bg-secondary" style={{ minHeight: 220 }}>
              <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">{track.domain}</p>
              <h3 className="font-display font-semibold text-2xl text-text-primary text-center leading-tight mb-6">
                {track.label}
              </h3>
              <button
                onClick={handleFlip}
                className="px-5 py-2.5 rounded-full bg-spark-ember text-white text-sm font-medium hover:bg-orange-600 transition-colors min-h-[40px]"
              >
                Reveal →
              </button>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-card shadow-card overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="h-1.5" style={{ background: color }} />
            <div className="flex flex-col p-5 bg-bg-secondary" style={{ minHeight: 220 }}>
              <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-2">{track.domain}</p>
              <h3 className="font-display font-semibold text-lg text-text-primary mb-3">{track.label}</h3>
              {loadingExplanation ? (
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <span className="inline-block w-3 h-3 rounded-full bg-spark-ember" style={{ animation: 'pulse-ember 1s infinite' }} />
                  Ember is thinking...
                </div>
              ) : (
                <p className="font-body text-text-secondary text-sm leading-relaxed line-clamp-4">
                  {explanation}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons — only show when flipped */}
      <AnimatePresence>
        {flipped && !loadingExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <p className="text-xs text-text-muted text-center mb-3 font-body">How did that feel?</p>
            <div className="flex gap-2 justify-center">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onRate(track, opt.id)}
                  className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-card border-2 transition-all duration-150 hover:scale-105 active:scale-95 min-w-[72px]"
                  style={{ borderColor: `${opt.color}40` }}
                  aria-label={opt.description}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-xs font-body font-medium text-text-primary">{opt.label}</span>
                </button>
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

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 py-8 max-w-sm mx-auto"
      >
        <Ember mood="celebrating" size="lg" glowIntensity={0.9} />
        <div className="text-center">
          <h3 className="font-display font-semibold text-xl text-text-primary mb-1">
            Session complete
          </h3>
          <p className="font-body text-text-muted text-sm">
            {dueCards.length} {dueCards.length === 1 ? 'card' : 'cards'} reviewed
          </p>
        </div>

        {/* Results breakdown */}
        <div className="flex gap-4 justify-center">
          {gotIt > 0 && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">✅</span>
              <span className="text-sm font-body font-semibold text-[#2D936C]">{gotIt}</span>
            </div>
          )}
          {kinda > 0 && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">🤔</span>
              <span className="text-sm font-body font-semibold text-[#FFA62B]">{kinda}</span>
            </div>
          )}
          {nope > 0 && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl">❌</span>
              <span className="text-sm font-body font-semibold text-[#E63946]">{nope}</span>
            </div>
          )}
        </div>

        <p className="font-body text-text-muted text-sm text-center italic max-w-[240px]">
          {gotIt === dueCards.length
            ? "You actually know this now."
            : gotIt > dueCards.length / 2
            ? "Solid session. Keep tending."
            : "The hard ones are the ones worth reviewing. See you soon."}
        </p>

        <button
          onClick={onFinish}
          className="px-6 py-3 rounded-card bg-spark-ember text-white font-body font-medium hover:bg-orange-600 transition-colors min-h-[44px]"
        >
          Back to Tracks
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ember mood={emberMood} size="xs" glowIntensity={0.5} />
          <span className="font-body text-sm text-text-muted">
            {currentIdx + 1} / {dueCards.length}
          </span>
        </div>
        <button
          onClick={onFinish}
          className="text-sm text-text-muted hover:text-text-primary transition-colors font-body"
        >
          End session
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[rgba(42,42,42,0.08)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-spark-ember rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4 }}
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
