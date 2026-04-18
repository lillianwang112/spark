// ── Age Groups ──
export const AGE_GROUPS = {
  LITTLE_EXPLORER: 'little_explorer',
  STUDENT: 'student',
  COLLEGE: 'college',
  ADULT: 'adult',
};

// ── Personalities ──
export const PERSONALITIES = {
  SPARK: 'spark',
  SAGE: 'sage',
  EXPLORER: 'explorer',
  PROFESSOR: 'professor',
};

// ── Domains ──
export const DOMAINS = [
  'math', 'science', 'cs', 'art', 'music', 'history',
  'literature', 'philosophy', 'engineering', 'languages',
  'cooking', 'sports', 'dance', 'film', 'architecture',
];

export const DOMAIN_LABELS = {
  math: 'Mathematics',
  science: 'Science',
  cs: 'Computer Science',
  art: 'Art & Design',
  music: 'Music',
  history: 'History',
  literature: 'Literature',
  philosophy: 'Philosophy',
  engineering: 'Engineering',
  languages: 'Languages',
  cooking: 'Cooking',
  sports: 'Sports & Movement',
  dance: 'Dance',
  film: 'Film',
  architecture: 'Architecture',
};

// ── Domain Colors (matches CSS vars) ──
export const DOMAIN_COLORS = {
  math:         '#2B59C3',
  science:      '#2D936C',
  cs:           '#5B5EA6',
  art:          '#E07A5F',
  music:        '#7B2D8B',
  history:      '#8B6914',
  literature:   '#C1666B',
  philosophy:   '#4A6FA5',
  engineering:  '#D4A373',
  languages:    '#3A7D44',
  cooking:      '#D35400',
  sports:       '#27AE60',
  dance:        '#E74C8B',
  film:         '#2C3E50',
  architecture: '#8E6F47',
};

// ── Domain Emojis ──
export const DOMAIN_EMOJIS = {
  math:         '∑',
  science:      '🔬',
  cs:           '💻',
  art:          '🎨',
  music:        '🎵',
  history:      '📜',
  literature:   '📚',
  philosophy:   '💭',
  engineering:  '⚙️',
  languages:    '🌍',
  cooking:      '🍳',
  sports:       '⚡',
  dance:        '💃',
  film:         '🎬',
  architecture: '🏛️',
};

// ── Knowledge States ──
export const KNOWLEDGE_STATES = {
  NEW: 'new',
  HEARD_OF: 'heard_of',
  KNOW_LITTLE: 'know_little',
  KNOW_WELL: 'know_well',
};

export const KNOWLEDGE_STATE_LABELS = {
  adult: {
    new:          { emoji: '✨', label: 'Totally new' },
    heard_of:     { emoji: '👂', label: 'Heard of it' },
    know_little:  { emoji: '🌱', label: 'Know a little' },
    know_well:    { emoji: '✅', label: 'Know this well' },
  },
  kids: {
    new:          { emoji: '✨', label: 'Never seen this!' },
    heard_of:     { emoji: '🤔', label: 'Sounds familiar' },
    know_little:  { emoji: '👍', label: 'I know a bit!' },
    know_well:    { emoji: '🌟', label: 'I know this one!' },
  },
};

// ── Branch States ──
export const BRANCH_STATES = {
  FLOWERING: 'flowering',
  HEALTHY: 'healthy',
  THIRSTY: 'thirsty',
  WILTING: 'wilting',
  DORMANT: 'dormant',
};

// ── Branch Timing Thresholds (days) — configurable ──
export const BRANCH_THRESHOLDS = {
  HEALTHY_TO_THIRSTY_SRS: 3,    // SRS overdue by this many days
  HEALTHY_TO_THIRSTY_IDLE: 14,  // No exploration for this many days
  THIRSTY_TO_WILTING_SRS: 14,   // SRS overdue by this many days
  THIRSTY_TO_WILTING_IDLE: 30,
  WILTING_TO_DORMANT_IDLE: 60,
};

// ── Tree Growth Stages ──
export const TREE_STAGES = {
  SEED:    { min: 0,   max: 19,   label: 'Seed',    emoji: '🌱' },
  SAPLING: { min: 20,  max: 99,   label: 'Sapling', emoji: '🌿' },
  GROWING: { min: 100, max: 499,  label: 'Growing', emoji: '🌳' },
  ROOTED:  { min: 500, max: 1999, label: 'Rooted',  emoji: '🌲' },
  ANCIENT: { min: 2000, max: Infinity, label: 'Ancient', emoji: '✨' },
};

// ── Elo Config ──
export const ELO_CONFIG = {
  K: 32,
  BASE: 1500,
  RECENCY_BOOST: 1.2,
};

// ── Discovery Config ──
export const DISCOVERY_CONFIG = {
  CARDS_PER_ROUND: 4,
  DEFAULT_ROUNDS: 5,   // Configurable, needs playtesting
  TRACKS_SAVE_BONUS: 64, // Equivalent to winning 2 comparisons
};

// ── Learning Preferences ──
export const LEARNING_PREFS = {
  VISUAL: 'visual',
  KINESTHETIC: 'kinesthetic',
  TEXT: 'text',
  AUDIO: 'audio',
};

// ── Mode (Exploring vs Mastering) ──
export const MODES = {
  EXPLORING: 'exploring',
  MASTERING: 'mastering',
};

// ── Badges ──
export const BADGES = [
  { id: 'cartographer', title: 'The Cartographer', emoji: '🗺️', description: '10+ domains explored' },
  { id: 'spelunker',    title: 'The Spelunker',    emoji: '🔦', description: '7+ levels deep' },
  { id: 'polymath',     title: 'The Polymath',     emoji: '🧠', description: '5+ unrelated tracks' },
  { id: 'rabbit',       title: 'The Rabbit',       emoji: '🐰', description: '3+ unrelated detours' },
  { id: 'architect',    title: 'The Architect',    emoji: '📐', description: 'Longest branch in your tree' },
  { id: 'first_principles', title: 'First Principles', emoji: '🔍', description: 'Drills to foundations before saving' },
];

// ── AI Prompt Types ──
export const PROMPT_TYPES = {
  DISCOVERY_CARDS: 'discoveryCards',
  NODE_CHILDREN: 'nodeChildren',
  EXPLAINER: 'explainer',
  PERSONALITY_SUMMARY: 'personalitySummary',
  JOURNEY_NARRATIVE: 'journeyNarrative',
};

export const BRANCH_TYPE_STYLES = {
  foundation:   { label: 'Foundations', shortLabel: 'Base layer', emoji: '🪜' },
  visual:       { label: 'Visual Pattern', shortLabel: 'See it', emoji: '👁️' },
  paradox:      { label: 'Paradox', shortLabel: 'Gets weird', emoji: '🌀' },
  connection:   { label: 'Cross Connection', shortLabel: 'Sideways leap', emoji: '🌉' },
  mechanism:    { label: 'Mechanism', shortLabel: 'How it works', emoji: '⚙️' },
  experiment:   { label: 'Experiment', shortLabel: 'Test it', emoji: '🧪' },
  edge:         { label: 'Edge Case', shortLabel: 'Where it breaks', emoji: '⚠️' },
  mental_model: { label: 'Mental Model', shortLabel: 'Hold it better', emoji: '🧠' },
  systems:      { label: 'At Scale', shortLabel: 'Scale test', emoji: '🌐' },
  failure:      { label: 'Failure Mode', shortLabel: 'Brittle point', emoji: '🧯' },
  craft:        { label: 'Craft Move', shortLabel: 'Made choice', emoji: '✍️' },
  taste:        { label: 'Taste Signal', shortLabel: 'What sings', emoji: '✨' },
  subversion:   { label: 'Rule Break', shortLabel: 'Break it', emoji: '🎭' },
  forces:       { label: 'Hidden Forces', shortLabel: 'Driving it', emoji: '🌪️' },
  people:       { label: 'Lived View', shortLabel: 'Inside it', emoji: '🫀' },
  counterfactual:{ label: 'Counterfactual', shortLabel: 'If not...', emoji: '⏳' },
  question:     { label: 'Core Question', shortLabel: 'The puzzle', emoji: '❓' },
  argument:     { label: 'Best Argument', shortLabel: 'Strong case', emoji: '🗣️' },
  objection:    { label: 'Objection', shortLabel: 'Push back', emoji: '🪓' },
  applications: { label: 'Real World', shortLabel: 'Use case', emoji: '🧭' },
  misconceptions:{ label: 'Misconception', shortLabel: 'Wrong turn', emoji: '🫣' },
};
