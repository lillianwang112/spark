import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
import Confetti from '../common/Confetti.jsx';
import BloomBurst from '../common/BloomBurst.jsx';
import BranchStateBadge from './BranchStateBadge.jsx';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { BRANCH_STATES } from '../../utils/constants.js';
import { deriveBranchState } from '../../hooks/useBranchState.js';
import { openDeepDive } from '../../utils/navigation.js';
import TopicGraph from '../../services/topicGraph.js';
void motion;

// ── Compact explainer block shown after Water ──
function RevealBlock({ text, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-text-muted">
        <Ember mood="thinking" size="xs" glowIntensity={0.7} />
        <span className="font-body text-sm italic">Ember is retrieving this...</span>
      </div>
    );
  }

  if (!text) return null;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className="max-h-[36vh] overflow-y-auto rounded-[18px] bg-[rgba(255,255,255,0.8)] px-4 py-3 space-y-2 border border-[rgba(42,42,42,0.07)]"
    >
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className={`font-body leading-relaxed text-text-primary ${i === 0 ? 'text-[15px] font-medium' : 'text-sm text-text-secondary'}`}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

// ── Child topic picker shown after Sunlight ──
function ChildPicker({ track, userContextObj, onPick, onClose }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    TopicGraph.getChildren(track, userContextObj)
      .then((result) => {
        if (!cancelled) { setChildren(result || []); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [track, userContextObj]);

  return (
    <div className="rounded-[22px] bg-[rgba(255,255,255,0.9)] border border-[rgba(42,42,42,0.07)] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Go deeper into</p>
        <button onClick={onClose} className="text-xs text-text-muted hover:text-text-primary font-body">← Back</button>
      </div>
      <p className="font-display font-semibold text-text-primary mb-3">{track.label}</p>
      {loading ? (
        <div className="flex items-center gap-2 py-3">
          <Ember mood="thinking" size="xs" glowIntensity={0.6} />
          <span className="font-body text-sm text-text-muted">Finding rabbit holes...</span>
        </div>
      ) : children.length === 0 ? (
        <p className="font-body text-sm text-text-muted py-3">No subtopics found — try the full Explore tab.</p>
      ) : (
        <div className="space-y-2">
          {children.slice(0, 5).map((child) => {
            const color = DOMAIN_COLORS[child.domain] || '#FF6B35';
            return (
              <button
                key={child.id}
                onClick={() => onPick(child)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-[16px] transition-all hover:scale-[1.01]"
                style={{ background: `${color}0d`, border: `1px solid ${color}20` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-text-primary leading-snug">{child.label}</p>
                  {child.description && (
                    <p className="font-body text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">{child.description}</p>
                  )}
                </div>
                <span className="text-xs flex-shrink-0 mt-0.5" style={{ color }}>→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TendingSession({ tracks, userContextObj = {}, onTend, onFinish }) {
  const [index, setIndex] = useState(0);
  const [actionsTaken, setActionsTaken] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Per-card phase: 'action' | 'water-loading' | 'water-revealed' | 'sunlight-pick'
  const [phase, setPhase] = useState('action');
  const [revealText, setRevealText] = useState(null);
  const [dropletActive, setDropletActive] = useState(false);
  const [sunActive, setSunActive] = useState(false);
  const scrollRef = useRef(null);

  const list = useMemo(() => tracks.slice(0, 8), [tracks]);
  const current = list[index];
  const total = list.length;

  const advance = useCallback(() => {
    setPhase('action');
    setRevealText(null);
    setDropletActive(false);
    setSunActive(false);
    setTimeout(() => {
      if (index + 1 >= total) {
        setCelebrate(true);
        setCompleted(true);
      } else {
        setIndex(index + 1);
      }
    }, 500);
  }, [index, total]);

  // Scroll reveal block into view
  useEffect(() => {
    if ((phase === 'water-revealed' || phase === 'sunlight-pick') && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }, [phase]);

  // ── Water: load the explainer, let user rate their recall ──
  const handleWater = useCallback(async () => {
    if (!current) return;
    setDropletActive(true);
    setPhase('water-loading');
    setActionsTaken((n) => n + 1);
    onTend?.(current, 'water');

    try {
      const text = await TopicGraph.getExplainer(current, userContextObj);
      setRevealText(text);
    } catch {
      setRevealText(`${current.label} is a fascinating area. Re-reading its ideas keeps the branch alive.`);
    }
    setPhase('water-revealed');
  }, [current, userContextObj, onTend]);

  // Rating after reveal: updates branch based on how well they remembered
  const handleRating = useCallback((rating) => {
    if (!current) return;
    onTend?.(current, 'water-rated', rating);
    advance();
  }, [current, onTend, advance]);

  // ── Sunlight: show child topics to explore ──
  const handleSunlight = useCallback(() => {
    if (!current) return;
    setSunActive(true);
    setActionsTaken((n) => n + 1);
    onTend?.(current, 'sunlight');
    setPhase('sunlight-pick');
  }, [current, onTend]);

  // User picks a child in Sunlight phase → open it in Explore
  const handleChildPick = useCallback((child) => {
    openDeepDive(child); // Navigates to Explore tab + opens DeepDive for this child
    advance();
  }, [advance]);

  const handleSkip = useCallback(() => advance(), [advance]);

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
        <button onClick={onFinish} className="btn btn-primary px-6">
          Back to Tracks
        </button>
      </div>
    );
  }

  const color = DOMAIN_COLORS[current.domain] || '#FF6B35';
  const state = deriveBranchState(current);
  const stateMessage = {
    [BRANCH_STATES.THIRSTY]: 'A quick check-in keeps the branch saturated.',
    [BRANCH_STATES.WILTING]: 'This one needs attention — recall what you knew.',
    [BRANCH_STATES.DORMANT]: 'Long dormant. One honest look wakes the whole branch.',
    [BRANCH_STATES.HEALTHY]: 'Strong pulse. A drop of water keeps it that way.',
  };

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col gap-5 px-1 py-4">
      {/* Header */}
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

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-[rgba(42,42,42,0.08)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #FFD166, #FF6B35)' }}
          initial={{ width: 0 }}
          animate={{ width: `${(index / total) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + phase}
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
                  width: 22, height: 28, marginLeft: -11,
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
            {/* Topic header */}
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-shrink-0">
                <motion.span
                  className="block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                  animate={{ boxShadow: [`0 0 0 0px ${color}60`, `0 0 0 4px ${color}20`, `0 0 0 0px ${color}60`] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted capitalize">
                {current.domain}
              </span>
              <BranchStateBadge state={state} hideHealthy={false} size="sm" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-text-primary leading-tight">
              {current.label}
            </h3>
            {current.description && (
              <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">
                {current.description}
              </p>
            )}

            {/* Action phase */}
            {phase === 'action' && (
              <>
                <div className="mt-4 rounded-[16px] bg-[rgba(255,255,255,0.7)] px-4 py-3 border border-[rgba(42,42,42,0.06)]">
                  <p className="font-body text-sm text-text-secondary">{stateMessage[state] || stateMessage[BRANCH_STATES.HEALTHY]}</p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <motion.button
                    whileHover={{ y: -3, scale: 1.03, boxShadow: '0 12px 28px rgba(74,111,165,0.4)' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleWater}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#8ec5fc,#4A6FA5)] px-4 py-2.5 font-body text-sm font-semibold text-white shadow-[0_8px_20px_rgba(74,111,165,0.35)]"
                  >
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    >💧</motion.span>
                    Water
                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-80">Active Recall</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -3, scale: 1.03, boxShadow: '0 12px 28px rgba(255,166,43,0.4)' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSunlight}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ffd166,#ff8a5a)] px-4 py-2.5 font-body text-sm font-semibold text-[#6b4b10] shadow-[0_8px_20px_rgba(255,166,43,0.35)]"
                  >
                    <motion.span
                      animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                    >☀️</motion.span>
                    Sunlight
                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-70">Go Deeper</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSkip}
                    className="inline-flex items-center gap-2 rounded-full bg-[rgba(42,42,42,0.06)] px-4 py-2.5 font-body text-sm font-semibold text-text-muted hover:bg-[rgba(42,42,42,0.12)]"
                  >
                    Skip
                  </motion.button>
                </div>
              </>
            )}

            {/* Water loading + reveal phase */}
            {(phase === 'water-loading' || phase === 'water-revealed') && (
              <div className="mt-4 space-y-4" ref={scrollRef}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#4A6FA5]">💧 Active recall</span>
                  <span className="text-xs text-text-muted font-body">— read, then rate your memory</span>
                </div>

                <RevealBlock
                  text={revealText}
                  isLoading={phase === 'water-loading'}
                />

                {phase === 'water-revealed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 26 }}
                    className="space-y-2"
                  >
                    <p className="font-body text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted text-center">How well did you remember?</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {[
                        { id: 'got_it', emoji: '✅', label: 'Got it', color: '#2D936C', bg: 'rgba(45,147,108,0.12)' },
                        { id: 'kinda',  emoji: '🤔', label: 'Kinda',  color: '#8B6914', bg: 'rgba(255,166,43,0.12)' },
                        { id: 'nope',   emoji: '❌', label: 'Blanked', color: '#E63946', bg: 'rgba(230,57,70,0.1)' },
                      ].map((opt, i) => (
                        <motion.button
                          key={opt.id}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06, type: 'spring', stiffness: 360, damping: 22 }}
                          whileHover={{ scale: 1.06, y: -2, boxShadow: `0 6px 16px ${opt.color}28` }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleRating(opt.id)}
                          className="flex-1 min-w-[80px] rounded-full px-3 py-2.5 font-body text-sm font-semibold transition-colors"
                          style={{ background: opt.bg, color: opt.color }}
                        >
                          {opt.emoji} {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Sunlight pick phase */}
            {phase === 'sunlight-pick' && (
              <div className="mt-4" ref={scrollRef}>
                <ChildPicker
                  track={current}
                  userContextObj={userContextObj}
                  onPick={handleChildPick}
                  onClose={() => setPhase('action')}
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Ember reaction */}
      <div className="flex items-center justify-center gap-3">
        <Ember
          mood={
            phase === 'water-loading' ? 'thinking'
            : phase === 'water-revealed' ? 'attentive'
            : phase === 'sunlight-pick' ? 'curious'
            : dropletActive ? 'attentive'
            : sunActive ? 'proud'
            : 'encouraging'
          }
          size="sm"
          glowIntensity={0.7}
        />
        <p className="font-body text-sm text-text-secondary max-w-sm">
          {phase === 'water-loading'
            ? 'Pulling the memory back to the surface...'
            : phase === 'water-revealed'
            ? 'Read it. Then tell me how much you remembered.'
            : phase === 'sunlight-pick'
            ? 'Pick a thread to follow — it feeds right back to the root.'
            : dropletActive
            ? 'Water trickles back into the branch.'
            : sunActive
            ? 'Sunlight reaches from root to leaf.'
            : 'Pick a care action. Small gestures make the tree remember you.'}
        </p>
      </div>
    </div>
  );
}
