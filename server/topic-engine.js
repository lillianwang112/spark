import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_INDEX, getSeedChildren, getSeedNode } from '../src/utils/seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const GRAPH_PATH = path.join(DATA_DIR, 'topic-graph.json');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeTopicKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildProfileKey(userContext = {}) {
  return [
    userContext.ageGroup || 'college',
    userContext.personality || 'spark',
    userContext.explorationStyle || 'balanced',
    (userContext.topInterests || []).slice(0, 4).map(normalizeTopicKey).join(','),
  ].join(':');
}

function createEmptyGraph() {
  return { topics: {}, updatedAt: new Date().toISOString() };
}

function readGraph() {
  ensureDataDir();
  if (!fs.existsSync(GRAPH_PATH)) return createEmptyGraph();
  try {
    return JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
  } catch {
    return createEmptyGraph();
  }
}

function writeGraph(graph) {
  ensureDataDir();
  graph.updatedAt = new Date().toISOString();
  fs.writeFileSync(GRAPH_PATH, JSON.stringify(graph, null, 2));
  return graph;
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

function mergeTopic(existing, topic) {
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
    signals: base.signals || toTopicRecord(topic).signals,
    updatedAt: new Date().toISOString(),
  };
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

function getGraphTopic(term, graph = readGraph()) {
  const normalized = normalizeTopicKey(term);
  return Object.values(graph.topics || {}).find((topic) =>
    topic.key === normalized || normalizeTopicKey(topic.label) === normalized
  ) || null;
}

function hydrateTopic(input, graph = readGraph()) {
  if (!input) return null;
  const seed = getSeedNode(input.id) || getSeedNode(normalizeTopicKey(input.id));
  const graphTopic = getGraphTopic(input.id || input.label, graph);
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
  const graph = readGraph();
  const hydrated = hydrateTopic(topic, graph);
  const key = normalizeTopicKey(hydrated.id || hydrated.label);
  graph.topics[key] = mergeTopic(graph.topics[key], hydrated);
  writeGraph(graph);
  return graph.topics[key];
}

function persistChildren(topic, children) {
  const graph = readGraph();
  const parent = hydrateTopic(topic, graph);
  const parentKey = normalizeTopicKey(parent.id || parent.label);
  const nextChildren = children.map((child) => hydrateTopic({
    ...child,
    id: child.id || normalizeTopicKey(child.label),
    domain: child.domain || parent.domain,
    path: child.path || [...(parent.path || [parent.label]), child.label],
  }, graph));

  graph.topics[parentKey] = mergeTopic(graph.topics[parentKey], parent);
  graph.topics[parentKey].children = nextChildren.map((child) => ({
    id: child.id,
    label: child.label,
    domain: child.domain,
    description: child.description || '',
    difficulty: child.difficulty || 'intermediate',
    surpriseFactor: Boolean(child.surpriseFactor),
    path: child.path,
  }));

  nextChildren.forEach((child) => {
    const childKey = normalizeTopicKey(child.id || child.label);
    graph.topics[childKey] = mergeTopic(graph.topics[childKey], child);
  });

  writeGraph(graph);
  return graph.topics[parentKey].children;
}

function persistExplainer(topic, userContext, text) {
  const graph = readGraph();
  const hydrated = hydrateTopic(topic, graph);
  const key = normalizeTopicKey(hydrated.id || hydrated.label);
  const record = mergeTopic(graph.topics[key], hydrated);
  record.explainers[buildProfileKey(userContext)] = text;
  graph.topics[key] = record;
  writeGraph(graph);
  return text;
}

function rememberSignal(topic, signal) {
  if (!topic?.label || !signal) return;
  const graph = readGraph();
  const hydrated = hydrateTopic(topic, graph);
  const key = normalizeTopicKey(hydrated.id || hydrated.label);
  const record = mergeTopic(graph.topics[key], hydrated);
  record.signals = {
    ...record.signals,
    [signal]: (record.signals?.[signal] || 0) + 1,
    lastOpenedAt: new Date().toISOString(),
  };
  graph.topics[key] = record;
  writeGraph(graph);
}

function resolveTopic(term, targetNode = null) {
  if (targetNode) return hydrateTopic(targetNode);

  const graph = readGraph();
  const normalized = String(term || '').trim().toLowerCase();
  const graphTopic = getGraphTopic(normalized, graph);
  if (graphTopic) return hydrateTopic(graphTopic, graph);

  const seeds = allSeedTopics();
  const exact = seeds.find((item) => item.label.toLowerCase() === normalized);
  if (exact) return hydrateTopic(exact, graph);

  const fuzzy = seeds
    .map((item) => {
      const hay = `${item.label} ${item.description}`.toLowerCase();
      const score = hay.includes(normalized) ? normalized.length / hay.length : 0;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item;

  if (fuzzy) return hydrateTopic(fuzzy, graph);

  return hydrateTopic({
    id: normalizeTopicKey(term),
    label: term,
    domain: 'general',
    description: '',
    path: [term],
  }, graph);
}

function generateExplainer(topic, userContext = {}) {
  const ageGroup = userContext.ageGroup || 'college';
  const path = Array.isArray(topic.path) ? topic.path.filter(Boolean) : [topic.label];
  const parentLabel = path.length > 1 ? path[path.length - 2] : null;
  const interestHint = (userContext.topInterests || []).slice(0, 1)[0];
  const hook = topic.description
    ? `${topic.label} is easier to feel once you realize it is really about ${topic.description.toLowerCase().replace(/\.$/, '')}.`
    : `${topic.label} looks like a topic, but it is really a doorway into how something deeper works.`;
  const core = parentLabel
    ? `Inside ${parentLabel}, this branch matters because it changes what questions you can ask next.`
    : `${topic.label} matters because it gives you a more precise way to notice patterns, causes, and tradeoffs.`;
  const analogy = interestHint
    ? `If ${interestHint} already pulls you in, think of ${topic.label} as the version of that instinct with clearer structure and sharper edges.`
    : `A good way to hold it is to treat ${topic.label} like a lens: the world stays the same, but what stands out changes.`;
  const teaser = ageGroup === 'little_explorer'
    ? `The fun part is that one more step usually reveals a stranger question hiding underneath.`
    : `The real rabbit hole starts when you stop asking what ${topic.label} is and start asking what it unlocks.`;

  return `${hook} ${core} ${analogy} ${teaser}`;
}

function inferCrossDomain(topic) {
  const related = {
    math: 'music',
    science: 'philosophy',
    cs: 'linguistics',
    art: 'history',
    music: 'math',
    history: 'politics',
    philosophy: 'science',
    engineering: 'design',
    literature: 'psychology',
    languages: 'culture',
    cooking: 'chemistry',
    film: 'music',
    architecture: 'engineering',
  };
  return related[topic.domain] || 'art';
}

function generateHeuristicChildren(topic) {
  const label = topic.label;
  const path = topic.path || [label];
  return [
    {
      id: `${normalizeTopicKey(label)}_foundations`,
      label: `${label} fundamentals`,
      description: `The core ideas that make ${label.toLowerCase()} click quickly.`,
      difficulty: 'beginner',
      surpriseFactor: false,
      domain: topic.domain,
      path: [...path, `${label} fundamentals`],
    },
    {
      id: `${normalizeTopicKey(label)}_applications`,
      label: `${label} in real life`,
      description: `Concrete places where ${label.toLowerCase()} shows up outside the textbook.`,
      difficulty: 'beginner',
      surpriseFactor: false,
      domain: topic.domain,
      path: [...path, `${label} in real life`],
    },
    {
      id: `${normalizeTopicKey(label)}_misconceptions`,
      label: `Misunderstanding ${label}`,
      description: `The wrong intuition most people carry before the deeper picture appears.`,
      difficulty: 'intermediate',
      surpriseFactor: true,
      domain: topic.domain,
      path: [...path, `Misunderstanding ${label}`],
    },
    {
      id: `${normalizeTopicKey(label)}_connections`,
      label: `${label} and ${inferCrossDomain(topic)}`,
      description: `A sideways branch that makes ${label.toLowerCase()} feel unexpectedly connected.`,
      difficulty: 'advanced',
      surpriseFactor: true,
      domain: topic.domain,
      path: [...path, `${label} and ${inferCrossDomain(topic)}`],
    },
  ];
}

function getChildren(topic) {
  const graph = readGraph();
  const resolved = hydrateTopic(topic, graph);
  const graphTopic = getGraphTopic(resolved.id || resolved.label, graph);
  if (graphTopic?.children?.length) return graphTopic.children;

  const seedChildren = getSeedChildren(resolved.id);
  if (seedChildren?.length) {
    return persistChildren(resolved, seedChildren.map((child) => ({
      ...child,
      path: [...(resolved.path || [resolved.label]), child.label],
    })));
  }

  return persistChildren(resolved, generateHeuristicChildren(resolved));
}

function getExplainer(topic, userContext = {}) {
  const graph = readGraph();
  const resolved = hydrateTopic(topic, graph);
  const profileKey = buildProfileKey(userContext);
  const cached = getGraphTopic(resolved.id || resolved.label, graph)?.explainers?.[profileKey];
  if (cached) return cached;
  return persistExplainer(resolved, userContext, generateExplainer(resolved, userContext));
}

function getPredictions(topic) {
  const resolved = hydrateTopic(topic);
  const children = getChildren(resolved);
  if (children?.length) return children.slice(0, 3).map((child) => child.label);
  return [
    `why ${resolved.label} matters`,
    `${resolved.label} for beginners`,
    `unexpected ideas inside ${resolved.label}`,
  ];
}

function warmTopic(topic, userContext = {}) {
  const resolved = hydrateTopic(topic);
  persistTopic(resolved);
  const children = getChildren(resolved);
  const explainer = getExplainer(resolved, userContext);
  children.slice(0, 3).forEach((child) => {
    persistTopic(child);
    getExplainer(child, userContext);
    getChildren(child);
  });
  return {
    topic: resolved,
    children,
    explainer,
    predictions: getPredictions(resolved),
  };
}

export const topicEngine = {
  normalizeTopicKey,
  resolveTopic,
  rememberSignal,
  getChildren,
  getExplainer,
  getPredictions,
  warmTopic,
};
