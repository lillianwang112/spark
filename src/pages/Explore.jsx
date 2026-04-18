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
import FreeFall from '../components/freefall/FreeFall.jsx';
import { useUserContext } from '../hooks/useUserContext.jsx';
import { useTree } from '../hooks/useTree.jsx';
import { useSearch } from '../hooks/useSearch.js';
import { DOMAIN_COLORS } from '../utils/domainColors.js';
import { DOMAINS, DOMAIN_LABELS, DOMAIN_EMOJIS } from '../utils/constants.js';
import { buildUserContext } from '../models/userContext.js';
import { getTopDomains } from '../models/elo.js';
import { storage } from '../services/storage.js';
import TopicGraph from '../services/topicGraph.js';
void motion;

function seededDomainSlice(domains, seed, count = 3) {
  const ordered = [...domains].sort((a, b) => {
    const av = `${a}-${seed}`;
    const bv = `${b}-${seed}`;
    return av.localeCompare(bv);
  });
  return ordered.slice(0, count);
}

const EXPLORE_SPOTLIGHT_TOPICS = [
  { id: 'personal_finance_101', label: 'Personal Finance', domain: 'economics', path: ['Finance & Economics', 'Personal Finance'], description: 'Budgeting, saving, debt, and compound growth in real life.' },
  { id: 'investing_basics', label: 'Investing Basics', domain: 'economics', path: ['Finance & Economics', 'Investing'], description: 'Index funds, risk, and long-term allocation strategy.' },
  { id: 'financial_markets', label: 'Market Crashes', domain: 'economics', path: ['Finance & Economics', 'Financial Markets', 'Why Markets Crash'], description: 'Bubbles, leverage, contagion, and panic feedback loops.' },
  { id: 'behavioral_econ', label: 'Behavioral Econ', domain: 'economics', path: ['Finance & Economics', 'Behavioral Economics'], description: 'How real human behavior bends idealized market models.' },
  { id: 'public_policy', label: 'Public Policy', domain: 'economics', path: ['Finance & Economics', 'Public Finance', 'Policy'], description: 'Taxes, incentives, and tradeoffs in collective decisions.' },
  { id: 'geopolitics_energy', label: 'Energy Geopolitics', domain: 'history', path: ['History', 'Modern History', 'Energy Geopolitics'], description: 'How oil, shipping lanes, and supply shocks shape history.' },
  { id: 'startup_mechanics', label: 'Startup Mechanics', domain: 'cs', path: ['Computer Science', 'Product', 'Startup Mechanics'], description: 'From MVP to product-market fit and growth loops.' },
  { id: 'design_for_attention', label: 'Attention Design', domain: 'art', path: ['Art & Design', 'Attention Design'], description: 'Why interfaces attract, hold, and redirect human attention.' },
  { id: 'ai_and_labor', label: 'AI & Jobs', domain: 'economics', path: ['Finance & Economics', 'Labor Economics', 'AI & Labor'], description: 'Automation, augmentation, and shifting labor markets.' },
  { id: 'science_of_sleep', label: 'Science of Sleep', domain: 'science', path: ['Science', 'Neuroscience', 'Sleep'], description: 'How sleep drives memory consolidation and learning outcomes.' },
  { id: 'power_and_ethics', label: 'Power & Ethics', domain: 'philosophy', path: ['Philosophy', 'Political Philosophy', 'Power & Ethics'], description: 'Moral tradeoffs in institutions, leadership, and systems.' },
  { id: 'history_of_money', label: 'History of Money', domain: 'history', path: ['History', 'Economic History', 'Money'], description: 'From shells and coins to fiat, credit, and digital ledgers.' },
];

export default function Explore({
  initialSearch = null,
  onboardingIntent = null,
  pendingDeepDive = null,
  onConsumePendingDeepDive,
  pendingGlobalSearch = null,
  onConsumePendingGlobalSearch,
  onSpark,
  streakState,
  theme = 'light',
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
  const [discoveryDirection, setDiscoveryDirection] = useState('similar');
  const [freefallMode, setFreefallMode] = useState(onboardingIntent === 'explore');
  const [forceDiscovery, setForceDiscovery] = useState(false);
  const [showMoreExplore, setShowMoreExplore] = useState(false);

  const userContextObj = useMemo(() => buildUserContext(user), [user]);
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
    if (!pendingGlobalSearch) return;
    handleQueryChange(pendingGlobalSearch);
    runSearch(pendingGlobalSearch);
    onConsumePendingGlobalSearch?.();
  }, [pendingGlobalSearch]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setForceDiscovery(false);
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
    if (roots.length === 0 && user.onboardingComplete && !restoredRootsRef.current && onboardingIntent !== 'explore') {
      restoredRootsRef.current = true;
      const topDomains = getTopDomains(user.eloScores, 3);
      if (topDomains.length > 0) {
        initRoots(topDomains);
      }
    }
  }, [initRoots, roots.length, user.eloScores, user.onboardingComplete, onboardingIntent]);

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
    if (forceDiscovery) return 'discovery';
    if (phase === 'discovery' && roots.length > 0) return 'tree';
    return phase;
  }, [phase, roots.length, forceDiscovery]);

  const streak = streakState?.streak ?? 1;
  const sparksToday = streakState?.sparksToday ?? 0;
  const dailyGoal = streakState?.dailyGoal ?? 3;

  const dailyPrompts = useMemo(() => {
    if (onboardingIntent === 'major') {
      return [
        'you are in a lab at 11pm rerunning an experiment',
        'you just found the bug crashing an app for 10,000 users',
        'you are writing a policy memo on why a system failed',
      ];
    }
    if (discoveryDirection === 'different') {
      const daySeed = new Date().toISOString().slice(0, 10);
      const variedDomains = seededDomainSlice(DOMAINS, daySeed, 3);
      return variedDomains.map((domain) => `surprising ideas in ${DOMAIN_LABELS[domain] || domain}`);
    }
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
  }, [discoveryDirection, onboardingIntent, roots, topDomains, userContextObj]);

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

  if (freefallMode) {
    return (
      <FreeFall
        onExit={() => {
          setFreefallMode(false);
          if (roots.length === 0) setPhase('discovery');
        }}
        onDig={(node) => {
          setFreefallMode(false);
          handleGoDeeper(node);
        }}
        theme={theme}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className="sticky top-0 z-10 px-4 pb-2.5 pt-4 backdrop-blur-2xl"
        style={{
          background: theme === 'dark' ? 'rgba(20,18,28,0.82)' : 'rgba(255,252,245,0.90)',
          borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,200,140,0.18)',
          boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.28)' : '0 4px 20px rgba(72,49,10,0.06)',
        }}
      >
        <div className="mx-auto max-w-[760px]">
          <SearchBar
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleSearchSubmit}
            suggestions={suggestions}
            placeholder={isKids ? 'Ask Ember anything!' : 'Search anything curious...'}
          />
          <div className="mt-2.5 flex items-center gap-1.5">
            <div
              className="flex items-center gap-1 rounded-full p-1"
              style={{ background: 'rgba(42,42,42,0.06)' }}
            >
              {[
                ['similar', 'Similar paths'],
                ['different', 'Surprise me'],
              ].map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setDiscoveryDirection(val)}
                  className="px-3 py-1.5 rounded-full text-xs font-body font-semibold transition-all"
                  style={discoveryDirection === val
                    ? {
                        background: 'linear-gradient(135deg, #FF8A5A, #FF6B35)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(255,107,53,0.30)',
                      }
                    : { color: 'var(--text-muted)' }
                  }
                >
                  {lbl}
                </button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFreefallMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg, #130700, #1E0C00)',
                color: '#FFD166',
                border: '1px solid rgba(255,166,43,0.30)',
                boxShadow: '0 4px 14px rgba(255,107,53,0.20)',
              }}
            >
              ✦ Freefall
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <AnimatePresence>
          {(searchExplainer || searchLoading) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-[760px] pt-3 pb-2"
            >
              {searchLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 py-4"
                >
                  <Ember mood="thinking" size="sm" glowIntensity={0.75} />
                  <div>
                    <motion.p
                      className="font-body text-sm text-text-secondary"
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      Ember is thinking...
                    </motion.p>
                    <p className="font-body text-xs text-text-muted">Crafting an explanation just for you</p>
                  </div>
                </motion.div>
              ) : searchExplainer ? (
                <div className="space-y-3">
                  <ExplainerCard
                    node={searchExplainer.node}
                    userContextObj={userContextObj}
                    knowledgeState={user.knowledgeStates[searchExplainer.node?.id]}
                    onKnowledgeTag={user.setKnowledgeState}
                    onSave={handleSaveNode}
                    onGoDeeper={(node) => handleGoDeeper(node)}
                  />
                  <button
                    onClick={clearSearch}
                    className="font-body text-sm text-text-muted transition-colors hover:text-text-secondary"
                  >
                    ← Back to exploring
                  </button>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

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
                        setForceDiscovery(true);
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
                  majorMode={onboardingIntent === 'major'}
                  majorField={onboardingIntent === 'major' ? initialSearch : null}
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
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="mb-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="mb-0.5 flex items-center gap-2">
                          <motion.span
                            className="text-xl leading-none"
                            animate={{ rotate: [0, -5, 5, -3, 0] }}
                            transition={{ duration: 2.4, delay: 0.5, repeat: Infinity, repeatDelay: 6 }}
                          >
                            🌳
                          </motion.span>
                          <h1 className="font-display text-lg font-semibold text-text-primary">
                            Your Knowledge Tree
                          </h1>
                          <div className="flex items-center gap-1">
                            {roots.slice(0, 5).map((root, i) => {
                              const color = DOMAIN_COLORS[root.domain] || '#FF6B35';
                              return (
                                <motion.div
                                  key={root.id}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                  title={root.label}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <p className="font-body text-xs text-text-muted">
                          <motion.span
                            key={Math.max(user.stats?.nodesExplored || 0, Object.keys(nodes || {}).length)}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {Math.max(user.stats?.nodesExplored || 0, Object.keys(nodes || {}).length)}
                          </motion.span>
                          {' sparks explored · tap any node to go deeper'}
                        </p>
                      </div>
                    </motion.div>

                    <TreeRenderer
                      userContextObj={userContextObj}
                      onExplain={handleExplainNode}
                      onSave={handleSaveNode}
                      drillStack={drillStack}
                      onDrillInto={handleDrillInto}
                      onDrillToDepth={handleDrillToDepth}
                    />

                    {/* Free Exploration */}
                    <div className="mt-6">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-text-muted">Explore freely</p>
                        <p className="text-xs font-body text-text-muted">Jump into any world</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {(showMoreExplore ? DOMAINS : DOMAINS.slice(0, 10)).map((domain, i) => {
                          const color = DOMAIN_COLORS[domain] || '#FF6B35';
                          return (
                            <motion.button
                              key={domain}
                              initial={{ opacity: 0, scale: 0.82, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
                              whileHover={{
                                scale: 1.09,
                                y: -5,
                                boxShadow: `0 12px 28px ${color}38`,
                                borderColor: `${color}55`,
                              }}
                              whileTap={{ scale: 0.93 }}
                              onClick={() => {
                                setDeepDiveNode({
                                  id: domain,
                                  label: DOMAIN_LABELS[domain],
                                  domain,
                                  path: [DOMAIN_LABELS[domain]],
                                  description: `Explore ${DOMAIN_LABELS[domain]} freely`,
                                });
                              }}
                              className="flex flex-col items-center gap-1.5 rounded-[18px] p-3 transition-all duration-200"
                              style={{
                                background: `linear-gradient(145deg, ${color}10, ${color}06)`,
                                border: `1px solid ${color}25`,
                                boxShadow: `0 4px 12px ${color}12`,
                              }}
                            >
                              <motion.span
                                className="text-2xl leading-none"
                                animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
                                transition={{ duration: 3 + i * 0.4, repeat: Infinity, repeatDelay: 4 + i * 0.5 }}
                              >
                                {DOMAIN_EMOJIS[domain]}
                              </motion.span>
                              <span
                                className="text-[11px] font-body font-bold text-center leading-tight"
                                style={{ color }}
                              >
                                {DOMAIN_LABELS[domain].replace(' & Design', '').replace(' & Movement', '')}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex justify-center">
                        <button
                          onClick={() => setShowMoreExplore((v) => !v)}
                          className="rounded-full border border-[rgba(42,42,42,0.1)] bg-[rgba(255,255,255,0.74)] px-4 py-2 text-xs font-body font-semibold text-text-primary transition-colors hover:bg-white"
                        >
                          {showMoreExplore ? 'Show core worlds' : 'Show more worlds + finance'}
                        </button>
                      </div>

                      {showMoreExplore && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                        >
                          {EXPLORE_SPOTLIGHT_TOPICS.map((topic, idx) => {
                            const color = DOMAIN_COLORS[topic.domain] || '#FF6B35';
                            return (
                              <motion.button
                                key={topic.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => setDeepDiveNode(topic)}
                                className="rounded-[14px] border px-3 py-2 text-left"
                                style={{ borderColor: `${color}36`, background: `${color}0D` }}
                              >
                                <p className="text-xs font-body font-semibold" style={{ color }}>{topic.label}</p>
                                <p className="mt-0.5 line-clamp-2 text-[11px] font-body text-text-secondary">{topic.description}</p>
                              </motion.button>
                            );
                          })}
                        </motion.div>
                      )}
                    </div>

                    <div className="mt-5 flex justify-center">
                      <motion.button
                        onClick={() => {
                          setDeepDiveNode(null);
                          setDrillStack([]);
                          setPhase('discovery');
                          setForceDiscovery(true);
                        }}
                        whileHover={{ scale: 1.05, y: -2, boxShadow: '0 8px 20px rgba(255,107,53,0.18)' }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 rounded-full px-5 py-2.5 font-body text-sm font-semibold transition-all"
                        style={{
                          background: 'rgba(255,107,53,0.08)',
                          border: '1px solid rgba(255,107,53,0.18)',
                          color: 'var(--spark-ember)',
                        }}
                      >
                        ✦ Run discovery again
                      </motion.button>
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
