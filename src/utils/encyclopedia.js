function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TOPIC_LIBRARY = {
  science: ['black holes', 'climate change', 'plate tectonics', 'evolution', 'CRISPR', 'quantum mechanics', 'neuroscience', 'immunology', 'dark matter', 'photosynthesis', 'epigenetics', 'vaccines', 'sleep science', 'ocean currents', 'gravity'],
  math: ['calculus', 'linear algebra', 'probability', 'statistics', 'game theory', 'graph theory', 'number theory', 'chaos theory', 'bayes theorem', 'optimization', 'fractals', 'topology', 'cryptography math', 'infinity', 'prime numbers'],
  cs: ['artificial intelligence', 'machine learning', 'algorithms', 'data structures', 'databases', 'distributed systems', 'operating systems', 'computer networks', 'cybersecurity', 'blockchain', 'computer vision', 'natural language processing', 'compilers', 'cloud computing', 'web architecture'],
  history: ['roman empire', 'industrial revolution', 'cold war', 'renaissance', 'silk road', 'french revolution', 'world war i', 'world war ii', 'civil rights movement', 'history of medicine', 'history of computing', 'history of democracy', 'decolonization', 'ancient egypt', 'history of trade'],
  art: ['impressionism', 'renaissance art', 'street art', 'color theory', 'photography', 'sculpture', 'design thinking', 'architecture styles', 'film language', 'storyboarding', 'fashion design', 'digital art', 'animation principles', 'ceramics', 'typography'],
  music: ['music theory', 'jazz harmony', 'rhythm', 'songwriting', 'film scoring', 'sound design', 'orchestration', 'electronic music', 'music production', 'history of hip hop', 'classical music', 'ear training', 'counterpoint', 'improvisation', 'audio engineering'],
  philosophy: ['stoicism', 'ethics', 'epistemology', 'free will', 'existentialism', 'philosophy of mind', 'philosophy of science', 'logic', 'utilitarianism', 'phenomenology', 'political philosophy', 'metaphysics', 'aesthetics', 'nihilism', 'pragmatism'],
  engineering: ['control systems', 'thermodynamics', 'materials science', 'aerodynamics', 'electrical circuits', 'signal processing', 'robotics', 'civil engineering', 'mechanical design', 'renewable energy', 'semiconductors', 'manufacturing systems', 'systems engineering', 'bioengineering', 'structural analysis'],
  languages: ['linguistics', 'language acquisition', 'phonetics', 'etymology', 'syntax', 'semantics', 'bilingualism', 'translation theory', 'sociolinguistics', 'historical linguistics', 'writing systems', 'language and identity', 'pragmatics', 'dialects', 'language change'],
  literature: ['shakespeare', 'poetry analysis', 'narrative structure', 'mythology', 'science fiction', 'literary criticism', 'postmodernism', 'world literature', 'short story craft', 'character development', 'symbolism', 'magical realism', 'oral traditions', 'memoir writing', 'drama'],
  economics: ['inflation', 'monetary policy', 'market structures', 'behavioral economics', 'game theory economics', 'international trade', 'labor economics', 'economic inequality', 'public finance', 'development economics', 'financial markets', 'supply chains', 'economic history', 'risk management', 'macro cycles'],
  business: ['product strategy', 'startup fundamentals', 'go to market', 'pricing strategy', 'brand strategy', 'unit economics', 'growth loops', 'user research', 'team leadership', 'operations strategy', 'negotiation', 'decision making', 'venture capital', 'business models', 'platform strategy'],
};

const DOMAIN_PLAYBOOK = {
  default: ['core idea', 'how it works', 'real-world applications', 'common misconceptions', 'advanced frontier', 'related disciplines'],
  science: ['core mechanism', 'evidence and experiments', 'everyday implications', 'major debates', 'frontier research', 'cross-domain links'],
  math: ['foundational intuition', 'formal structure', 'worked examples', 'classic pitfalls', 'advanced theorems', 'where it appears in practice'],
  cs: ['system model', 'algorithmic tradeoffs', 'failure modes', 'hands-on implementation', 'scaling concerns', 'future directions'],
  history: ['historical context', 'key turning points', 'lived experience', 'contested interpretations', 'long-term effects', 'connections to today'],
  art: ['visual language', 'creative process', 'historical influences', 'interpretation lenses', 'technical craft', 'modern remixes'],
  music: ['listening framework', 'underlying theory', 'composition techniques', 'performance practice', 'production perspective', 'genre crossovers'],
};

function sentenceCase(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildSummary(topic, domain) {
  return `${sentenceCase(topic)} is a key idea in ${domain} that becomes clearer when you study mechanism, context, and real-world impact together.`;
}

function toId(topic) {
  return normalize(topic).replace(/\s+/g, '_');
}

const ENCYCLOPEDIA_TOPICS = Object.entries(TOPIC_LIBRARY).flatMap(([domain, topics]) =>
  topics.map((topic) => ({
    id: `ency_${domain}_${toId(topic)}`,
    label: sentenceCase(topic),
    domain,
    description: buildSummary(topic, domain),
  })),
);

export function searchEncyclopediaTopics(query, limit = 20) {
  const normalized = normalize(query);
  if (!normalized) return ENCYCLOPEDIA_TOPICS.slice(0, limit);
  const scored = ENCYCLOPEDIA_TOPICS
    .map((topic) => {
      const label = normalize(topic.label);
      if (label === normalized) return { topic, score: 1 };
      if (label.startsWith(normalized)) return { topic, score: 0.9 };
      if (label.includes(normalized)) return { topic, score: 0.7 };
      return { topic, score: 0 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.topic);
}

export function getEncyclopediaTopic(term) {
  const [match] = searchEncyclopediaTopics(term, 1);
  return match || null;
}

export function getEncyclopediaChildren(topic) {
  const domain = topic?.domain || 'default';
  const lenses = DOMAIN_PLAYBOOK[domain] || DOMAIN_PLAYBOOK.default;
  const baseLabel = topic?.label || 'This topic';
  const basePath = topic?.path || [baseLabel];

  return lenses.map((lens, index) => ({
    id: `${toId(baseLabel)}_${toId(lens)}_${index + 1}`,
    label: `${sentenceCase(baseLabel)}: ${sentenceCase(lens)}`,
    description: `${sentenceCase(lens)} for ${baseLabel} — what matters, why it matters, and what to explore next.`,
    kind: index === 0 ? 'question' : index === 1 ? 'mechanism' : index === 2 ? 'connection' : index === 3 ? 'objection' : index === 4 ? 'paradox' : 'connection',
    difficulty: index < 2 ? 'beginner' : index < 4 ? 'intermediate' : 'advanced',
    surpriseFactor: index >= 4,
    domain: topic?.domain || 'general',
    path: [...basePath, `${sentenceCase(baseLabel)}: ${sentenceCase(lens)}`],
  }));
}

export function getEncyclopediaExplainer(topic) {
  const domain = topic?.domain || 'general';
  const label = topic?.label || 'This topic';
  const summary = topic?.description || buildSummary(label, domain);
  return `${summary}\n\nThe fastest way to understand ${label} is to move through three layers: what it is, how it works, and where it changes real decisions.\n\nIf you keep going deeper, focus on frontier debates and cross-domain connections where ${label} gets most interesting.`;
}
