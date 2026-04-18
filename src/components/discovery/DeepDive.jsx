import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import DiscoveryCard from './DiscoveryCard.jsx';
import Ember from '../ember/Ember.jsx';
import AIService from '../../ai/ai.service.js';
import { useTree } from '../../hooks/useTree.jsx';
import { getSeedChildren } from '../../utils/seedData.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';

// Map a node-children AI result to the DiscoveryCard card shape
function toCard(child, domain) {
  return {
    text: child.label,
    domain,
    emoji: child.surpriseFactor ? '✨' : '🔍',
    imageQuery: child.label,
    _id: child.id || null,
    _label: child.label,
    _description: child.description || '',
    _difficulty: child.difficulty,
    _surpriseFactor: child.surpriseFactor,
  };
}

// Convert a tree node (from nodes registry) to a card
function treeNodeToCard(node) {
  return {
    text: node.label,
    domain: node.domain,
    emoji: node.surpriseFactor ? '✨' : '🔍',
    imageQuery: node.label,
    _id: node.id,
    _label: node.label,
    _description: node.description || '',
    _difficulty: node.difficulty,
    _surpriseFactor: node.surpriseFactor,
  };
}

// Convert a seed child to a card
function seedToCard(seed, domain) {
  return {
    text: seed.label,
    domain: seed.domain || domain,
    emoji: '🔍',
    imageQuery: seed.label,
    _id: seed.id,
    _label: seed.label,
    _description: seed.description || '',
  };
}

// Depth dots showing how far down the rabbit hole we've gone
function DepthDots({ depth, color }) {
  const count = Math.min(depth + 1, 7);
  return (
    <div className="flex justify-center gap-1.5 py-1" aria-label={`${depth + 1} levels deep`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === count - 1 ? 16 : 6,
            height: 6,
            backgroundColor:
              i === count - 1
                ? color
                : `${color}${i === count - 2 ? '80' : '40'}`,
          }}
        />
      ))}
    </div>
  );
}

export default function DeepDive({ rootNode, userContextObj, onExplain, onSave, onBack }) {
  // path = nodes the user has drilled through (NOT including rootNode)
  const [path, setPath] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pickedCard, setPickedCard] = useState(null);
  const [emberMood, setEmberMood] = useState('curious');
  const cancelRef = useRef(false);

  // Keep a ref to tree nodes so fetchCards doesn't go stale without re-creating
  const { nodes: treeNodes } = useTree();
  const treeNodesRef = useRef(treeNodes);
  useEffect(() => { treeNodesRef.current = treeNodes; }, [treeNodes]);

  // The node whose children are currently shown
  const currentNode = path.length > 0 ? path[path.length - 1] : rootNode;
  const currentColor = DOMAIN_COLORS[currentNode.domain] || '#FF6B35';

  const fetchCards = useCallback(async (node) => {
    setError(false);
    setLoading(true);
    setCards([]);
    cancelRef.current = false;

    // 1. Check tree nodes registry — if already expanded in tree, use instantly
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

    // 2. Check seed data — covers top 3 levels (always instant)
    const seedChildren = getSeedChildren(node.id);
    if (seedChildren && seedChildren.length > 0) {
      const seedCards = seedChildren.map((c) => seedToCard(c, node.domain));
      if (!cancelRef.current) {
        setCards(seedCards);
        setLoading(false);
      }
      return;
    }

    // 3. Call AI as last resort
    // currentPath must match useTree's format (node.path, NOT [...node.path, node.label])
    const params = {
      currentNode: node.label,
      currentPath: node.path || [node.label],
      ageGroup: userContextObj?.ageGroup || 'college',
      topInterests: userContextObj?.topInterests || [],
      personality: userContextObj?.personality || 'spark',
    };

    try {
      const children = await AIService.call('nodeChildren', params);
      if (cancelRef.current) return;

      // Detect and reject the useless generic fallback cards from AIService
      const isFallback = children?.length > 0 && children[0]?.id === 'fallback_1';

      if (!isFallback && children && Array.isArray(children) && children.length > 0) {
        setCards(children.map((c) => toCard(c, node.domain)));
      } else {
        setError(true);
      }
    } catch {
      if (!cancelRef.current) setError(true);
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, [userContextObj]);

  // Load children of rootNode on mount
  useEffect(() => {
    cancelRef.current = false;
    fetchCards(rootNode);
    return () => { cancelRef.current = true; };
  }, [rootNode.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePick = useCallback((card) => {
    if (pickedCard) return;
    setPickedCard(card);
    setEmberMood('excited');

    const nextNode = {
      // Use real ID from seed/tree when available, otherwise derive from parent + label
      id: card._id || `${currentNode.id || currentNode.label}_${card._label}`.replace(/\W+/g, '_').toLowerCase(),
      label: card._label,
      description: card._description,
      domain: card.domain,
      path: [...(currentNode.path || []), currentNode.label],
      parentId: currentNode.id || null,
    };

    setTimeout(() => {
      if (cancelRef.current) return;
      setPickedCard(null);
      setEmberMood('curious');
      setPath((prev) => [...prev, nextNode]);
      fetchCards(nextNode);
    }, 650);
  }, [pickedCard, currentNode, fetchCards]);

  const handleBack = useCallback(() => {
    if (path.length === 0) {
      onBack();
      return;
    }
    const prevPath = path.slice(0, -1);
    const prevNode = prevPath.length > 0 ? prevPath[prevPath.length - 1] : rootNode;
    setPath(prevPath);
    fetchCards(prevNode);
  }, [path, rootNode, onBack, fetchCards]);

  useEffect(() => () => { cancelRef.current = true; }, []);

  const isKids = userContextObj?.ageGroup === 'little_explorer';

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header: back + breadcrumb */}
      <div className="flex items-start gap-2 min-h-[32px]">
        <button
          onClick={handleBack}
          className="flex-shrink-0 text-sm text-text-muted hover:text-text-secondary font-body transition-colors min-h-[32px] px-1 flex items-center"
          aria-label="Go back"
        >
          ←
        </button>
        <div className="flex-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 pt-1">
          <span
            className="text-xs font-body font-medium"
            style={{ color: currentColor }}
          >
            {rootNode.label}
          </span>
          {path.map((node) => (
            <span key={node.id} className="flex items-center gap-1">
              <span className="text-text-muted text-xs" aria-hidden="true">›</span>
              <span className="text-xs text-text-primary font-body font-semibold">{node.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Ember + prompt */}
      <div className="flex flex-col items-center gap-2">
        <Ember mood={emberMood} size="sm" glowIntensity={0.4} />
        <AnimatePresence mode="wait">
          <motion.p
            key={currentNode.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`text-center font-body text-text-secondary ${isKids ? 'text-base font-body-kids' : 'text-sm'}`}
          >
            {path.length === 0
              ? <>Which part of <strong className="text-text-primary">{rootNode.label}</strong> pulls you?</>
              : <>Which direction in <strong className="text-text-primary">{currentNode.label}</strong>?</>}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Ember mood="thinking" size="xs" glowIntensity={0.5} />
          <span className="text-sm text-text-muted font-body">Finding the next rabbit holes...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-8">
          <Ember mood="sheepish" size="sm" glowIntensity={0.3} />
          <p className="text-sm text-text-muted font-body mt-3 mb-4">
            Ember had trouble loading this path
          </p>
          <button
            onClick={() => fetchCards(currentNode)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[36px]"
            style={{ background: `${currentColor}15`, color: currentColor }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Card grid */}
      {!loading && !error && cards.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNode.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {cards.map((card, i) => (
              <div key={`${currentNode.label}-${i}`} className="relative">
                <DiscoveryCard
                  card={card}
                  index={i}
                  onPick={handlePick}
                  disabled={!!pickedCard}
                  isKids={isKids}
                />
                {/* Picked overlay */}
                {pickedCard?.text === card.text && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-card flex items-center justify-center"
                    style={{ background: `${DOMAIN_COLORS[card.domain] || '#FF6B35'}28` }}
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="text-3xl"
                    >
                      ✓
                    </motion.span>
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty state */}
      {!loading && !error && cards.length === 0 && (
        <div className="text-center py-8 text-text-muted font-body text-sm">
          <span className="text-2xl block mb-2">🔭</span>
          You've reached the edge of the map — this territory is still being charted
        </div>
      )}

      {/* Depth indicator */}
      {path.length > 0 && !loading && (
        <DepthDots depth={path.length} color={currentColor} />
      )}

      {/* Explain + Save for the current node (if deep enough) */}
      {path.length > 0 && !loading && (
        <div className="flex justify-center gap-2 pb-2">
          <button
            onClick={() => onExplain(currentNode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px]"
            style={{ background: `${currentColor}15`, color: currentColor }}
          >
            ✨ Explain {currentNode.label}
          </button>
          {!currentNode.saved && (
            <button
              onClick={() => onSave(currentNode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(42,42,42,0.06)] text-text-muted text-xs font-medium hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[32px]"
            >
              📌 Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}
