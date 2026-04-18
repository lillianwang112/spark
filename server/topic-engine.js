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
    kind: child.kind || 'connection',
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

const DOMAIN_EXPLAINER_FRAMES = {
  math: {
    lens: 'a compression of pattern into something you can reason with cleanly',
    doorway: 'you stop memorizing formulas and start seeing structure',
  },
  science: {
    lens: 'a way of turning messy phenomena into testable causes and mechanisms',
    doorway: 'you can start predicting what should happen before you observe it',
  },
  cs: {
    lens: 'a set of abstractions for turning complexity into procedures, systems, and leverage',
    doorway: 'you begin asking what should be automated, represented, or optimized',
  },
  art: {
    lens: 'a way of shaping attention, emotion, and meaning through deliberate choices',
    doorway: 'you start noticing why something feels alive instead of just whether it looks good',
  },
  music: {
    lens: 'a structure of tension, release, rhythm, and memory moving through time',
    doorway: 'you can hear why certain sounds feel inevitable and others feel unresolved',
  },
  history: {
    lens: 'a map of forces, contingencies, and stories that still shape the present',
    doorway: 'you start seeing the present as an outcome instead of a default',
  },
  philosophy: {
    lens: 'a machine for sharpening concepts until hidden assumptions become visible',
    doorway: 'the vague question turns into a precise one that actually bites',
  },
  engineering: {
    lens: 'a discipline of constraints, tradeoffs, and systems that must survive reality',
    doorway: 'you stop imagining elegant ideas in isolation and start designing for failure modes',
  },
  literature: {
    lens: 'a way of storing consciousness, conflict, and style inside language',
    doorway: 'you begin noticing what a sentence is doing to your attention',
  },
  languages: {
    lens: 'a system for encoding meaning, culture, and thought into patterns people can share',
    doorway: 'you start hearing the hidden architecture beneath everyday speech',
  },
  cooking: {
    lens: 'a choreography of chemistry, timing, texture, and appetite',
    doorway: 'you can predict how flavor and texture will change before you taste the result',
  },
  film: {
    lens: 'a grammar of image, sound, pacing, and point of view',
    doorway: 'you stop passively watching and start feeling how the scene is being steered',
  },
  architecture: {
    lens: 'a negotiation between space, body, material, climate, and meaning',
    doorway: 'you start sensing how a place scripts behavior before anyone speaks',
  },
  general: {
    lens: 'a new way of carving up reality so different questions become available',
    doorway: 'you stop circling the topic and start entering it',
  },
};

function generateExplainer(topic, userContext = {}) {
  const ageGroup = userContext.ageGroup || 'college';
  const path = Array.isArray(topic.path) ? topic.path.filter(Boolean) : [topic.label];
  const parentLabel = path.length > 1 ? path[path.length - 2] : null;
  const interestHint = (userContext.topInterests || []).slice(0, 1)[0];
  const frame = DOMAIN_EXPLAINER_FRAMES[topic.domain] || DOMAIN_EXPLAINER_FRAMES.general;
  const hook = topic.description
    ? `${topic.label} gets better the second you realize it is really about ${topic.description.toLowerCase().replace(/\.$/, '')}.`
    : `${topic.label} looks separate from everything else, but it is really ${frame.lens}.`;
  const core = parentLabel
    ? `Inside ${parentLabel}, this branch matters because it changes what you can notice and what you can ask next.`
    : `${topic.label} matters because it sharpens your grip on patterns, causes, and tradeoffs instead of leaving them fuzzy.`;
  const analogy = interestHint
    ? `If ${interestHint} already pulls you in, treat ${topic.label} like that same instinct after someone tuned it for clarity and force.`
    : `A good way to hold it is like swapping in a better lens: the world does not change, but the hidden structure finally starts outlining itself.`;
  const example = topic.description
    ? `In practice, you feel it when ${topic.description.toLowerCase().replace(/\.$/, '')} stops sounding like trivia and starts behaving like a repeatable pattern.`
    : `You feel it the moment an example stops looking random and starts looking inevitable.`;
  const teaser = ageGroup === 'little_explorer'
    ? `The best part is that one more step usually reveals an even stranger question hiding underneath.`
    : `The real doorway opens when ${frame.doorway}.`;

  return `${hook} ${core}\n\n${analogy} ${example}\n\n${teaser}`;
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

const DOMAIN_CHILD_BLUEPRINTS = {
  math: [
    { kind: 'foundation', makeLabel: (label) => `Why ${label} works`, makeDescription: (label) => `The hidden structure that makes ${label.toLowerCase()} feel less arbitrary.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'visual', makeLabel: (label) => `Seeing ${label}`, makeDescription: (label) => `The picture or pattern that makes ${label.toLowerCase()} click faster.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'paradox', makeLabel: (label) => `${label} paradoxes`, makeDescription: (label) => `Where intuition breaks and ${label.toLowerCase()} starts getting genuinely weird.`, difficulty: 'advanced', surpriseFactor: true },
    { kind: 'connection', makeLabel: (label, topic) => `${label} and ${inferCrossDomain(topic)}`, makeDescription: (label, topic) => `A sideways route from ${label.toLowerCase()} into ${inferCrossDomain(topic)}.`, difficulty: 'intermediate', surpriseFactor: true },
  ],
  science: [
    { kind: 'mechanism', makeLabel: (label) => `Mechanisms behind ${label}`, makeDescription: (label) => `The physical causes doing the work beneath ${label.toLowerCase()}.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'experiment', makeLabel: (label) => `Testing ${label}`, makeDescription: () => `The experiment that would most quickly reveal whether your intuition is right.`, difficulty: 'intermediate', surpriseFactor: false },
    { kind: 'edge', makeLabel: (label) => `Where ${label} breaks`, makeDescription: (label) => `The edge cases where the neat story around ${label.toLowerCase()} stops being enough.`, difficulty: 'advanced', surpriseFactor: true },
    { kind: 'connection', makeLabel: (label) => `${label} and philosophy`, makeDescription: (label) => `The conceptual questions hiding underneath ${label.toLowerCase()}.`, difficulty: 'intermediate', surpriseFactor: true },
  ],
  cs: [
    { kind: 'mental_model', makeLabel: (label) => `${label} mental models`, makeDescription: (label) => `The abstraction that makes ${label.toLowerCase()} feel more tractable.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'systems', makeLabel: (label) => `${label} at scale`, makeDescription: (label) => `What changes when ${label.toLowerCase()} stops being toy-sized.`, difficulty: 'intermediate', surpriseFactor: false },
    { kind: 'failure', makeLabel: (label) => `Failure modes in ${label}`, makeDescription: (label) => `Where ${label.toLowerCase()} gets brittle, leaky, or expensive.`, difficulty: 'advanced', surpriseFactor: true },
    { kind: 'connection', makeLabel: (label) => `${label} and language`, makeDescription: (label) => `How ${label.toLowerCase()} depends on representation, grammar, and interpretation.`, difficulty: 'intermediate', surpriseFactor: true },
  ],
  art: [
    { kind: 'craft', makeLabel: (label) => `Craft inside ${label}`, makeDescription: (label) => `The concrete choices that make ${label.toLowerCase()} feel intentional.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'taste', makeLabel: (label) => `What makes ${label} sing`, makeDescription: (label) => `The difference between competent ${label.toLowerCase()} and unforgettable ${label.toLowerCase()}.`, difficulty: 'intermediate', surpriseFactor: false },
    { kind: 'subversion', makeLabel: (label) => `Breaking ${label} on purpose`, makeDescription: (label) => `How rule-breaking can make ${label.toLowerCase()} more alive instead of worse.`, difficulty: 'advanced', surpriseFactor: true },
    { kind: 'connection', makeLabel: (label) => `${label} and memory`, makeDescription: (label) => `Why certain choices in ${label.toLowerCase()} stick in the body and not just the eye.`, difficulty: 'intermediate', surpriseFactor: true },
  ],
  history: [
    { kind: 'forces', makeLabel: (label) => `Forces behind ${label}`, makeDescription: (label) => `The incentives and pressures that made ${label.toLowerCase()} more likely.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'people', makeLabel: (label) => `Lives inside ${label}`, makeDescription: (label) => `What ${label.toLowerCase()} felt like from inside ordinary lives.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'counterfactual', makeLabel: (label) => `If ${label} had gone differently`, makeDescription: (label) => `The alternate path that shows what was contingent about ${label.toLowerCase()}.`, difficulty: 'advanced', surpriseFactor: true },
    { kind: 'connection', makeLabel: (label) => `${label} in today’s world`, makeDescription: (label) => `The live wires from ${label.toLowerCase()} into the present.`, difficulty: 'intermediate', surpriseFactor: true },
  ],
  philosophy: [
    { kind: 'question', makeLabel: (label) => `The core question in ${label}`, makeDescription: (label) => `The exact puzzle ${label.toLowerCase()} is trying to sharpen.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'argument', makeLabel: (label) => `Best arguments for ${label}`, makeDescription: (label) => `The strongest case that makes ${label.toLowerCase()} hard to dismiss.`, difficulty: 'intermediate', surpriseFactor: false },
    { kind: 'objection', makeLabel: (label) => `Objections to ${label}`, makeDescription: (label) => `The attack that exposes the weak seams in ${label.toLowerCase()}.`, difficulty: 'advanced', surpriseFactor: true },
    { kind: 'connection', makeLabel: (label) => `${label} and science`, makeDescription: (label) => `Where ${label.toLowerCase()} collides with evidence, models, and method.`, difficulty: 'intermediate', surpriseFactor: true },
  ],
  default: [
    { kind: 'foundation', makeLabel: (label) => `${label} fundamentals`, makeDescription: (label) => `The core ideas that make ${label.toLowerCase()} click quickly.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'applications', makeLabel: (label) => `${label} in real life`, makeDescription: (label) => `Concrete places where ${label.toLowerCase()} shows up outside the textbook.`, difficulty: 'beginner', surpriseFactor: false },
    { kind: 'misconceptions', makeLabel: (label) => `Misunderstanding ${label}`, makeDescription: () => `The wrong intuition most people carry before the deeper picture appears.`, difficulty: 'intermediate', surpriseFactor: true },
    { kind: 'connection', makeLabel: (label, topic) => `${label} and ${inferCrossDomain(topic)}`, makeDescription: (label, topic) => `A sideways branch that makes ${label.toLowerCase()} feel unexpectedly connected to ${inferCrossDomain(topic)}.`, difficulty: 'advanced', surpriseFactor: true },
  ],
};

function generateHeuristicChildren(topic) {
  const label = topic.label;
  const path = topic.path || [label];
  const blueprint = DOMAIN_CHILD_BLUEPRINTS[topic.domain] || DOMAIN_CHILD_BLUEPRINTS.default;
  return blueprint.map((entry) => {
    const childLabel = entry.makeLabel(label, topic);
    return {
      id: `${normalizeTopicKey(label)}_${entry.kind}`,
      label: childLabel,
      description: entry.makeDescription(label, topic),
      kind: entry.kind,
      difficulty: entry.difficulty,
      surpriseFactor: entry.surpriseFactor,
      domain: topic.domain,
      path: [...path, childLabel],
    };
  });
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
