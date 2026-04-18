import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import CardGrid from '../components/discovery/CardGrid.jsx';
import DeepDive from '../components/discovery/DeepDive.jsx';
import TreeRenderer from '../components/tree/TreeRenderer.jsx';
import SeedSprout from '../components/tree/SeedSprout.jsx';
import ExplainerCard from '../components/explainer/ExplainerCard.jsx';
import SearchBar from '../components/search/SearchBar.jsx';
import Ember from '../components/ember/Ember.jsx';
import Modal from '../components/common/Modal.jsx';
import EmberErrorBoundary from '../components/common/ErrorBoundary.jsx';
import { useUserContext } from '../hooks/useUserContext.jsx';
import { useTree } from '../hooks/useTree.jsx';
import { useSearch } from '../hooks/useSearch.js';
import { DOMAIN_COLORS } from '../utils/domainColors.js';
import { buildUserContext } from '../models/userContext.js';
import { getTopDomains } from '../models/elo.js';
import { storage } from '../services/storage.js';

export default function Explore({ initialSearch = null, pendingDeepDive = null, onConsumePendingDeepDive }) {
  const user = useUserContext();
  const { initRoots, roots, nodes, expandNode, updateNode } = useTree();
  const [phase, setPhase] = useState('discovery');
  const [sproutDomains, setSproutDomains] = useState([]);
  const [explainerNode, setExplainerNode] = useState(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState('balanced');
  const [drillStack, setDrillStack] = useState([]);
  const [deepDiveNode, setDeepDiveNode] = useState(null);

  const userContextObj = buildUserContext(user);
  const {
    query,
    suggestions,
    explainer: searchExplainer,
    isLoading: searchLoading,
    handleQueryChange,
    runSearch,
    clearSearch,
    lastSearchIdRef,
  } = useSearch(userContextObj);
  const initializedSearchRef = useRef(false);
  const restoredRootsRef = useRef(false);

  useEffect(() => {
    if (!initialSearch || initializedSearchRef.current) return;
    initializedSearchRef.current = true;

    handleQueryChange(initialSearch);
    runSearch(initialSearch);

    if (roots.length === 0) {
      const defaultDomains = ['math', 'science', 'cs', 'art', 'music'];
      initRoots(defaultDomains);
    }
  }, [handleQueryChange, initRoots, initialSearch, roots.length, runSearch]);

  useEffect(() => {
    if (!pendingDeepDive) return;

    const timer = setTimeout(() => {
      if (roots.length === 0) {
        const fallbackDomains = [pendingDeepDive.domain || 'science', 'math', 'cs', 'art', 'music'];
        initRoots(Array.from(new Set(fallbackDomains)));
      }

      clearSearch();
      setShowExplainer(false);
      setExplainerNode(null);
      setDrillStack([]);
      setDeepDiveNode(pendingDeepDive);
      setPhase('tree');
      onConsumePendingDeepDive?.();
    }, 0);

    return () => clearTimeout(timer);
  }, [clearSearch, initRoots, onConsumePendingDeepDive, pendingDeepDive, roots.length]);

  const handleDiscoveryComplete = useCallback(() => {
    const topDomains = getTopDomains(user.eloScores, 3);
    const domains = topDomains.length > 0 ? topDomains : ['math', 'science', 'cs'];
    setSproutDomains(domains);
    setPhase('sprouting');
    initRoots(domains);
  }, [user.eloScores, initRoots]);

  const handleSproutComplete = useCallback(() => {
    setPhase('tree');
  }, []);

  useEffect(() => {
    if (roots.length === 0 && user.onboardingComplete && !restoredRootsRef.current) {
      restoredRootsRef.current = true;
      const topDomains = getTopDomains(user.eloScores, 3);
      if (topDomains.length > 0) {
        initRoots(topDomains);
      }
    }
  }, [initRoots, roots.length, user.eloScores, user.onboardingComplete]);

  const handleExplainNode = useCallback((node) => {
    setExplainerNode(node);
    setShowExplainer(true);
  }, []);

  const handleSaveNode = useCallback((node) => {
    if (!node.saved) {
      const track = { ...node, saved: true, savedAt: new Date().toISOString() };
      user.addTrack(track);
      updateNode?.(node.id, { saved: true });
      if (lastSearchIdRef.current) {
        storage.updateSearch(lastSearchIdRef.current, { savedForLater: true });
      }
    }
  }, [lastSearchIdRef, user, updateNode]);

  const handleDrillInto = useCallback((node) => {
    expandNode(node.id, userContextObj);
    setDrillStack((prev) => {
      const last = prev[prev.length - 1];
      if (last?.id === node.id) return prev;
      return [...prev, { id: node.id, label: node.label, domain: node.domain }];
    });
  }, [expandNode, userContextObj]);

  const handleDrillToDepth = useCallback((depth) => {
    setDrillStack((prev) => prev.slice(0, depth));
  }, []);

  const handleGoDeeper = useCallback((node) => {
    setShowExplainer(false);
    clearSearch();
    setDeepDiveNode(node);
    setPhase('tree');
    if (lastSearchIdRef.current) {
      storage.updateSearch(lastSearchIdRef.current, { wentDeeper: true });
    }
  }, [clearSearch, lastSearchIdRef]);

  const handleSearchSubmit = useCallback((term, targetNode) => {
    runSearch(term, targetNode);
  }, [runSearch]);

  const isKids = user.ageGroup === 'little_explorer';
  const recentSearches = useMemo(() => storage.getSearches().slice(0, 3), []);
  const topDomains = useMemo(() => getTopDomains(user.eloScores, 3), [user.eloScores]);
  const currentStreak = Math.max(1, Math.min(7, Math.ceil(((user.stats?.nodesExplored || 0) + recentSearches.length + (user.tracks?.length || 0)) / 3)));
  const rabbitHolesUnlocked = Math.max(roots.length, drillStack.length + (deepDiveNode ? 2 : 0), topDomains.length);
  const effectivePhase = useMemo(() => {
    if (phase === 'discovery' && roots.length > 0) return 'tree';
    return phase;
  }, [phase, roots.length]);
  const headerTitle = effectivePhase === 'discovery'
    ? 'Calibrate your curiosity engine'
    : deepDiveNode
      ? `Dive through ${deepDiveNode.label}`
      : 'Follow the strongest thread';
  const headerCopy = effectivePhase === 'discovery'
    ? 'A few fast picks help Spark learn what feels magnetic, weird, or worth chasing.'
    : deepDiveNode
      ? 'Keep tapping toward the branch that feels unexpectedly rich.'
      : 'The tree should feel less like a menu and more like a map that wants you to wander.';
  const emberMood = searchLoading
    ? 'thinking'
    : searchExplainer
      ? 'excited'
      : deepDiveNode
        ? 'curious'
        : effectivePhase === 'discovery'
          ? 'encouraging'
          : 'attentive';
  const emberLine = searchLoading
    ? 'I am stitching together the next explanation.'
    : searchExplainer
      ? `This one has momentum. ${searchExplainer.node?.label || 'Open it'} and see where it branches.`
      : deepDiveNode
        ? `We are already inside ${deepDiveNode.label}. Keep pulling on the thread that feels richest.`
        : effectivePhase === 'discovery'
          ? 'Pick fast. Strong taste is more useful than overthinking.'
          : 'Tap the branch that feels oddly specific. Those are usually the best rabbit holes.';
  const rabbitHolePrompts = deepDiveNode?.children?.length
    ? deepDiveNode.children.slice(0, 3).map((child) => child.label)
    : topDomains.length > 0
      ? [
        `strange ideas in ${topDomains[0]}`,
        `beautiful concepts in ${topDomains[1] || topDomains[0]}`,
        `why ${topDomains[0]} connects to ${topDomains[2] || topDomains[1] || 'art'}`,
      ]
      : ['black holes', 'ancient maps', 'why music feels emotional'];
  const explorationSignal = deepDiveNode
    ? 'Thread Locked'
    : searchExplainer
      ? 'Signal Rising'
      : effectivePhase === 'discovery'
        ? 'Taste Scan'
        : 'Wander Mode';

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-[rgba(42,42,42,0.06)] bg-[rgba(255,253,247,0.82)] px-4 pb-2 pt-4 backdrop-blur-xl">
        <div className="mx-auto max-w-[760px]">
          <SearchBar
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleSearchSubmit}
            suggestions={suggestions}
            placeholder={isKids ? 'Ask Ember anything!' : 'Search anything curious...'}
          />
        </div>
      </div>

      <AnimatePresence>
        {(searchExplainer || searchLoading) && (
          <div className="overflow-hidden">
            <div className="mx-auto max-w-[760px] px-4 py-3">
              {searchLoading ? (
                <div className="flex items-center gap-3 py-4 text-text-muted">
                  <Ember mood="thinking" size="xs" glowIntensity={0.5} />
                  <span className="font-body text-sm">Ember is thinking...</span>
                </div>
              ) : searchExplainer ? (
                <div className="space-y-3">
                  <ExplainerCard
                    node={searchExplainer.node}
                    userContextObj={userContextObj}
                    knowledgeState={user.knowledgeStates[searchExplainer.node?.id]}
                    onKnowledgeTag={user.setKnowledgeState}
                    onSave={handleSaveNode}
                    onGoDeeper={(node) => handleGoDeeper(node)}
                    compact
                  />
                  <button
                    onClick={clearSearch}
                    className="font-body text-sm text-text-muted transition-colors hover:text-text-secondary"
                  >
                    Clear search
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-5 mt-3 rounded-[28px] border border-[rgba(255,255,255,0.74)] bg-[linear-gradient(135deg,rgba(255,249,239,0.95),rgba(255,255,255,0.72))] p-5 shadow-[0_24px_70px_rgba(72,49,10,0.08)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[rgba(42,42,42,0.06)] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
                    Curiosity Engine
                  </span>
                  {topDomains.map((domain) => (
                    <span
                      key={domain}
                      className="rounded-full px-3 py-1 text-[11px] font-body font-semibold capitalize"
                      style={{ background: `${DOMAIN_COLORS[domain] || '#FF6B35'}15`, color: DOMAIN_COLORS[domain] || '#FF6B35' }}
                    >
                      {domain}
                    </span>
                  ))}
                </div>
                <h1 className={`mb-2 font-display font-semibold text-text-primary ${isKids ? 'text-[2rem]' : 'text-[2.3rem]'}`}>
                  {headerTitle}
                </h1>
                <p className="max-w-2xl font-body text-[15px] leading-relaxed text-text-secondary">
                  {headerCopy}
                </p>
              </div>

              <div className="grid gap-3 sm:min-w-[250px] sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[20px] bg-[rgba(255,255,255,0.82)] px-4 py-3">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Current Streak</p>
                  <p className="mt-1 font-display text-2xl text-text-primary">{currentStreak} day{currentStreak === 1 ? '' : 's'}</p>
                  <p className="text-xs text-text-muted">Tiny daily sessions compound fast.</p>
                </div>
                <div className="rounded-[20px] bg-[rgba(255,255,255,0.82)] px-4 py-3">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Rabbit Holes</p>
                  <p className="mt-1 font-display text-2xl text-text-primary">{rabbitHolesUnlocked}</p>
                  <p className="text-xs text-text-muted">Distinct threads opening up.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-[rgba(255,107,53,0.12)] bg-[linear-gradient(135deg,rgba(255,107,53,0.13),rgba(255,244,236,0.92))] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-[18px] bg-[rgba(255,255,255,0.72)] p-2.5 shadow-[0_10px_24px_rgba(255,107,53,0.12)]">
                    <Ember mood={emberMood} size="md" glowIntensity={0.9} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[rgba(42,42,42,0.06)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
                        Ember live
                      </span>
                      <span className="rounded-full bg-[rgba(255,255,255,0.7)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-spark-ember">
                        {explorationSignal}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-xl leading-tight text-text-primary">
                      {deepDiveNode ? `The branch around ${deepDiveNode.label} is heating up.` : 'The app should feel like it is luring you deeper.'}
                    </p>
                    <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary">
                      {emberLine}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] bg-[rgba(255,255,255,0.74)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
                      Prompt Bait
                    </p>
                    <p className="text-xs font-body text-text-muted">Tap to jump-start a rabbit hole</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rabbitHolePrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSearchSubmit(prompt)}
                        className="rounded-full bg-[rgba(255,107,53,0.08)] px-3 py-1.5 text-sm font-body font-semibold text-spark-ember transition-colors hover:bg-[rgba(255,107,53,0.16)]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[22px] bg-[rgba(255,107,53,0.08)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Discovery Mode</p>
                    <p className="text-xs font-body text-text-muted">{effectivePhase === 'discovery' ? 'Actively calibrating' : 'Ready for detours'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      ['balanced', 'Balanced'],
                      ['similar', 'More like this'],
                      ['surprise', 'Surprise me'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setDiscoveryMode(value)}
                        className={`rounded-full px-3 py-1.5 text-sm font-body font-semibold transition-all ${
                          discoveryMode === value
                            ? 'bg-spark-ember text-white shadow-sm'
                            : 'bg-[rgba(255,255,255,0.84)] text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] bg-[rgba(255,255,255,0.82)] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Thread Pulse</p>
                    <p className="text-xs font-body text-text-muted">{rabbitHolesUnlocked} active openings</p>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 7 }).map((_, index) => {
                      const active = index < Math.min(7, Math.max(1, rabbitHolesUnlocked));
                      return (
                        <span
                          key={index}
                          className={`h-2.5 flex-1 rounded-full transition-opacity ${active ? 'opacity-100' : 'opacity-25'}`}
                          style={{ background: active ? 'linear-gradient(90deg, rgba(255,107,53,0.95), rgba(255,166,43,0.85))' : 'rgba(42,42,42,0.08)' }}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-2 text-sm font-body text-text-secondary">
                    {deepDiveNode
                      ? 'This thread is already open. Keep drilling until the next question becomes obvious.'
                      : 'The best sessions feel like one click creates three more tempting questions.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[22px] bg-[rgba(255,255,255,0.82)] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Recent Curiosity</p>
                  <p className="text-xs font-body text-text-muted">Reusable entry points</p>
                </div>
                {recentSearches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search.id}
                        onClick={() => handleSearchSubmit(search.term)}
                        className="rounded-full bg-[rgba(42,42,42,0.05)] px-3 py-1.5 text-sm font-body text-text-primary hover:bg-[rgba(255,107,53,0.08)]"
                      >
                        {search.term}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-body text-text-muted">Your searches will turn into reusable entry points here.</p>
                )}
              </div>

              <div className="rounded-[22px] bg-[rgba(255,255,255,0.82)] p-4">
                <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Session Goal</p>
                <p className="font-display text-xl text-text-primary">
                  {effectivePhase === 'discovery' ? 'Find your next obsession' : 'Leave with a stronger question'}
                </p>
                <p className="mt-2 text-sm font-body leading-relaxed text-text-secondary">
                  {effectivePhase === 'discovery'
                    ? 'The point is not correctness yet. It is noticing what keeps tugging on your attention.'
                    : 'If the app is working, each tap should sharpen taste and produce a more specific next step.'}
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {effectivePhase === 'discovery' ? (
              <div key="discovery" className="py-4">
                <CardGrid
                  userContext={userContextObj}
                  onDiscoveryComplete={handleDiscoveryComplete}
                  mode={discoveryMode}
                />
              </div>
            ) : effectivePhase === 'sprouting' ? (
              <div key="sprouting">
                <SeedSprout
                  topDomains={sproutDomains}
                  onComplete={handleSproutComplete}
                />
              </div>
            ) : (
              <div key="tree" className="py-4">
                {deepDiveNode ? (
                  <DeepDive
                    key={deepDiveNode.id}
                    rootNode={deepDiveNode}
                    userContextObj={userContextObj}
                    onExplain={handleExplainNode}
                    onSave={handleSaveNode}
                    onBack={() => setDeepDiveNode(null)}
                  />
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="mb-0.5 flex items-center gap-2">
                          <h1 className="font-display text-lg font-semibold text-text-primary">
                            Your Knowledge Tree
                          </h1>
                          <div className="flex items-center gap-1">
                            {roots.slice(0, 5).map((root) => {
                              const color = DOMAIN_COLORS[root.domain] || '#FF6B35';
                              return (
                                <div
                                  key={root.id}
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                  title={root.label}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <p className="font-body text-xs text-text-muted">
                          {Math.max(user.stats?.nodesExplored || 0, Object.keys(nodes || {}).length)} sparks explored
                        </p>
                      </div>
                    </div>

                    <TreeRenderer
                      userContextObj={userContextObj}
                      onExplain={handleExplainNode}
                      onSave={handleSaveNode}
                      drillStack={drillStack}
                      onDrillInto={handleDrillInto}
                      onDrillToDepth={handleDrillToDepth}
                    />

                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={() => setPhase('discovery')}
                        className="flex items-center gap-1.5 rounded-full bg-[rgba(42,42,42,0.05)] px-4 py-2 font-body text-sm text-text-muted transition-colors hover:text-spark-ember"
                      >
                        ✦ Run discovery again
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Modal
        isOpen={showExplainer}
        onClose={() => setShowExplainer(false)}
        title={explainerNode?.label || ''}
      >
        {explainerNode && (
          <EmberErrorBoundary>
            <ExplainerCard
              node={explainerNode}
              userContextObj={userContextObj}
              knowledgeState={user.knowledgeStates[explainerNode.id]}
              onKnowledgeTag={user.setKnowledgeState}
              onSave={handleSaveNode}
              onGoDeeper={handleGoDeeper}
            />
          </EmberErrorBoundary>
        )}
      </Modal>
    </div>
  );
}
