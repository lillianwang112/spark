import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserContext } from '../hooks/useUserContext.jsx';
import { DOMAIN_COLORS } from '../utils/domainColors.js';
import AIService from '../ai/ai.service.js';
import { getTopDomains } from '../models/elo.js';
import { parseAIJson } from '../utils/helpers.js';
void motion;

const OPTIN_KEY = 'spark_opportunities_optin';

const GOAL_OPTIONS = [
  { value: 'research',  label: 'Find research opportunities' },
  { value: 'careers',   label: 'Explore careers' },
  { value: 'local',     label: 'Get involved locally' },
  { value: 'open',      label: 'Open to anything' },
];

const TYPE_COLORS = {
  competition: { bg: 'rgba(255,107,53,0.10)', color: '#E63946' },
  program:     { bg: 'rgba(108,99,255,0.10)', color: '#6C63FF' },
  club:        { bg: 'rgba(45,147,108,0.10)', color: '#2D936C' },
  professor:   { bg: 'rgba(74,111,165,0.10)', color: '#4A6FA5' },
  company:     { bg: 'rgba(255,166,43,0.10)', color: '#FFA62B' },
  community:   { bg: 'rgba(42,42,42,0.08)',   color: '#5C5C52' },
};

function OpportunityCard({ opp, index }) {
  const typeStyle = TYPE_COLORS[opp.type] || TYPE_COLORS.community;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: [0.25, 0.8, 0.25, 1] }}
      className="rounded-card p-4 border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.74)] shadow-soft"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0 mt-0.5">{opp.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-text-primary text-base leading-tight">
              {opp.name}
            </h3>
            <span
              className="text-[10px] font-mono uppercase tracking-[0.12em] rounded-full px-2 py-0.5 flex-shrink-0"
              style={{ background: typeStyle.bg, color: typeStyle.color }}
            >
              {opp.type}
            </span>
          </div>

          <p className="font-body text-sm text-text-secondary leading-relaxed mb-3">
            {opp.whyItConnects}
          </p>

          <div
            className="rounded-[12px] px-3 py-2.5"
            style={{ background: 'rgba(42,42,42,0.04)' }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mb-1">
              Next step
            </p>
            <p className="font-body text-sm text-text-primary">{opp.nextStep}</p>
          </div>

          {opp.timing && (
            <p className="mt-2 font-body text-xs text-text-muted">
              🕐 {opp.timing}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-card p-4 border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.74)] shadow-soft space-y-3"
    >
      {[0.6, 0.85, 0.7].map((w, i) => (
        <motion.div
          key={i}
          className="h-3.5 rounded-full bg-[rgba(42,42,42,0.07)]"
          style={{ width: `${w * 100}%` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, delay: i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </motion.div>
  );
}

export default function Opportunities({ userContextObj }) {
  const user = useUserContext();
  const [optedIn, setOptedIn] = useState(() => {
    try { return localStorage.getItem(OPTIN_KEY) === 'true'; } catch { return false; }
  });
  const [location, setLocation] = useState('');
  const [school, setSchool] = useState('');
  const [goal, setGoal] = useState('open');
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const topDomains = useMemo(() => getTopDomains(user.eloScores, 3), [user.eloScores]);
  const tracks = useMemo(() => user.tracks || [], [user.tracks]);

  const threadCount = tracks.length;

  const handleOptIn = useCallback((val) => {
    setOptedIn(val);
    try { localStorage.setItem(OPTIN_KEY, String(val)); } catch { /* ignore */ }
  }, []);

  const buildFingerprint = useCallback(() => {
    const deepTracks = tracks.filter((t) => (t.path?.length || 0) >= 3).slice(0, 3).map((t) => t.label);
    return `Top domains: ${topDomains.join(', ')}. Tracks: ${tracks.slice(0, 5).map((t) => t.label).join(', ')}. Deepest explorations: ${deepTracks.join(', ')}.`;
  }, [topDomains, tracks]);

  const handleFindOpportunities = useCallback(async () => {
    if (!topDomains.length && !tracks.length) {
      setError('Explore a few more topics first so Spark can build your thread fingerprint!');
      return;
    }
    setError('');
    setLoading(true);
    setOpportunities([]);
    setSearched(true);

    const fingerprint = buildFingerprint();
    const ageGroup = userContextObj?.ageGroup || user.ageGroup || 'college';
    const goalLabel = GOAL_OPTIONS.find((g) => g.value === goal)?.label || goal;

    const prompt = `You are Spark's opportunity engine. Based on this learner's thread fingerprint, surface 5 real-world opportunities that connect meaningfully to their demonstrated curiosity.

Age group: ${ageGroup}
Location: ${location || 'not specified'}
School: ${school || 'not specified'}
Goal: ${goalLabel}
Thread fingerprint: ${fingerprint}

For each opportunity, return ONLY valid JSON (no markdown, no explanation):
[{
  "emoji": "...",
  "name": "...",
  "type": "competition|program|club|professor|company|community",
  "whyItConnects": "...(specific, references their actual threads)...",
  "nextStep": "...(concrete, actionable)...",
  "timing": "...(deadline or always-open)"
}]

Prioritize specificity over comprehensiveness. 5 highly relevant opportunities beats 20 generic ones.`;

    const systemPrompt = 'You surface real, specific, named opportunities for curious learners. Always return valid JSON only — no markdown fences, no extra text.';

    try {
      const raw = await AIService.complete(prompt, systemPrompt);
      const parsed = parseAIJson(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setOpportunities(parsed);
      } else {
        setError('Could not parse opportunities. Try again!');
      }
    } catch (err) {
      console.warn('[Opportunities] AI call failed:', err?.message);
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [buildFingerprint, goal, location, school, topDomains, tracks, user.ageGroup, userContextObj?.ageGroup]);

  return (
    <div className="flex flex-col min-h-full px-4 pb-28 pt-5">
      <div className="mx-auto w-full max-w-[680px] space-y-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-display text-2xl font-bold text-text-primary mb-1">
            Connect to the World 🌍
          </h1>
          <p className="font-body text-sm text-text-secondary">
            Real opportunities that connect to what you've been learning.
          </p>
        </motion.div>

        {/* Thread fingerprint display */}
        {(topDomains.length > 0 || threadCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.05 }}
            className="rounded-card p-4 border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.6)] shadow-soft"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mb-2">
              Your thread fingerprint
            </p>
            <p className="font-body text-xs text-text-secondary mb-2">
              Based on your exploration of:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topDomains.map((domain) => (
                <span
                  key={domain}
                  className="rounded-full px-2.5 py-1 text-[11px] font-body font-semibold capitalize"
                  style={{
                    background: `${DOMAIN_COLORS[domain] || '#FF6B35'}15`,
                    color: DOMAIN_COLORS[domain] || '#FF6B35',
                  }}
                >
                  {domain}
                </span>
              ))}
              {threadCount > 0 && (
                <span className="rounded-full px-2.5 py-1 text-[11px] font-body text-text-muted bg-[rgba(42,42,42,0.05)]">
                  {threadCount} thread{threadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Opt-in toggle */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.08 }}
          className="rounded-card p-4 border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.74)] shadow-soft"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-display font-semibold text-text-primary text-base mb-1">
                Surface opportunities for me
              </h2>
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                {optedIn
                  ? "Spark will find clubs, competitions, professors, and companies that connect to your actual curiosity threads."
                  : "Want Spark to surface real opportunities based on what you've been learning? Turn this on and we'll find clubs, competitions, professors, and companies that connect to your actual curiosity threads."}
              </p>
            </div>
            <button
              onClick={() => handleOptIn(!optedIn)}
              className="flex-shrink-0 mt-0.5 w-12 h-6 rounded-full transition-colors duration-200 relative focus-visible:outline-2 focus-visible:outline-spark-ember"
              style={{
                background: optedIn
                  ? 'linear-gradient(135deg, #FF8A5A, #E63946)'
                  : 'rgba(42,42,42,0.14)',
              }}
              aria-pressed={optedIn}
              aria-label="Toggle opportunity discovery"
            >
              <motion.span
                animate={{ x: optedIn ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
              />
            </button>
          </div>
        </motion.div>

        {/* Form — only visible when opted in */}
        <AnimatePresence>
          {optedIn && (
            <motion.div
              key="opp-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                {/* Location */}
                <div className="rounded-card p-4 border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.74)] shadow-soft">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Remote"
                    className="w-full bg-transparent outline-none border-none font-body text-[15px] text-text-primary placeholder-text-muted"
                  />
                </div>

                {/* School */}
                <div className="rounded-card p-4 border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.74)] shadow-soft">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">
                    School <span className="normal-case tracking-normal text-text-muted opacity-70">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full bg-transparent outline-none border-none font-body text-[15px] text-text-primary placeholder-text-muted"
                  />
                </div>

                {/* Goal */}
                <div className="rounded-card p-4 border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.74)] shadow-soft">
                  <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">
                    What are you looking for?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {GOAL_OPTIONS.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setGoal(g.value)}
                        className="rounded-[12px] px-3 py-2.5 text-sm font-body font-medium text-left transition-all"
                        style={{
                          background: goal === g.value ? 'rgba(255,107,53,0.10)' : 'rgba(42,42,42,0.04)',
                          color: goal === g.value ? '#FF6B35' : '#5C5C52',
                          border: goal === g.value ? '1.5px solid rgba(255,107,53,0.25)' : '1.5px solid transparent',
                        }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA button */}
                <motion.button
                  onClick={handleFindOpportunities}
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02, boxShadow: '0 12px 36px rgba(255,107,53,0.28)' } : {}}
                  whileTap={!loading ? { scale: 0.97 } : {}}
                  className="w-full rounded-[16px] py-3.5 font-display font-semibold text-white text-base flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: loading
                      ? 'rgba(42,42,42,0.12)'
                      : 'linear-gradient(135deg, #FF8A5A 0%, #E63946 100%)',
                    color: loading ? '#8B8B7A' : '#fff',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(255,107,53,0.24)',
                  }}
                >
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        className="text-xl"
                      >
                        ✦
                      </motion.span>
                      Finding opportunities…
                    </>
                  ) : (
                    'Find opportunities'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-card px-4 py-3 bg-[rgba(230,57,70,0.08)] border border-[rgba(230,57,70,0.15)]"
            >
              <p className="font-body text-sm text-[#E63946]">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {(loading || opportunities.length > 0) && searched && (
            <motion.div
              key="opp-results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {loading ? 'Scanning opportunities…' : `${opportunities.length} opportunities found`}
                </p>
              </div>

              {loading
                ? [0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} index={i} />)
                : opportunities.map((opp, i) => (
                    <OpportunityCard key={`${opp.name}-${i}`} opp={opp} index={i} />
                  ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not opted in + no activity — idle state */}
        {!optedIn && topDomains.length === 0 && threadCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-card p-6 border border-[rgba(255,255,255,0.72)] bg-[rgba(255,255,255,0.5)] text-center"
          >
            <p className="text-3xl mb-3">🌍</p>
            <p className="font-display font-semibold text-text-primary mb-1">
              Build your curiosity profile first
            </p>
            <p className="font-body text-sm text-text-secondary">
              Explore topics in the Discover tab. The more threads you pull, the more targeted your opportunities become.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
