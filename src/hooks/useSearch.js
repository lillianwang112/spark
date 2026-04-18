import { useState, useCallback, useRef } from 'react';
import { storage } from '../services/storage.js';
import { fuzzySearch } from '../utils/helpers.js';
import { SEED_INDEX } from '../utils/seedData.js';
import { uid } from '../utils/helpers.js';
import TopicGraph from '../services/topicGraph.js';

// All seed node labels for autocomplete
const ALL_SEED_LABELS = Object.values(SEED_INDEX).map((n) => ({
  id: n.id,
  label: n.label,
  domain: n.domain,
  description: n.description || '',
  path: n.path || [n.label],
}));

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
