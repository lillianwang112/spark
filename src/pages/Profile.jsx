import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import Ember from '../components/ember/Ember.jsx';
import Modal from '../components/common/Modal.jsx';
import JourneyTimeline from '../components/profile/JourneyTimeline.jsx';
import StreakFlame from '../components/common/StreakFlame.jsx';
import ProgressRing from '../components/common/ProgressRing.jsx';
import { useUserContext } from '../hooks/useUserContext.jsx';
import { DOMAIN_COLORS, DOMAIN_EMOJIS, BADGES } from '../utils/constants.js';
import { getRankedDomains, normalizeScores } from '../models/elo.js';
import { getTreeStage, TREE_STAGE_LABELS } from '../models/node.js';
import AIService from '../ai/ai.service.js';
import { storage } from '../services/storage.js';
import { copyThreadUrl } from '../utils/threads.js';

// ── Domain constellation — visual bubble map ──

// Positions chosen so every circle (up to maxR) + label stays inside the viewBox.
// Mini: 6 slots, viewH=90. Max r=7.5 → label at worst: y=69+7.5+4=80.5 ✓
const MINI_POSITIONS = [
  { x: 50, y: 40 },  // center
  { x: 74, y: 22 },  // top-right
  { x: 26, y: 22 },  // top-left
  { x: 79, y: 54 },  // right
  { x: 21, y: 54 },  // left
  { x: 50, y: 69 },  // bottom
];
const MINI_VIEW_H = 90;

// Full: 10 slots, viewH=108. Max r=11 → label at worst: y=74+11+4.5=89.5 ✓
const FULL_POSITIONS = [
  { x: 50, y: 38 },  // center
  { x: 74, y: 20 },  // top-right
  { x: 26, y: 20 },  // top-left
  { x: 80, y: 50 },  // right
  { x: 20, y: 50 },  // left
  { x: 50, y: 66 },  // bottom-center
  { x: 66, y: 74 },  // bottom-right
  { x: 34, y: 74 },  // bottom-left
  { x: 68, y: 34 },  // upper-right-inner
  { x: 32, y: 34 },  // upper-left-inner
];
const FULL_VIEW_H = 108;

function ConstellationSVG({ ranked, normalized, positions, maxR, viewH, showPct = false }) {
  const maxNorm = Math.max(...Object.values(normalized), 1);
  const slots = ranked.filter((r) => (normalized[r.domain] || 0) > 5).slice(0, positions.length);

  return (
    <svg
      viewBox={`0 0 100 ${viewH}`}
      className="w-full"
      style={{ display: 'block' }}
      aria-label="Domain interest map"
      role="img"
    >
      {/* Subtle connecting lines */}
      {slots.slice(0, 4).flatMap((_, i) =>
        slots.slice(i + 1, i + 3).map((_, j) => {
          const pa = positions[i];
          const pb = positions[i + j + 1];
          if (!pa || !pb) return null;
          return (
            <line key={`l-${i}-${j}`}
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke="rgba(42,42,42,0.06)" strokeWidth="0.5"
            />
          );
        })
      )}

      {slots.map((r, i) => {
        const norm = normalized[r.domain] || 0;
        const fraction = norm / maxNorm;
        const radius = 3.5 + fraction * maxR;
        const pos = positions[i];
        if (!pos) return null;
        const color = DOMAIN_COLORS[r.domain] || '#8B8B7A';
        const emoji = DOMAIN_EMOJIS?.[r.domain] || '✦';
        const pct = Math.round(fraction * 100);
        // label sits just below the circle, clamped inside viewBox
        const labelY = Math.min(pos.y + radius + 4, viewH - 1.5);

        return (
          <g key={r.domain}>
            {/* Glow halo */}
            <motion.circle cx={pos.x} cy={pos.y} r={0}
              fill={color} opacity={0.13}
              animate={{ r: radius + 2.5 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
            />
            {/* Main circle */}
            <motion.circle cx={pos.x} cy={pos.y} r={0}
              fill={color} opacity={0.9}
              animate={{ r: radius }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            />
            {/* Emoji inside (only when circle is large enough) */}
            {radius > 5.5 && (
              <motion.text
                x={pos.x} y={pos.y + 0.5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.min(radius * 0.68, 5.5)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.07 + 0.25 }}
              >
                {emoji}
              </motion.text>
            )}
            {/* Domain label */}
            <motion.text
              x={pos.x} y={labelY}
              textAnchor="middle"
              fontSize="2.8"
              fill="rgba(42,42,42,0.58)"
              fontFamily="'Source Sans 3', sans-serif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.07 + 0.3 }}
            >
              {r.domain}
            </motion.text>
            {/* Percentage (full-view only) */}
            {showPct && (
              <motion.text
                x={pos.x} y={Math.min(labelY + 3.5, viewH - 0.5)}
                textAnchor="middle"
                fontSize="2.4"
                fill="rgba(42,42,42,0.35)"
                fontFamily="'JetBrains Mono', monospace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.07 + 0.4 }}
              >
                {pct}%
              </motion.text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Mini preview shown in the profile card
function DomainConstellation({ ranked, normalized, onExpand }) {
  const top = ranked.filter((r) => (normalized[r.domain] || 0) > 5);
  if (!top.length) return null;

  return (
    <div className="relative">
      <ConstellationSVG
        ranked={top}
        normalized={normalized}
        positions={MINI_POSITIONS}
        maxR={7.5}
        viewH={MINI_VIEW_H}
      />
      <button
        onClick={onExpand}
        className="absolute bottom-0 right-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(42,42,42,0.07)] text-text-muted text-[10px] font-body hover:bg-[rgba(42,42,42,0.12)] transition-colors min-h-[22px]"
        aria-label="Expand curiosity map"
      >
        expand ↗
      </button>
    </div>
  );
}

// ── Single domain bar ──
function DomainBar({ domain, score, maxScore }) {
  const color = DOMAIN_COLORS[domain] || '#8B8B7A';
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct < 3) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-body text-text-muted w-20 truncate capitalize">{domain}</span>
      <div className="flex-1 h-1.5 bg-[rgba(42,42,42,0.08)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-text-muted w-8 text-right">{Math.round(pct)}</span>
    </div>
  );
}

// ── Badge card ──
function BadgeCard({ badge, earned }) {
  return (
    <motion.div
      whileHover={earned ? { y: -2, scale: 1.02 } : {}}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      className={`relative flex flex-col items-center gap-1.5 overflow-hidden rounded-[18px] p-3 text-center transition-all ${
        earned
          ? 'border border-[rgba(255,107,53,0.28)] shadow-[0_10px_24px_rgba(255,107,53,0.15)]'
          : 'border border-transparent opacity-45'
      }`}
      style={
        earned
          ? { background: 'linear-gradient(135deg, rgba(255,209,102,0.22) 0%, rgba(255,138,90,0.18) 60%, rgba(255,255,255,0.8) 100%)' }
          : { background: 'rgba(255,255,255,0.5)' }
      }
    >
      {earned && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.75), rgba(255,255,255,0) 55%)',
          }}
        />
      )}
      <span className="relative text-2xl" style={earned ? { filter: 'drop-shadow(0 4px 10px rgba(255,107,53,0.25))' } : {}}>
        {badge.emoji}
      </span>
      <p className="relative font-body font-semibold text-text-primary text-xs leading-tight">{badge.title}</p>
      <p className="relative font-body text-text-muted text-[10px] leading-tight">{badge.description}</p>
    </motion.div>
  );
}

export default function Profile({ streakState }) {
  const user = useUserContext();
  const streak = streakState?.streak ?? 0;
  const longest = streakState?.longest ?? streak;
  const lifetime = streakState?.lifetime ?? 0;
  const sparksToday = streakState?.sparksToday ?? 0;
  const dailyGoal = streakState?.dailyGoal ?? 3;
  const [personalitySummary, setPersonalitySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [view, setView] = useState('constellation'); // 'constellation' | 'bars'
  const [showFullMap, setShowFullMap] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

  const ranked = getRankedDomains(user.eloScores);
  const normalized = normalizeScores(user.eloScores);
  const maxNorm = Math.max(...Object.values(normalized), 1);

  const tracks = useMemo(() => user.tracks || [], [user.tracks]);
  const treeStage = getTreeStage(user.stats?.nodesExplored || tracks.length || 0);
  const stageInfo = TREE_STAGE_LABELS[treeStage] || TREE_STAGE_LABELS.seed;

  const topDomains = useMemo(() =>
    ranked.slice(0, 5).map((r) => r.domain).filter((d) => (normalized[d] || 0) > 10),
    [ranked, normalized]
  );
  const sortedTracks = useMemo(
    () => [...tracks].sort((a, b) => new Date(b.lastTended || b.savedAt || b.timestamp || 0) - new Date(a.lastTended || a.savedAt || a.timestamp || 0)),
    [tracks]
  );
  const currentTrack = sortedTracks[0] || null;
  const pinnedThreads = sortedTracks.slice(0, 3);

  // Earned badge computation
  const earnedBadgeIds = useMemo(() => {
    const ids = new Set();
    const domainCount = ranked.filter((r) => (normalized[r.domain] || 0) > 15).length;

    if (tracks.length >= 1)           ids.add('architect');
    if (domainCount >= 5)             ids.add('polymath');
    if (domainCount >= 10)            ids.add('cartographer');
    if (tracks.length >= 3)           ids.add('rabbit');
    // First principles: has at least one 'know_well' tag + saved at depth > 3
    const knowledgeStates = user.knowledgeStates || {};
    const wellKnown = Object.values(knowledgeStates).filter((s) => s === 'know_well').length;
    if (wellKnown >= 1)               ids.add('first_principles');
    return ids;
  }, [tracks, ranked, normalized, user.knowledgeStates]);

  const loadSummary = async () => {
    if (loadingSummary || personalitySummary) return;
    setLoadingSummary(true);
    try {
      const firstBadge = earnedBadgeIds.size > 0
        ? BADGES.find((b) => earnedBadgeIds.has(b.id))?.title
        : null;
      const result = await AIService.call('personalitySummary', {
        topDomains,
        explorationStyle: user.explorationStyle || 'balanced',
        avgDepth: 3,
        surprisingPath: topDomains[topDomains.length - 1] || 'general curiosity',
        dominantKnowledge: 'curious',
        badge: firstBadge,
      });
      setPersonalitySummary(result);
    } catch {
      setPersonalitySummary('Your curiosity is building something unique. Keep exploring — the tree has a shape, and it\'s yours.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const emberGlow = Math.min(1, 0.2 + (tracks.length / 10) * 0.8);

  // Curiosity log — recent search history
  const [recentSearches] = useState(() => storage.getSearches().slice(0, 10));
  const recentSearchAgeDays = recentSearches[0]?.timestamp
    ? Math.floor((Date.now() - new Date(recentSearches[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isTreeResting = recentSearchAgeDays !== null && recentSearchAgeDays > 6;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-2 border-b border-[rgba(42,42,42,0.06)]">
        <div className="max-w-[600px] mx-auto">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Profile</h1>
          {user.name && (
            <p className="font-body text-text-muted text-sm mt-0.5">{user.name}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-[600px] mx-auto py-4 space-y-4">
          {isTreeResting && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[rgba(142,111,71,0.1)] rounded-card border border-[rgba(142,111,71,0.22)] p-4 flex items-center gap-4"
            >
              <Ember mood="attentive" size="sm" glowIntensity={0.25} />
              <div>
                <p className="font-display text-lg text-text-primary">Your tree is resting.</p>
                <p className="font-body text-sm text-text-secondary">
                  No guilt. Pick one thread and wake the canopy back up.
                </p>
              </div>
            </motion.div>
          )}

          {/* Tree stage + Ember + stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-secondary rounded-card shadow-card p-5"
          >
            <div className="flex items-center gap-4 mb-4">
              <Ember mood="proud" size="lg" glowIntensity={emberGlow} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xl">{stageInfo.emoji}</span>
                  <span className="font-display font-semibold text-text-primary">
                    {stageInfo.label} Tree
                  </span>
                </div>
                <p className="font-body text-text-muted text-sm truncate">
                  {stageInfo.description}
                </p>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[rgba(42,42,42,0.06)]">
              <div className="text-center">
                <p className="font-display font-semibold text-text-primary text-xl">
                  {user.stats?.nodesExplored || tracks.length || 0}
                </p>
                <p className="font-body text-text-muted text-xs">sparks</p>
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-text-primary text-xl">
                  {topDomains.length}
                </p>
                <p className="font-body text-text-muted text-xs">worlds</p>
              </div>
              <div className="text-center">
                <p className="font-display font-semibold text-text-primary text-xl">
                  {earnedBadgeIds.size}
                </p>
                <p className="font-body text-text-muted text-xs">badges</p>
              </div>
            </div>
          </motion.div>

          {/* Streak + goal */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="relative overflow-hidden rounded-[24px] border border-[rgba(255,181,94,0.24)] p-5 shadow-warm"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,233,196,0.88) 0%, rgba(255,212,158,0.82) 50%, rgba(255,249,238,0.94) 100%)',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <StreakFlame size="lg" streak={streak} />
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-spark-ember">
                    Commitment
                  </p>
                  <p className="font-display text-[1.8rem] font-semibold leading-none text-text-primary">
                    {streak} <span className="text-sm font-body text-text-muted">day{streak === 1 ? '' : 's'}</span>
                  </p>
                  <p className="mt-1 font-body text-xs text-text-secondary">
                    Longest run: <span className="font-semibold text-text-primary">{longest}</span> · Lifetime sparks: <span className="font-semibold text-text-primary">{lifetime}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center rounded-[18px] bg-[rgba(255,255,255,0.78)] px-3 py-2 border border-[rgba(255,181,94,0.22)]">
                <ProgressRing value={Math.min(sparksToday, dailyGoal)} max={dailyGoal} size={54} stroke={5} gradientId="profile-goal">
                  <span className="font-display text-base font-semibold text-text-primary">{sparksToday}</span>
                </ProgressRing>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">of {dailyGoal} today</p>
              </div>
            </div>
          </motion.div>

          {currentTrack && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-bg-secondary rounded-card shadow-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-text-muted">Currently Exploring</p>
                  <h2 className="font-display font-semibold text-text-primary mt-1">{currentTrack.label}</h2>
                  <p className="font-body text-sm text-text-secondary mt-1 leading-relaxed">
                    {currentTrack.description || 'This is the thread with the freshest energy in your tree right now.'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await copyThreadUrl(currentTrack);
                    setShareFeedback(`Copied thread for ${currentTrack.label}`);
                    setTimeout(() => setShareFeedback(''), 1800);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[rgba(91,94,166,0.1)] text-[#5B5EA6] text-xs font-medium hover:bg-[rgba(91,94,166,0.18)] transition-colors min-h-[32px]"
                >
                  ↗ Share thread
                </button>
              </div>
              {currentTrack.path?.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentTrack.path.map((segment, index) => (
                    <span
                      key={`${currentTrack.id}-${segment}-${index}`}
                      className="rounded-full bg-[rgba(42,42,42,0.05)] px-3 py-1 text-xs font-body text-text-muted"
                    >
                      {segment}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
          >
            <JourneyTimeline tracks={tracks} searches={recentSearches} />
          </motion.div>

          {pinnedThreads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-bg-secondary rounded-card shadow-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-text-primary">Pinned Threads</h2>
                <span className="font-body text-xs text-text-muted">Shareable rabbit holes</span>
              </div>
              <div className="space-y-2.5">
                {pinnedThreads.map((track) => (
                  <div
                    key={track.id}
                    className="rounded-[18px] border border-[rgba(42,42,42,0.06)] bg-[rgba(255,255,255,0.6)] px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body text-xs uppercase tracking-wider text-text-muted">{track.domain}</p>
                        <p className="font-display text-lg text-text-primary">{track.label}</p>
                      </div>
                      <button
                        onClick={async () => {
                          await copyThreadUrl(track);
                          setShareFeedback(`Copied thread for ${track.label}`);
                          setTimeout(() => setShareFeedback(''), 1800);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[rgba(91,94,166,0.1)] text-[#5B5EA6] text-xs font-medium hover:bg-[rgba(91,94,166,0.18)] transition-colors min-h-[32px]"
                      >
                        Copy link
                      </button>
                    </div>
                    {track.path?.length > 1 && (
                      <p className="mt-2 font-body text-sm text-text-secondary">
                        {track.path.join(' → ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {shareFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-card border border-[rgba(45,147,108,0.22)] bg-[rgba(45,147,108,0.08)] p-3"
            >
              <p className="font-body text-sm font-semibold text-[#2D936C]">{shareFeedback}</p>
            </motion.div>
          )}

          {/* Domain visualization */}
          {topDomains.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-bg-secondary rounded-card shadow-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-text-primary">Curiosity map</h2>
                <div className="flex items-center gap-1 bg-[rgba(42,42,42,0.06)] rounded-full p-0.5 text-xs">
                  {[['constellation', '✦'], ['bars', '≡']].map(([v, icon]) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-2.5 py-1 rounded-full transition-all ${view === v ? 'bg-spark-ember text-white' : 'text-text-muted hover:text-text-primary'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {view === 'constellation' ? (
                  <motion.div key="constellation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DomainConstellation
                      ranked={ranked}
                      normalized={normalized}
                      onExpand={() => setShowFullMap(true)}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="bars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                    {ranked.slice(0, 8).map((r) => (
                      <DomainBar
                        key={r.domain}
                        domain={r.domain}
                        score={normalized[r.domain] || 0}
                        maxScore={maxNorm}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Personality summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-bg-secondary rounded-card shadow-card p-5"
          >
            <h2 className="font-display font-semibold text-text-primary mb-3">
              Who you are as an explorer
            </h2>
            <AnimatePresence mode="wait">
              {personalitySummary ? (
                <motion.p
                  key="summary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-body text-text-primary text-sm leading-relaxed italic"
                >
                  "{personalitySummary}"
                </motion.p>
              ) : (
                <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                  <p className="font-body text-text-muted text-sm">
                    {topDomains.length > 0
                      ? 'Spark can generate a portrait of your curiosity style.'
                      : 'Explore more to unlock your curiosity portrait.'}
                  </p>
                  {topDomains.length > 0 && (
                    <button
                      onClick={loadSummary}
                      disabled={loadingSummary}
                      className="self-start flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,107,53,0.1)] text-spark-ember text-sm font-medium hover:bg-[rgba(255,107,53,0.2)] transition-colors disabled:opacity-50 min-h-[36px]"
                    >
                      {loadingSummary ? (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-spark-ember" style={{ animation: 'pulse-ember 1s infinite' }} />
                          Thinking...
                        </>
                      ) : (
                        '✨ Generate my portrait'
                      )}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Curiosity log */}
          {recentSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-bg-secondary rounded-card shadow-card p-5"
            >
              <h2 className="font-display font-semibold text-text-primary mb-3">Curiosity log</h2>
              <div className="space-y-1.5">
                {recentSearches.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1 border-b border-[rgba(42,42,42,0.04)] last:border-0 gap-3">
                    <span className="font-body text-sm text-text-primary truncate">{s.term}</span>
                    <span className="font-mono text-[10px] text-text-muted shrink-0">
                      {new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-secondary rounded-card shadow-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-text-primary">Badges</h2>
              <span className="font-body text-text-muted text-xs">
                {earnedBadgeIds.size} / {BADGES.length} earned
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedBadgeIds.has(badge.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-bg-secondary rounded-card shadow-card p-5"
          >
            <h2 className="font-display font-semibold text-text-primary mb-3">Settings</h2>
            <div className="space-y-3 mb-4">
              {[
                ['Age group', user.ageGroup?.replace('_', ' ')],
                ['Personality', user.personality],
                ['Learning pref', user.learningPref || 'not set'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-[rgba(42,42,42,0.04)] last:border-0">
                  <span className="font-body text-sm text-text-secondary">{label}</span>
                  <span className="font-body text-sm text-text-muted capitalize">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => user.resetOnboarding?.()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(42,42,42,0.1)] text-text-secondary text-sm font-body hover:bg-[rgba(42,42,42,0.04)] transition-colors min-h-[40px]"
            >
              ✦ Rediscover your interests
            </button>
          </motion.div>

        </div>
      </div>

      {/* Full curiosity map modal */}
      <Modal
        isOpen={showFullMap}
        onClose={() => setShowFullMap(false)}
        title="Your Curiosity Map"
        maxWidth="max-w-lg"
      >
        {showFullMap && (
          <div className="space-y-5">
            <ConstellationSVG
              ranked={ranked}
              normalized={normalized}
              positions={FULL_POSITIONS}
              maxR={11}
              viewH={FULL_VIEW_H}
              showPct
            />
            {/* Domain legend */}
            <div className="grid grid-cols-2 gap-1.5">
              {ranked
                .filter((r) => (normalized[r.domain] || 0) > 5)
                .slice(0, 10)
                .map((r) => {
                  const color = DOMAIN_COLORS[r.domain] || '#8B8B7A';
                  const maxNorm = Math.max(...Object.values(normalized), 1);
                  const pct = Math.round(((normalized[r.domain] || 0) / maxNorm) * 100);
                  return (
                    <div
                      key={r.domain}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                      style={{ background: `${color}12` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-body text-text-primary capitalize flex-1 truncate">
                        {r.domain}
                      </span>
                      <span className="text-xs font-mono text-text-muted">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
