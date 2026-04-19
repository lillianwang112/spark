import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import AIService from '../../ai/ai.service.js';
import Ember from '../ember/Ember.jsx';

// ── Shimmer skeleton while cards load ──
function CardSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Ember mood="thinking" size="sm" glowIntensity={0.8} />
        <span className="font-body text-sm text-text-muted">Building your flashcards...</span>
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
          className="rounded-[22px] bg-[rgba(0,0,0,0.06)]"
          style={{ height: i === 0 ? 200 : 56 }}
        />
      ))}
    </div>
  );
}

// ── Single flippable flashcard ──
function FlashCard({ card, onResult, cardIndex, total }) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleFlip = useCallback(() => {
    if (!flipped) setFlipped(true);
  }, [flipped]);

  const handleResult = useCallback((got) => {
    if (answered) return;
    setAnswered(true);
    // Short delay lets the button tap feel registered, then transitions immediately
    setTimeout(() => onResult(got), 80);
  }, [answered, onResult]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress indicator */}
      <p className="text-center font-mono text-xs text-text-muted mb-4 tracking-[0.12em] uppercase">
        {cardIndex + 1} / {total} cards
      </p>

      {/* 3D flip container */}
      <div className="relative" style={{ perspective: 1000, height: 220 }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, type: 'spring', stiffness: 180, damping: 22 }}
          style={{ transformStyle: 'preserve-3d', position: 'absolute', inset: 0 }}
        >
          {/* Front — question */}
          <div
            className="absolute inset-0 rounded-[22px] flex flex-col items-center justify-center px-8 py-6 cursor-pointer select-none shadow-[0_16px_48px_rgba(42,42,42,0.10)]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #FFFDF7 0%, #FFF8ED 100%)',
              border: '1.5px solid rgba(255,107,53,0.14)',
            }}
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            aria-label="Tap to reveal answer"
            onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mb-4">Question</p>
            <p className="font-display text-xl text-text-primary text-center leading-snug">
              {card.question}
            </p>
            <motion.div
              className="mt-6 flex items-center gap-2 text-text-muted"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-xs font-body">Tap to flip</span>
              <span className="text-sm">↕</span>
            </motion.div>
          </div>

          {/* Back — answer */}
          <div
            className="absolute inset-0 rounded-[22px] flex flex-col items-center justify-center px-8 py-6 shadow-[0_16px_48px_rgba(255,107,53,0.14)]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #FFF4EE 0%, #FFF8F2 100%)',
              border: '1.5px solid rgba(255,107,53,0.22)',
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-spark-ember mb-4">Answer</p>
            <p className="font-body text-base text-text-primary text-center leading-relaxed">
              {card.answer}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rating buttons — appear after flip */}
      <AnimatePresence>
        {flipped && !answered && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 26 }}
            className="mt-5 flex gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(231,76,60,0.25)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleResult(false)}
              className="flex-1 py-3 rounded-[16px] font-body font-semibold text-sm transition-colors"
              style={{
                background: 'rgba(231,76,60,0.08)',
                color: '#E74C3C',
                border: '1.5px solid rgba(231,76,60,0.22)',
              }}
            >
              Review again 🔄
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(45,147,108,0.25)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleResult(true)}
              className="flex-1 py-3 rounded-[16px] font-body font-semibold text-sm transition-colors"
              style={{
                background: 'rgba(45,147,108,0.08)',
                color: '#2D936C',
                border: '1.5px solid rgba(45,147,108,0.22)',
              }}
            >
              Got it ✅
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Summary screen shown after all cards ──
function DeckSummary({ total, gotCount, onComplete }) {
  const pct = Math.round((gotCount / total) * 100);
  const message =
    pct === 100
      ? "You nailed every single one."
      : pct >= 75
      ? "Solid recall. The ones you missed will come back around."
      : pct >= 50
      ? "Good start — repetition makes the rest stick."
      : "These concepts take time. Come back tomorrow and they'll feel different.";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="flex flex-col items-center gap-5 py-6 max-w-sm mx-auto"
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 320, damping: 20 }}
      >
        <Ember mood={pct >= 75 ? 'celebrating' : pct >= 50 ? 'proud' : 'encouraging'} size="lg" glowIntensity={1.0} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="text-center"
      >
        <h3 className="font-display font-semibold text-2xl text-text-primary mb-1">
          {gotCount} / {total} cards
        </h3>
        <p className="font-mono text-2xl font-bold" style={{ color: '#FF6B35' }}>
          {pct}%
        </p>
      </motion.div>

      {/* Result bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="w-full rounded-[20px] overflow-hidden p-4 space-y-2"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,248,237,0.92))',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 8px 28px rgba(72,49,10,0.07)',
        }}
      >
        {[
          { label: 'Got it', count: gotCount, color: '#2D936C', emoji: '✅' },
          { label: 'Review again', count: total - gotCount, color: '#E74C3C', emoji: '🔄' },
        ].filter((r) => r.count > 0).map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-6 text-center text-base">{r.emoji}</span>
            <div className="flex-1 h-2 rounded-full bg-[rgba(42,42,42,0.07)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(r.count / total) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.38 + i * 0.12, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: r.color }}
              />
            </div>
            <span className="font-mono text-sm font-semibold w-4 text-right" style={{ color: r.color }}>
              {r.count}
            </span>
          </div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="font-body text-text-muted text-sm text-center italic max-w-[240px] leading-relaxed"
      >
        {message}
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62 }}
        whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(255,107,53,0.3)' }}
        whileTap={{ scale: 0.96 }}
        onClick={onComplete}
        className="px-10 py-3 rounded-full bg-spark-ember text-white font-body font-semibold hover:bg-orange-600 transition-colors min-h-[44px]"
      >
        Continue →
      </motion.button>
    </motion.div>
  );
}

// ── Main export ──
export default function CourseFlashcards({ topic, lessonTitle, keyPoints, ageGroup, onComplete }) {
  const [cards, setCards] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [gotCount, setGotCount] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Build a minimal flashcard deck from keyPoints while AI loads
    const fallbackCards = (keyPoints || []).slice(0, 5).map((pt, i) => ({
      question: `What does this mean: "${pt.slice(0, 60)}${pt.length > 60 ? '...' : ''}"?`,
      answer: pt,
    }));

    AIService.call('lessonFlashcards', { topic, lessonTitle, keyPoints, ageGroup })
      .then((result) => {
        if (cancelled) return;
        // AI returns { front, back } — normalise to { question, answer }
        const normalised = Array.isArray(result)
          ? result.map((c) => ({
              question: c.question || c.front || '',
              answer: c.answer || c.back || '',
            })).filter((c) => c.question && c.answer)
          : [];
        if (normalised.length > 0) {
          setCards(normalised);
        } else if (fallbackCards.length > 0) {
          setCards(fallbackCards);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (fallbackCards.length > 0) {
          setCards(fallbackCards);
        } else {
          setError(true);
        }
      });

    return () => { cancelled = true; };
  }, [topic, lessonTitle, keyPoints, ageGroup]);

  const handleResult = useCallback((got) => {
    if (got) setGotCount((c) => c + 1);
    const next = cardIndex + 1;
    if (next >= (cards?.length || 0)) {
      setDone(true);
    } else {
      setCardIndex(next);
    }
  }, [cardIndex, cards]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center px-6">
        <Ember mood="sheepish" size="md" />
        <p className="font-body text-text-muted text-sm">
          Couldn't generate flashcards right now.
        </p>
        <button
          onClick={onComplete}
          className="px-8 py-2.5 rounded-full bg-spark-ember text-white font-body font-semibold hover:bg-orange-600 transition-colors"
        >
          Continue anyway →
        </button>
      </div>
    );
  }

  if (!cards) return <CardSkeleton />;

  if (done) {
    return (
      <DeckSummary
        total={cards.length}
        gotCount={gotCount}
        onComplete={onComplete}
      />
    );
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={cardIndex}
        initial={{ opacity: 0, x: 48, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -48, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.25, 0.8, 0.25, 1] }}
      >
        <FlashCard
          card={cards[cardIndex]}
          cardIndex={cardIndex}
          total={cards.length}
          onResult={handleResult}
        />
      </motion.div>
    </AnimatePresence>
  );
}
