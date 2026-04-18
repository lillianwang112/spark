import AIService from '../ai/ai.service.js';
import { storage } from './storage.js';
import { fuzzySearch, hashPath } from '../utils/helpers.js';
import { SEED_INDEX, getSeedChildren, getSeedNode } from '../utils/seedData.js';
import { getCuratedRabbitHoles, buildDomainRabbitHoles } from '../utils/rabbitHoles.js';
import { getEncyclopediaTopic, getEncyclopediaChildren, getEncyclopediaExplainer } from '../utils/encyclopedia.js';

const TOPIC_GRAPH_KEY = 'spark_topic_graph_v1';
const EMPTY_GRAPH = { topics: {} };
const inflight = new Map();
const API_BASE = import.meta.env.VITE_TOPIC_API_URL || '';
const API_RETRY_COOLDOWN_MS = 8000;
const FALLBACK_CHILD_KIND_ORDER = ['question', 'mechanism', 'connection', 'experiment', 'counterfactual', 'paradox'];
const FALLBACK_DIFFICULTY_ORDER = ['beginner', 'beginner', 'intermediate', 'intermediate', 'advanced', 'advanced'];

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
  if (!API_BASE) {
    throw new Error('Topic API unavailable');
  }

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
    kind: child.kind || 'connection',
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

function buildSubstantiveFallbackDescription(topicLabel, childLabel, kind, ageGroup) {
  const isKids = ageGroup === 'little_explorer';
  const templates = {
    question: isKids
      ? `${childLabel} is a big clue hiding inside ${topicLabel}.`
      : `${childLabel} asks the central question that makes ${topicLabel} worth exploring.`,
    mechanism: isKids
      ? `This shows what makes ${topicLabel} actually work.`
      : `${childLabel} reveals the mechanism that powers ${topicLabel} under the surface.`,
    connection: isKids
      ? `This links ${topicLabel} to another cool world.`
      : `${childLabel} maps how ${topicLabel} connects to seemingly distant ideas.`,
    experiment: isKids
      ? `You can test this with a tiny real-world experiment.`
      : `${childLabel} turns ${topicLabel} into a testable experiment instead of a vague idea.`,
    counterfactual: isKids
      ? `Imagine ${topicLabel} if one rule changed.`
      : `${childLabel} stress-tests ${topicLabel} by changing one key assumption.`,
    paradox: isKids
      ? `This part feels impossible at first, then clicks.`
      : `${childLabel} holds the paradox that separates shallow understanding from deep understanding.`,
  };

  return templates[kind] || templates.connection;
}

function normalizeChildNode(topic, child, index = 0, userContextObj = {}) {
  if (!child?.label) return null;
  const kind = child.kind || FALLBACK_CHILD_KIND_ORDER[index % FALLBACK_CHILD_KIND_ORDER.length];
  const difficulty = child.difficulty || FALLBACK_DIFFICULTY_ORDER[index % FALLBACK_DIFFICULTY_ORDER.length];
  const label = String(child.label).trim();

  return hydrateTopic({
    id: child.id || normalizeTopicKey(label),
    label,
    description:
      child.description
      || child.description_one_sentence
      || child.summary
      || child.why_it_matters
      || buildSubstantiveFallbackDescription(topic.label, label, kind, userContextObj.ageGroup),
    kind,
    domain: child.domain || topic.domain,
    difficulty,
    surpriseFactor: Boolean(child.surpriseFactor || child.surprising || child.isSurprising),
    path: child.path || [...(topic.path || [topic.label]), label],
  });
}

function buildFallbackChildren(topic, userContextObj = {}) {
  const encyclopediaChildren = getEncyclopediaChildren(topic);
  if (encyclopediaChildren.length > 0) {
    return encyclopediaChildren
      .map((child, index) => normalizeChildNode(topic, child, index, userContextObj))
      .filter(Boolean);
  }

  const curated = getCuratedRabbitHoles(topic);
  if (curated.length > 0) {
    return curated
      .map((child, index) => normalizeChildNode(topic, child, index, userContextObj))
      .filter(Boolean);
  }

  const domainPack = buildDomainRabbitHoles(topic);
  if (domainPack.length > 0) {
    return domainPack
      .map((child, index) => normalizeChildNode(topic, child, index, userContextObj))
      .filter(Boolean);
  }


  const topicLabel = topic.label;
  const isKids = userContextObj.ageGroup === 'little_explorer';
  const starterChildren = [
    {
      label: `${topicLabel} in real life`,
      kind: 'question',
      difficulty: 'beginner',
      surpriseFactor: false,
      description: isKids
        ? `Where you can spot ${topicLabel} in everyday life.`
        : `Concrete examples that make ${topicLabel} feel visible instead of abstract.`,
    },
    {
      label: `How ${topicLabel} actually works`,
      kind: 'mechanism',
      difficulty: 'beginner',
      surpriseFactor: false,
      description: isKids
        ? `The hidden moving parts behind ${topicLabel}.`
        : `The mechanism that explains why ${topicLabel} behaves the way it does.`,
    },
    {
      label: `${topicLabel} and decision making`,
      kind: 'connection',
      difficulty: 'intermediate',
      surpriseFactor: false,
      description: isKids
        ? `How ${topicLabel} helps people choose better.`
        : `How ideas from ${topicLabel} can improve reasoning and real-world decisions.`,
    },
    {
      label: `Test ${topicLabel} yourself`,
      kind: 'experiment',
      difficulty: 'intermediate',
      surpriseFactor: true,
      description: isKids
        ? 'A mini experiment you can try today.'
        : `A hands-on experiment to verify a core claim inside ${topicLabel}.`,
    },
    {
      label: `If ${topicLabel} assumptions break`,
      kind: 'counterfactual',
      difficulty: 'advanced',
      surpriseFactor: true,
      description: isKids
        ? 'What changes if one big rule is different?'
        : `A stress test of ${topicLabel}: what fails first when key assumptions change?`,
    },
    {
      label: `${topicLabel} paradoxes`,
      kind: 'paradox',
      difficulty: 'advanced',
      surpriseFactor: true,
      description: isKids
        ? 'The weird part that seems impossible at first.'
        : `Counterintuitive edge-cases where ${topicLabel} exposes deeper structure.`,
    },
  ];

  return starterChildren
    .map((child, index) => normalizeChildNode(topic, child, index, userContextObj))
    .filter(Boolean);
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
    return children.slice(0, 3).map((child) => {
      const kind = child.kind || 'connection';
      if (kind === 'mechanism') return `how ${child.label} works`;
      if (kind === 'paradox') return `why ${child.label} feels paradoxical`;
      if (kind === 'experiment') return `experiment: ${child.label}`;
      return child.label;
    });
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

    const encyclopediaTopic = getEncyclopediaTopic(term);
    if (encyclopediaTopic) {
      return hydrateTopic({
        ...encyclopediaTopic,
        path: [encyclopediaTopic.label],
      });
    }

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
    if (!topic) return null;
    const graphTopic = getTopicFromGraph(topic.id || topic.label);
    if (graphTopic?.children?.length) return graphTopic.children;

    const encyclopediaChildren = getEncyclopediaChildren(topic);
    if (encyclopediaChildren.length > 0) {
      return encyclopediaChildren.map((child) => hydrateTopic(child));
    }

    const curated = getCuratedRabbitHoles(topic);
    if (curated.length > 0) {
      return curated.map((child) => hydrateTopic(child));
    }

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
    if (!resolvedTopic) return [];
    persistTopic(resolvedTopic);

    if (!options.forceFresh) {
      const cachedChildren = this.getCachedChildren(resolvedTopic);
      if (cachedChildren?.length) {
        persistChildren(resolvedTopic, cachedChildren);
        return cachedChildren;
      }
    }

    // Build instant fallback from curated + encyclopedia data (no AI wait)
    const curated = getCuratedRabbitHoles(resolvedTopic)
      .map((child, index) => normalizeChildNode(resolvedTopic, child, index, userContextObj))
      .filter(Boolean);
    const encyclopediaFallback = getEncyclopediaChildren(resolvedTopic)
      .map((child, index) => normalizeChildNode(resolvedTopic, child, index, userContextObj))
      .filter(Boolean);

    let immediateChildren;
    if (curated.length > 0) {
      const merged = new Map();
      [...curated, ...encyclopediaFallback].forEach((child) => {
        const key = normalizeTopicKey(child.id || child.label);
        if (!merged.has(key)) merged.set(key, child);
      });
      immediateChildren = Array.from(merged.values()).slice(0, 6);
    } else if (encyclopediaFallback.length > 0) {
      immediateChildren = encyclopediaFallback.slice(0, 6);
    } else {
      immediateChildren = buildFallbackChildren(resolvedTopic, userContextObj);
    }

    persistChildren(resolvedTopic, immediateChildren);

    // Enrich with AI in background — updates cache for next visit
    const requestKey = `children:${normalizeTopicKey(resolvedTopic.id || resolvedTopic.label)}:${buildProfileKey(userContextObj)}`;
    if (!inflight.has(requestKey)) {
      const enrichPromise = (async () => {
        try {
          const remote = await callTopicApi('/api/topic/children', {
            topic: resolvedTopic,
            userContext: userContextObj,
          });
          if (Array.isArray(remote?.children) && remote.children.length > 0) {
            const enriched = remote.children
              .map((child, index) => normalizeChildNode(resolvedTopic, child, index, userContextObj))
              .filter(Boolean);
            if (enriched.length > 0) { persistChildren(resolvedTopic, enriched); return; }
          }
        } catch { /* no remote API */ }

        try {
          const childData = await AIService.call('nodeChildren', buildUserParams(resolvedTopic, userContextObj));
          const aiChildren = (Array.isArray(childData) ? childData : [])
            .map((child, index) => normalizeChildNode(resolvedTopic, child, index, userContextObj))
            .filter(Boolean);
          if (aiChildren.length >= 3) {
            const merged = new Map();
            [...immediateChildren, ...aiChildren].forEach((child) => {
              const k = normalizeTopicKey(child.id || child.label);
              if (!merged.has(k)) merged.set(k, child);
            });
            persistChildren(resolvedTopic, Array.from(merged.values()).slice(0, 6));
          }
        } catch { /* swallow — background only */ }
      })().finally(() => inflight.delete(requestKey));
      inflight.set(requestKey, enrichPromise);
    }

    return immediateChildren;
  },

  getCachedExplainer(topic, userContextObj = {}) {
    if (!topic) return null;
    const record = getTopicFromGraph(topic.id || topic.label);
    return record?.explainers?.[buildProfileKey(userContextObj)] || null;
  },

  async getExplainer(topic, userContextObj = {}, options = {}) {
    const resolvedTopic = hydrateTopic(topic);
    if (!resolvedTopic) {
      return getEncyclopediaExplainer({ label: String(topic || 'This topic') });
    }
    persistTopic(resolvedTopic);

    if (!options.forceFresh) {
      const cached = this.getCachedExplainer(resolvedTopic, userContextObj);
      if (cached) return cached;
    }

    // Return encyclopedia explainer immediately (no AI wait)
    const immediateText = getEncyclopediaExplainer(resolvedTopic);

    // Enrich with AI in background — updates cache for next visit
    const requestKey = `explainer:${normalizeTopicKey(resolvedTopic.id || resolvedTopic.label)}:${buildProfileKey(userContextObj)}:${hashPath(resolvedTopic.path || [resolvedTopic.label])}`;
    if (!inflight.has(requestKey)) {
      const enrichPromise = (async () => {
        try {
          const remote = await callTopicApi('/api/topic/explainer', {
            topic: resolvedTopic,
            userContext: userContextObj,
          });
          if (typeof remote?.explainer === 'string' && remote.explainer.trim()) {
            persistExplainer(resolvedTopic, userContextObj, remote.explainer);
            return;
          }
        } catch { /* no remote API */ }

        try {
          const text = await AIService.call('explainer', buildUserParams(resolvedTopic, userContextObj));
          if (text && typeof text === 'string' && text.trim().length >= 80) {
            persistExplainer(resolvedTopic, userContextObj, text);
            return;
          }
        } catch { /* swallow — background only */ }

        persistExplainer(resolvedTopic, userContextObj, immediateText);
      })().finally(() => inflight.delete(requestKey));
      inflight.set(requestKey, enrichPromise);
    }

    return immediateText;
  },

  getPredictedPrompts(topic, userContextObj = {}) {
    const resolvedTopic = hydrateTopic(topic);
    const record = getTopicFromGraph(resolvedTopic.id || resolvedTopic.label);
    const children = record?.children?.length ? record.children : this.getCachedChildren(resolvedTopic) || [];
    return buildPredictivePrompts(resolvedTopic, children, userContextObj);
  },

  async warmTopic(topic, userContextObj = {}) {
    const resolvedTopic = hydrateTopic(topic);
    if (!resolvedTopic) return { topic: null, children: [], predictions: [] };
    persistTopic(resolvedTopic);

    callTopicApi('/api/topic/warm', {
      topic: resolvedTopic,
      userContext: userContextObj,
    }).then((remote) => {
      if (Array.isArray(remote?.children) && remote.children.length > 0) {
        persistChildren(
          resolvedTopic,
          remote.children
            .map((child, index) => normalizeChildNode(resolvedTopic, child, index, userContextObj))
            .filter(Boolean),
        );
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
