import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import { useUserContext } from '../hooks/useUserContext.jsx';
import { deriveBranchState, useBranchState } from '../hooks/useBranchState.js';
import ExplainerCard from '../components/explainer/ExplainerCard.jsx';
import ReviewSession from '../components/mastering/ReviewSession.jsx';
import Modal from '../components/common/Modal.jsx';
import Ember from '../components/ember/Ember.jsx';
import { DOMAIN_COLORS } from '../utils/domainColors.js';
import { KNOWLEDGE_STATE_LABELS, BRANCH_STATES } from '../utils/constants.js';
import { getDueCards, seedSRSFromKnowledgeState, daysUntilReview } from '../models/srs.js';
import { buildUserContext } from '../models/userContext.js';
import { copyThreadUrl } from '../utils/threads.js';
import { relativeTime } from '../utils/helpers.js';
import { openDeepDive } from '../utils/navigation.js';

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

// ── Branch state badge ──
function BranchBadge({ state }) {
  const badges = {
    [BRANCH_STATES.FLOWERING]: { emoji: '🌸', label: 'Flowering', bg: 'bg-[rgba(255,215,0,0.15)]', text: 'text-[#8B6914]' },
    [BRANCH_STATES.HEALTHY]:   { emoji: '🌿', label: 'Healthy',   bg: 'bg-[rgba(45,147,108,0.1)]',  text: 'text-[#2D936C]' },
    [BRANCH_STATES.THIRSTY]:   { emoji: '🍂', label: 'Thirsty',   bg: 'bg-[rgba(255,166,43,0.12)]', text: 'text-[#8B6914]' },
    [BRANCH_STATES.WILTING]:   { emoji: '🥀', label: 'Wilting',   bg: 'bg-[rgba(230,57,70,0.08)]',  text: 'text-[#E63946]' },
    [BRANCH_STATES.DORMANT]:   { emoji: '🪵', label: 'Dormant',   bg: 'bg-[rgba(139,139,122,0.12)]',text: 'text-text-muted' },
  };
  const b = badges[state];
  if (!b || state === BRANCH_STATES.HEALTHY) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${b.bg} ${b.text}`}>
      {b.emoji} {b.label}
    </span>
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
          : undefined,
      }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ layout: { duration: 0.2 } }}
      className={`bg-bg-secondary rounded-card shadow-card overflow-hidden transition-all ${
        isInConnectMode ? 'cursor-pointer ring-2 ring-[rgba(255,107,53,0.3)] hover:ring-spark-ember' : ''
      }`}
      onClick={isInConnectMode ? handleConnect : undefined}
    >
      <div className="h-1" style={{ backgroundColor: color }} />
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
          <BranchBadge state={branchState} />
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

export default function Tracks() {
  const user = useUserContext();
  const [explainerTrack, setExplainerTrack] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewCards, setReviewCards] = useState([]);
  const [connectSource, setConnectSource] = useState(null); // track being connected
  const [shareFeedback, setShareFeedback] = useState('');
  const userContextObj = buildUserContext(user);

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

  const handleUpdateCard = (updatedCard) => {
    user.updateTrack(updatedCard);
  };

  const handleRemove = (trackId) => {
    user.removeTrack(trackId);
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

    user.updateTrack({
      id: track.id,
      lastTended: new Date().toISOString(),
      branchState: BRANCH_STATES.HEALTHY,
    });
    setShareFeedback(`Woke up ${track.label}`);
    setTimeout(() => setShareFeedback(''), 1800);
  };

  const handleTendAll = () => {
    if (careTracks.length === 0) return;

    const masteringCare = careTracks.filter((track) => track.mode === 'mastering');
    const exploringCare = careTracks.filter((track) => track.mode !== 'mastering');

    exploringCare.forEach((track) => {
      user.updateTrack({
        id: track.id,
        lastTended: new Date().toISOString(),
        branchState: BRANCH_STATES.HEALTHY,
      });
    });

    if (masteringCare.length > 0) {
      const seeded = masteringCare.map((track) => (
        track.srsData
          ? track
          : { ...track, srsData: seedSRSFromKnowledgeState(track.knowledgeState || 'new') }
      ));
      setReviewCards(seeded);
      setReviewMode(true);
      return;
    }

    setShareFeedback(`Tended ${exploringCare.length} branch${exploringCare.length === 1 ? '' : 'es'}`);
    setTimeout(() => setShareFeedback(''), 1800);
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

  // ── Main tracks view ──
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 pb-3 border-b border-[rgba(42,42,42,0.06)]">
        <div className="max-w-[600px] mx-auto flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">Tracks</h1>
            <p className="font-body text-text-muted text-sm mt-0.5">
              {tracks.length} saved · {dueNow.length > 0 ? `${dueNow.length} due` : 'all clear'}
            </p>
          </div>
          {dueNow.length > 0 && (
            <button
              onClick={() => handleStartReview()}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-card bg-spark-ember text-white text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm min-h-[44px]"
            >
              ⏰ Review {dueNow.length} due
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="max-w-[760px] mx-auto py-4">
          {tracks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 py-16 text-center"
            >
              <Ember mood="curious" size="lg" glowIntensity={0.4} />
              <div>
                <p className="font-display text-lg font-semibold text-text-primary mb-1">
                  Nothing saved yet
                </p>
                <p className="font-body text-text-muted text-sm max-w-[260px] mx-auto leading-relaxed">
                  When you find something worth returning to in Explore, tap "Add to Tracks"
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] bg-[rgba(255,255,255,0.72)] p-4 shadow-card">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Active Tracks</p>
                  <p className="mt-1 font-display text-3xl text-text-primary">{tracks.length}</p>
                  <p className="text-xs font-body text-text-muted">Ideas worth returning to.</p>
                </div>
                <div className="rounded-[22px] bg-[rgba(255,107,53,0.08)] p-4 shadow-card">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Due Right Now</p>
                  <p className="mt-1 font-display text-3xl text-text-primary">{dueNow.length}</p>
                  <p className="text-xs font-body text-text-muted">The tightest loop for retention.</p>
                </div>
                <div className="rounded-[22px] bg-[rgba(91,94,166,0.08)] p-4 shadow-card">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Connections</p>
                  <p className="mt-1 font-display text-3xl text-text-primary">
                    {tracks.reduce((sum, track) => sum + (track.connections?.length || 0), 0)}
                  </p>
                  <p className="text-xs font-body text-text-muted">Cross-topic bridges in your map.</p>
                </div>
              </div>

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
                  <h2 className="font-body font-semibold text-text-secondary text-xs uppercase tracking-wider mb-3">
                    🎯 Mastering
                  </h2>
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
                  <h2 className="font-body font-semibold text-text-secondary text-xs uppercase tracking-wider mb-3">
                    🏔 Exploring
                  </h2>
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
    </div>
  );
}
