import { uid } from '../utils/helpers.js';
import { BRANCH_STATES, MODES, KNOWLEDGE_STATES } from '../utils/constants.js';

// Create a new tree node
export function createNode({
  id,
  label,
  description = '',
  domain,
  parentId = null,
  path = [],
  depth = 0,
  difficulty = 'medium',
  surpriseFactor = false,
}) {
  return {
    id:             id || uid(),
    label,
    description,
    domain,
    parentId,
    path:           [...path, label],
    depth,
    difficulty,
    surpriseFactor,
    // User state
    knowledgeState: null,
    mode:           MODES.EXPLORING,
    branchState:    BRANCH_STATES.HEALTHY,
    srsData:        null,
    // Metadata
    timestamp:      new Date().toISOString(),
    lastTended:     null,
    explainerCache: {},
    saved:          false,
    pruned:         false,
    isGhost:        false,
    connections:    [],
    // UI state (not persisted)
    expanded:       false,
    children:       [],
    childrenLoaded: false,
  };
}

// Derive tree stage from total nodes explored
export function getTreeStage(nodesCount) {
  if (nodesCount < 20)   return 'seed';
  if (nodesCount < 100)  return 'sapling';
  if (nodesCount < 500)  return 'growing';
  if (nodesCount < 2000) return 'rooted';
  return 'ancient';
}

export const TREE_STAGE_LABELS = {
  seed:    { emoji: '🌱', label: 'Seed' },
  sapling: { emoji: '🌿', label: 'Sapling' },
  growing: { emoji: '🌳', label: 'Growing' },
  rooted:  { emoji: '🌲', label: 'Rooted' },
  ancient: { emoji: '✨', label: 'Ancient' },
};
