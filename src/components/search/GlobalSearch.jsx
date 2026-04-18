import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIService from '../../ai/ai.service.js';
void motion;

const CURIOSITY_LOG_KEY = 'spark_curiosity_log';

const KNOWLEDGE_STATES = [
  { id: 'new',     label: '✨ New to me',       color: '#6C63FF', bg: 'rgba(108,99,255,0.10)' },
  { id: 'heard',   label: '👂 I\'ve heard of it', color: '#FF6B35', bg: 'rgba(255,107,53,0.10)' },
  { id: 'bit',     label: '🌱 Know a bit',       color: '#2D936C', bg: 'rgba(45,147,108,0.10)' },
  { id: 'well',    label: '✅ Know this well',   color: '#FFA62B', bg: 'rgba(255,166,43,0.10)' },
];

function getCuriosityLog() {
  try {
    return JSON.parse(localStorage.getItem(CURIOSITY_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCuriosityEntry(entry) {
  try {
    const log = getCuriosityLog();
    log.unshift(entry);
    localStorage.setItem(CURIOSITY_LOG_KEY, JSON.stringify(log.slice(0, 50)));
  } catch {
    // ignore
  }
}

function SkeletonLines() {
  return (
    <div className="space-y-3 py-2">
      {[0.9, 0.75, 0.85, 0.6].map((w, i) => (
        <motion.div
          key={i}
          className="h-4 rounded-full bg-[rgba(42,42,42,0.08)]"
          style={{ width: `${w * 100}%` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: i * 0.12, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function GlobalSearch({ open, onClose, userContextObj, onGoDeeper }) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [explainer, setExplainer] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [recentLog, setRecentLog] = useState([]);
  const inputRef = useRef(null);

  // Refresh log whenever overlay opens
  useEffect(() => {
    if (open) {
      setRecentLog(getCuriosityLog().slice(0, 5));
      // reset state for new open
      setQuery('');
      setSubmitted('');
      setExplainer('');
      setSelectedState(null);
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleSubmit = useCallback(async (term) => {
    const q = (term || query).trim();
    if (!q) return;
    setSubmitted(q);
    setExplainer('');
    setSelectedState(null);
    setLoading(true);

    try {
      const result = await AIService.call('explainer', {
        currentNode: q,
        currentPath: [q],
        ageGroup: userContextObj?.ageGroup || 'college',
        personality: userContextObj?.personality || 'spark',
        topInterests: userContextObj?.topInterests || [],
        name: userContextObj?.name || '',
      });
      setExplainer(typeof result === 'string' ? result : (result?.text || ''));
    } catch {
      setExplainer(`${q} is a fascinating topic worth exploring. Type it into Spark's Explore tab to go deeper.`);
    } finally {
      setLoading(false);
    }
  }, [query, userContextObj]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSubmit(query.trim());
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [query, handleSubmit, onClose]);

  const handleSelectState = useCallback((stateId) => {
    if (!submitted) return;
    setSelectedState(stateId);
    const entry = { query: submitted, timestamp: Date.now(), knowledgeState: stateId };
    saveCuriosityEntry(entry);
    setRecentLog(getCuriosityLog().slice(0, 5));
  }, [submitted]);

  const handleGoDeeper = useCallback(() => {
    if (!submitted) return;
    onGoDeeper?.(submitted);
  }, [submitted, onGoDeeper]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="gs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[90] bg-[rgba(20,18,14,0.54)] backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel — slides in from top */}
          <motion.div
            key="gs-panel"
            initial={{ opacity: 0, y: -28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 top-4 z-[91] mx-auto max-w-[680px] px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
          >
            <div
              className="relative rounded-[28px] overflow-hidden"
              style={{
                background: 'rgba(255,253,247,0.97)',
                boxShadow: '0 32px 80px rgba(42,42,42,0.22), 0 0 0 1px rgba(255,255,255,0.7)',
                backdropFilter: 'blur(32px)',
              }}
            >
              {/* Ambient glow top */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-40"
                style={{
                  background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255,107,53,0.14) 0%, transparent 80%)',
                }}
              />

              {/* Search input row */}
              <div className="relative flex items-center gap-3 px-5 py-4 border-b border-[rgba(42,42,42,0.06)]">
                <motion.span
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 5 }}
                  className="text-2xl flex-shrink-0 select-none"
                  aria-hidden="true"
                >
                  ✦
                </motion.span>

                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search anything curious…"
                  className="flex-1 bg-transparent outline-none border-none font-body text-[17px] text-text-primary placeholder-text-muted"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-label="Search topic"
                />

                {query && (
                  <button
                    onClick={() => { setQuery(''); setSubmitted(''); setExplainer(''); inputRef.current?.focus(); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary text-xs transition-colors bg-[rgba(42,42,42,0.06)] hover:bg-[rgba(42,42,42,0.1)] flex-shrink-0"
                    aria-label="Clear"
                  >
                    ✕
                  </button>
                )}

                <button
                  onClick={() => handleSubmit(query.trim())}
                  disabled={!query.trim()}
                  className="flex-shrink-0 px-4 py-2 rounded-full font-body text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: query.trim() ? 'linear-gradient(135deg, #FF8A5A, #E63946)' : 'rgba(42,42,42,0.08)',
                    color: query.trim() ? '#fff' : '#8B8B7A',
                    boxShadow: query.trim() ? '0 6px 20px rgba(255,107,53,0.3)' : 'none',
                  }}
                >
                  Search
                </button>

                <button
                  onClick={onClose}
                  className="flex-shrink-0 text-sm font-body text-text-muted hover:text-text-primary transition-colors ml-1"
                  aria-label="Close search"
                >
                  Esc
                </button>
              </div>

              {/* Content area */}
              <div className="px-5 pb-5 pt-4 max-h-[75vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {(loading || submitted) && (
                    <motion.div
                      key={submitted}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="mb-5"
                    >
                      {/* Topic chip */}
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className="inline-block rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.12em]"
                          style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}
                        >
                          {submitted}
                        </span>
                      </div>

                      {/* Explainer text */}
                      <div className="mb-4">
                        {loading ? (
                          <SkeletonLines />
                        ) : (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35 }}
                            className="font-body text-[15px] leading-relaxed text-text-secondary"
                          >
                            {explainer}
                          </motion.p>
                        )}
                      </div>

                      {/* Knowledge state buttons */}
                      {!loading && explainer && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: 0.1 }}
                        >
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mb-2">
                            How well do you know this?
                          </p>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {KNOWLEDGE_STATES.map((ks) => (
                              <motion.button
                                key={ks.id}
                                onClick={() => handleSelectState(ks.id)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.96 }}
                                className="rounded-[14px] px-3 py-2.5 text-sm font-body font-semibold text-left transition-all"
                                style={{
                                  background: selectedState === ks.id ? ks.bg : 'rgba(42,42,42,0.04)',
                                  color: selectedState === ks.id ? ks.color : '#5C5C52',
                                  border: selectedState === ks.id
                                    ? `1.5px solid ${ks.color}40`
                                    : '1.5px solid transparent',
                                  boxShadow: selectedState === ks.id
                                    ? `0 4px 14px ${ks.color}20`
                                    : 'none',
                                }}
                              >
                                {ks.label}
                              </motion.button>
                            ))}
                          </div>

                          {/* Go deeper CTA */}
                          <motion.button
                            onClick={handleGoDeeper}
                            whileHover={{ scale: 1.02, boxShadow: '0 10px 32px rgba(255,107,53,0.28)' }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full rounded-[16px] py-3 font-body font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all"
                            style={{
                              background: 'linear-gradient(135deg, #FF8A5A 0%, #E63946 100%)',
                              boxShadow: '0 6px 20px rgba(255,107,53,0.24)',
                            }}
                          >
                            Go deeper →
                          </motion.button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Curiosity Log */}
                {recentLog.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: submitted ? 0.18 : 0 }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mb-2">
                      📚 Curiosity log
                    </p>
                    <div className="space-y-1.5">
                      {recentLog.map((entry, i) => {
                        const ks = KNOWLEDGE_STATES.find((k) => k.id === entry.knowledgeState);
                        return (
                          <motion.button
                            key={`${entry.query}-${entry.timestamp}`}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => {
                              setQuery(entry.query);
                              handleSubmit(entry.query);
                            }}
                            className="w-full flex items-center gap-3 rounded-[12px] px-3 py-2 text-left transition-colors hover:bg-[rgba(42,42,42,0.05)]"
                          >
                            <span className="text-text-muted text-sm">↩</span>
                            <span className="flex-1 font-body text-sm text-text-primary truncate">
                              {entry.query}
                            </span>
                            {ks && (
                              <span
                                className="text-[10px] font-body rounded-full px-2 py-0.5 flex-shrink-0"
                                style={{ background: ks.bg, color: ks.color }}
                              >
                                {ks.label.split(' ').slice(0, 2).join(' ')}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                              {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Empty idle state */}
                {!submitted && recentLog.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="py-6 text-center"
                  >
                    <p className="font-body text-text-muted text-sm">
                      Type anything — a word, a question, a concept — and Spark will explain it for you.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
