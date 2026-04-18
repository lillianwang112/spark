import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import { useUserContext } from '../hooks/useUserContext.jsx';
import { deriveBranchState, useBranchState } from '../hooks/useBranchState.js';
import ExplainerCard from '../components/explainer/ExplainerCard.jsx';
import ReviewSession from '../components/mastering/ReviewSession.jsx';
import Modal from '../components/common/Modal.jsx';
import Ember from '../components/ember/Ember.jsx';
import Toast from '../components/common/Toast.jsx';
import TendingSession from '../components/tracks/TendingSession.jsx';
import PruningCeremony from '../components/tracks/PruningCeremony.jsx';
import BranchStateBadge from '../components/tracks/BranchStateBadge.jsx';
import { DOMAIN_COLORS } from '../utils/domainColors.js';
import { KNOWLEDGE_STATE_LABELS, BRANCH_STATES } from '../utils/constants.js';
import { getDueCards, seedSRSFromKnowledgeState, daysUntilReview } from '../models/srs.js';
import { buildUserContext } from '../models/userContext.js';
import { copyThreadUrl } from '../utils/threads.js';
import { relativeTime } from '../utils/helpers.js';
import { openDeepDive } from '../utils/navigation.js';

function inferDomainFromDeck(fileName = '', title = '') {
  const sample = `${fileName} ${title}`.toLowerCase();
  if (sample.includes('math')) return 'math';
  if (sample.includes('music')) return 'music';
  if (sample.includes('art')) return 'art';
  if (sample.includes('history')) return 'history';
  if (sample.includes('language') || sample.includes('chinese') || sample.includes('vocab')) return 'language';
  if (sample.includes('code') || sample.includes('computer') || sample.includes('cs')) return 'cs';
  return 'culture';
}

function normalizeDeckEntries(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.cards)) return raw.cards;
  if (Array.isArray(raw?.vocabulary)) return raw.vocabulary;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

async function parseDeckFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const entries = normalizeDeckEntries(parsed);
  if (entries.length === 0) return { cards: [], title: file.name.replace(/\.json$/i, '') };

  const cards = entries
    .map((entry, index) => {
      const label = entry.word || entry.character || entry.term || entry.hanzi || entry.front || entry.question;
      const detail = entry.definition || entry.english || entry.meaning || entry.back || entry.answer || '';
      if (!label) return null;
      return {
        id: `deck-${file.name}-${index}-${String(label).trim().toLowerCase().replace(/\s+/g, '-')}`,
        label: String(label).trim(),
        description: String(detail).trim() || 'Imported from study deck',
      };
    })
    .filter(Boolean);

  return {
    cards,
    title: parsed?.title || parsed?.deckName || file.name.replace(/\.json$/i, ''),
  };
}

const MATCH_BEST_KEY = 'spark:match-best-seconds';

// ── Mode toggle ──
function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-[rgba(42,42,42,0.06)] rounded-full p-1 text-xs">
      {['exploring', 'mastering'].map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-3 py-1.5 rounded-full transition-all font-body font-medium whitespace-nowrap ${
            mode === m ? 'bg-spark-ember text-white' : 'text-text-muted hover:text-text-primary'
          }`}
          aria-pressed={mode === m}
        >
          {m === 'exploring' ? '🏔 Exploring' : '🎯 Mastering'}
        </button>
      ))}
    </div>
  );
}

// ── Garden Health Panel ──
function GardenHealthPanel({ tracksWithSRS, careTracks, dueNow, onTendAll, onStartReview }) {
  const domainStats = useMemo(() => {
    const stats = {};
    tracksWithSRS.forEach((t) => {
      const d = t.domain || 'general';
      if (!stats[d]) stats[d] = { total: 0, healthy: 0, thirsty: 0, wilting: 0, dormant: 0, flowering: 0 };
      stats[d].total++;
      const state = deriveBranchState(t);
      stats[d][state] = (stats[d][state] || 0) + 1;
    });
    return stats;
  }, [tracksWithSRS]);

  const overallScore = useMemo(() => {
    if (!tracksWithSRS.length) return 100;
    const W = { flowering: 1.0, healthy: 0.8, thirsty: 0.5, wilting: 0.2, dormant: 0.05 };
    const total = tracksWithSRS.reduce((sum, t) => sum + (W[deriveBranchState(t)] ?? 0.5), 0);
    return Math.round((total / tracksWithSRS.length) * 100);
  }, [tracksWithSRS]);

  const emberMood = overallScore >= 80 ? 'proud' : overallScore >= 60 ? 'attentive' : overallScore >= 40 ? 'encouraging' : 'sheepish';
  const healthLabel = overallScore >= 80 ? 'Thriving' : overallScore >= 55 ? 'Growing well' : overallScore >= 35 ? 'Needs tending' : 'Struggling';
  const domains = Object.keys(domainStats);
  const strokeScore = Math.round(overallScore * 0.942);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(45,147,108,0.09) 0%, rgba(255,209,102,0.07) 60%, rgba(255,255,255,0.8) 100%)',
        border: '1px solid rgba(45,147,108,0.16)',
        boxShadow: '0 2px 16px rgba(45,147,108,0.08)',
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3.5">
          <Ember mood={emberMood} size="sm" glowIntensity={overallScore >= 70 ? 0.65 : 0.3} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-text-primary text-sm leading-tight">
              Garden · {healthLabel}
            </p>
            <p className="font-body text-[11px] text-text-muted mt-0.5">
              {tracksWithSRS.length} branch{tracksWithSRS.length !== 1 ? 'es' : ''} across {domains.length} world{domains.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Health ring */}
          <div className="relative flex-shrink-0 w-9 h-9">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(42,42,42,0.08)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={overallScore >= 70 ? '#2D936C' : overallScore >= 45 ? '#FFA62B' : '#E63946'}
                strokeWidth="3"
                strokeDasharray={`${strokeScore} 94.2`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold text-text-secondary">
              {overallScore}
            </span>
          </div>
        </div>

        {/* Domain health bars */}
        {domains.length > 0 && (
          <div className="space-y-1.5 mb-3.5">
            {domains.slice(0, 5).map((domain) => {
              const s = domainStats[domain];
              const color = DOMAIN_COLORS[domain] || '#FF6B35';
              const healthPct = Math.round(
                ((s.flowering || 0) * 100 + (s.healthy || 0) * 80 + (s.thirsty || 0) * 50 + (s.wilting || 0) * 20 + (s.dormant || 0) * 5)
                / (s.total * 100) * 100,
              );
              const worstState = s.dormant > 0 ? 'dormant' : s.wilting > 0 ? 'wilting' : s.thirsty > 0 ? 'thirsty' : s.flowering > 0 ? 'flowering' : 'healthy';
              const stateEmoji = { dormant: '🪵', wilting: '🥀', thirsty: '🍂', flowering: '🌸', healthy: '' }[worstState];

              return (
                <div key={domain} className="flex items-center gap-2">
                  <span className="text-[10px] font-body font-semibold w-14 truncate capitalize" style={{ color }}>{domain}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[rgba(42,42,42,0.07)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${healthPct}%` }}
                      transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color, opacity: healthPct > 60 ? 0.85 : 0.55 }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-text-muted w-5 text-right">{s.total}</span>
                  {stateEmoji && <span className="text-[10px] leading-none">{stateEmoji}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick action buttons */}
        {(careTracks.length > 0 || dueNow.length > 0) ? (
          <div className="flex gap-2">
            {careTracks.length > 0 && (
              <button
                onClick={onTendAll}
                className="flex-1 rounded-full bg-[rgba(45,147,108,0.14)] text-[#2D936C] py-2 text-xs font-semibold hover:bg-[rgba(45,147,108,0.22)] transition-colors min-h-[32px]"
              >
                💧 Tend {careTracks.length}
              </button>
            )}
            {dueNow.length > 0 && (
              <button
                onClick={onStartReview}
                className="flex-1 rounded-full bg-spark-ember text-white py-2 text-xs font-semibold hover:bg-orange-600 transition-colors min-h-[32px]"
              >
                ⏰ Review {dueNow.length}
              </button>
            )}
          </div>
        ) : (
          <p className="text-center font-body text-xs text-text-muted py-0.5">
            ✓ All clear — nothing needs tending right now
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Single track card ──
function TrackCard({ track, ageGroup, onExplain, onReview, onRemove, onToggleMode, onConnect, onShare, onTend, connectMode, isConnectSource }) {
  const color = DOMAIN_COLORS[track.domain] || '#FF6B35';
  const { state: branchState, message: branchMessage, needsAttention } = useBranchState(track);
  const ksLabels = ageGroup === 'little_explorer' ? KNOWLEDGE_STATE_LABELS.kids : KNOWLEDGE_STATE_LABELS.adult;
  const ksLabel = ksLabels[track.knowledgeState || 'new'];
  const isMastering = track.mode === 'mastering';
  const daysLeft = isMastering && track.srsData ? daysUntilReview(track.srsData) : null;
  const connectionCount = track.connections?.length || 0;
  const isInConnectMode = connectMode && !isConnectSource;
  const [justConnected, setJustConnected] = useState(false);

  const handleConnect = () => {
    if (isInConnectMode) {
      onConnect?.(track);
      setJustConnected(true);
      setTimeout(() => setJustConnected(false), 2000);
    } else {
      onConnect?.(track, true);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1, y: 0,
        boxShadow: (justConnected || isConnectSource)
          ? `0 0 0 2px ${color}60, 0 4px 16px ${color}20`
          : '0 2px 12px rgba(42,42,42,0.08)',
      }}
      whileHover={!isInConnectMode ? {
        y: -3,
        boxShadow: `0 12px 32px ${color}18, 0 4px 12px rgba(42,42,42,0.06)`,
      } : {}}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ layout: { duration: 0.2 } }}
      className={`bg-bg-secondary rounded-card overflow-hidden transition-colors ${
        isInConnectMode ? 'cursor-pointer ring-2 ring-[rgba(255,107,53,0.3)] hover:ring-spark-ember' : ''
      }`}
      onClick={isInConnectMode ? handleConnect : undefined}
    >
      <div
        className="h-1.5"
        style={{ backgroundColor: color, boxShadow: `0 2px 8px ${color}60` }}
      />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted font-mono uppercase tracking-wide mb-0.5 truncate">
              {track.domain}
              {track.path?.length > 1 && (
                <span className="ml-1 normal-case tracking-normal font-body">· {track.path.slice(-2, -1)[0]}</span>
              )}
            </p>
            <h3 className="font-display font-semibold text-text-primary leading-tight">{track.label}</h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {ksLabel && (
              <span className="text-base" title={ksLabel.label} aria-label={ksLabel.label}>
                {ksLabel.emoji}
              </span>
            )}
            <button
              onClick={() => onRemove(track.id)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-spark-flame hover:bg-[rgba(230,57,70,0.08)] transition-colors text-xs"
              aria-label={`Remove ${track.label}`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Branch state + SRS info */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <BranchStateBadge state={branchState} hideHealthy size="sm" />
          {isMastering && daysLeft !== null && (
            <span className="text-[10px] font-body text-text-muted">
              {daysLeft === 0 ? '⏰ Due now' : `Review in ${daysLeft}d`}
            </span>
          )}
          {!isMastering && track.lastTended && (
            <span className="text-[10px] font-body text-text-muted">
              Last tended {relativeTime(track.lastTended)}
            </span>
          )}
        </div>

        {track.description && (
          <p className="text-sm text-text-secondary leading-relaxed mb-3 line-clamp-2">
            {track.description}
          </p>
        )}

        {needsAttention && (
          <div className="mb-3 rounded-[14px] bg-[rgba(42,42,42,0.04)] px-3 py-2">
            <p className="font-body text-xs text-text-secondary leading-relaxed">
              {branchMessage}
            </p>
          </div>
        )}

        {track.path?.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {track.path.slice(0, 4).map((segment, index) => (
              <span
                key={`${track.id}-${segment}-${index}`}
                className="rounded-full bg-[rgba(42,42,42,0.05)] px-2.5 py-1 text-[11px] font-body text-text-muted"
              >
                {segment}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <ModeToggle mode={track.mode || 'exploring'} onChange={(m) => onToggleMode(track.id, m)} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onShare(track); }}
              className="px-3 py-1.5 rounded-full bg-[rgba(91,94,166,0.1)] text-[#5B5EA6] text-xs font-medium hover:bg-[rgba(91,94,166,0.18)] transition-colors min-h-[32px]"
            >
              ↗ Share
            </button>
            {needsAttention && (
              <button
                onClick={(e) => { e.stopPropagation(); onTend(track); }}
                className="px-3 py-1.5 rounded-full bg-[rgba(45,147,108,0.12)] text-[#2D936C] text-xs font-medium hover:bg-[rgba(45,147,108,0.18)] transition-colors min-h-[32px]"
              >
                💧 Tend
              </button>
            )}
            {/* Connect button */}
            {!isInConnectMode && (
              <button
                onClick={(e) => { e.stopPropagation(); handleConnect(); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px] ${
                  isConnectSource
                    ? 'bg-[rgba(45,147,108,0.15)] text-[#2D936C]'
                    : justConnected
                    ? 'bg-[rgba(45,147,108,0.15)] text-[#2D936C]'
                    : connectionCount > 0
                    ? 'bg-[rgba(91,94,166,0.1)] text-[#5B5EA6] hover:bg-[rgba(91,94,166,0.18)]'
                    : 'bg-[rgba(42,42,42,0.06)] text-text-muted hover:bg-[rgba(42,42,42,0.1)]'
                }`}
                title={connectionCount > 0 ? `${connectionCount} connection${connectionCount > 1 ? 's' : ''}` : 'Connect to another track'}
              >
                {isConnectSource ? '🌱 Connecting...' : justConnected ? '✓ Connected!' : connectionCount > 0 ? `🌱 ${connectionCount}` : '🌱'}
              </button>
            )}

            {isMastering ? (
              <button
                onClick={(e) => { e.stopPropagation(); onReview(track); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px] ${
                  daysLeft === 0
                    ? 'bg-spark-ember text-white hover:bg-orange-600'
                    : 'bg-[rgba(255,107,53,0.1)] text-spark-ember hover:bg-[rgba(255,107,53,0.2)]'
                }`}
              >
                {daysLeft === 0 ? '⏰ Review now' : '🃏 Review'}
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onExplain(track); }}
                className="px-3 py-1.5 rounded-full bg-[rgba(255,107,53,0.1)] text-spark-ember text-xs font-medium hover:bg-[rgba(255,107,53,0.2)] transition-colors min-h-[32px]"
              >
                ✨ Explain
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Tracks({ onSpark }) {
  const user = useUserContext();
  const [explainerTrack, setExplainerTrack] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewCards, setReviewCards] = useState([]);
  const [connectSource, setConnectSource] = useState(null); // track being connected
  const [shareFeedback, setShareFeedback] = useState('');
  const [tendingOpen, setTendingOpen] = useState(false);
  const [tendingList, setTendingList] = useState([]);
  const [pruningTarget, setPruningTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [importingDeck, setImportingDeck] = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const [sprintCards, setSprintCards] = useState([]);
  const [sprintIndex, setSprintIndex] = useState(0);
  const [sprintScore, setSprintScore] = useState(0);
  const [sprintReveal, setSprintReveal] = useState(false);
  const [sprintDone, setSprintDone] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchDeck, setMatchDeck] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [matchAnswerOrder, setMatchAnswerOrder] = useState([]);
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [matchBest, setMatchBest] = useState(() => {
    const raw = Number(localStorage.getItem(MATCH_BEST_KEY));
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  });
  const [writingOpen, setWritingOpen] = useState(false);
  const [writingTargetId, setWritingTargetId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [writingStrokes, setWritingStrokes] = useState(0);
  const [writingMessage, setWritingMessage] = useState('');
  const writingCanvasRef = useRef(null);
  const writingCtxRef = useRef(null);
  const userContextObj = buildUserContext(user);

  const ping = () => { onSpark?.(); };

  const tracks = useMemo(() => user.tracks || [], [user.tracks]);

  // Ensure mastering tracks have SRS data seeded
  const tracksWithSRS = useMemo(() => tracks.map((t) => {
    if (t.mode === 'mastering' && !t.srsData) {
      return { ...t, srsData: seedSRSFromKnowledgeState(t.knowledgeState || 'new') };
    }
    return t;
  }), [tracks]);

  const masteringTracks = tracksWithSRS.filter((t) => t.mode === 'mastering');
  const exploringTracks = tracksWithSRS.filter((t) => !t.mode || t.mode === 'exploring');
  const dueNow = getDueCards(masteringTracks);
  const careTracks = useMemo(
    () => tracksWithSRS.filter((track) =>
      [BRANCH_STATES.THIRSTY, BRANCH_STATES.WILTING, BRANCH_STATES.DORMANT].includes(deriveBranchState(track))
    ),
    [tracksWithSRS]
  );
  const troubleTracks = useMemo(
    () => tracksWithSRS
      .filter((track) => (track.struggleScore || 0) > 0)
      .sort((a, b) => (b.struggleScore || 0) - (a.struggleScore || 0))
      .slice(0, 6),
    [tracksWithSRS]
  );

  useEffect(() => {
    if (!matchOpen || matchDeck.length === 0 || matchedIds.length === matchDeck.length) return undefined;
    const timer = setInterval(() => {
      setMatchSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [matchOpen, matchDeck.length, matchedIds.length]);

  useEffect(() => {
    if (!writingOpen) return;
    const canvas = writingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2A2A2A';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    writingCtxRef.current = ctx;
  }, [writingOpen]);

  const handleToggleMode = (trackId, newMode) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    const updates = { id: trackId, mode: newMode };
    // Seed SRS when switching to mastering
    if (newMode === 'mastering' && !track.srsData) {
      updates.srsData = seedSRSFromKnowledgeState(track.knowledgeState || 'new');
    }
    user.updateTrack(updates);
  };

  const handleStartReview = (specificCard = null) => {
    const cards = specificCard
      ? [specificCard]
      : dueNow.length > 0 ? dueNow : masteringTracks.slice(0, 10);
    if (!cards.length) return;
    setReviewCards(cards);
    setReviewMode(true);
  };

  const startTroubleReview = () => {
    if (troubleTracks.length === 0) return;
    const seeded = troubleTracks.map((track) => (
      track.srsData
        ? track
        : { ...track, srsData: seedSRSFromKnowledgeState(track.knowledgeState || 'new') }
    ));
    setReviewCards(seeded);
    setReviewMode(true);
  };

  const handleUpdateCard = (updatedCard) => {
    user.updateTrack(updatedCard);
  };

  const handleRemove = (trackId) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    setPruningTarget(track);
  };

  const handlePruneConfirm = () => {
    if (!pruningTarget) return;
    user.removeTrack(pruningTarget.id);
    setPruningTarget(null);
  };

  const handleShare = async (track) => {
    await copyThreadUrl(track);
    setShareFeedback(`Copied thread for ${track.label}`);
    setTimeout(() => setShareFeedback(''), 1800);
  };

  const handleTendTrack = (track) => {
    if (track.mode === 'mastering') {
      const seededTrack = track.srsData
        ? track
        : { ...track, srsData: seedSRSFromKnowledgeState(track.knowledgeState || 'new') };
      handleStartReview(seededTrack);
      return;
    }
    // For exploring: open a dedicated tending session for this single track
    setTendingList([track]);
    setTendingOpen(true);
  };

  const handleTendAll = () => {
    if (careTracks.length === 0) return;
    setTendingList(careTracks.slice(0, 8));
    setTendingOpen(true);
  };

  const handleTendAction = (track, action, rating = null) => {
    const now = new Date().toISOString();
    const updates = { id: track.id, lastTended: now };

    if (action === 'water' || action === 'sunlight') {
      // Mark as attended; rating refines the state further
      updates.branchState = BRANCH_STATES.HEALTHY;
    }

    if (action === 'water-rated') {
      // Adjust branch state based on recall quality
      if (rating === 'got_it') {
        updates.branchState = BRANCH_STATES.HEALTHY;
        if (track.mode === 'mastering' && track.srsData) {
          updates.srsData = {
            ...track.srsData,
            interval: Math.round((track.srsData.interval || 1) * 1.5),
            nextReview: new Date(Date.now() + Math.round((track.srsData.interval || 1) * 1.5) * 86400000).toISOString(),
          };
        }
      } else if (rating === 'kinda') {
        updates.branchState = BRANCH_STATES.THIRSTY;
        if (track.mode === 'mastering' && track.srsData) {
          updates.srsData = { ...track.srsData, nextReview: new Date(Date.now() + 86400000).toISOString() };
        }
      } else {
        // nope — wilting, needs more review
        updates.branchState = BRANCH_STATES.WILTING;
        if (track.mode === 'mastering' && track.srsData) {
          updates.srsData = { ...track.srsData, interval: 1, nextReview: now };
        }
      }
    }

    if (action === 'sunlight' && track.mode === 'mastering' && track.srsData) {
      updates.srsData = { ...track.srsData, nextReview: new Date(Date.now() + 86400000).toISOString() };
    }

    user.updateTrack(updates);
    ping();
  };

  const handleTendFinish = () => {
    setTendingOpen(false);
    setTendingList([]);
    setToast({ title: 'Canopy tended', subtitle: 'Your tree feels the difference.', variant: 'celebrate', icon: '🌿' });
  };

  const handleConnect = (track, isSource = false) => {
    if (isSource) {
      // Start connection mode — track A selected
      setConnectSource(track);
      return;
    }
    // Track B selected — complete the connection
    if (!connectSource || connectSource.id === track.id) {
      setConnectSource(null);
      return;
    }
    const aConns = Array.from(new Set([...(connectSource.connections || []), track.id]));
    const bConns = Array.from(new Set([...(track.connections || []), connectSource.id]));
    user.updateTrack({ id: connectSource.id, connections: aConns, lastTended: new Date().toISOString() });
    user.updateTrack({ id: track.id, connections: bConns, lastTended: new Date().toISOString() });
    setConnectSource(null);
  };

  const handleImportDeck = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportingDeck(true);
    try {
      const { cards, title } = await parseDeckFile(file);
      if (cards.length === 0) {
        setToast({ title: 'Could not import deck', subtitle: 'No recognizable cards were found.', icon: '⚠️' });
        return;
      }
      const deckDomain = inferDomainFromDeck(file.name, title);
      cards.slice(0, 200).forEach((card) => {
        user.addTrack({
          ...card,
          domain: deckDomain,
          mode: 'mastering',
          path: [title, card.label],
          saved: true,
          savedAt: new Date().toISOString(),
          source: 'deck-import',
          srsData: seedSRSFromKnowledgeState('new'),
        });
      });
      setToast({
        title: 'Deck imported',
        subtitle: `${Math.min(cards.length, 200)} cards added to Mastering.`,
        variant: 'celebrate',
        icon: '📚',
      });
      ping();
    } catch {
      setToast({ title: 'Import failed', subtitle: 'Please upload a valid JSON deck.', icon: '⚠️' });
    } finally {
      setImportingDeck(false);
      event.target.value = '';
    }
  };

  const startSprint = () => {
    if (masteringTracks.length === 0) return;
    const prioritized = [...masteringTracks].sort((a, b) => {
      const aNext = new Date(a.srsData?.nextReview || 0).getTime();
      const bNext = new Date(b.srsData?.nextReview || 0).getTime();
      return aNext - bNext;
    });
    const picked = prioritized.slice(0, 12).sort(() => Math.random() - 0.5).slice(0, 5);
    setSprintCards(picked);
    setSprintIndex(0);
    setSprintScore(0);
    setSprintReveal(false);
    setSprintDone(false);
    setSprintOpen(true);
  };

  const handleSprintGrade = (grade) => {
    const card = sprintCards[sprintIndex];
    if (!card) return;
    const now = Date.now();
    let nextInterval = card.srsData?.interval || 1;
    let scoreDelta = 0;

    if (grade === 'again') {
      nextInterval = 1;
      scoreDelta = 0;
    } else if (grade === 'hard') {
      nextInterval = Math.max(1, Math.round(nextInterval * 1.4));
      scoreDelta = 1;
    } else {
      nextInterval = Math.max(2, Math.round(nextInterval * 2.1));
      scoreDelta = 2;
    }

    user.updateTrack({
      id: card.id,
      lastTended: new Date(now).toISOString(),
      struggleScore: grade === 'again'
        ? (card.struggleScore || 0) + 2
        : grade === 'hard'
          ? (card.struggleScore || 0) + 1
          : Math.max(0, (card.struggleScore || 0) - 1),
      srsData: {
        ...(card.srsData || {}),
        interval: nextInterval,
        nextReview: new Date(now + nextInterval * 86400000).toISOString(),
      },
    });

    const nextScore = sprintScore + scoreDelta;
    const isLast = sprintIndex >= sprintCards.length - 1;
    if (isLast) {
      setSprintScore(nextScore);
      setSprintDone(true);
      ping();
      return;
    }
    setSprintScore(nextScore);
    setSprintIndex((prev) => prev + 1);
    setSprintReveal(false);
    ping();
  };

  const closeSprint = () => {
    setSprintOpen(false);
    setSprintCards([]);
    setSprintIndex(0);
    setSprintScore(0);
    setSprintReveal(false);
    setSprintDone(false);
  };

  const startMatchGame = () => {
    if (masteringTracks.length < 3) {
      setToast({ title: 'Need more cards', subtitle: 'Import or save at least 3 mastering cards for Match Blitz.', icon: '🧩' });
      return;
    }
    const chosen = [...masteringTracks]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
      .map((card) => ({
        id: card.id,
        prompt: card.label,
        answer: card.description || card.label,
      }));
    setMatchDeck(chosen);
    setMatchAnswerOrder([...chosen].sort(() => Math.random() - 0.5).map((card) => card.id));
    setSelectedPromptId(null);
    setSelectedAnswerId(null);
    setMatchedIds([]);
    setMatchSeconds(0);
    setMatchOpen(true);
  };

  const closeMatchGame = () => {
    setMatchOpen(false);
    setMatchDeck([]);
    setSelectedPromptId(null);
    setSelectedAnswerId(null);
    setMatchedIds([]);
    setMatchAnswerOrder([]);
    setMatchSeconds(0);
  };

  const commitMatchIfSolved = (nextMatched) => {
    if (nextMatched.length !== matchDeck.length) return;
    if (matchBest === null || matchSeconds < matchBest) {
      setMatchBest(matchSeconds);
      localStorage.setItem(MATCH_BEST_KEY, String(matchSeconds));
    }
    setToast({
      title: 'Match Blitz complete',
      subtitle: `Solved in ${matchSeconds}s${matchBest && matchSeconds < matchBest ? ' · new personal best!' : ''}`,
      variant: 'celebrate',
      icon: '🏆',
    });
    ping();
  };

  const handlePickPrompt = (id) => {
    if (matchedIds.includes(id)) return;
    setSelectedPromptId(id);
    if (!selectedAnswerId) return;
    if (selectedAnswerId === id) {
      const nextMatched = Array.from(new Set([...matchedIds, id]));
      setMatchedIds(nextMatched);
      setSelectedPromptId(null);
      setSelectedAnswerId(null);
      commitMatchIfSolved(nextMatched);
      return;
    }
    if (selectedAnswerId) {
      user.updateTrack({ id, struggleScore: ((tracksWithSRS.find((t) => t.id === id)?.struggleScore) || 0) + 1 });
      user.updateTrack({ id: selectedAnswerId, struggleScore: ((tracksWithSRS.find((t) => t.id === selectedAnswerId)?.struggleScore) || 0) + 1 });
    }
    setTimeout(() => {
      setSelectedPromptId(null);
      setSelectedAnswerId(null);
    }, 220);
  };

  const handlePickAnswer = (id) => {
    if (matchedIds.includes(id)) return;
    setSelectedAnswerId(id);
    if (!selectedPromptId) return;
    if (selectedPromptId === id) {
      const nextMatched = Array.from(new Set([...matchedIds, id]));
      setMatchedIds(nextMatched);
      setSelectedPromptId(null);
      setSelectedAnswerId(null);
      commitMatchIfSolved(nextMatched);
      return;
    }
    if (selectedPromptId) {
      user.updateTrack({ id, struggleScore: ((tracksWithSRS.find((t) => t.id === id)?.struggleScore) || 0) + 1 });
      user.updateTrack({ id: selectedPromptId, struggleScore: ((tracksWithSRS.find((t) => t.id === selectedPromptId)?.struggleScore) || 0) + 1 });
    }
    setTimeout(() => {
      setSelectedPromptId(null);
      setSelectedAnswerId(null);
    }, 220);
  };

  const startWritingLab = (trackId = null) => {
    const fallback = troubleTracks[0]?.id || masteringTracks[0]?.id || null;
    const targetId = trackId || fallback;
    if (!targetId) {
      setToast({ title: 'No cards available', subtitle: 'Add or import mastering cards first.', icon: '✍️' });
      return;
    }
    setWritingTargetId(targetId);
    setWritingStrokes(0);
    setWritingMessage('');
    setWritingOpen(true);
  };

  const clearWritingCanvas = () => {
    const canvas = writingCanvasRef.current;
    const ctx = writingCtxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setWritingStrokes(0);
    setWritingMessage('');
  };

  const getCanvasPoint = (event) => {
    const canvas = writingCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleWritePointerDown = (event) => {
    const ctx = writingCtxRef.current;
    const point = getCanvasPoint(event);
    if (!ctx || !point) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setWritingStrokes((prev) => prev + 1);
  };

  const handleWritePointerMove = (event) => {
    if (!isDrawing) return;
    const ctx = writingCtxRef.current;
    const point = getCanvasPoint(event);
    if (!ctx || !point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const handleWritePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const submitWritingAttempt = () => {
    const current = tracksWithSRS.find((track) => track.id === writingTargetId);
    if (!current) return;
    const bonus = writingStrokes >= 5 ? 2 : 1;
    user.updateTrack({
      id: current.id,
      lastTended: new Date().toISOString(),
      struggleScore: Math.max(0, (current.struggleScore || 0) - bonus),
    });
    setWritingMessage(`Great effort — reduced difficulty score by ${bonus}.`);
    ping();
  };

  // ── Tending session view ──
  if (tendingOpen) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-6 pb-2 border-b border-[rgba(42,42,42,0.06)]">
          <div className="max-w-[600px] mx-auto">
            <h1 className="font-display text-xl font-semibold text-text-primary">
              Tending session
            </h1>
            <p className="font-body text-xs text-text-muted mt-0.5">
              Small gestures. The tree remembers you.
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <div className="max-w-[600px] mx-auto">
            <TendingSession
              tracks={tendingList}
              userContextObj={userContextObj}
              onTend={handleTendAction}
              onFinish={handleTendFinish}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Review session view ──
  if (reviewMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-6 pb-2 border-b border-[rgba(42,42,42,0.06)]">
          <div className="max-w-[600px] mx-auto">
            <h1 className="font-display text-xl font-semibold text-text-primary">
              Review session
            </h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <div className="max-w-[600px] mx-auto">
            <ReviewSession
              dueCards={reviewCards}
              userContextObj={userContextObj}
              onUpdateCard={handleUpdateCard}
              onFinish={() => setReviewMode(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  const gardenColor = (() => {
    const topDomain = tracksWithSRS[0]?.domain;
    return DOMAIN_COLORS[topDomain] || '#2D936C';
  })();

  // ── Main tracks view ──
  return (
    <div className="flex flex-col h-full">
      <div
        className="relative overflow-hidden px-4 pt-6 pb-4"
        style={{
          background: `linear-gradient(135deg, ${gardenColor}14 0%, rgba(45,147,108,0.06) 50%, rgba(255,253,247,0.96) 100%)`,
          borderBottom: `1px solid ${gardenColor}18`,
        }}
      >
        <div
          className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full"
          style={{ background: `radial-gradient(circle, ${gardenColor}18 0%, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="max-w-[600px] mx-auto relative">
          <div className="flex items-center justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-0.5"
              >
                <motion.span
                  className="text-xl leading-none"
                  animate={{ rotate: [0, -8, 8, -4, 0] }}
                  transition={{ duration: 2.8, delay: 1, repeat: Infinity, repeatDelay: 7 }}
                >
                  🌿
                </motion.span>
                <h1 className="font-display text-2xl font-semibold text-text-primary">Your Garden</h1>
              </motion.div>
              <p className="font-body text-text-muted text-sm">
                {tracks.length === 0
                  ? 'Plant your first seed in Explore →'
                  : `${tracks.length} branch${tracks.length !== 1 ? 'es' : ''} · ${masteringTracks.length} mastering · ${dueNow.length > 0 ? `${dueNow.length} due for review` : 'all tended'}`}
              </p>
            </div>
            {tracks.length > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 240, damping: 22 }}
                className="rounded-[18px] px-3 py-2 text-center"
                style={{ background: `${gardenColor}14`, border: `1px solid ${gardenColor}25` }}
              >
                <p className="font-display text-xl font-semibold text-text-primary leading-none">{tracks.length}</p>
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted mt-0.5">branches</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-[760px] mx-auto py-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-card border border-[rgba(91,94,166,0.2)] bg-[rgba(91,94,166,0.07)] p-4"
          >
            <p className="font-body font-semibold text-text-primary text-sm">Import a study deck</p>
            <p className="font-body text-xs text-text-muted mt-0.5 mb-3">
              Bring in vocabulary or flashcard JSON decks and Spark will auto-create mastering tracks.
            </p>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#5B5EA6] text-white text-xs font-medium hover:bg-[#4a4d88] transition-colors cursor-pointer min-h-[36px]">
              {importingDeck ? 'Importing…' : '📥 Import JSON deck'}
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleImportDeck}
                disabled={importingDeck}
              />
            </label>
          </motion.div>

          {tracks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-5 py-16 text-center"
            >
              <div className="relative">
                <Ember mood="curious" size="lg" glowIntensity={0.5} />
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                >
                  🌱
                </motion.div>
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text-primary mb-1.5">
                  Your garden is empty
                </p>
                <p className="font-body text-text-muted text-sm max-w-[280px] mx-auto leading-relaxed">
                  When you find something worth returning to in Explore, save it and watch it grow here.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5">
              <GardenHealthPanel
                tracksWithSRS={tracksWithSRS}
                careTracks={careTracks}
                dueNow={dueNow}
                onTendAll={handleTendAll}
                onStartReview={() => handleStartReview()}
              />

              {masteringTracks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-card border border-[rgba(255,107,53,0.24)] bg-[rgba(255,107,53,0.08)] p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-body font-semibold text-text-primary text-sm">⚡ Mastery Sprint</p>
                    <p className="font-body text-xs text-text-muted mt-0.5">
                      Run a 5-card rapid challenge to sharpen recall and boost intervals.
                    </p>
                  </div>
                  <button
                    onClick={startSprint}
                    className="flex-shrink-0 px-4 py-2 rounded-full bg-spark-ember text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    Start sprint
                  </button>
                </motion.div>
              )}

              {masteringTracks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-card border border-[rgba(91,94,166,0.24)] bg-[rgba(91,94,166,0.08)] p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-body font-semibold text-text-primary text-sm">🧩 Match Blitz</p>
                    <p className="font-body text-xs text-text-muted mt-0.5">
                      Timed matching game inspired by your vocab apps. Pair prompts with meanings fast.
                    </p>
                  </div>
                  <button
                    onClick={startMatchGame}
                    className="flex-shrink-0 px-4 py-2 rounded-full bg-[#5B5EA6] text-white text-sm font-medium hover:bg-[#4a4d88] transition-colors"
                  >
                    Play
                  </button>
                </motion.div>
              )}

              {troubleTracks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-card border border-[rgba(230,57,70,0.22)] bg-[rgba(230,57,70,0.08)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-body font-semibold text-text-primary text-sm">⚠️ Trouble Words</p>
                      <p className="font-body text-xs text-text-muted mt-0.5">
                        Auto-detected from your misses in Sprint + Match. Focus these first.
                      </p>
                    </div>
                    <button
                      onClick={startTroubleReview}
                      className="flex-shrink-0 px-4 py-2 rounded-full bg-[#C2414B] text-white text-sm font-medium hover:opacity-90 transition-colors"
                    >
                      Focus review
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {troubleTracks.slice(0, 5).map((track) => (
                      <span
                        key={`trouble-${track.id}`}
                        className="rounded-full bg-[rgba(230,57,70,0.12)] px-2.5 py-1 text-xs font-body text-[#A22F3B]"
                      >
                        {track.label} · {track.struggleScore || 0}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {masteringTracks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-card border border-[rgba(45,147,108,0.24)] bg-[rgba(45,147,108,0.08)] p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-body font-semibold text-text-primary text-sm">✍️ Handwriting Lab</p>
                    <p className="font-body text-xs text-text-muted mt-0.5">
                      Practice writing prompts on a canvas board (Axiom-style) and cool down trouble items.
                    </p>
                  </div>
                  <button
                    onClick={() => startWritingLab()}
                    className="flex-shrink-0 px-4 py-2 rounded-full bg-[#2D936C] text-white text-sm font-medium hover:opacity-90 transition-colors"
                  >
                    Open lab
                  </button>
                </motion.div>
              )}

              <AnimatePresence>
                {shareFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-card border border-[rgba(45,147,108,0.22)] bg-[rgba(45,147,108,0.08)] p-3"
                  >
                    <p className="font-body text-sm font-semibold text-[#2D936C]">{shareFeedback}</p>
                    <p className="font-body text-xs text-text-muted">Share exact rabbit holes, not generic home pages.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {careTracks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-card border border-[rgba(212,163,115,0.26)] bg-[rgba(212,163,115,0.12)] p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-body font-semibold text-text-primary text-sm">
                        {careTracks.length} branch{careTracks.length === 1 ? '' : 'es'} need tending
                      </p>
                      <p className="font-body text-text-muted text-xs mt-0.5">
                        {careTracks.slice(0, 3).map((track) => track.label).join(', ')}
                        {careTracks.length > 3 ? '...' : ''}
                      </p>
                    </div>
                    <button
                      onClick={handleTendAll}
                      className="flex-shrink-0 px-4 py-2 rounded-full bg-[#8E6F47] text-white text-sm font-medium hover:opacity-90 transition-colors"
                    >
                      💧 Tend all
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Due for review banner */}
              <AnimatePresence>
                {dueNow.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-[rgba(255,107,53,0.08)] border border-[rgba(255,107,53,0.2)] rounded-card p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-body font-semibold text-text-primary text-sm">
                        {dueNow.length} {dueNow.length === 1 ? 'card' : 'cards'} due for review
                      </p>
                      <p className="font-body text-text-muted text-xs mt-0.5">
                        {dueNow.map((c) => c.label).join(', ').slice(0, 60)}
                        {dueNow.map((c) => c.label).join(', ').length > 60 ? '...' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartReview()}
                      className="flex-shrink-0 px-4 py-2 rounded-full bg-spark-ember text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      Start →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connection mode banner */}
              <AnimatePresence>
                {connectSource && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-[rgba(91,94,166,0.08)] border border-[rgba(91,94,166,0.2)] rounded-card p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-body font-semibold text-text-primary text-sm">
                        🌱 Connecting "{connectSource.label}"
                      </p>
                      <p className="font-body text-text-muted text-xs mt-0.5">
                        Tap another track to link them together
                      </p>
                    </div>
                    <button
                      onClick={() => setConnectSource(null)}
                      className="text-xs text-text-muted hover:text-text-primary font-body transition-colors"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mastering section */}
              {masteringTracks.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-[rgba(42,42,42,0.07)]" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted px-2">
                      🎯 Mastering · {masteringTracks.length}
                    </span>
                    <div className="h-px flex-1 bg-[rgba(42,42,42,0.07)]" />
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {masteringTracks.map((track) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          ageGroup={user.ageGroup}
                          onExplain={setExplainerTrack}
                          onReview={(t) => handleStartReview(t)}
                          onRemove={handleRemove}
                          onToggleMode={handleToggleMode}
                          onConnect={handleConnect}
                          onShare={handleShare}
                          onTend={handleTendTrack}
                          connectMode={!!connectSource}
                          isConnectSource={connectSource?.id === track.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {/* Exploring section */}
              {exploringTracks.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-[rgba(42,42,42,0.07)]" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted px-2">
                      🏔 Exploring · {exploringTracks.length}
                    </span>
                    <div className="h-px flex-1 bg-[rgba(42,42,42,0.07)]" />
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {exploringTracks.map((track) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          ageGroup={user.ageGroup}
                          onExplain={setExplainerTrack}
                          onReview={(t) => handleStartReview(t)}
                          onRemove={handleRemove}
                          onToggleMode={handleToggleMode}
                          onConnect={handleConnect}
                          onShare={handleShare}
                          onTend={handleTendTrack}
                          connectMode={!!connectSource}
                          isConnectSource={connectSource?.id === track.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explainer modal */}
      <Modal
        isOpen={!!explainerTrack}
        onClose={() => setExplainerTrack(null)}
        title={explainerTrack?.label || ''}
      >
        {explainerTrack && (
          <ExplainerCard
            node={explainerTrack}
            userContextObj={userContextObj}
            knowledgeState={user.knowledgeStates[explainerTrack.id]}
            onKnowledgeTag={user.setKnowledgeState}
            onSave={() => {}}
            onGoDeeper={(node) => {
              setExplainerTrack(null);
              openDeepDive(node);
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={sprintOpen}
        onClose={closeSprint}
        title="⚡ Mastery Sprint"
        maxWidth="max-w-xl"
      >
        {sprintCards.length > 0 && !sprintDone && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-sm text-text-muted">
                Card {sprintIndex + 1} of {sprintCards.length}
              </p>
              <p className="font-body text-sm font-semibold text-text-primary">Score: {sprintScore}</p>
            </div>
            <div className="rounded-[20px] border border-[rgba(42,42,42,0.1)] bg-[rgba(255,255,255,0.65)] p-4 mb-4">
              <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-1">Prompt</p>
              <p className="font-display text-xl text-text-primary">{sprintCards[sprintIndex].label}</p>
              <p className="font-body text-xs text-text-muted mt-2">Try recalling before revealing.</p>
              {sprintReveal && (
                <div className="mt-3 rounded-[14px] bg-[rgba(42,42,42,0.05)] p-3">
                  <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-1">Answer</p>
                  <p className="font-body text-sm text-text-secondary">
                    {sprintCards[sprintIndex].description || 'No answer text in this card.'}
                  </p>
                </div>
              )}
            </div>
            {!sprintReveal ? (
              <button
                onClick={() => setSprintReveal(true)}
                className="w-full rounded-full bg-[rgba(91,94,166,0.12)] text-[#5B5EA6] px-4 py-2 text-sm font-medium hover:bg-[rgba(91,94,166,0.2)] transition-colors"
              >
                Reveal answer
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSprintGrade('again')}
                  className="rounded-full bg-[rgba(230,57,70,0.12)] text-[#C2414B] px-3 py-2 text-sm font-medium hover:bg-[rgba(230,57,70,0.2)] transition-colors"
                >
                  Again
                </button>
                <button
                  onClick={() => handleSprintGrade('hard')}
                  className="rounded-full bg-[rgba(212,163,115,0.18)] text-[#8E6F47] px-3 py-2 text-sm font-medium hover:bg-[rgba(212,163,115,0.26)] transition-colors"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleSprintGrade('easy')}
                  className="rounded-full bg-[rgba(45,147,108,0.14)] text-[#2D936C] px-3 py-2 text-sm font-medium hover:bg-[rgba(45,147,108,0.24)] transition-colors"
                >
                  Easy
                </button>
              </div>
            )}
          </div>
        )}

        {sprintCards.length > 0 && sprintDone && (
          <div className="text-center">
            <p className="text-4xl mb-2">🏁</p>
            <p className="font-display text-xl text-text-primary">Sprint complete</p>
            <p className="font-body text-sm text-text-secondary mt-1">
              You scored <span className="font-semibold text-text-primary">{sprintScore}</span> out of {sprintCards.length * 2}.
            </p>
            <p className="font-body text-xs text-text-muted mt-3">
              Card schedules were updated based on your ratings.
            </p>
            <button
              onClick={closeSprint}
              className="mt-4 px-4 py-2 rounded-full bg-spark-ember text-white text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={matchOpen}
        onClose={closeMatchGame}
        title="🧩 Match Blitz"
        maxWidth="max-w-2xl"
      >
        {matchDeck.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-body text-sm text-text-muted">
                Matched {matchedIds.length}/{matchDeck.length}
              </p>
              <p className="font-body text-sm font-semibold text-text-primary">
                ⏱ {matchSeconds}s {matchBest ? `· best ${matchBest}s` : ''}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="font-body text-xs uppercase tracking-wider text-text-muted">Prompts</p>
                {matchDeck.map((item) => {
                  const matched = matchedIds.includes(item.id);
                  const selected = selectedPromptId === item.id;
                  return (
                    <button
                      key={`p-${item.id}`}
                      onClick={() => handlePickPrompt(item.id)}
                      disabled={matched}
                      className={`w-full text-left rounded-[14px] px-3 py-2 text-sm transition-colors ${
                        matched
                          ? 'bg-[rgba(45,147,108,0.16)] text-[#2D936C]'
                          : selected
                            ? 'bg-[rgba(91,94,166,0.2)] text-[#4a4d88]'
                            : 'bg-[rgba(42,42,42,0.06)] text-text-primary hover:bg-[rgba(42,42,42,0.1)]'
                      }`}
                    >
                      {item.prompt}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <p className="font-body text-xs uppercase tracking-wider text-text-muted">Meanings</p>
                {matchAnswerOrder.map((id) => {
                  const item = matchDeck.find((entry) => entry.id === id);
                  if (!item) return null;
                  const matched = matchedIds.includes(item.id);
                  const selected = selectedAnswerId === item.id;
                  return (
                    <button
                      key={`a-${item.id}`}
                      onClick={() => handlePickAnswer(item.id)}
                      disabled={matched}
                      className={`w-full text-left rounded-[14px] px-3 py-2 text-sm transition-colors ${
                        matched
                          ? 'bg-[rgba(45,147,108,0.16)] text-[#2D936C]'
                          : selected
                            ? 'bg-[rgba(255,107,53,0.2)] text-spark-ember'
                            : 'bg-[rgba(42,42,42,0.06)] text-text-primary hover:bg-[rgba(42,42,42,0.1)]'
                      }`}
                    >
                      {item.answer}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={writingOpen}
        onClose={() => { setWritingOpen(false); setIsDrawing(false); }}
        title="✍️ Handwriting Lab"
        maxWidth="max-w-2xl"
      >
        {writingOpen && (
          <div>
            <div className="mb-3">
              <p className="font-body text-xs uppercase tracking-wider text-text-muted">Practice prompt</p>
              <p className="font-display text-xl text-text-primary">
                {tracksWithSRS.find((track) => track.id === writingTargetId)?.label || 'Practice'}
              </p>
              <p className="font-body text-xs text-text-muted mt-1">
                Strokes: {writingStrokes} {writingMessage ? `· ${writingMessage}` : ''}
              </p>
            </div>

            <canvas
              ref={writingCanvasRef}
              width={860}
              height={360}
              className="w-full rounded-[16px] border border-[rgba(42,42,42,0.14)] bg-white touch-none"
              onPointerDown={handleWritePointerDown}
              onPointerMove={handleWritePointerMove}
              onPointerUp={handleWritePointerUp}
              onPointerLeave={handleWritePointerUp}
            />

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                onClick={clearWritingCanvas}
                className="rounded-full bg-[rgba(42,42,42,0.08)] text-text-primary px-3 py-2 text-sm font-medium hover:bg-[rgba(42,42,42,0.14)] transition-colors"
              >
                Clear
              </button>
              <button
                onClick={submitWritingAttempt}
                className="rounded-full bg-[#2D936C] text-white px-3 py-2 text-sm font-medium hover:opacity-90 transition-colors"
              >
                Submit
              </button>
              <button
                onClick={() => startWritingLab(troubleTracks[0]?.id)}
                className="rounded-full bg-[rgba(230,57,70,0.12)] text-[#C2414B] px-3 py-2 text-sm font-medium hover:bg-[rgba(230,57,70,0.2)] transition-colors"
              >
                Next trouble
              </button>
            </div>
          </div>
        )}
      </Modal>

      <PruningCeremony
        track={pruningTarget}
        open={!!pruningTarget}
        onConfirm={handlePruneConfirm}
        onCancel={() => setPruningTarget(null)}
      />

      <Toast
        open={!!toast}
        title={toast?.title || ''}
        subtitle={toast?.subtitle || ''}
        icon={toast?.icon}
        variant={toast?.variant || 'default'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
