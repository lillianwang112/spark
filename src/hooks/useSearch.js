import { useState, useCallback, useRef } from 'react';
import { storage } from '../services/storage.js';
import { fuzzySearch } from '../utils/helpers.js';
import { SEED_INDEX } from '../utils/seedData.js';
import { uid } from '../utils/helpers.js';
import TopicGraph from '../services/topicGraph.js';
import { searchEncyclopediaTopics } from '../utils/encyclopedia.js';

// All seed node labels for autocomplete
const ALL_SEED_LABELS = Object.values(SEED_INDEX).map((n) => ({
  id: n.id,
  label: n.label,
  domain: n.domain,
  description: n.description || '',
  path: n.path || [n.label],
}));

// Broad topic pool including freefall topics — enables niche suggestions
const FREEFALL_TOPICS = [
  { id: 'black_holes', label: 'Black Holes', domain: 'science' },
  { id: 'quantum_entanglement', label: 'Quantum Entanglement', domain: 'science' },
  { id: 'infinity', label: 'Infinity', domain: 'math' },
  { id: 'prime_numbers', label: 'Prime Numbers', domain: 'math' },
  { id: 'topology', label: 'Topology', domain: 'math' },
  { id: 'neural_networks', label: 'Neural Networks', domain: 'cs' },
  { id: 'chaos_theory', label: 'Chaos Theory', domain: 'science' },
  { id: 'stoicism', label: 'Stoicism', domain: 'philosophy' },
  { id: 'golden_ratio', label: 'The Golden Ratio', domain: 'art' },
  { id: 'music_harmony', label: 'Why Music Moves Us', domain: 'music' },
  { id: 'fermat_last', label: "Fermat's Last Theorem", domain: 'math' },
  { id: 'sapir_whorf', label: 'Language Shapes Thought', domain: 'humanities' },
  { id: 'emergence', label: 'Emergence', domain: 'science' },
  { id: 'cryptography', label: 'Cryptography', domain: 'cs' },
  { id: 'dark_matter', label: 'Dark Matter', domain: 'science' },
  { id: 'consciousness', label: 'Consciousness', domain: 'philosophy' },
  { id: 'information_theory', label: 'Information Theory', domain: 'cs' },
  { id: 'evolution', label: 'Evolution', domain: 'science' },
  { id: 'category_theory', label: 'Category Theory', domain: 'math' },
  { id: 'epigenetics', label: 'Epigenetics', domain: 'science' },
  { id: 'four_color', label: 'Four Color Theorem', domain: 'math' },
  { id: 'compilers', label: 'How Compilers Work', domain: 'cs' },
  { id: 'markets_crash', label: 'Why Markets Crash', domain: 'economics' },
  { id: 'sleep_science', label: 'Why We Sleep', domain: 'science' },
  { id: 'origami_math', label: 'Origami Mathematics', domain: 'math' },
  { id: 'color_theory', label: 'Color & Perception', domain: 'art' },
  { id: 'dna', label: 'How DNA Works', domain: 'science' },
  { id: 'game_theory', label: 'Game Theory', domain: 'math' },
  { id: 'fermentation', label: 'Fermentation', domain: 'science' },
  { id: 'byzantine', label: 'The Byzantine Problem', domain: 'cs' },
  { id: 'fractals', label: 'Fractal Geometry', domain: 'math' },
  { id: 'antibiotics', label: 'Antibiotic Resistance', domain: 'science' },
];

export function useSearch(userContextObj) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [explainer, setExplainer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory] = useState(() => storage.getSearches().slice(0, 20));
  const lastSearchIdRef = useRef(null);
  const debounceRef = useRef(null);

  // Update suggestions as user types (instant from seed + freefall topics + encyclopedia)
  const handleQueryChange = useCallback((q) => {
    setQuery(q);
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const results = fuzzySearch(q, ALL_SEED_LABELS, (item) => item.label);
      const freefall = fuzzySearch(q, FREEFALL_TOPICS, (item) => item.label);
      const encyclopedia = searchEncyclopediaTopics(q, 12);
      const merged = new Map();
      [...results, ...freefall, ...encyclopedia].forEach((item) => {
        const key = String(item.id || item.label || '').toLowerCase();
        if (!merged.has(key)) merged.set(key, item);
      });
      const top = Array.from(merged.values()).slice(0, 7);
      // Always show a catch-all "Search for X" entry so any topic can be explored
      if (!top.some((s) => s.label.toLowerCase() === q.toLowerCase())) {
        top.push({ id: `__search__${q}`, label: q, domain: 'general', description: `Search for "${q}"`, _isOpenSearch: true });
      }
      setSuggestions(top);
    }, 120);
  }, []);

  // Run a full search: get explainer, log to history
  const runSearch = useCallback(async (term, targetNode = null) => {
    if (!term?.trim()) return;
    const resolvedNode = TopicGraph.resolveTopic(term, targetNode);

    setIsLoading(true);
    setExplainer(null);

    try {
      TopicGraph.rememberSignal(resolvedNode, 'opens');
      const result = await TopicGraph.getExplainer(resolvedNode, userContextObj);
      const searchId = uid();
      lastSearchIdRef.current = searchId;
      setExplainer({
        id: searchId,
        text: result,
        node: resolvedNode,
      });
      TopicGraph.warmTopic(resolvedNode, userContextObj).catch(() => {});

      // Log to search history
      storage.addSearch({
        id: searchId,
        term,
        nodeId: resolvedNode.id || term,
        domain: resolvedNode.domain || 'general',
        timestamp: new Date().toISOString(),
        wentDeeper: false,
        savedForLater: false,
      });
    } catch (err) {
      console.error('[useSearch] error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userContextObj]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setExplainer(null);
    setIsLoading(false);
  }, []);

  return {
    query,
    suggestions,
    explainer,
    isLoading,
    searchHistory,
    handleQueryChange,
    runSearch,
    clearSearch,
    lastSearchIdRef,
  };
}
