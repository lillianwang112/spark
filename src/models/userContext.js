import { getTopDomains } from './elo.js';
import { AGE_GROUPS, PERSONALITIES } from '../utils/constants.js';

// Assembles the user context object for every AI call
export function buildUserContext(user, currentNode = null) {
  const topInterests = user.eloScores
    ? getTopDomains(user.eloScores, 3)
    : [];

  return {
    ageGroup:        user.ageGroup    || AGE_GROUPS.COLLEGE,
    name:            user.name        || 'Explorer',
    personality:     user.personality || PERSONALITIES.SPARK,
    topInterests,
    knowledgeStates: user.knowledgeStates || {},
    explorationStyle: user.explorationStyle || 'balanced',
    learningPref:    user.learningPref || 'visual',
    currentNode:     currentNode?.label || null,
    currentPath:     currentNode?.path  || [],
    language:        user.language || 'en',
  };
}

// Default guest context for unauthenticated users
export const DEFAULT_USER = {
  uid: null,
  name: null,
  ageGroup: AGE_GROUPS.COLLEGE,
  personality: PERSONALITIES.SPARK,
  eloScores: {},
  knowledgeStates: {},
  explorationStyle: 'balanced',
  learningPref: 'visual',
  onboardingComplete: false,
  tracks: [],
  badges: [],
  stats: {
    nodesExplored: 0,
    domainsExplored: new Set(),
    deepestPath: 0,
    streak: 0,
    firstSpark: null,
  },
  treeStage: 'seed',
};
