// ── Demo Profile ──────────────────────────────────────────────────────────────
// Rich dataset for live demos. Load via loadDemoProfile() to seed localStorage.
// Today's reference date: April 18 2026.

// ── Helper: ISO dates relative to April 18 2026 ──────────────────────────────
const ref = new Date('2026-04-18T00:00:00.000Z');
function daysAgo(n) {
  const d = new Date(ref);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysFromNow(n) {
  const d = new Date(ref);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ── User ──────────────────────────────────────────────────────────────────────
const user = {
  name: 'Alex Chen',
  ageGroup: 'college',
  personality: 'spark',
  onboardingComplete: true,
  stats: {
    nodesExplored: 47,
  },
};

// ── Tracks ────────────────────────────────────────────────────────────────────
// 20 tracks across 7 domains. Dates spread across last 3 months.
const tracks = [
  // ── Math (5) ──────────────────────────────────────────────────
  {
    id: 'riemann_hypothesis',
    label: 'Riemann Hypothesis',
    domain: 'math',
    path: [
      'Mathematics',
      'Number Theory',
      'Prime Numbers',
      'Distribution of Primes',
      'Riemann Hypothesis',
    ],
    description:
      'The conjecture that all non-trivial zeros of the Riemann zeta function lie on the critical line Re(s) = ½ — the deepest open problem connecting primes and complex analysis.',
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(84),
    lastTended: daysAgo(14),
  },
  {
    id: 'zeros_of_the_zeta_function',
    label: 'Zeros of the Zeta Function',
    domain: 'math',
    path: [
      'Mathematics',
      'Number Theory',
      'Prime Numbers',
      'Distribution of Primes',
      'Riemann Hypothesis',
      'Zeros of the Zeta Function',
    ],
    description:
      'The precise locations in the complex plane where ζ(s) = 0, and why their distribution governs the error term in the Prime Number Theorem.',
    mode: 'mastering',
    saved: true,
    savedAt: daysAgo(76),
    lastTended: daysAgo(9),
  },
  {
    id: 'p_vs_np',
    label: 'P vs NP',
    domain: 'math',
    path: [
      'Mathematics',
      'Computational Complexity',
      'Complexity Classes',
      'P vs NP',
    ],
    description:
      'The central unsolved question of theoretical computer science: whether every problem whose solution can be quickly verified can also be quickly solved.',
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(63),
    lastTended: daysAgo(21),
  },
  {
    id: 'fourier_transforms',
    label: 'Fourier Transforms',
    domain: 'math',
    path: [
      'Mathematics',
      'Analysis',
      'Harmonic Analysis',
      'Fourier Analysis',
      'Fourier Transforms',
    ],
    description:
      'Decomposing a function into a continuous spectrum of frequencies — the mathematical backbone of signal processing, quantum mechanics, and image compression.',
    mode: 'mastering',
    saved: true,
    savedAt: daysAgo(55),
    lastTended: daysAgo(5),
  },
  {
    id: 'godel_incompleteness',
    label: "Gödel's Incompleteness Theorems",
    domain: 'math',
    path: [
      'Mathematics',
      'Logic & Foundations',
      'Mathematical Logic',
      'Formal Systems',
      "Gödel's Incompleteness Theorems",
    ],
    description:
      "Any sufficiently powerful formal system contains true statements it cannot prove. Gödel's 1931 theorems shattered Hilbert's program and redrew the limits of mathematics.",
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(48),
    lastTended: daysAgo(18),
  },

  // ── Science (4) ───────────────────────────────────────────────
  {
    id: 'quantum_entanglement',
    label: 'Quantum Entanglement',
    domain: 'science',
    path: [
      'Science',
      'Physics',
      'Quantum Mechanics',
      'Quantum Phenomena',
      'Quantum Entanglement',
    ],
    description:
      'When two particles share a quantum state such that measuring one instantly determines properties of the other, regardless of distance — "spooky action at a distance."',
    mode: 'mastering',
    saved: true,
    savedAt: daysAgo(72),
    lastTended: daysAgo(7),
  },
  {
    id: 'bells_theorem',
    label: "Bell's Theorem",
    domain: 'science',
    path: [
      'Science',
      'Physics',
      'Quantum Mechanics',
      'Quantum Phenomena',
      'Quantum Entanglement',
      "Bell's Theorem",
    ],
    description:
      "Bell's 1964 proof that no local hidden-variable theory can reproduce all predictions of quantum mechanics — experimentally confirmed by Aspect et al. and the 2022 Nobel Prize.",
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(66),
    lastTended: daysAgo(12),
  },
  {
    id: 'crispr_cas9_mechanism',
    label: 'CRISPR-Cas9 Mechanism',
    domain: 'science',
    path: [
      'Science',
      'Biology',
      'Molecular Biology',
      'Gene Editing',
      'CRISPR-Cas9 Mechanism',
    ],
    description:
      'How a bacterial immune protein became the most precise molecular scissors ever engineered — guide RNA targeting, Cas9 cleavage, and DNA repair pathway hijacking.',
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(41),
    lastTended: daysAgo(25),
  },
  {
    id: 'thermodynamics_entropy',
    label: 'Entropy & the Arrow of Time',
    domain: 'science',
    path: [
      'Science',
      'Physics',
      'Thermodynamics',
      'Statistical Mechanics',
      'Entropy & the Arrow of Time',
    ],
    description:
      'Why does time have a direction? Boltzmann\'s statistical interpretation of entropy as "disorder," and why the Second Law emerges from time-symmetric microscopic physics.',
    mode: 'mastering',
    saved: true,
    savedAt: daysAgo(33),
    lastTended: daysAgo(3),
  },

  // ── CS (3) ────────────────────────────────────────────────────
  {
    id: 'backpropagation',
    label: 'Backpropagation',
    domain: 'cs',
    path: [
      'Computer Science',
      'Machine Learning',
      'Neural Networks',
      'Training Dynamics',
      'Backpropagation',
    ],
    description:
      'The chain-rule algorithm that makes deep learning trainable — computing gradients layer by layer from output to input to update millions of weights efficiently.',
    mode: 'mastering',
    saved: true,
    savedAt: daysAgo(58),
    lastTended: daysAgo(4),
  },
  {
    id: 'rsa_cryptography',
    label: 'RSA Cryptography',
    domain: 'cs',
    path: [
      'Computer Science',
      'Cryptography',
      'Public-Key Cryptography',
      'RSA Cryptography',
    ],
    description:
      'The elegance of using integer factorization hardness to build a one-way trapdoor function — how prime products become the lock and the private key the hidden factorization.',
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(45),
    lastTended: daysAgo(30),
  },
  {
    id: 'dynamic_programming',
    label: 'Dynamic Programming',
    domain: 'cs',
    path: [
      'Computer Science',
      'Algorithms',
      'Optimization Algorithms',
      'Dynamic Programming',
    ],
    description:
      'Breaking overlapping subproblems into memoized substructures — from Bellman equations to the optimal substructure principle that makes DP more than just recursion.',
    mode: 'mastering',
    saved: true,
    savedAt: daysAgo(37),
    lastTended: daysAgo(10),
  },

  // ── Philosophy (3) ────────────────────────────────────────────
  {
    id: 'hard_problem_of_consciousness',
    label: 'Hard Problem of Consciousness',
    domain: 'philosophy',
    path: [
      'Philosophy',
      'Philosophy of Mind',
      'Consciousness',
      'Hard Problem of Consciousness',
    ],
    description:
      "Chalmers' formulation: why does physical processing give rise to subjective experience at all? The explanatory gap between neural correlates and qualia.",
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(80),
    lastTended: daysAgo(22),
  },
  {
    id: 'trolley_problem_variants',
    label: 'Trolley Problem & Its Variants',
    domain: 'philosophy',
    path: [
      'Philosophy',
      'Ethics',
      'Normative Ethics',
      'Consequentialism vs Deontology',
      'Trolley Problem & Its Variants',
    ],
    description:
      'From the footbridge dilemma to the transplant surgeon — how edge cases stress-test utilitarian calculus and reveal the role of intention and proximity in moral judgment.',
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(53),
    lastTended: daysAgo(28),
  },
  {
    id: 'modal_logic',
    label: 'Modal Logic',
    domain: 'philosophy',
    path: [
      'Philosophy',
      'Logic',
      'Formal Logic',
      'Modal Logic',
    ],
    description:
      'Possible worlds semantics and the logic of necessity and possibility — how Kripke frames give truth conditions to statements like "it is necessarily true that…"',
    mode: 'mastering',
    saved: true,
    savedAt: daysAgo(29),
    lastTended: daysAgo(6),
  },

  // ── Music (2) ─────────────────────────────────────────────────
  {
    id: 'functional_harmony',
    label: 'Functional Harmony',
    domain: 'music',
    path: [
      'Music',
      'Music Theory',
      'Harmony',
      'Tonal Harmony',
      'Functional Harmony',
    ],
    description:
      'How tonic, subdominant, and dominant chords create tension and resolution — the gravitational system underlying Western music from Bach to jazz.',
    mode: 'mastering',
    saved: true,
    savedAt: daysAgo(61),
    lastTended: daysAgo(8),
  },
  {
    id: 'bachs_counterpoint',
    label: "Bach's Counterpoint",
    domain: 'music',
    path: [
      'Music',
      'Music Theory',
      'Harmony',
      'Polyphony',
      "Bach's Counterpoint",
    ],
    description:
      'The rules and freedom of species counterpoint as practiced in the Well-Tempered Clavier — voice leading, contrary motion, and the architecture of independent melodic lines.',
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(38),
    lastTended: daysAgo(16),
  },

  // ── Literature (2) ────────────────────────────────────────────
  {
    id: 'narrative_unreliable_narrator',
    label: 'The Unreliable Narrator',
    domain: 'literature',
    path: [
      'Literature',
      'Narrative Theory',
      'Point of View',
      'Narrator Types',
      'The Unreliable Narrator',
    ],
    description:
      "From Stevens in Remains of the Day to Humbert Humbert — how unreliable narration forces readers to read between the lines and reconstruct what 'actually' happened.",
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(50),
    lastTended: daysAgo(20),
  },
  {
    id: 'borges_labyrinths',
    label: 'Borges and the Labyrinth',
    domain: 'literature',
    path: [
      'Literature',
      'Postmodern Fiction',
      'Metafiction',
      'Borges and the Labyrinth',
    ],
    description:
      "Borges' recursive fictions — The Garden of Forking Paths, The Library of Babel — as philosophy of time, infinity, and the book that contains all books.",
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(26),
    lastTended: daysAgo(11),
  },

  // ── History (1) ───────────────────────────────────────────────
  {
    id: 'byzantine_empire_fall',
    label: 'Fall of the Byzantine Empire',
    domain: 'history',
    path: [
      'History',
      'Medieval History',
      'Eastern Roman Empire',
      'Byzantine Decline',
      'Fall of Constantinople 1453',
    ],
    description:
      'The Ottoman siege that ended a millennium of Roman continuity — Greek fire, the Theodosian Walls, Constantine XI, and why 1453 is a hinge point of world history.',
    mode: 'exploring',
    saved: true,
    savedAt: daysAgo(18),
    lastTended: daysAgo(2),
  },
];

// ── Elo Ratings ───────────────────────────────────────────────────────────────
const elo = {
  math:         1820,
  science:      1750,
  cs:           1690,
  philosophy:   1640,
  music:        1580,
  art:          1520,
  literature:   1510,
  history:      1500,
  architecture: 1490,
  engineering:  1488,
  film:         1485,
  languages:    1482,
  cooking:      1480,
};

// ── Knowledge States ──────────────────────────────────────────────────────────
const knowledge = {
  // Math
  riemann_hypothesis:             'know_little',
  zeros_of_the_zeta_function:     'heard_of',
  prime_number_theorem:           'know_little',
  p_vs_np:                        'know_little',
  fourier_transforms:             'know_well',
  godel_incompleteness:           'know_little',
  category_theory:                'heard_of',

  // Science
  quantum_entanglement:           'know_well',
  bells_theorem:                  'heard_of',
  crispr_cas9_mechanism:          'know_little',
  thermodynamics_entropy:         'know_well',
  many_worlds_interpretation:     'heard_of',

  // CS
  backpropagation:                'know_well',
  rsa_cryptography:               'know_little',
  dynamic_programming:            'know_well',
  attention_mechanism:            'heard_of',

  // Philosophy
  hard_problem_of_consciousness:  'know_little',
  trolley_problem_variants:       'know_well',
  modal_logic:                    'heard_of',
  philosophy_of_language:         'heard_of',

  // Music
  functional_harmony:             'know_well',
  bachs_counterpoint:             'know_little',

  // Literature
  narrative_unreliable_narrator:  'know_little',
  borges_labyrinths:              'heard_of',

  // History
  byzantine_empire_fall:          'heard_of',
};

// ── Study Sessions ─────────────────────────────────────────────────────────────
// Reference week: April 13–19 2026 (Mon–Sun)
// Next week:      April 20–26 2026
// Last week:      April 6–12 2026
const DEMO_SESSIONS = [
  // Last week — both completed
  {
    id: 'session_001',
    date: '2026-04-08',
    topicLabel: 'Fourier Transforms',
    topicDomain: 'math',
    duration: 45,
    type: 'deep_dive',
    note: 'Worked through convolution theorem; finally clicked why multiplication in frequency domain equals convolution in time domain.',
    completed: true,
    completedAt: '2026-04-08T18:30:00.000Z',
  },
  {
    id: 'session_002',
    date: '2026-04-11',
    topicLabel: 'Backpropagation',
    topicDomain: 'cs',
    duration: 60,
    type: 'practice',
    note: 'Implemented from scratch in NumPy. Gradient checking passed — satisfying.',
    completed: true,
    completedAt: '2026-04-11T21:00:00.000Z',
  },

  // This week — 2 completed, 1 not yet
  {
    id: 'session_003',
    date: '2026-04-14',
    topicLabel: 'Quantum Entanglement',
    topicDomain: 'science',
    duration: 45,
    type: 'review',
    note: "Reviewed Bell inequality violations. The CHSH game framing made the weirdness much more concrete.",
    completed: true,
    completedAt: '2026-04-14T19:15:00.000Z',
  },
  {
    id: 'session_004',
    date: '2026-04-16',
    topicLabel: 'Modal Logic',
    topicDomain: 'philosophy',
    duration: 30,
    type: 'explore',
    note: 'Kripke semantics intro — possible worlds felt abstract at first but the accessibility relation framing helped.',
    completed: true,
    completedAt: '2026-04-16T20:45:00.000Z',
  },
  {
    id: 'session_005',
    date: '2026-04-19',
    topicLabel: 'Functional Harmony',
    topicDomain: 'music',
    duration: 45,
    type: 'practice',
    note: 'Harmonizing Bach chorales — dominant seventh resolution exercises.',
    completed: false,
    completedAt: null,
  },

  // Next week
  {
    id: 'session_006',
    date: '2026-04-21',
    topicLabel: 'Riemann Hypothesis',
    topicDomain: 'math',
    duration: 60,
    type: 'deep_dive',
    note: 'Plan to work through the analytic continuation of the zeta function.',
    completed: false,
    completedAt: null,
  },
  {
    id: 'session_007',
    date: '2026-04-23',
    topicLabel: 'CRISPR-Cas9 Mechanism',
    topicDomain: 'science',
    duration: 30,
    type: 'review',
    note: 'Quick review of PAM sequence requirements and off-target effect literature.',
    completed: false,
    completedAt: null,
  },
  {
    id: 'session_008',
    date: '2026-04-25',
    topicLabel: "Gödel's Incompleteness Theorems",
    topicDomain: 'math',
    duration: 45,
    type: 'explore',
    note: 'Starting with the diagonal lemma — want to understand the self-referential construction properly.',
    completed: false,
    completedAt: null,
  },
];

// ── Exports ───────────────────────────────────────────────────────────────────
export const DEMO_PROFILE = { user, tracks, elo, knowledge };

export function loadDemoProfile() {
  localStorage.setItem('spark_user',           JSON.stringify(DEMO_PROFILE.user));
  localStorage.setItem('spark_tracks',         JSON.stringify(DEMO_PROFILE.tracks));
  localStorage.setItem('spark_elo',            JSON.stringify(DEMO_PROFILE.elo));
  localStorage.setItem('spark_knowledge',      JSON.stringify(DEMO_PROFILE.knowledge));
  // Also seed study sessions
  const sessions = DEMO_SESSIONS;
  localStorage.setItem('spark_study_sessions', JSON.stringify(sessions));
  localStorage.setItem('spark_onboarding_complete', 'true');
}

export function clearDemoProfile() {
  ['spark_user', 'spark_tracks', 'spark_elo', 'spark_knowledge', 'spark_study_sessions']
    .forEach(k => localStorage.removeItem(k));
}
