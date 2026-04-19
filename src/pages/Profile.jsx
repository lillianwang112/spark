import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import Ember from '../components/ember/Ember.jsx';
import Modal from '../components/common/Modal.jsx';
import JourneyTimeline from '../components/profile/JourneyTimeline.jsx';
import LivingTreeViz from '../components/profile/LivingTreeViz.jsx';
import StreakFlame from '../components/common/StreakFlame.jsx';
import ProgressRing from '../components/common/ProgressRing.jsx';
import { useUserContext } from '../hooks/useUserContext.jsx';
import { deriveBranchState } from '../hooks/useBranchState.js';
import { DOMAIN_COLORS, DOMAIN_EMOJIS, BADGE_SYSTEM, TIER_STYLES } from '../utils/constants.js';
import StudyCalendar from '../components/profile/StudyCalendar.jsx';
import { loadDemoProfile, clearDemoProfile } from '../data/demoProfile.js';
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

function buildRecentDays(count = 84) {
  const days = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    days.push(day);
  }
  return days;
}

function activityIntensity(value = 0) {
  if (value >= 5) return 'bg-[#2D936C]';
  if (value >= 3) return 'bg-[#79C99E]';
  if (value >= 1) return 'bg-[#CBEBD9]';
  return 'bg-[rgba(42,42,42,0.08)]';
}

function LearningCalendar({ dailyActivity = {} }) {
  const days = useMemo(() => buildRecentDays(84), []);
  const totalActiveDays = days.filter((day) => dailyActivity[day.toISOString().slice(0, 10)] > 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="bg-bg-secondary rounded-card shadow-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-semibold text-text-primary">Learning Calendar</h2>
          <p className="font-body text-xs text-text-muted mt-0.5">Last 12 weeks of curiosity activity.</p>
        </div>
        <span className="font-body text-xs text-text-muted">{totalActiveDays} active days</span>
      </div>
      <div className="grid grid-cols-12 gap-1.5">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const value = dailyActivity[key] || 0;
          return (
            <div
              key={key}
              className={`h-3.5 rounded-[4px] ${activityIntensity(value)}`}
              title={`${key}: ${value} spark${value === 1 ? '' : 's'}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] font-body text-text-muted">
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-[rgba(42,42,42,0.08)]" />0</span>
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-[#CBEBD9]" />1-2</span>
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-[#79C99E]" />3-4</span>
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-[#2D936C]" />5+</span>
      </div>
    </motion.div>
  );
}

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function RobustMonthlyCalendar({ dailyActivity = {} }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const cells = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.065 }}
      className="bg-bg-secondary rounded-card shadow-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-text-primary">Tiger-style Monthly Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="h-8 w-8 rounded-full bg-[rgba(42,42,42,0.08)] text-text-primary hover:bg-[rgba(42,42,42,0.14)] transition-colors"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="font-body text-sm text-text-primary min-w-[140px] text-center">{monthLabel}</span>
          <button
            onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="h-8 w-8 rounded-full bg-[rgba(42,42,42,0.08)] text-text-primary hover:bg-[rgba(42,42,42,0.14)] transition-colors"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} className="h-10 rounded-[8px] bg-transparent" />;
          const key = cell.toISOString().slice(0, 10);
          const value = dailyActivity[key] || 0;
          const intensityClass = activityIntensity(value);
          return (
            <div
              key={key}
              className={`h-10 rounded-[8px] border border-[rgba(42,42,42,0.06)] ${intensityClass} flex items-center justify-center`}
              title={`${key}: ${value} spark${value === 1 ? '' : 's'}`}
            >
              <span className="font-body text-xs text-text-primary">{cell.getDate()}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Tiered badge card ──
function TieredBadgeCard({ badge, currentTier, nextTier, progress, value }) {
  const isLocked = !currentTier;
  const tierStyle = currentTier ? TIER_STYLES[currentTier.tier] : null;
  const nextStyle = nextTier ? TIER_STYLES[nextTier.tier] : null;
  const pct = nextTier ? Math.min(100, Math.round((value / nextTier.threshold) * 100)) : 100;

  return (
    <motion.div
      whileHover={!isLocked ? { y: -2, scale: 1.02 } : { scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative flex flex-col gap-1.5 overflow-hidden rounded-[18px] p-3 text-left"
      style={
        tierStyle
          ? {
              background: `linear-gradient(135deg, ${tierStyle.color}18 0%, rgba(255,255,255,0.88) 100%)`,
              border: `1.5px solid ${tierStyle.color}44`,
              boxShadow: `0 8px 20px ${tierStyle.glow}`,
            }
          : { background: 'rgba(255,255,255,0.45)', border: '1.5px solid rgba(42,42,42,0.07)', opacity: 0.65 }
      }
    >
      {/* Shimmer for diamond tier */}
      {currentTier?.tier === 'diamond' && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-[18px]"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(circle at 30% 20%, rgba(155,111,232,0.18), transparent 60%)' }}
          aria-hidden="true"
        />
      )}

      {/* Top row: emoji + tier star */}
      <div className="flex items-start justify-between gap-1">
        <span className="text-2xl leading-none" style={tierStyle ? { filter: `drop-shadow(0 3px 8px ${tierStyle.color}55)` } : {}}>
          {badge.emoji}
        </span>
        {tierStyle ? (
          <span className="text-base leading-none">{tierStyle.star}</span>
        ) : (
          <span className="text-[10px] font-mono text-text-muted opacity-60">🔒</span>
        )}
      </div>

      {/* Name + tier label */}
      <div>
        <p className="font-body font-semibold text-text-primary text-xs leading-tight">{badge.title}</p>
        {tierStyle ? (
          <p className="font-mono text-[10px] leading-tight mt-0.5" style={{ color: tierStyle.color }}>
            {currentTier.label} · {tierStyle.label}
          </p>
        ) : (
          <p className="font-body text-[10px] text-text-muted leading-tight mt-0.5">{badge.description}</p>
        )}
      </div>

      {/* Progress toward next tier */}
      {nextTier && (
        <div>
          <div className="h-1 rounded-full bg-[rgba(42,42,42,0.08)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: nextStyle?.color || '#FF6B35' }}
            />
          </div>
          <p className="font-mono text-[9px] text-text-muted mt-0.5">
            {value} / {nextTier.threshold} → {nextStyle?.star} {nextTier.label}
          </p>
        </div>
      )}
      {!nextTier && currentTier && (
        <p className="font-mono text-[9px] mt-0.5" style={{ color: tierStyle?.color }}>✦ Max tier reached</p>
      )}
    </motion.div>
  );
}

function AuthPanel({ user }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setStatus('');
    try {
      if (mode === 'signup') await user.createAccount(email.trim(), password);
      else await user.authenticateEmail(email.trim(), password);
      setStatus(mode === 'signup' ? 'Account created and synced.' : 'Signed in and synced.');
      setPassword('');
    } catch (err) {
      setStatus(err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setStatus('');
    try {
      await user.authenticateGoogle();
      setStatus('Google sign-in complete.');
    } catch (err) {
      setStatus(err?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setStatus('');
    try {
      await user.continueAsGuest();
      setStatus('Guest session ready.');
    } catch (err) {
      setStatus(err?.message || 'Guest session failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setStatus('');
    try {
      await user.logout();
      setStatus('Signed out. Back in guest mode.');
    } catch (err) {
      setStatus(err?.message || 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 }}
      className="bg-bg-secondary rounded-card shadow-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-xs uppercase tracking-wider text-text-muted">Account</p>
          <h2 className="font-display font-semibold text-text-primary mt-1">
            {user.authStatus === 'signed_in' ? 'Cloud sync is on' : 'Guest mode'}
          </h2>
          <p className="font-body text-sm text-text-secondary mt-1">
            {user.authStatus === 'signed_in'
              ? `Signed in as ${user.authEmail || 'Google account'}. Progress syncs to Firebase.`
              : 'You are exploring as a guest right now. Sign in to keep your threads in the cloud.'}
          </p>
        </div>
        {user.authStatus === 'signed_in' && (
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-3 py-1.5 rounded-full bg-[rgba(42,42,42,0.06)] text-text-secondary text-xs font-medium hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[32px]"
          >
            Sign out
          </button>
        )}
      </div>

      {user.authStatus !== 'signed_in' && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-spark-ember text-white text-sm font-medium hover:bg-orange-600 transition-colors min-h-[38px]"
            >
              Sign in with Google
            </button>
            <button
              onClick={handleGuest}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-[rgba(42,42,42,0.06)] text-text-secondary text-sm font-medium hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[38px]"
            >
              Continue as guest
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded-[16px] border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-spark-ember"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="rounded-[16px] border border-[rgba(42,42,42,0.08)] bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-spark-ember"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={handleEmailAuth}
              disabled={loading || !email.trim() || !password.trim()}
              className="px-4 py-2 rounded-full bg-[#5B5EA6] text-white text-sm font-medium hover:bg-[#4a4d88] transition-colors disabled:opacity-50 min-h-[38px]"
            >
              {mode === 'signup' ? 'Create account' : 'Sign in with email'}
            </button>
            <button
              onClick={() => setMode((prev) => prev === 'signup' ? 'signin' : 'signup')}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-[rgba(91,94,166,0.1)] text-[#5B5EA6] text-sm font-medium hover:bg-[rgba(91,94,166,0.18)] transition-colors min-h-[38px]"
            >
              {mode === 'signup' ? 'Have an account?' : 'Need an account?'}
            </button>
          </div>
        </>
      )}

      {status && (
        <p className="mt-3 font-body text-sm text-text-muted">{status}</p>
      )}
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
  const dailyActivity = streakState?.dailyActivity || {};
  const [personalitySummary, setPersonalitySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [view, setView] = useState('constellation'); // 'constellation' | 'bars'
  const [showFullMap, setShowFullMap] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [demoClicks, setDemoClicks] = useState(0);
  const demoTimerRef = useRef(null);

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

  // Compute stats used by badge system
  const badgeStats = useMemo(() => {
    const distinctDomains = new Set(tracks.map((t) => t.domain).filter(Boolean)).size;
    const maxDepth = tracks.reduce((max, t) => Math.max(max, (t.path?.length || 0)), 0);
    const knowWellCount = Object.values(user.knowledgeStates || {}).filter((s) => s === 'know_well').length;
    const deepSavesCount = tracks.filter((t) => (t.path?.length || 0) >= 4).length;
    // Count domain jumps: consecutive tracks in different domains
    const sortedByDate = [...tracks].sort((a, b) => new Date(a.savedAt || 0) - new Date(b.savedAt || 0));
    let distinctDomainJumps = 0;
    for (let i = 1; i < sortedByDate.length; i++) {
      if (sortedByDate[i].domain !== sortedByDate[i - 1].domain) distinctDomainJumps++;
    }
    return {
      maxDepth,
      distinctDomains,
      tracksCount: tracks.length,
      streak: streak,
      knowWellCount,
      deepSavesCount,
      distinctDomainJumps,
    };
  }, [tracks, user.knowledgeStates, streak]);

  // Compute tiered badge progress for all badges
  const badgeProgress = useMemo(() => {
    return BADGE_SYSTEM.map((badge) => {
      const value = badge.getValue(badgeStats);
      let currentTierIdx = -1;
      for (let i = badge.tiers.length - 1; i >= 0; i--) {
        if (value >= badge.tiers[i].threshold) { currentTierIdx = i; break; }
      }
      const currentTier = currentTierIdx >= 0 ? badge.tiers[currentTierIdx] : null;
      const nextTier = currentTierIdx < badge.tiers.length - 1 ? badge.tiers[currentTierIdx + 1] : null;
      return { badge, value, currentTier, nextTier };
    });
  }, [badgeStats]);

  const earnedBadgeIds = useMemo(() => new Set(badgeProgress.filter((b) => b.currentTier).map((b) => b.badge.id)), [badgeProgress]);

  const loadSummary = async () => {
    if (loadingSummary || personalitySummary) return;
    setLoadingSummary(true);
    try {
      const maxDepth = tracks.reduce((max, t) => Math.max(max, (t.path?.length || 0)), 0);
      const explorationStyle = maxDepth >= 5 ? 'spelunker — goes very deep' : topDomains.length >= 4 ? 'cartographer — goes wide' : 'balanced explorer';
      const firstBadge = earnedBadgeIds.size > 0
        ? BADGE_SYSTEM.find((b) => earnedBadgeIds.has(b.id))?.title
        : null;
      const result = await AIService.call('personalitySummary', {
        topDomains,
        explorationStyle,
        avgDepth: maxDepth || 3,
        surprisingPath: topDomains[topDomains.length - 1] || 'general curiosity',
        dominantKnowledge: Object.values(user.knowledgeStates || {}).filter(s => s === 'know_well').length > 0 ? 'know_well' : 'curious',
        badge: firstBadge,
      });
      setPersonalitySummary(result);
    } catch {
      setPersonalitySummary("Your curiosity is building something unique. Keep exploring — the tree has a shape, and it's yours.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Auto-load summary if user has enough data
  useEffect(() => {
    if (topDomains.length >= 2 && tracks.length >= 3 && !personalitySummary && !loadingSummary) {
      loadSummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topDomains.length, tracks.length]);

  const emberGlow = Math.min(1, 0.2 + (tracks.length / 10) * 0.8);

  const handleEmberSecretClick = useCallback(() => {
    setDemoClicks((prev) => {
      const next = prev + 1;
      if (next >= 7) {
        if (!demoMode) {
          loadDemoProfile();
          setDemoMode(true);
          window.location.reload();
        } else {
          clearDemoProfile();
          setDemoMode(false);
          window.location.reload();
        }
        return 0;
      }
      // Reset after 3s of inactivity
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = setTimeout(() => setDemoClicks(0), 3000);
      return next;
    });
  }, [demoMode, demoTimerRef]);

  // Curiosity log — recent search history
  const [recentSearches] = useState(() => storage.getSearches().slice(0, 10));
  const [studySessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('spark_study_sessions') || '[]').slice(0, 80);
    } catch {
      return [];
    }
  });
  const recentSearchAgeDays = recentSearches[0]?.timestamp
    ? Math.floor((Date.now() - new Date(recentSearches[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isTreeResting = recentSearchAgeDays !== null && recentSearchAgeDays > 6;

  const heroColor = DOMAIN_COLORS[ranked[0]?.domain] || '#FF6B35';
  const heroColor2 = DOMAIN_COLORS[ranked[1]?.domain] || '#FFA62B';

  return (
    <div className="flex flex-col h-full">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden px-4 pt-8 pb-7"
        style={{
          background: `linear-gradient(140deg, rgba(255,252,246,0.97) 0%, rgba(255,243,224,0.94) 52%, rgba(245,238,255,0.9) 100%)`,
          borderBottom: '1px solid rgba(255,168,114,0.2)',
          boxShadow: '0 6px 24px rgba(72,49,10,0.08)',
        }}
      >
        {/* Aurora sweep */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            background: [
              `radial-gradient(ellipse 80% 60% at 20% 30%, ${heroColor}28 0%, transparent 65%)`,
              `radial-gradient(ellipse 80% 60% at 75% 60%, ${heroColor2}22 0%, transparent 65%)`,
              `radial-gradient(ellipse 80% 60% at 45% 10%, rgba(255,209,102,0.16) 0%, transparent 65%)`,
              `radial-gradient(ellipse 80% 60% at 20% 30%, ${heroColor}28 0%, transparent 65%)`,
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        {/* Stars */}
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute rounded-full bg-white"
            style={{
              width: 1 + (i % 2) * 0.8,
              height: 1 + (i % 2) * 0.8,
              left: `${(i * 41 + 7) % 100}%`,
              top: `${(i * 57 + 11) % 100}%`,
              opacity: 0,
            }}
            animate={{ opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration: 2 + (i % 3) * 0.7, delay: i * 0.22, repeat: Infinity }}
            aria-hidden="true"
          />
        ))}

        <div className="max-w-[600px] mx-auto relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-[10px] font-mono uppercase tracking-[0.24em]"
                style={{ color: `${heroColor}CC` }}
              >
                {stageInfo.emoji} {stageInfo.label}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 }}
                className="font-display text-[1.85rem] font-bold leading-tight mt-0.5"
                style={{ color: '#2C2C2C' }}
              >
                {user.name ? `${user.name}'s tree` : 'Your curiosity tree'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.16 }}
                className="font-body text-sm mt-1.5 leading-relaxed max-w-xs"
                style={{ color: 'rgba(72,49,10,0.72)' }}
              >
                {topDomains.length
                  ? `Pulling hardest toward ${topDomains.slice(0, 2).join(' and ')}`
                  : 'Still finding your threads — keep exploring'}
              </motion.p>

              {/* Domain color pills */}
              {topDomains.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-wrap gap-1.5 mt-3"
                >
                  {topDomains.slice(0, 4).map((domain, i) => {
                    const c = DOMAIN_COLORS[domain] || '#FF6B35';
                    const emojiMap = { math:'🔢', science:'🔬', cs:'💻', philosophy:'🏛️', music:'🎵', art:'🎨', history:'📜', literature:'📚', economics:'📊' };
                    return (
                      <motion.span
                        key={domain}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 320 }}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono font-semibold capitalize"
                        style={{
                          background: `${c}25`,
                          border: `1px solid ${c}40`,
                          color: c,
                          boxShadow: `0 2px 8px ${c}25`,
                        }}
                      >
                        {emojiMap[domain] || '✦'} {domain}
                      </motion.span>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Ember + stats */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.12, type: 'spring', stiffness: 240 }}
              className="flex-shrink-0 flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ boxShadow: [`0 0 20px ${heroColor}30`, `0 0 44px ${heroColor}55`, `0 0 20px ${heroColor}30`] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="rounded-[22px] p-3 cursor-pointer select-none"
                style={{ background: `rgba(255,107,53,0.15)`, border: `1px solid rgba(255,138,90,0.28)` }}
                onClick={handleEmberSecretClick}
                title={demoClicks > 0 ? `${7 - demoClicks} more...` : 'Your curiosity avatar'}
              >
                <Ember
                  mood={demoMode ? 'celebrating' : tracks.length >= 10 ? 'proud' : tracks.length >= 3 ? 'curious' : 'idle'}
                  size="md"
                  glowIntensity={demoMode ? 1.2 : emberGlow}
                />
              </motion.div>
              <div className="flex gap-2 text-center">
                <div className="rounded-[12px] px-2.5 py-1.5" style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.22)' }}>
                  <p className="font-display text-lg font-bold" style={{ color: '#FF8A5A' }}>{user.stats?.nodesExplored || tracks.length || 0}</p>
                  <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,150,80,0.6)' }}>sparks</p>
                </div>
                <div className="rounded-[12px] px-2.5 py-1.5" style={{ background: 'rgba(255,166,43,0.12)', border: '1px solid rgba(255,166,43,0.22)' }}>
                  <p className="font-display text-lg font-bold" style={{ color: '#FFD166' }}>{streak}</p>
                  <p className="text-[8px] font-mono uppercase tracking-widest" style={{ color: 'rgba(255,200,80,0.6)' }}>streak</p>
                </div>
              </div>
              {demoMode && (
                <span className="text-[9px] font-mono rounded-full px-2 py-0.5" style={{ background: 'rgba(255,209,102,0.18)', color: '#FFD166', border: '1px solid rgba(255,209,102,0.3)' }}>
                  ✦ demo
                </span>
              )}
            </motion.div>
          </div>

          {/* AI personality summary */}
          {personalitySummary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-4 rounded-[16px] px-4 py-3"
              style={{
                background: 'rgba(255,107,53,0.07)',
                border: '1px solid rgba(255,107,53,0.18)',
              }}
            >
              <p className="font-body text-sm italic leading-relaxed" style={{ color: 'rgba(72,38,10,0.82)' }}>
                "{personalitySummary}"
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-[600px] mx-auto py-4 space-y-4">
          <AuthPanel user={user} />

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

          {/* ── Living Tree — the centerpiece ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-[rgba(255,255,255,0.82)] bg-[linear-gradient(160deg,rgba(255,253,247,0.96)_0%,rgba(245,240,230,0.92)_100%)] p-5 shadow-[0_12px_36px_rgba(72,49,10,0.09)]"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">Your Living Tree</p>
                <p className="font-display text-lg font-semibold text-text-primary leading-tight">
                  Growing in {new Set(tracks.map(t => t.domain).filter(Boolean)).size || 1} world{new Set(tracks.map(t => t.domain).filter(Boolean)).size !== 1 ? 's' : ''}
                </p>
              </div>
              {/* Stats pills */}
              <div className="flex gap-3">
                {[
                  [new Set(tracks.map(t => t.domain).filter(Boolean)).size, 'worlds'],
                  [tracks.filter(t => t.mode === 'mastering').length, 'mastering'],
                  [earnedBadgeIds.size, 'badges'],
                ].map(([val, label]) => (
                  <div key={label} className="text-center px-3 py-1.5 rounded-[14px] bg-[rgba(255,255,255,0.7)]" style={{ border: `1px solid ${heroColor}14` }}>
                    <p className="font-display font-semibold text-text-primary text-xl leading-none">{val}</p>
                    <p className="font-body text-text-muted text-[10px] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* The tree SVG */}
            <LivingTreeViz tracks={tracks} className="mt-2" />
          </motion.div>

          {/* Tend your tree prompt — shown when branches need attention */}
          {(() => {
            const thirsty = tracks.filter(t => {
              const s = deriveBranchState(t);
              return s === 'thirsty' || s === 'wilting';
            });
            if (thirsty.length === 0) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[22px] p-4 flex items-center gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,209,102,0.14), rgba(255,107,53,0.08))',
                  border: '1px solid rgba(255,166,43,0.28)',
                }}
              >
                <span className="text-2xl">💧</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-semibold text-text-primary">
                    {thirsty.length} branch{thirsty.length !== 1 ? 'es need' : ' needs'} water
                  </p>
                  <p className="font-body text-xs text-text-secondary">
                    {thirsty[0].label}{thirsty.length > 1 ? ` and ${thirsty.length - 1} more` : ''} — a quick review keeps them alive
                  </p>
                </div>
                <button
                  onClick={() => {/* Switch to Tracks tab — informational */}}
                  className="flex-shrink-0 text-xs font-mono uppercase tracking-[0.12em] font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,166,43,0.2)', color: '#E6950A' }}
                >
                  Tend →
                </button>
              </motion.div>
            );
          })()}

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

          <StudyCalendar dailyActivity={dailyActivity} userTracks={tracks} />

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
            <JourneyTimeline tracks={tracks} searches={recentSearches} sessions={studySessions} />
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
                  className="font-body text-sm leading-relaxed italic"
                  style={{ color: 'rgba(60,30,5,0.85)' }}
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

          {/* Badges — tiered Duolingo-style */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-secondary rounded-card shadow-card p-5"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-semibold text-text-primary">Badges</h2>
              <span className="font-body text-text-muted text-xs">
                {earnedBadgeIds.size} / {BADGE_SYSTEM.length} unlocked · {badgeProgress.filter((b) => b.currentTier?.tier === 'diamond').length} maxed
              </span>
            </div>
            <p className="font-body text-xs text-text-muted mb-3">Bronze → Silver → Gold → Platinum → Diamond</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {badgeProgress.map(({ badge, value, currentTier, nextTier }) => (
                <TieredBadgeCard
                  key={badge.id}
                  badge={badge}
                  currentTier={currentTier}
                  nextTier={nextTier}
                  progress={value}
                  value={value}
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

            {/* Inline age picker */}
            <div className="mb-4">
              <p className="text-xs font-mono uppercase tracking-[0.14em] text-text-muted mb-2">Age group</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'little_explorer', label: 'Little Explorer', emoji: '🧸', range: 'Under 10' },
                  { id: 'student', label: 'Student', emoji: '🎒', range: '10–17' },
                  { id: 'college', label: 'Young Adult', emoji: '🎓', range: '18–24' },
                  { id: 'adult', label: 'Adult', emoji: '🔭', range: '25+' },
                ].map((opt) => {
                  const sel = user.ageGroup === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      whileHover={!sel ? { scale: 1.03 } : {}}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => user.setAgeGroup?.(opt.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-[14px] border-2 text-left transition-colors"
                      style={{
                        borderColor: sel ? '#FF6B35' : 'rgba(42,42,42,0.1)',
                        background: sel ? 'rgba(255,107,53,0.07)' : undefined,
                      }}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <div>
                        <p className="text-xs font-body font-semibold text-text-primary leading-tight">{opt.label}</p>
                        <p className="text-[10px] font-mono text-text-muted">{opt.range}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {[
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
