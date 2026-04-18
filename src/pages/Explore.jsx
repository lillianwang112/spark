import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardGrid from '../components/discovery/CardGrid.jsx';
import DeepDive from '../components/discovery/DeepDive.jsx';
import TreeRenderer from '../components/tree/TreeRenderer.jsx';
import SeedSprout from '../components/tree/SeedSprout.jsx';
import ExplainerCard from '../components/explainer/ExplainerCard.jsx';
import SearchBar from '../components/search/SearchBar.jsx';
import Ember from '../components/ember/Ember.jsx';
import Modal from '../components/common/Modal.jsx';
import EmberErrorBoundary from '../components/common/ErrorBoundary.jsx';
import DailySpark from '../components/explore/DailySpark.jsx';
import Toast from '../components/common/Toast.jsx';
import { useUserContext } from '../hooks/useUserContext.jsx';
import { useTree } from '../hooks/useTree.jsx';
import { useSearch } from '../hooks/useSearch.js';
import { DOMAIN_COLORS } from '../utils/domainColors.js';
import { buildUserContext } from '../models/userContext.js';
import { getTopDomains } from '../models/elo.js';
import { storage } from '../services/storage.js';
import TopicGraph from '../services/topicGraph.js';
void motion;

export default function Explore({
  initialSearch = null,
  pendingDeepDive = null,
  onConsumePendingDeepDive,
  onSpark,
  streakState,
}) {
  const user = useUserContext();
  const { initRoots, roots, nodes, expandNode, updateNode } = useTree();
  const [phase, setPhase] = useState('discovery');
  const [sproutDomains, setSproutDomains] = useState([]);
  const [explainerNode, setExplainerNode] = useState(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState('balanced');
  const [drillStack, setDrillStack] = useState([]);
  const [deepDiveNode, setDeepDiveNode] = useState(null);
  const [toast, setToast] = useState(null);

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

  const ping = useCallback(() => { onSpark?.(); }, [onSpark]);

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
    ping();
  }, [user.eloScores, initRoots, ping]);

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
    ping();
  }, [ping]);

  const handleSaveNode = useCallback((node) => {
    if (!node.saved) {
      const track = { ...node, saved: true, savedAt: new Date().toISOString() };
      user.addTrack(track);
      updateNode?.(node.id, { saved: true });
      TopicGraph.rememberSignal(node, 'saves');
      if (lastSearchIdRef.current) {
        storage.updateSearch(lastSearchIdRef.current, { savedForLater: true });
      }
      setToast({ title: 'Added to Tracks', subtitle: node.label, variant: 'celebrate', icon: '✨' });
      ping();
    }
  }, [lastSearchIdRef, user, updateNode, ping]);

  const handleDrillInto = useCallback((node) => {
    expandNode(node.id, userContextObj);
    setDrillStack((prev) => {
      const last = prev[prev.length - 1];
      if (last?.id === node.id) return prev;
      return [...prev, { id: node.id, label: node.label, domain: node.domain }];
    });
    ping();
  }, [expandNode, userContextObj, ping]);

  const handleDrillToDepth = useCallback((depth) => {
    setDrillStack((prev) => prev.slice(0, depth));
  }, []);

  const handleGoDeeper = useCallback((node) => {
    setShowExplainer(false);
    clearSearch();
    if (!node.saved) {
      user.addTrack({
        ...node,
        saved: true,
        savedAt: new Date().toISOString(),
      });
    }
    setDeepDiveNode(node);
    setPhase('tree');
    TopicGraph.rememberSignal(node, 'deepens');
    TopicGraph.warmTopic(node, userContextObj).catch(() => {});
    if (lastSearchIdRef.current) {
      storage.updateSearch(lastSearchIdRef.current, { wentDeeper: true });
    }
    ping();
  }, [clearSearch, lastSearchIdRef, user, userContextObj, ping]);

  const handleSearchSubmit = useCallback((term, targetNode) => {
    runSearch(term, targetNode);
    ping();
  }, [runSearch, ping]);

  const isKids = user.ageGroup === 'little_explorer';
  const recentSearches = useMemo(() => storage.getSearches().slice(0, 3), []);
  const topDomains = useMemo(() => getTopDomains(user.eloScores, 3), [user.eloScores]);
  const effectivePhase = useMemo(() => {
    if (phase === 'discovery' && roots.length > 0) return 'tree';
    return phase;
  }, [phase, roots.length]);

  const streak = streakState?.streak ?? 1;
  const sparksToday = streakState?.sparksToday ?? 0;
  const dailyGoal = streakState?.dailyGoal ?? 3;

  const dailyPrompts = useMemo(() => {
    const fromTree = roots[0]
      ? TopicGraph.getPredictedPrompts(roots[0], userContextObj)
      : null;
    if (fromTree && fromTree.length) return fromTree.slice(0, 3);
    if (topDomains.length > 0) {
      return [
        `strange ideas in ${topDomains[0]}`,
        `beautiful concepts in ${topDomains[1] || topDomains[0]}`,
        `why ${topDomains[0]} connects to ${topDomains[2] || topDomains[1] || 'art'}`,
      ];
    }
    return ['black holes', 'ancient maps', 'why music feels emotional'];
  }, [roots, topDomains, userContextObj]);

  const dailyHook = deepDiveNode
    ? `Dive through ${deepDiveNode.label}.`
    : searchExplainer
      ? 'This thread has momentum — keep pulling.'
      : effectivePhase === 'discovery'
        ? 'Let\'s calibrate what actually lights you up.'
        : 'One thread, pulled gently into daylight.';

  const dailyBody = deepDiveNode
    ? 'Keep tapping toward the branch that feels unexpectedly rich.'
    : searchExplainer
      ? `${searchExplainer.node?.label || 'This one'} is worth opening — and saving.`
      : 'Tap one of these, or surprise me. Every spark counts toward today.';

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-[rgba(42,42,42,0.06)] bg-[rgba(255,253,247,0.86)] px-4 pb-2 pt-4 backdrop-blur-xl">
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
        <div className="mx-auto max-w-[760px] space-y-5 pt-4">
          <DailySpark
            userName={user.name}
            sparksToday={sparksToday}
            dailyGoal={dailyGoal}
            streak={streak}
            suggestion={{ hook: dailyHook, body: dailyBody, prompts: dailyPrompts }}
            onSearch={handleSearchSubmit}
            onStartDiscovery={() => {
              setDeepDiveNode(null);
              setDrillStack([]);
              setPhase('discovery');
            }}
            isKids={isKids}
          />

          {(topDomains.length > 0 || effectivePhase === 'tree') && (
            <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="rounded-[22px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.74)] p-4 shadow-soft"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Discovery Mode</p>
                  <p className="text-xs font-body text-text-muted">{effectivePhase === 'discovery' ? 'Actively calibrating' : 'Ready for detours'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    ['balanced', 'Balanced'],
                    ['similar', 'More like this'],
                    ['surprise', 'Surprise me ✦'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setDiscoveryMode(value);
                        setDeepDiveNode(null);
                        setDrillStack([]);
                        setPhase('discovery');
                      }}
                      className={`rounded-full px-3 py-1.5 text-sm font-body font-semibold transition-all ${
                        discoveryMode === value
                          ? 'bg-spark-ember text-white shadow-[0_6px_16px_rgba(255,107,53,0.28)]'
                          : 'bg-[rgba(42,42,42,0.05)] text-text-secondary hover:bg-[rgba(42,42,42,0.1)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {topDomains.map((domain) => (
                    <span
                      key={domain}
                      className="rounded-full px-2.5 py-1 text-[11px] font-body font-semibold capitalize"
                      style={{ background: `${DOMAIN_COLORS[domain] || '#FF6B35'}15`, color: DOMAIN_COLORS[domain] || '#FF6B35' }}
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-[22px] border border-[rgba(255,255,255,0.78)] bg-[rgba(255,255,255,0.74)] p-4 shadow-soft"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Recent Curiosity</p>
                  <p className="text-xs font-body text-text-muted">Reusable entry points</p>
                </div>
                {recentSearches.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
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
              </motion.div>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {effectivePhase === 'discovery' ? (
              <motion.div
                key="discovery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="py-2"
              >
                <CardGrid
                  key={discoveryMode}
                  userContext={userContextObj}
                  onDiscoveryComplete={handleDiscoveryComplete}
                  onOpenTopic={handleExplainNode}
                  mode={discoveryMode}
                />
              </motion.div>
            ) : effectivePhase === 'sprouting' ? (
              <motion.div
                key="sprouting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SeedSprout
                  topDomains={sproutDomains}
                  onComplete={handleSproutComplete}
                />
              </motion.div>
            ) : (
              <motion.div
                key="tree"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="py-2"
              >
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
              </motion.div>
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
