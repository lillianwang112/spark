import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import DiscoveryCard from './DiscoveryCard.jsx';
import Ember from '../ember/Ember.jsx';
import MathText from '../common/MathText.jsx';
import KeyTakeaways from '../explainer/KeyTakeaways.jsx';
import ResearchFrontier from './ResearchFrontier.jsx';
import { useTree } from '../../hooks/useTree.jsx';
import { getSeedChildren } from '../../utils/seedData.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import TopicGraph from '../../services/topicGraph.js';
import AIService from '../../ai/ai.service.js';
import { BRANCH_TYPE_STYLES } from '../../utils/constants.js';

function toCard(child, domain) {
  return {
    text: child.label,
    domain,
    emoji: child.surpriseFactor ? '✨' : '🔍',
    imageQuery: child.label,
    _id: child.id || null,
    _label: child.label,
    _description: child.description || child.description_one_sentence || child.summary || '',
    _kind: child.kind || 'connection',
    _difficulty: child.difficulty,
    _surpriseFactor: child.surpriseFactor,
  };
}

function treeNodeToCard(node) {
  return {
    text: node.label,
    domain: node.domain,
    emoji: node.surpriseFactor ? '✨' : '🔍',
    imageQuery: node.label,
    _id: node.id,
    _label: node.label,
    _description: node.description || '',
    _kind: node.kind || 'connection',
    _difficulty: node.difficulty,
    _surpriseFactor: node.surpriseFactor,
  };
}

function seedToCard(seed, domain) {
  return {
    text: seed.label,
    domain: seed.domain || domain,
    emoji: '🔍',
    imageQuery: seed.label,
    _id: seed.id,
    _label: seed.label,
    _description: seed.description || '',
    _kind: seed.kind || 'foundation',
  };
}

function DepthDots({ depth, color }) {
  const count = Math.min(depth + 1, 9);
  return (
    <div className="flex justify-center items-center gap-1.5 py-0.5" aria-label={`${depth + 1} levels deep`}>
      {Array.from({ length: count }).map((_, i) => {
        const isLast = i === count - 1;
        const isPrev = i === count - 2;
        return (
          <motion.div
            key={i}
            initial={isLast ? { scale: 0, opacity: 0 } : false}
            animate={isLast ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: 'spring', stiffness: 420, damping: 20 }}
            className="rounded-full flex-shrink-0"
            style={{
              width: isLast ? 18 : 6,
              height: 6,
              backgroundColor: isLast
                ? color
                : `${color}${isPrev ? '70' : i === count - 3 ? '45' : '28'}`,
              boxShadow: isLast ? `0 0 10px ${color}90` : 'none',
            }}
          />
        );
      })}
      {depth >= 2 && (
        <span className="text-[10px] font-mono ml-0.5 flex-shrink-0" style={{ color: `${color}80` }}>
          {depth + 1}×
        </span>
      )}
    </div>
  );
}

const CHAT_DEPTH_THRESHOLD = 7; // Beyond this depth, pivot to chat instead of more cards

// Inline chat panel — activates when user goes too deep for meaningful card exploration
function EmberChat({ node, userContextObj }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const color = DOMAIN_COLORS[node?.domain] || '#FF6B35';
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const systemPrompt = `You are Ember, a brilliant and enthusiastic learning companion. The user has been exploring "${node?.label}" (in the domain of ${node?.domain || 'knowledge'}) by going very deep into rabbit holes. They've gone ${CHAT_DEPTH_THRESHOLD}+ levels deep. Now guide them further through conversation — answer questions, suggest fascinating tangents, challenge assumptions, and open new doors. Be specific, concrete, and intellectually exciting. Keep responses to 3-4 sentences unless they ask for more.`;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await AIService.chat([...messages, userMsg], systemPrompt);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "I hit a snag — try asking again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] overflow-hidden"
      style={{ border: `1.5px solid ${color}28`, background: `${color}08` }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: `${color}12` }}>
        <Ember mood="curious" size="xs" glowIntensity={0.7} />
        <div>
          <p className="font-body text-xs font-semibold text-text-primary">Chat with Ember</p>
          <p className="font-mono text-[10px] text-text-muted">You've gone deep — let's explore together</p>
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex gap-2">
            <span className="text-base flex-shrink-0">✦</span>
            <p className="font-body text-sm text-text-secondary leading-relaxed">
              You've gone <span className="font-semibold" style={{ color }}>{CHAT_DEPTH_THRESHOLD}+ levels deep</span> into <strong>{node?.label}</strong>.
              The cards stop here — but the conversation doesn't. What do you want to understand next?
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <span className="text-base flex-shrink-0 self-start">✦</span>}
            <div
              className={`rounded-[14px] px-3 py-2 font-body text-sm leading-relaxed max-w-[85%] ${
                m.role === 'user'
                  ? 'text-white'
                  : 'text-text-primary bg-[rgba(255,255,255,0.7)]'
              }`}
              style={m.role === 'user' ? { background: color } : {}}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <span className="text-base">✦</span>
            <div className="rounded-[14px] px-3 py-2 bg-[rgba(255,255,255,0.7)]">
              <motion.div className="flex gap-1" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                {[0,1,2].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />)}
              </motion.div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={`Ask anything about ${node?.label}…`}
          className="flex-1 rounded-[14px] px-3 py-2.5 text-sm font-body bg-[rgba(255,255,255,0.8)] border border-[rgba(42,42,42,0.1)] text-text-primary placeholder-text-muted outline-none focus:border-opacity-60"
          style={{ '--tw-border-opacity': 1 }}
        />
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="px-3 py-2.5 rounded-[14px] text-white text-sm font-semibold disabled:opacity-40"
          style={{ background: color }}
        >
          →
        </motion.button>
      </div>
    </motion.div>
  );
}

function formatExplainerText(text) {
  if (!text) return { lead: '', body: [], teaser: '' };
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 3) {
    return { lead: paragraphs[0], body: paragraphs.slice(1, -1), teaser: paragraphs[paragraphs.length - 1] };
  }
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((p) => p.trim()).filter(Boolean) || [text];
  return {
    lead: sentences[0] || text,
    body: sentences.slice(1, -1).length ? [sentences.slice(1, -1).join(' ')] : [],
    teaser: sentences.length > 1 ? sentences[sentences.length - 1] : '',
  };
}

// Inline rabbit-hole explainer — lean, focused, no videos/images/quiz (those are in Full view)
function RabbitHoleExplainer({ node, userContextObj, onGoDeeper, onSave, onFullView, onBack, onFrontier, pathLength }) {
  const [text, setText] = useState(null);
  const [explLoading, setExplLoading] = useState(true);
  const [takeaways, setTakeaways] = useState(null);
  const [savedLocal, setSavedLocal] = useState(false);

  const color = DOMAIN_COLORS[node?.domain] || '#FF6B35';
  const ageGroup = userContextObj?.ageGroup || 'college';
  const topInterests = userContextObj?.topInterests || [];
  const isDeep = pathLength >= 4;
  const isChatDepth = pathLength >= CHAT_DEPTH_THRESHOLD;
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!node) return;
    let cancelled = false;
    setText(null);
    setExplLoading(true);
    setTakeaways(null);
    setSavedLocal(false);

    Promise.allSettled([
      TopicGraph.getExplainer(node, userContextObj),
      AIService.call('keyTakeaways', {
        currentNode: node.label,
        currentPath: node.path || [node.label],
        ageGroup,
        topInterests,
      }),
    ]).then(([explResult, twResult]) => {
      if (cancelled) return;
      setText(
        explResult.status === 'fulfilled' && explResult.value
          ? explResult.value
          : `${node.label} is a fascinating concept waiting to be fully explored.`
      );
      setExplLoading(false);
      if (twResult.status === 'fulfilled' && Array.isArray(twResult.value) && twResult.value.length) {
        setTakeaways(twResult.value);
      }
    });

    // Pre-warm children while user is reading — by the time they click "Go deeper →",
    // cards may already be cached
    TopicGraph.warmTopic(node, userContextObj).catch(() => {});

    return () => { cancelled = true; };
  }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocks = formatExplainerText(text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      {/* Explanation card */}
      <div
        className="relative overflow-hidden rounded-[22px] px-5 pt-5 pb-5"
        style={{
          background: `linear-gradient(135deg, ${color}12 0%, ${color}06 55%, transparent 100%)`,
          border: `1px solid ${color}22`,
        }}
      >
        <div
          className="pointer-events-none absolute top-0 right-0 w-32 h-32"
          style={{ background: `radial-gradient(circle at 85% 15%, ${color}1C, transparent 65%)` }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] mb-1.5" style={{ color: `${color}AA` }}>
                {node.domain || 'Topic'}
              </p>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight text-text-primary">
                {node.label}
              </h2>
            </div>
            <Ember
              mood={explLoading ? 'thinking' : isDeep ? 'celebrating' : 'proud'}
              size="sm"
              glowIntensity={explLoading ? 0.9 : 0.55}
            />
          </div>

          {explLoading ? (
            <div className="space-y-2.5 mt-2">
              {[100, 82, 94].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-3.5 rounded-full"
                  style={{ width: `${w}%`, background: `${color}14` }}
                  animate={{ opacity: [0.35, 0.65, 0.35] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.22 }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {blocks.lead && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.36, delay: 0.08 }}
                  className="font-display text-[1.1rem] leading-snug text-text-primary"
                >
                  <MathText text={blocks.lead} />
                </motion.div>
              )}
              {blocks.body.map((para, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.18 + i * 0.09 }}
                  className="font-body text-[14.5px] leading-relaxed text-text-primary"
                >
                  <MathText text={para} />
                </motion.div>
              ))}
              {blocks.teaser && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.33 }}
                  className="relative overflow-hidden rounded-[14px] px-3.5 py-3"
                  style={{ background: `${color}0E`, borderLeft: `3px solid ${color}55` }}
                >
                  <motion.div
                    className="pointer-events-none absolute inset-0"
                    animate={{ x: ['-100%', '220%'] }}
                    transition={{ duration: 2.8, delay: 1.2, repeat: Infinity, repeatDelay: 9 }}
                    style={{ background: `linear-gradient(90deg, transparent, ${color}14, transparent)` }}
                    aria-hidden="true"
                  />
                  <p className="mb-0.5 text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: `${color}70` }}>
                    Next doorway ›
                  </p>
                  <MathText
                    text={blocks.teaser}
                    as="p"
                    className="font-body text-[13px] leading-relaxed text-text-primary"
                  />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Key ideas */}
      <AnimatePresence>
        {takeaways && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-[0.18em] mb-2.5"
              style={{ color: `${color}80` }}
            >
              ✦ Key Ideas
            </p>
            <KeyTakeaways takeaways={takeaways} color={color} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deep rabbit hole badge */}
      {isDeep && (
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 rounded-full px-4 py-2 w-fit"
          style={{ background: `${color}12`, border: `1px solid ${color}24` }}
        >
          <span className="text-sm">🕳️</span>
          <p className="text-[11px] font-mono font-semibold" style={{ color }}>
            {pathLength + 1} levels deep — serious rabbit hole
          </p>
        </motion.div>
      )}

      {/* Primary CTA: Go deeper / Chat with Ember at depth */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        className="space-y-3"
      >
        {isChatDepth ? (
          <motion.button
            onClick={() => setShowChat((s) => !s)}
            whileHover={{ scale: 1.02, y: -3, boxShadow: `0 22px 52px ${color}3A` }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-[18px] py-4 font-display text-[1.05rem] font-semibold text-white tracking-wide"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
              boxShadow: `0 10px 30px ${color}28`,
            }}
          >
            {showChat ? '✦ Hide chat' : '💬 Chat with Ember →'}
          </motion.button>
        ) : (
          <motion.button
            onClick={() => onGoDeeper(node)}
            whileHover={{ scale: 1.02, y: -3, boxShadow: `0 22px 52px ${color}3A` }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-[18px] py-4 font-display text-[1.05rem] font-semibold text-white tracking-wide"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
              boxShadow: `0 10px 30px ${color}28`,
            }}
          >
            {isDeep ? '🕳️' : '🌀'} Go deeper →
          </motion.button>
        )}

        <AnimatePresence>
          {isChatDepth && showChat && (
            <EmberChat node={node} userContextObj={userContextObj} />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Secondary actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.52 }}
        className="flex flex-wrap gap-2"
      >
        <button
          onClick={() => { if (!savedLocal) { onSave(node); setSavedLocal(true); } }}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all min-h-[36px]"
          style={
            savedLocal
              ? { background: `${color}16`, color }
              : { background: 'rgba(42,42,42,0.06)', color: 'var(--color-text-secondary,#6B6B6B)' }
          }
        >
          {savedLocal ? '✓ Saved' : '📌 Save'}
        </button>
        <button
          onClick={() => onFullView(node)}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-[rgba(42,42,42,0.06)] text-text-secondary hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[36px]"
        >
          ⊕ Full view
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-[rgba(42,42,42,0.06)] text-text-secondary hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[36px]"
        >
          ← Back
        </button>
      </motion.div>

      {/* Research Frontier — only for college/adult users at depth >= 4 */}
      {(userContextObj?.ageGroup === 'college' || userContextObj?.ageGroup === 'adult') && pathLength >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-2"
        >
          <button
            onClick={() => onFrontier?.(node)}
            className="w-full flex items-center justify-between rounded-[16px] px-4 py-3 text-left transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(10,10,20,0.92) 0%, rgba(15,15,30,0.88) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white',
            }}
          >
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.16em] mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Deep enough to go here
              </p>
              <p className="font-display text-sm font-semibold">🔬 Research Frontier</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                See landmark papers, open questions & how to contribute
              </p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Main DeepDive — seamless rabbit hole: picking cards ↔ inline explainer, path grows continuously
export default function DeepDive({ rootNode, userContextObj, onExplain, onSave, onBack }) {
  // path = nodes drilled through (not including rootNode)
  const [path, setPath] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // mode: 'picking' shows 2×2 card grid; 'explaining' shows inline explainer
  const [mode, setMode] = useState('picking');
  const [explainNode, setExplainNode] = useState(null);
  const [emberMood, setEmberMood] = useState('curious');
  const [frontierNode, setFrontierNode] = useState(null);
  const cancelRef = useRef(false);

  const { nodes: treeNodes } = useTree();
  const treeNodesRef = useRef(treeNodes);
  useEffect(() => { treeNodesRef.current = treeNodes; }, [treeNodes]);

  const currentPickNode = path.length > 0 ? path[path.length - 1] : rootNode;
  const currentColor = DOMAIN_COLORS[(mode === 'explaining' ? explainNode?.domain : currentPickNode?.domain) || 'math'] || '#FF6B35';
  const currentPredictedKinds = Array.from(new Set(cards.map((c) => c._kind).filter(Boolean))).slice(0, 3);

  // Full breadcrumb: rootNode + drilled-through nodes + (current explainNode when explaining)
  const breadcrumbNodes = [
    rootNode,
    ...path,
    ...(mode === 'explaining' && explainNode ? [explainNode] : []),
  ];
  const fullDepth = path.length + (mode === 'explaining' ? 1 : 0);

  const fetchCards = useCallback(async (node) => {
    setError(false);
    setLoading(true);
    setCards([]);
    cancelRef.current = false;

    // Layer 1: tree registry (already expanded)
    const treeNode = treeNodesRef.current[node.id];
    if (treeNode?.childrenLoaded && treeNode.children?.length > 0) {
      const childCards = treeNode.children
        .map((id) => treeNodesRef.current[id])
        .filter(Boolean)
        .map(treeNodeToCard);
      if (!cancelRef.current && childCards.length > 0) {
        setCards(childCards);
        setLoading(false);
        return;
      }
    }

    // Layer 2: seed data (covers top 3 levels, always instant)
    const seedChildren = getSeedChildren(node.id);
    if (seedChildren && seedChildren.length > 0) {
      if (!cancelRef.current) {
        setCards(seedChildren.map((c) => seedToCard(c, node.domain)));
        setLoading(false);
      }
      TopicGraph.warmTopic(node, userContextObj).catch(() => {});
      return;
    }

    // Layer 3: AI generation
    try {
      const children = await TopicGraph.getChildren(node, userContextObj);
      if (cancelRef.current) return;
      if (children && Array.isArray(children) && children.length > 0) {
        setCards(children.map((c) => toCard(c, node.domain)));
        TopicGraph.warmTopic(node, userContextObj).catch(() => {});
      } else {
        setError(true);
      }
    } catch {
      if (!cancelRef.current) setError(true);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [userContextObj]);

  useEffect(() => {
    cancelRef.current = false;
    fetchCards(rootNode);
    return () => { cancelRef.current = true; };
  }, [rootNode.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { cancelRef.current = true; }, []);

  // Pick a card → switch to inline explainer (no modal)
  const handlePick = useCallback((card) => {
    if (mode === 'explaining') return;
    const nextNode = {
      id: card._id || `${currentPickNode.id || currentPickNode.label}_${card._label}`.replace(/\W+/g, '_').toLowerCase(),
      label: card._label,
      description: card._description,
      kind: card._kind || 'connection',
      domain: card.domain,
      path: [...(currentPickNode.path || [currentPickNode.label]), currentPickNode.label],
      parentId: currentPickNode.id || null,
    };
    setExplainNode(nextNode);
    setMode('explaining');
    setEmberMood('excited');
    TopicGraph.rememberSignal(nextNode, 'opens');
  }, [mode, currentPickNode]);

  // "Go deeper →" inside the inline explainer → advance path, fetch next cards
  const handleGoDeeper = useCallback((node) => {
    setPath((prev) => [...prev, node]);
    setMode('picking');
    setExplainNode(null);
    setEmberMood('curious');
    TopicGraph.rememberSignal(node, 'deepens');
    fetchCards(node);
  }, [fetchCards]);

  const handleBackFromExplain = useCallback(() => {
    setMode('picking');
    setExplainNode(null);
    setEmberMood('curious');
  }, []);

  const handleBack = useCallback(() => {
    if (mode === 'explaining') { handleBackFromExplain(); return; }
    if (path.length === 0) { onBack(); return; }
    const newPath = path.slice(0, -1);
    const prevNode = newPath.length > 0 ? newPath[newPath.length - 1] : rootNode;
    setPath(newPath);
    setEmberMood('curious');
    fetchCards(prevNode);
  }, [mode, path, rootNode, onBack, fetchCards, handleBackFromExplain]);

  const isKids = userContextObj?.ageGroup === 'little_explorer';

  // Research Frontier overlay — takes over the full view when active
  if (frontierNode) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="frontier"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ResearchFrontier
            node={frontierNode}
            userContextObj={userContextObj}
            onBack={() => setFrontierNode(null)}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Breadcrumb bar — grows with path */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[20px] px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${currentColor}12 0%, ${currentColor}06 60%, transparent 100%)`,
          border: `1px solid ${currentColor}1A`,
        }}
      >
        <div
          className="pointer-events-none absolute top-0 right-0 w-20 h-20"
          style={{ background: `radial-gradient(circle at 85% 15%, ${currentColor}18, transparent 65%)` }}
          aria-hidden="true"
        />
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleBack}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.88 }}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            style={{ background: `${currentColor}12` }}
            aria-label="Go back"
          >
            ←
          </motion.button>
          <div className="flex-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 overflow-hidden">
            {breadcrumbNodes.map((node, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && (
                  <span className="text-text-muted text-xs flex-shrink-0" aria-hidden="true">›</span>
                )}
                <span
                  className={`text-xs font-body font-semibold truncate max-w-[88px] ${
                    i === breadcrumbNodes.length - 1 ? 'text-text-primary' : 'text-text-muted'
                  }`}
                  style={i === 0 ? { color: currentColor } : {}}
                >
                  {node.label}
                </span>
              </span>
            ))}
          </div>
          <DepthDots depth={fullDepth} color={currentColor} />
        </div>
      </motion.div>

      {/* Main content: explaining or picking */}
      <AnimatePresence mode="wait">
        {mode === 'explaining' && explainNode ? (
          <motion.div
            key="explaining"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <RabbitHoleExplainer
              node={explainNode}
              userContextObj={userContextObj}
              onGoDeeper={handleGoDeeper}
              onSave={onSave}
              onFullView={onExplain}
              onBack={handleBackFromExplain}
              onFrontier={(n) => setFrontierNode(n)}
              pathLength={path.length}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`picking-${path.length}`}
            initial={{ opacity: 0, x: path.length > 0 ? 18 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex flex-col gap-4"
          >
            {/* Ember + prompt */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <Ember mood={emberMood} size="sm" glowIntensity={loading ? 0.7 : 0.45} />
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPickNode.label}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.22 }}
                  className={`text-center font-body text-text-secondary ${isKids ? 'text-base' : 'text-sm'}`}
                >
                  {path.length === 0
                    ? <>Which part of <strong className="text-text-primary">{rootNode.label}</strong> pulls you?</>
                    : <>Which direction in <strong className="text-text-primary">{currentPickNode.label}</strong>?</>}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Branch type badges */}
            {!loading && currentPredictedKinds.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="flex flex-wrap justify-center gap-1.5"
              >
                {currentPredictedKinds.map((kind, i) => {
                  const style = BRANCH_TYPE_STYLES[kind] || BRANCH_TYPE_STYLES.connection;
                  return (
                    <motion.span
                      key={kind}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-full bg-[rgba(255,255,255,0.8)] px-3 py-1 text-[11px] font-body font-semibold text-text-secondary shadow-[0_4px_12px_rgba(72,49,10,0.06)]"
                      style={{ border: `1px solid ${currentColor}16` }}
                    >
                      {style.emoji} {style.shortLabel}
                    </motion.span>
                  );
                })}
              </motion.div>
            )}

            {/* Loading */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-10"
              >
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: currentColor }}
                      animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.88, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
                <motion.p
                  className="text-sm text-text-muted font-body"
                  animate={{ opacity: [1, 0.55, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Finding the next rabbit holes…
                </motion.p>
              </motion.div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="text-center py-8">
                <Ember mood="sheepish" size="sm" glowIntensity={0.3} />
                <p className="text-sm text-text-muted font-body mt-3 mb-4">
                  Ember had trouble finding this path
                </p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fetchCards(currentPickNode)}
                  className="px-4 py-2 rounded-full text-sm font-medium min-h-[36px]"
                  style={{ background: `${currentColor}15`, color: currentColor }}
                >
                  Try again
                </motion.button>
              </div>
            )}

            {/* 2×2 card grid */}
            {!loading && !error && cards.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPickNode.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {cards.map((card, i) => (
                    <DiscoveryCard
                      key={`${currentPickNode.label}-${i}`}
                      card={card}
                      index={i}
                      onPick={handlePick}
                      isKids={isKids}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Empty */}
            {!loading && !error && cards.length === 0 && (
              <div className="text-center py-8 text-text-muted font-body text-sm">
                <span className="text-2xl block mb-2">🔭</span>
                You've reached the edge of the map — this territory is still being charted
              </div>
            )}

            {/* About current node + Save (when deep enough) */}
            {path.length > 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center gap-2 pb-1"
              >
                <button
                  onClick={() => onExplain(currentPickNode)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium bg-[rgba(42,42,42,0.06)] text-text-secondary hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[32px]"
                >
                  📖 About {currentPickNode.label}
                </button>
                {!currentPickNode.saved && (
                  <button
                    onClick={() => onSave(currentPickNode)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium bg-[rgba(42,42,42,0.06)] text-text-secondary hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[32px]"
                  >
                    📌 Save
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
