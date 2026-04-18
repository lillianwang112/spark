/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback } from 'react';
import { createNode } from '../models/node.js';
import { getSeedChildren, getSeedNode } from '../utils/seedData.js';
import AIService from '../ai/ai.service.js';

// ── State ──

const initialState = {
  roots: [],        // Top-level domain nodes (from discovery results)
  nodes: {},        // id → node (flat registry)
  expandedIds: new Set(),
  activeNodeId: null,
  loading: {},      // nodeId → boolean
  preGenerated: new Set(),
};

// ── Reducer ──

function treeReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOTS':
      return { ...state, roots: action.payload };

    case 'SET_NODE_CHILDREN': {
      const { parentId, children } = action.payload;
      const parent = state.nodes[parentId];
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [parentId]: { ...parent, children: children.map((c) => c.id), childrenLoaded: true },
          ...Object.fromEntries(children.map((c) => [c.id, c])),
        },
      };
    }

    case 'ADD_NODE': {
      const node = action.payload;
      return { ...state, nodes: { ...state.nodes, [node.id]: node } };
    }

    case 'UPDATE_NODE': {
      const { id, updates } = action.payload;
      return {
        ...state,
        nodes: { ...state.nodes, [id]: { ...state.nodes[id], ...updates } },
      };
    }

    case 'TOGGLE_EXPAND': {
      const { nodeId } = action.payload;
      const next = new Set(state.expandedIds);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return { ...state, expandedIds: next };
    }

    case 'EXPAND': {
      const next = new Set(state.expandedIds);
      next.add(action.payload);
      return { ...state, expandedIds: next };
    }

    case 'SET_ACTIVE':
      return { ...state, activeNodeId: action.payload };

    case 'SET_LOADING': {
      const { nodeId, loading } = action.payload;
      return { ...state, loading: { ...state.loading, [nodeId]: loading } };
    }

    case 'MARK_PREGENERATED': {
      const next = new Set(state.preGenerated);
      next.add(action.payload);
      return { ...state, preGenerated: next };
    }

    default:
      return state;
  }
}

// ── Context ──

const TreeContext = createContext(null);

export function TreeProvider({ children }) {
  const [state, dispatch] = useReducer(treeReducer, initialState);

  // Initialize roots from top discovery domains
  const initRoots = useCallback((domains) => {
    const roots = domains.map((domain) => {
      const seed = getSeedNode(domain) || { id: domain, label: domain, domain, description: '' };
      const node = createNode({ ...seed, depth: 0 });
      return node;
    });
    dispatch({ type: 'SET_ROOTS', payload: roots });
    // Register root nodes
    roots.forEach((n) => dispatch({ type: 'ADD_NODE', payload: n }));
  }, []);

  const preGenerateChildren = useCallback((nodes, userContextObj) => {
    nodes.forEach((node) => {
      if (state.preGenerated.has(node.id)) return;
      dispatch({ type: 'MARK_PREGENERATED', payload: node.id });
      AIService.preGenerate('nodeChildren', {
        currentNode: node.label,
        currentPath: node.path || [node.label],
        ageGroup: userContextObj?.ageGroup || 'college',
        topInterests: userContextObj?.topInterests || [],
        personality: userContextObj?.personality || 'spark',
      });
      AIService.preGenerate('explainer', {
        currentNode: node.label,
        currentPath: node.path || [node.label],
        ageGroup: userContextObj?.ageGroup || 'college',
        personality: userContextObj?.personality || 'spark',
        topInterests: userContextObj?.topInterests || [],
      });
    });
  }, [state.preGenerated]);

  // Expand a node: load children from seed or AI
  const expandNode = useCallback(async (nodeId, userContextObj) => {
    const node = state.nodes[nodeId];
    if (!node) return;

    if (node.childrenLoaded && (node.children?.length > 0)) {
      dispatch({ type: 'TOGGLE_EXPAND', payload: { nodeId } });
      dispatch({ type: 'SET_ACTIVE', payload: state.expandedIds.has(nodeId) ? null : nodeId });
      return;
    }

    const seedChildren = getSeedChildren(nodeId);
    if (seedChildren) {
      const childNodes = seedChildren.map((c) =>
        createNode({ ...c, parentId: nodeId, path: [...(node.path || []), node.label], depth: (node.depth || 0) + 1 })
      );
      dispatch({ type: 'SET_NODE_CHILDREN', payload: { parentId: nodeId, children: childNodes } });
      dispatch({ type: 'EXPAND', payload: nodeId });
      dispatch({ type: 'SET_ACTIVE', payload: nodeId });
      preGenerateChildren(childNodes.slice(0, 2), userContextObj);
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: { nodeId, loading: true } });

    try {
      const params = {
        currentNode: node.label,
        currentPath: node.path || [node.label],
        ageGroup: userContextObj?.ageGroup || 'college',
        topInterests: userContextObj?.topInterests || [],
        personality: userContextObj?.personality || 'spark',
      };
      const childData = await AIService.call('nodeChildren', params);
      if (childData && Array.isArray(childData)) {
        const childNodes = childData.map((c) =>
          createNode({
            id: `${nodeId}_${c.id || c.label?.toLowerCase().replace(/\s+/g, '_')}`,
            label: c.label,
            description: c.description || '',
            domain: node.domain,
            parentId: nodeId,
            path: [...(node.path || []), node.label],
            depth: (node.depth || 0) + 1,
            difficulty: c.difficulty,
            surpriseFactor: c.surpriseFactor,
          })
        );
        dispatch({ type: 'SET_NODE_CHILDREN', payload: { parentId: nodeId, children: childNodes } });
        dispatch({ type: 'EXPAND', payload: nodeId });
        dispatch({ type: 'SET_ACTIVE', payload: nodeId });
        preGenerateChildren(childNodes.slice(0, 2), userContextObj);
      }
    } catch (err) {
      console.error('[useTree] expandNode error:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { nodeId, loading: false } });
    }
  }, [preGenerateChildren, state.expandedIds, state.nodes]);

  const setActiveNode = useCallback((nodeId) => {
    dispatch({ type: 'SET_ACTIVE', payload: nodeId });
  }, []);

  const toggleExpand = useCallback((nodeId) => {
    dispatch({ type: 'TOGGLE_EXPAND', payload: { nodeId } });
  }, []);

  const updateNode = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } });
  }, []);

  return (
    <TreeContext.Provider value={{
      ...state,
      initRoots,
      expandNode,
      setActiveNode,
      toggleExpand,
      updateNode,
    }}>
      {children}
    </TreeContext.Provider>
  );
}

export function useTree() {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error('useTree must be used within TreeProvider');
  return ctx;
}
