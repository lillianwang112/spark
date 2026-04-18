function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CURATED_RABBIT_HOLES = [
  {
    key: 'black holes',
    aliases: ['black hole', 'event horizon', 'singularity'],
    branches: [
      { label: 'Event horizon physics', description: 'Where spacetime warps so strongly that escape velocity exceeds light speed.', kind: 'mechanism', difficulty: 'intermediate' },
      { label: 'How black holes are detected', description: 'Astronomers infer them from accretion disks, orbital motion, and gravitational waves.', kind: 'experiment', difficulty: 'beginner' },
      { label: 'Hawking radiation puzzle', description: 'Quantum effects imply black holes slowly evaporate, raising information paradox questions.', kind: 'paradox', difficulty: 'advanced', surpriseFactor: true },
      { label: 'Supermassive black holes and galaxies', description: 'Galaxy evolution appears tightly coupled to growth of central black holes.', kind: 'connection', difficulty: 'intermediate' },
      { label: 'What happens if Earth had one nearby?', description: 'A counterfactual that clarifies gravity, tidal forces, and orbital stability.', kind: 'counterfactual', difficulty: 'advanced', surpriseFactor: true },
    ],
  },
  {
    key: 'ai',
    aliases: ['artificial intelligence', 'machine learning', 'neural networks', 'llm', 'chatgpt'],
    branches: [
      { label: 'How models actually learn', description: 'Gradient descent updates weights to reduce prediction error over huge datasets.', kind: 'mechanism', difficulty: 'intermediate' },
      { label: 'Why AI hallucinates', description: 'Models optimize likely wording, not guaranteed truth, unless constrained by tools.', kind: 'failure', difficulty: 'beginner', surpriseFactor: true },
      { label: 'Prompt design as interface design', description: 'Prompting works best when treated like product UX for model behavior.', kind: 'craft', difficulty: 'intermediate' },
      { label: 'AI safety and alignment', description: 'The challenge of getting capable systems to reliably pursue intended goals.', kind: 'objection', difficulty: 'advanced' },
      { label: 'Jobs transformed, not just replaced', description: 'Most impact comes from task-level automation and workflow redesign.', kind: 'connection', difficulty: 'intermediate' },
    ],
  },
  {
    key: 'roman empire',
    aliases: ['rome', 'ancient rome'],
    branches: [
      { label: 'Why Rome scaled governance', description: 'Roads, law, tax systems, and military logistics enabled durable imperial control.', kind: 'systems', difficulty: 'beginner' },
      { label: 'Republic to empire transition', description: 'Civil wars and institutional strain shifted power from senate to emperors.', kind: 'question', difficulty: 'intermediate' },
      { label: 'Everyday life in Roman cities', description: 'Urban infrastructure, class hierarchy, and public entertainment shaped daily behavior.', kind: 'connection', difficulty: 'beginner' },
      { label: 'Why the Western Empire collapsed', description: 'A mix of fiscal stress, military pressure, and political fragmentation.', kind: 'objection', difficulty: 'intermediate' },
      { label: 'What Rome still influences today', description: 'Legal frameworks, architecture, language, and statecraft still carry Roman DNA.', kind: 'connection', difficulty: 'beginner' },
    ],
  },
  {
    key: 'music theory',
    aliases: ['music', 'harmony', 'melody', 'songwriting'],
    branches: [
      { label: 'Why chord progressions feel emotional', description: 'Expectation and resolution in harmonic movement creates perceived tension and release.', kind: 'mechanism', difficulty: 'beginner' },
      { label: 'Rhythm, groove, and the body', description: 'Syncopation and timing micro-variations change how music feels physically.', kind: 'connection', difficulty: 'intermediate' },
      { label: 'Modes beyond major/minor', description: 'Modal color changes emotional tone without changing root note identity.', kind: 'question', difficulty: 'intermediate' },
      { label: 'Why some melodies become earworms', description: 'Repetition, contour, and predictability drive memory stickiness.', kind: 'experiment', difficulty: 'beginner' },
      { label: 'How film scores manipulate attention', description: 'Composers shape anticipation, fear, and relief through leitmotifs and orchestration.', kind: 'craft', difficulty: 'advanced' },
    ],
  },
  {
    key: 'nutrition',
    aliases: ['diet', 'food science', 'metabolism'],
    branches: [
      { label: 'Energy balance vs hormone signaling', description: 'Calories matter, but appetite and metabolic signaling shape real outcomes.', kind: 'paradox', difficulty: 'intermediate' },
      { label: 'Protein and satiety mechanics', description: 'Protein often reduces hunger by affecting fullness hormones and digestion rate.', kind: 'mechanism', difficulty: 'beginner' },
      { label: 'Gut microbiome and behavior', description: 'Microbes influence digestion, inflammation, and possibly mood through signaling pathways.', kind: 'connection', difficulty: 'advanced', surpriseFactor: true },
      { label: 'Ultra-processed foods and cravings', description: 'Hyper-palatable food design can overpower normal satiety cues.', kind: 'objection', difficulty: 'intermediate' },
      { label: 'How to read nutrition studies', description: 'Distinguish correlation, randomized trials, effect size, and confounders.', kind: 'craft', difficulty: 'intermediate' },
    ],
  },
  {
    key: 'startup',
    aliases: ['startups', 'entrepreneurship', 'business', 'product'],
    branches: [
      { label: 'Finding painful problems worth solving', description: 'Great startups begin with repeated, expensive pain in specific user groups.', kind: 'question', difficulty: 'beginner' },
      { label: 'Distribution beats features', description: 'Many products fail not from quality but from weak acquisition channels.', kind: 'paradox', difficulty: 'intermediate', surpriseFactor: true },
      { label: 'PMF signals that actually matter', description: 'Retention, pull-through behavior, and willingness to pay reveal real fit.', kind: 'mechanism', difficulty: 'intermediate' },
      { label: 'Unit economics before hyper-growth', description: 'Growth without healthy margins can scale losses faster than learning.', kind: 'objection', difficulty: 'advanced' },
      { label: 'Founder psychology under uncertainty', description: 'Decision quality often depends on emotional regulation, not just strategy.', kind: 'connection', difficulty: 'intermediate' },
    ],
  },
  {
    key: 'chess',
    aliases: ['chess openings', 'endgames', 'tactics'],
    branches: [
      { label: 'Pattern recognition in tactics', description: 'Forks, pins, and discovered attacks become automatic through chunked patterns.', kind: 'mechanism', difficulty: 'beginner' },
      { label: 'Opening principles vs memorization', description: 'Understanding structures usually outperforms blind move memorization.', kind: 'paradox', difficulty: 'intermediate' },
      { label: 'Endgames that decide real games', description: 'King activity and pawn races convert slight advantages into wins.', kind: 'question', difficulty: 'intermediate' },
      { label: 'How engines changed human style', description: 'Computer evaluations normalized counterintuitive yet precise moves.', kind: 'connection', difficulty: 'advanced' },
      { label: 'Building a training loop that works', description: 'Review blunders, solve themed puzzles, and annotate your own games.', kind: 'craft', difficulty: 'beginner' },
    ],
  },
];

const DOMAIN_PACKS = {
  science: ['mechanism', 'experiment', 'counterfactual', 'connection', 'paradox'],
  math: ['question', 'mechanism', 'paradox', 'connection', 'experiment'],
  cs: ['mechanism', 'failure', 'connection', 'experiment', 'craft'],
  history: ['question', 'connection', 'objection', 'counterfactual', 'systems'],
  art: ['craft', 'question', 'connection', 'paradox', 'experiment'],
};

function buildDescription(topicLabel, branchLabel, kind) {
  const templates = {
    question: `${branchLabel} frames the core question that unlocks ${topicLabel} at a deeper level.`,
    mechanism: `${branchLabel} reveals the underlying mechanism behind ${topicLabel}, step by step.`,
    connection: `${branchLabel} links ${topicLabel} to another field so the idea becomes more useful.`,
    experiment: `${branchLabel} turns ${topicLabel} into something testable you can actually try.`,
    counterfactual: `${branchLabel} stress-tests ${topicLabel} by changing one assumption and observing what breaks.`,
    paradox: `${branchLabel} exposes the counterintuitive edge where ${topicLabel} gets truly interesting.`,
    craft: `${branchLabel} focuses on practical craft decisions used by experts in ${topicLabel}.`,
    failure: `${branchLabel} studies how ${topicLabel} fails in the real world and why.`,
    objection: `${branchLabel} challenges common claims in ${topicLabel} and checks them against evidence.`,
    systems: `${branchLabel} maps the interacting systems that make ${topicLabel} behave the way it does.`,
  };
  return templates[kind] || templates.connection;
}

export function getCuratedRabbitHoles(topic) {
  const normalizedLabel = normalize(topic?.label);
  if (!normalizedLabel) return [];

  const exact = CURATED_RABBIT_HOLES.find((entry) =>
    normalize(entry.key) === normalizedLabel || entry.aliases.some((alias) => normalize(alias) === normalizedLabel),
  );

  const fuzzy = CURATED_RABBIT_HOLES.find((entry) =>
    normalizedLabel.includes(normalize(entry.key))
    || entry.aliases.some((alias) => normalizedLabel.includes(normalize(alias))),
  );

  const selected = exact || fuzzy;
  if (!selected) return [];

  return selected.branches.map((branch, index) => ({
    id: `${normalize(selected.key)}_${index}_${normalize(branch.label).replace(/\s+/g, '_')}`,
    label: branch.label,
    description: branch.description,
    kind: branch.kind || 'connection',
    difficulty: branch.difficulty || 'intermediate',
    surpriseFactor: Boolean(branch.surpriseFactor),
    domain: topic.domain || 'general',
    path: [...(topic.path || [topic.label]), branch.label],
  }));
}

export function buildDomainRabbitHoles(topic) {
  const topicLabel = topic?.label;
  if (!topicLabel) return [];
  const sequence = DOMAIN_PACKS[topic.domain] || ['question', 'mechanism', 'connection', 'experiment', 'paradox'];
  const labels = [
    `${topicLabel} in real systems`,
    `How ${topicLabel} actually works`,
    `${topicLabel} misconceptions`,
    `Hands-on ${topicLabel} experiment`,
    `${topicLabel} edge cases`,
  ];

  return sequence.map((kind, index) => {
    const label = labels[index] || `${topicLabel} thread ${index + 1}`;
    return {
      id: `${normalize(topicLabel)}_${kind}_${index + 1}`,
      label,
      description: buildDescription(topicLabel, label, kind),
      kind,
      difficulty: index < 2 ? 'beginner' : index < 4 ? 'intermediate' : 'advanced',
      surpriseFactor: kind === 'paradox' || kind === 'counterfactual' || kind === 'failure',
      domain: topic.domain || 'general',
      path: [...(topic.path || [topic.label]), label],
    };
  });
}
