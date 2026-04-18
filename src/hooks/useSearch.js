import { useState, useCallback, useRef } from 'react';
import AIService from '../ai/ai.service.js';
import { storage } from '../services/storage.js';
import { fuzzySearch } from '../utils/helpers.js';
import { SEED_INDEX } from '../utils/seedData.js';
import { uid } from '../utils/helpers.js';

// All seed node labels for autocomplete
const ALL_SEED_LABELS = Object.values(SEED_INDEX).map((n) => ({
  id: n.id,
  label: n.label,
  domain: n.domain,
  description: n.description || '',
  path: n.path || [n.label],
}));

function resolveSearchNode(term, targetNode) {
  if (targetNode) return targetNode;

  const normalized = term.trim().toLowerCase();
  const exact = ALL_SEED_LABELS.find((item) => item.label.toLowerCase() === normalized);
  if (exact) return exact;

  const [bestMatch] = fuzzySearch(term, ALL_SEED_LABELS, (item) => item.label);
  if (bestMatch?.label?.toLowerCase().includes(normalized) || normalized.includes(bestMatch?.label?.toLowerCase?.() || '')) {
    return bestMatch;
  }

  return {
    id: term,
    label: term,
    domain: 'general',
    description: '',
    path: [term],
  };
}

export function useSearch(userContextObj) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [explainer, setExplainer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory] = useState(() => storage.getSearches().slice(0, 20));
  const lastSearchIdRef = useRef(null);
  const debounceRef = useRef(null);

  // Update suggestions as user types (instant from seed)
  const handleQueryChange = useCallback((q) => {
    setQuery(q);
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const results = fuzzySearch(q, ALL_SEED_LABELS, (item) => item.label);
      setSuggestions(results.slice(0, 8));
    }, 120);
  }, []);

  // Run a full search: get explainer, log to history
  const runSearch = useCallback(async (term, targetNode = null) => {
    if (!term?.trim()) return;
    const resolvedNode = resolveSearchNode(term, targetNode);
    const label = resolvedNode.label || term;

    setIsLoading(true);
    setExplainer(null);

    try {
      const params = {
        currentNode: label,
        currentPath: resolvedNode.path || [label],
        ageGroup:    userContextObj?.ageGroup || 'college',
        name:        userContextObj?.name || 'Explorer',
        knowledgeState: null,
        topInterests: userContextObj?.topInterests || [],
        explorationStyle: userContextObj?.explorationStyle || 'balanced',
        personality: userContextObj?.personality || 'spark',
      };

      const result = await AIService.call('explainer', params);
      const searchId = uid();
      lastSearchIdRef.current = searchId;
      setExplainer({
        id: searchId,
        text: result,
        node: resolvedNode,
      });

      // Log to search history
      storage.addSearch({
        id: searchId,
        term,
        nodeId: resolvedNode.id || term,
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
