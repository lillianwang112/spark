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
  'literature', 'philosophy', 'economics', 'engineering', 'languages',
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
  economics: 'Finance & Economics',
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
  economics:    '#0E9F6E',
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
  economics:    '💹',
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
export const BADGE_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export const TIER_STYLES = {
  bronze:   { color: '#CD7F32', glow: 'rgba(205,127,50,0.35)',  label: 'Bronze',   star: '🥉' },
  silver:   { color: '#9EA8B8', glow: 'rgba(158,168,184,0.35)', label: 'Silver',   star: '🥈' },
  gold:     { color: '#F5C518', glow: 'rgba(245,197,24,0.40)',  label: 'Gold',     star: '🥇' },
  platinum: { color: '#70C8D4', glow: 'rgba(112,200,212,0.40)', label: 'Platinum', star: '💎' },
  diamond:  { color: '#9B6FE8', glow: 'rgba(155,111,232,0.45)', label: 'Diamond',  star: '💠' },
};

export const BADGE_SYSTEM = [
  {
    id: 'depth_diver',
    title: 'Depth Diver',
    emoji: '🤿',
    description: 'Follow ideas deeper and deeper',
    getValue: (stats) => stats.maxDepth,
    tiers: [
      { tier: 'bronze',   label: 'Paddler',      description: 'Reach 3 levels deep',  threshold: 3  },
      { tier: 'silver',   label: 'Diver',         description: 'Reach 5 levels deep',  threshold: 5  },
      { tier: 'gold',     label: 'Deep Diver',    description: 'Reach 7 levels deep',  threshold: 7  },
      { tier: 'platinum', label: 'Abyss Walker',  description: 'Reach 10 levels deep', threshold: 10 },
      { tier: 'diamond',  label: 'Mariana',        description: 'Reach 15 levels deep', threshold: 15 },
    ],
  },
  {
    id: 'world_builder',
    title: 'World Builder',
    emoji: '🌍',
    description: 'Explore ideas across many domains',
    getValue: (stats) => stats.distinctDomains,
    tiers: [
      { tier: 'bronze',   label: 'Tourist',      description: 'Explore 2 domains',  threshold: 2  },
      { tier: 'silver',   label: 'Traveler',      description: 'Explore 4 domains',  threshold: 4  },
      { tier: 'gold',     label: 'Cartographer',  description: 'Explore 6 domains',  threshold: 6  },
      { tier: 'platinum', label: 'Globe Trotter', description: 'Explore 9 domains',  threshold: 9  },
      { tier: 'diamond',  label: 'Omnivore',      description: 'Explore 12 domains', threshold: 12 },
    ],
  },
  {
    id: 'thread_keeper',
    title: 'Thread Keeper',
    emoji: '🧵',
    description: 'Grow your collection of saved tracks',
    getValue: (stats) => stats.tracksCount,
    tiers: [
      { tier: 'bronze',   label: 'Collector',     description: 'Save 3 tracks',  threshold: 3  },
      { tier: 'silver',   label: 'Curator',        description: 'Save 8 tracks',  threshold: 8  },
      { tier: 'gold',     label: 'Archivist',      description: 'Save 15 tracks', threshold: 15 },
      { tier: 'platinum', label: 'Librarian',      description: 'Save 30 tracks', threshold: 30 },
      { tier: 'diamond',  label: 'Encyclopedist',  description: 'Save 50 tracks', threshold: 50 },
    ],
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    emoji: '🔥',
    description: 'Keep your learning streak alive',
    getValue: (stats) => stats.streak,
    tiers: [
      { tier: 'bronze',   label: 'Sparked',        description: '3-day streak',   threshold: 3  },
      { tier: 'silver',   label: 'On Fire',         description: '7-day streak',   threshold: 7  },
      { tier: 'gold',     label: 'Blazing',         description: '14-day streak',  threshold: 14 },
      { tier: 'platinum', label: 'Unstoppable',     description: '30-day streak',  threshold: 30 },
      { tier: 'diamond',  label: 'Eternal Flame',   description: '60-day streak',  threshold: 60 },
    ],
  },
  {
    id: 'polymath',
    title: 'Polymath',
    emoji: '🧠',
    description: 'Build genuine breadth across disciplines',
    getValue: (stats) => Math.min(stats.distinctDomains, Math.floor(stats.tracksCount / 3)),
    tiers: [
      { tier: 'bronze',   label: 'Curious Mind',   description: 'Breadth score of 2',  threshold: 2  },
      { tier: 'silver',   label: 'Scholar',         description: 'Breadth score of 3',  threshold: 3  },
      { tier: 'gold',     label: 'Polymath',        description: 'Breadth score of 5',  threshold: 5  },
      { tier: 'platinum', label: 'Renaissance',     description: 'Breadth score of 7',  threshold: 7  },
      { tier: 'diamond',  label: 'Leonardo',        description: 'Breadth score of 10', threshold: 10 },
    ],
  },
  {
    id: 'rabbit_hole',
    title: 'Rabbit Hole',
    emoji: '🐰',
    description: 'Chase ideas across unexpected domain jumps',
    getValue: (stats) => stats.distinctDomainJumps,
    tiers: [
      { tier: 'bronze',   label: 'Curious',        description: '3 domain jumps',   threshold: 3  },
      { tier: 'silver',   label: 'Wanderer',        description: '6 domain jumps',   threshold: 6  },
      { tier: 'gold',     label: 'Rabbit',          description: '10 domain jumps',  threshold: 10 },
      { tier: 'platinum', label: 'Nomad',           description: '15 domain jumps',  threshold: 15 },
      { tier: 'diamond',  label: 'Chaos Agent',     description: '25 domain jumps',  threshold: 25 },
    ],
  },
  {
    id: 'scholar',
    title: 'Scholar',
    emoji: '📚',
    description: 'Master topics deeply, not just broadly',
    getValue: (stats) => stats.knowWellCount,
    tiers: [
      { tier: 'bronze',   label: 'Student',        description: 'Know 2 topics well',  threshold: 2  },
      { tier: 'silver',   label: 'Graduate',        description: 'Know 5 topics well',  threshold: 5  },
      { tier: 'gold',     label: 'Scholar',         description: 'Know 10 topics well', threshold: 10 },
      { tier: 'platinum', label: 'Expert',          description: 'Know 20 topics well', threshold: 20 },
      { tier: 'diamond',  label: 'Sage',            description: 'Know 35 topics well', threshold: 35 },
    ],
  },
  {
    id: 'architect',
    title: 'Architect',
    emoji: '📐',
    description: 'Build deep, structured chains of knowledge',
    getValue: (stats) => stats.deepSavesCount,
    tiers: [
      { tier: 'bronze',   label: 'Builder',        description: '1 track 4+ levels deep',   threshold: 1  },
      { tier: 'silver',   label: 'Engineer',        description: '3 tracks 4+ levels deep',  threshold: 3  },
      { tier: 'gold',     label: 'Architect',       description: '7 tracks 4+ levels deep',  threshold: 7  },
      { tier: 'platinum', label: 'Mastermind',      description: '12 tracks 4+ levels deep', threshold: 12 },
      { tier: 'diamond',  label: 'Grand Architect', description: '20 tracks 4+ levels deep', threshold: 20 },
    ],
  },
];

// Legacy alias — use BADGE_SYSTEM for new code
export const BADGES = BADGE_SYSTEM;

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
