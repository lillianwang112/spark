import AIService from '../ai/ai.service.js';
import { storage } from './storage.js';
import { fuzzySearch, hashPath } from '../utils/helpers.js';
import { SEED_INDEX, getSeedChildren, getSeedNode } from '../utils/seedData.js';

const TOPIC_GRAPH_KEY = 'spark_topic_graph_v1';
const EMPTY_GRAPH = { topics: {} };
const inflight = new Map();
const API_BASE = import.meta.env.VITE_TOPIC_API_URL || '';
const API_RETRY_COOLDOWN_MS = 8000;

let topicApiStatus = 'unknown';
let topicApiFailedAt = 0;

function readGraph() {
  return storage.get(TOPIC_GRAPH_KEY) || EMPTY_GRAPH;
}

function writeGraph(graph) {
  storage.set(TOPIC_GRAPH_KEY, graph);
  return graph;
}

function normalizeTopicKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildProfileKey(userContextObj = {}) {
  return [
    userContextObj.ageGroup || 'college',
    userContextObj.personality || 'spark',
    userContextObj.explorationStyle || 'balanced',
    (userContextObj.topInterests || []).slice(0, 4).map(normalizeTopicKey).join(','),
  ].join(':');
}

function toTopicRecord(topic) {
  const key = normalizeTopicKey(topic.id || topic.label);
  return {
    key,
    id: topic.id || key,
    label: topic.label,
    domain: topic.domain || 'general',
    description: topic.description || '',
    path: topic.path || [topic.label],
    children: [],
    explainers: {},
    signals: {
      opens: 0,
      deepens: 0,
      saves: 0,
      expands: 0,
      lastOpenedAt: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

function mergeTopicRecord(existing, topic) {
  const base = existing || toTopicRecord(topic);
  return {
    ...base,
    id: topic.id || base.id,
    label: topic.label || base.label,
    domain: topic.domain || base.domain,
    description: topic.description || base.description,
    path: topic.path || base.path || [topic.label || base.label],
    children: Array.isArray(base.children) ? base.children : [],
    explainers: base.explainers || {},
    signals: base.signals || {
      opens: 0,
      deepens: 0,
      saves: 0,
      expands: 0,
      lastOpenedAt: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

function withInflight(key, factory) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = Promise.resolve()
    .then(factory)
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

async function callTopicApi(pathname, payload) {
  if (topicApiStatus === 'unavailable' && (Date.now() - topicApiFailedAt) < API_RETRY_COOLDOWN_MS) {
    throw new Error('Topic API unavailable');
  }

  const endpoint = `${API_BASE}${pathname}`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      topicApiStatus = 'unavailable';
      topicApiFailedAt = Date.now();
      throw new Error(`Topic API error: ${response.status}`);
    }

    topicApiStatus = 'available';
    topicApiFailedAt = 0;
    return response.json();
  } catch (error) {
    topicApiStatus = 'unavailable';
    topicApiFailedAt = Date.now();
    throw error;
  }
}

function getTopicFromGraph(term) {
  const graph = readGraph();
  const topics = Object.values(graph.topics || {});
  const normalized = normalizeTopicKey(term);
  return topics.find((topic) =>
    topic.key === normalized || normalizeTopicKey(topic.label) === normalized
  ) || null;
}

function allSeedTopics() {
  return Object.values(SEED_INDEX).map((node) => ({
    id: node.id,
    label: node.label,
    domain: node.domain,
    description: node.description || '',
    path: node.path || [node.label],
  }));
}

function hydrateTopic(input) {
  if (!input) return null;
  const seed = getSeedNode(input.id) || getSeedNode(normalizeTopicKey(input.id));
  const graphTopic = getTopicFromGraph(input.id || input.label);
  return {
    ...graphTopic,
    ...seed,
    ...input,
    id: input.id || graphTopic?.id || seed?.id || normalizeTopicKey(input.label),
    label: input.label || graphTopic?.label || seed?.label || '',
    domain: input.domain || graphTopic?.domain || seed?.domain || 'general',
    description: input.description || graphTopic?.description || seed?.description || '',
    path: input.path || graphTopic?.path || seed?.path || [input.label || graphTopic?.label || seed?.label].filter(Boolean),
  };
}

function persistTopic(topic) {
  if (!topic?.label) return null;
  const graph = readGraph();
  const key = normalizeTopicKey(topic.id || topic.label);
  graph.topics[key] = mergeTopicRecord(graph.topics[key], hydrateTopic(topic));
  writeGraph(graph);
  return graph.topics[key];
}

function persistChildren(topic, children) {
  const graph = readGraph();
  const key = normalizeTopicKey(topic.id || topic.label);
  const parent = mergeTopicRecord(graph.topics[key], hydrateTopic(topic));
  parent.children = children.map((child) => ({
    id: child.id || normalizeTopicKey(child.label),
    label: child.label,
    domain: child.domain || topic.domain || parent.domain || 'general',
    description: child.description || '',
    difficulty: child.difficulty || 'intermediate',
    surpriseFactor: Boolean(child.surpriseFactor),
    path: child.path || [...(topic.path || parent.path || [topic.label]), child.label],
  }));
  parent.updatedAt = new Date().toISOString();
  graph.topics[key] = parent;
  parent.children.forEach((child) => {
    const childKey = normalizeTopicKey(child.id || child.label);
    graph.topics[childKey] = mergeTopicRecord(graph.topics[childKey], child);
  });
  writeGraph(graph);
  return parent.children;
}

function persistExplainer(topic, userContextObj, text) {
  const graph = readGraph();
  const key = normalizeTopicKey(topic.id || topic.label);
  const record = mergeTopicRecord(graph.topics[key], hydrateTopic(topic));
  record.explainers[buildProfileKey(userContextObj)] = text;
  record.updatedAt = new Date().toISOString();
  graph.topics[key] = record;
  writeGraph(graph);
  return text;
}

function buildPredictivePrompts(topic, children = []) {
  if (children.length > 0) {
    return children.slice(0, 3).map((child) => child.label);
  }

  const searches = storage.getSearches().slice(0, 30);
  const related = searches
    .filter((entry) => normalizeTopicKey(entry.term) !== normalizeTopicKey(topic.label))
    .filter((entry) => entry.domain === topic.domain || entry.wentDeeper || entry.savedForLater)
    .slice(0, 3)
    .map((entry) => entry.term);

  if (related.length > 0) return related;

  return [
    `why ${topic.label} matters`,
    `${topic.label} for beginners`,
    `unexpected ideas inside ${topic.label}`,
  ];
}

function buildUserParams(topic, userContextObj = {}) {
  return {
    currentNode: topic.label,
    currentPath: topic.path || [topic.label],
    ageGroup: userContextObj.ageGroup || 'college',
    name: userContextObj.name || 'Explorer',
    topInterests: userContextObj.topInterests || [],
    explorationStyle: userContextObj.explorationStyle || 'balanced',
    personality: userContextObj.personality || 'spark',
    knowledgeState: userContextObj.knowledgeStates?.[topic.id] || null,
  };
}

const TopicGraph = {
  resolveTopic(term, targetNode = null) {
    if (targetNode) return hydrateTopic(targetNode);

    const normalized = term.trim().toLowerCase();
    const graphTopic = getTopicFromGraph(normalized);
    if (graphTopic) return hydrateTopic(graphTopic);

    const seeds = allSeedTopics();
    const exact = seeds.find((item) => item.label.toLowerCase() === normalized);
    if (exact) return hydrateTopic(exact);

    const [bestMatch] = fuzzySearch(term, seeds, (item) => `${item.label} ${item.description}`);
    if (bestMatch?.label?.toLowerCase().includes(normalized) || normalized.includes(bestMatch?.label?.toLowerCase?.() || '')) {
      return hydrateTopic(bestMatch);
    }

    return hydrateTopic({
      id: normalizeTopicKey(term),
      label: term,
      domain: 'general',
      description: '',
      path: [term],
    });
  },

  rememberSignal(topic, signal) {
    if (!topic?.label || !signal) return;
    callTopicApi('/api/topic/signal', { topic, signal }).catch(() => {});
    const graph = readGraph();
    const key = normalizeTopicKey(topic.id || topic.label);
    const record = mergeTopicRecord(graph.topics[key], hydrateTopic(topic));
    const nextSignals = {
      ...(record.signals || {}),
      [signal]: (record.signals?.[signal] || 0) + 1,
      lastOpenedAt: new Date().toISOString(),
    };
    record.signals = nextSignals;
    record.updatedAt = new Date().toISOString();
    graph.topics[key] = record;
    writeGraph(graph);
  },

  getCachedChildren(topic) {
    const graphTopic = getTopicFromGraph(topic.id || topic.label);
    if (graphTopic?.children?.length) return graphTopic.children;

    const seedChildren = getSeedChildren(topic.id);
    if (!seedChildren?.length) return null;
    return seedChildren.map((child) => hydrateTopic({
      ...child,
      path: [...(topic.path || [topic.label]), child.label],
      domain: child.domain || topic.domain,
    }));
  },

  async getChildren(topic, userContextObj = {}, options = {}) {
    const resolvedTopic = hydrateTopic(topic);
    persistTopic(resolvedTopic);

    if (!options.forceFresh) {
      const cachedChildren = this.getCachedChildren(resolvedTopic);
      if (cachedChildren?.length) {
        persistChildren(resolvedTopic, cachedChildren);
        return cachedChildren;
      }
    }

    const requestKey = `children:${normalizeTopicKey(resolvedTopic.id || resolvedTopic.label)}:${buildProfileKey(userContextObj)}`;
    return withInflight(requestKey, async () => {
      try {
        const remote = await callTopicApi('/api/topic/children', {
          topic: resolvedTopic,
          userContext: userContextObj,
        });
        if (Array.isArray(remote?.children) && remote.children.length > 0) {
          const children = remote.children.map((child) => hydrateTopic(child));
          persistChildren(resolvedTopic, children);
          return children;
        }
      } catch {
        // Fall back to local-first graph below.
      }

      const childData = await AIService.call('nodeChildren', buildUserParams(resolvedTopic, userContextObj));
      const children = (Array.isArray(childData) ? childData : []).map((child) => hydrateTopic({
        id: child.id || normalizeTopicKey(child.label),
        label: child.label,
        description: child.description || '',
        domain: resolvedTopic.domain,
        difficulty: child.difficulty,
        surpriseFactor: child.surpriseFactor,
        path: [...(resolvedTopic.path || [resolvedTopic.label]), child.label],
      }));
      persistChildren(resolvedTopic, children);
      return children;
    });
  },

  getCachedExplainer(topic, userContextObj = {}) {
    const record = getTopicFromGraph(topic.id || topic.label);
    return record?.explainers?.[buildProfileKey(userContextObj)] || null;
  },

  async getExplainer(topic, userContextObj = {}, options = {}) {
    const resolvedTopic = hydrateTopic(topic);
    persistTopic(resolvedTopic);

    if (!options.forceFresh) {
      const cached = this.getCachedExplainer(resolvedTopic, userContextObj);
      if (cached) return cached;
    }

    const requestKey = `explainer:${normalizeTopicKey(resolvedTopic.id || resolvedTopic.label)}:${buildProfileKey(userContextObj)}:${hashPath(resolvedTopic.path || [resolvedTopic.label])}`;
    return withInflight(requestKey, async () => {
      try {
        const remote = await callTopicApi('/api/topic/explainer', {
          topic: resolvedTopic,
          userContext: userContextObj,
        });
        if (typeof remote?.explainer === 'string' && remote.explainer.trim()) {
          persistExplainer(resolvedTopic, userContextObj, remote.explainer);
          return remote.explainer;
        }
      } catch {
        // Fall back to local-first graph below.
      }

      const text = await AIService.call('explainer', buildUserParams(resolvedTopic, userContextObj));
      persistExplainer(resolvedTopic, userContextObj, text);
      return text;
    });
  },

  getPredictedPrompts(topic, userContextObj = {}) {
    const resolvedTopic = hydrateTopic(topic);
    const record = getTopicFromGraph(resolvedTopic.id || resolvedTopic.label);
    const children = record?.children?.length ? record.children : this.getCachedChildren(resolvedTopic) || [];
    return buildPredictivePrompts(resolvedTopic, children, userContextObj);
  },

  async warmTopic(topic, userContextObj = {}) {
    const resolvedTopic = hydrateTopic(topic);
    persistTopic(resolvedTopic);

    callTopicApi('/api/topic/warm', {
      topic: resolvedTopic,
      userContext: userContextObj,
    }).then((remote) => {
      if (Array.isArray(remote?.children) && remote.children.length > 0) {
        persistChildren(resolvedTopic, remote.children.map((child) => hydrateTopic(child)));
      }
      if (typeof remote?.explainer === 'string' && remote.explainer.trim()) {
        persistExplainer(resolvedTopic, userContextObj, remote.explainer);
      }
    }).catch(() => {});

    const children = await this.getChildren(resolvedTopic, userContextObj).catch(() => []);
    this.getExplainer(resolvedTopic, userContextObj).catch(() => {});

    children.slice(0, 3).forEach((child) => {
      AIService.preGenerate('explainer', buildUserParams(child, userContextObj));
      AIService.preGenerate('nodeChildren', buildUserParams(child, userContextObj));
      persistTopic(child);
    });

    return {
      topic: resolvedTopic,
      children,
      predictions: buildPredictivePrompts(resolvedTopic, children),
    };
  },
};

export default TopicGraph;
