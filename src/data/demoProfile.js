// ── Demo Profiles ─────────────────────────────────────────────────────────────
// Three rich demo personas. Activate via URL: ?demo=alex | ?demo=maya | ?demo=james
// Or keyboard: hold Shift and press 1/2/3 while in demo mode.
// Today's reference date: April 18 2026.

const ref = new Date('2026-04-18T00:00:00.000Z');
function daysAgo(n) {
  const d = new Date(ref);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE 1 — Alex Chen  (college, 21, STEM + philosophy)
// ═══════════════════════════════════════════════════════════════════════════════
const alex = {
  user: {
    name: 'Alex Chen',
    ageGroup: 'college',
    personality: 'spark',
    onboardingComplete: true,
    stats: { nodesExplored: 52 },
  },
  tracks: [
    { id: 'riemann_hypothesis', label: 'Riemann Hypothesis', domain: 'math',
      path: ['Mathematics','Number Theory','Prime Numbers','Riemann Hypothesis'],
      description: 'The conjecture that all non-trivial zeros of the Riemann zeta function lie on Re(s) = ½.',
      mode: 'exploring', saved: true, savedAt: daysAgo(84), lastTended: daysAgo(14) },
    { id: 'zeros_of_the_zeta_function', label: 'Zeros of the Zeta Function', domain: 'math',
      path: ['Mathematics','Number Theory','Riemann Hypothesis','Zeros of the Zeta Function'],
      description: 'Precise locations in the complex plane where ζ(s) = 0.',
      mode: 'mastering', saved: true, savedAt: daysAgo(76), lastTended: daysAgo(9) },
    { id: 'p_vs_np', label: 'P vs NP', domain: 'math',
      path: ['Mathematics','Computational Complexity','P vs NP'],
      description: 'Whether every quickly-verified problem can also be quickly solved.',
      mode: 'exploring', saved: true, savedAt: daysAgo(63), lastTended: daysAgo(21) },
    { id: 'fourier_transforms', label: 'Fourier Transforms', domain: 'math',
      path: ['Mathematics','Harmonic Analysis','Fourier Transforms'],
      description: 'Decomposing functions into frequency spectra.',
      mode: 'mastering', saved: true, savedAt: daysAgo(55), lastTended: daysAgo(5) },
    { id: 'godel_incompleteness', label: "Gödel's Incompleteness", domain: 'math',
      path: ['Mathematics','Logic','Gödel\'s Incompleteness Theorems'],
      description: 'Any powerful formal system contains true statements it cannot prove.',
      mode: 'exploring', saved: true, savedAt: daysAgo(48), lastTended: daysAgo(18) },
    { id: 'quantum_entanglement', label: 'Quantum Entanglement', domain: 'science',
      path: ['Science','Physics','Quantum Mechanics','Quantum Entanglement'],
      description: 'Measuring one particle instantly determines the other across any distance.',
      mode: 'mastering', saved: true, savedAt: daysAgo(72), lastTended: daysAgo(7) },
    { id: 'bells_theorem', label: "Bell's Theorem", domain: 'science',
      path: ['Science','Physics','Quantum Mechanics','Bell\'s Theorem'],
      description: 'Proof no local hidden-variable theory can reproduce quantum predictions.',
      mode: 'exploring', saved: true, savedAt: daysAgo(66), lastTended: daysAgo(12) },
    { id: 'crispr_cas9_mechanism', label: 'CRISPR-Cas9', domain: 'science',
      path: ['Science','Biology','Molecular Biology','CRISPR-Cas9'],
      description: 'How bacterial immune proteins became the sharpest molecular scissors.',
      mode: 'exploring', saved: true, savedAt: daysAgo(41), lastTended: daysAgo(25) },
    { id: 'thermodynamics_entropy', label: 'Entropy & the Arrow of Time', domain: 'science',
      path: ['Science','Physics','Thermodynamics','Entropy'],
      description: 'Why time has a direction from time-symmetric microscopic physics.',
      mode: 'mastering', saved: true, savedAt: daysAgo(33), lastTended: daysAgo(3) },
    { id: 'backpropagation', label: 'Backpropagation', domain: 'cs',
      path: ['Computer Science','Machine Learning','Neural Networks','Backpropagation'],
      description: 'Chain-rule gradient computation that makes deep learning trainable.',
      mode: 'mastering', saved: true, savedAt: daysAgo(58), lastTended: daysAgo(4) },
    { id: 'rsa_cryptography', label: 'RSA Cryptography', domain: 'cs',
      path: ['Computer Science','Cryptography','Public-Key','RSA'],
      description: 'One-way trapdoor from integer factorization hardness.',
      mode: 'exploring', saved: true, savedAt: daysAgo(45), lastTended: daysAgo(30) },
    { id: 'dynamic_programming', label: 'Dynamic Programming', domain: 'cs',
      path: ['Computer Science','Algorithms','Dynamic Programming'],
      description: 'Overlapping subproblems solved once and reused.',
      mode: 'mastering', saved: true, savedAt: daysAgo(37), lastTended: daysAgo(10) },
    { id: 'hard_problem_of_consciousness', label: 'Hard Problem of Consciousness', domain: 'philosophy',
      path: ['Philosophy','Philosophy of Mind','Hard Problem of Consciousness'],
      description: "Why physical processing gives rise to subjective experience at all.",
      mode: 'exploring', saved: true, savedAt: daysAgo(80), lastTended: daysAgo(22) },
    { id: 'modal_logic', label: 'Modal Logic', domain: 'philosophy',
      path: ['Philosophy','Logic','Modal Logic'],
      description: 'Possible-worlds semantics for necessity and possibility.',
      mode: 'mastering', saved: true, savedAt: daysAgo(29), lastTended: daysAgo(6) },
    { id: 'functional_harmony', label: 'Functional Harmony', domain: 'music',
      path: ['Music','Music Theory','Harmony','Functional Harmony'],
      description: 'Tonic–dominant tension and resolution underlying Western music.',
      mode: 'mastering', saved: true, savedAt: daysAgo(61), lastTended: daysAgo(8) },
    { id: 'complex_analysis_residue_theorem', label: 'Residue Theorem', domain: 'math',
      path: ['Mathematics','Complex Analysis','Contour Integration','Residue Theorem'],
      description: 'Computing hard real integrals with poles and tiny loops in the complex plane.',
      mode: 'mastering', saved: true, savedAt: daysAgo(27), lastTended: daysAgo(2) },
    { id: 'information_theory_entropy', label: 'Information Entropy', domain: 'cs',
      path: ['Computer Science','Information Theory','Shannon Entropy'],
      description: 'Bits, uncertainty, and why compression is mathematically bounded.',
      mode: 'exploring', saved: true, savedAt: daysAgo(23), lastTended: daysAgo(4) },
    { id: 'bayesian_inference', label: 'Bayesian Inference', domain: 'science',
      path: ['Science','Statistics','Bayesian Inference'],
      description: 'Updating beliefs with evidence — probability as rational belief dynamics.',
      mode: 'mastering', saved: true, savedAt: daysAgo(19), lastTended: daysAgo(1) },
    { id: 'category_theory_functors', label: 'Functors & Natural Transformations', domain: 'math',
      path: ['Mathematics','Abstract Algebra','Category Theory','Functors'],
      description: 'Structure-preserving maps that unify large chunks of modern math.',
      mode: 'exploring', saved: true, savedAt: daysAgo(15), lastTended: daysAgo(3) },
    { id: 'ethics_of_ai_alignment', label: 'AI Alignment Ethics', domain: 'philosophy',
      path: ['Philosophy','Ethics','Technology Ethics','AI Alignment'],
      description: 'The value-loading problem when increasingly capable systems meet messy human norms.',
      mode: 'exploring', saved: true, savedAt: daysAgo(11), lastTended: daysAgo(2) },
  ],
  elo: {
    math: 1820, science: 1750, cs: 1690, philosophy: 1640, music: 1580,
    art: 1520, literature: 1510, history: 1500, architecture: 1490,
    engineering: 1488, film: 1485, languages: 1482, cooking: 1480,
  },
  knowledge: {
    riemann_hypothesis: 'know_little', fourier_transforms: 'know_well',
    quantum_entanglement: 'know_well', thermodynamics_entropy: 'know_well',
    backpropagation: 'know_well', dynamic_programming: 'know_well',
    functional_harmony: 'know_well', hard_problem_of_consciousness: 'know_little',
    modal_logic: 'heard_of', p_vs_np: 'know_little', bells_theorem: 'heard_of',
  },
  streak: 19,
  sparksToday: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE 2 — Maya Rivera  (high school, 16, arts + science + music)
// ═══════════════════════════════════════════════════════════════════════════════
const maya = {
  user: {
    name: 'Maya Rivera',
    ageGroup: 'high_school',
    personality: 'explorer',
    onboardingComplete: true,
    stats: { nodesExplored: 34 },
  },
  tracks: [
    { id: 'music_theory_basics', label: 'Music Theory Basics', domain: 'music',
      path: ['Music','Music Theory','Fundamentals'],
      description: 'Scales, intervals, chord construction — the grammar of music.',
      mode: 'mastering', saved: true, savedAt: daysAgo(70), lastTended: daysAgo(3) },
    { id: 'functional_harmony', label: 'Functional Harmony', domain: 'music',
      path: ['Music','Music Theory','Harmony','Functional Harmony'],
      description: 'Why certain chord progressions feel like home, tension, or release.',
      mode: 'mastering', saved: true, savedAt: daysAgo(55), lastTended: daysAgo(7) },
    { id: 'synesthesia', label: 'Synesthesia', domain: 'science',
      path: ['Science','Neuroscience','Perception','Synesthesia'],
      description: 'When sound triggers color and music has texture — cross-wired senses.',
      mode: 'exploring', saved: true, savedAt: daysAgo(48), lastTended: daysAgo(11) },
    { id: 'color_and_perception', label: 'Color & Perception', domain: 'art',
      path: ['Art','Color Theory','Perception','Color & Perception'],
      description: 'Colors exist only in your brain — the physics of light vs. subjective hue.',
      mode: 'exploring', saved: true, savedAt: daysAgo(42), lastTended: daysAgo(9) },
    { id: 'golden_ratio', label: 'The Golden Ratio', domain: 'art',
      path: ['Art','Design','Mathematical Beauty','The Golden Ratio'],
      description: 'φ ≈ 1.618 — why it appears in sunflowers, Parthenons, and Fibonacci.',
      mode: 'mastering', saved: true, savedAt: daysAgo(38), lastTended: daysAgo(5) },
    { id: 'renaissance_art', label: 'Renaissance Perspective', domain: 'art',
      path: ['Art','Art History','Renaissance','Linear Perspective'],
      description: 'How Brunelleschi\'s single vanishing point shattered the medieval visual world.',
      mode: 'exploring', saved: true, savedAt: daysAgo(33), lastTended: daysAgo(15) },
    { id: 'human_evolution', label: 'Human Evolution', domain: 'science',
      path: ['Science','Biology','Evolutionary Biology','Human Evolution'],
      description: 'How Homo sapiens emerged, spread, and outlived every other human species.',
      mode: 'exploring', saved: true, savedAt: daysAgo(28), lastTended: daysAgo(20) },
    { id: 'dna_basics', label: 'How DNA Works', domain: 'science',
      path: ['Science','Biology','Molecular Biology','DNA'],
      description: 'Every cell carries a 2-metre instruction manual folded impossibly small.',
      mode: 'mastering', saved: true, savedAt: daysAgo(22), lastTended: daysAgo(4) },
    { id: 'social_media_psychology', label: 'Social Media & Psychology', domain: 'science',
      path: ['Science','Psychology','Social Psychology','Social Media & Psychology'],
      description: 'Dopamine loops, social comparison, and variable reward schedules.',
      mode: 'exploring', saved: true, savedAt: daysAgo(16), lastTended: daysAgo(6) },
    { id: 'creative_writing_structure', label: 'Story Structure', domain: 'literature',
      path: ['Literature','Creative Writing','Narrative','Story Structure'],
      description: 'From the hero\'s journey to the three-act structure — why stories follow patterns.',
      mode: 'exploring', saved: true, savedAt: daysAgo(13), lastTended: daysAgo(8) },
    { id: 'climate_science', label: 'Climate Science', domain: 'science',
      path: ['Science','Earth Science','Climate','Climate Science'],
      description: 'The greenhouse effect, feedback loops, and what the models actually show.',
      mode: 'mastering', saved: true, savedAt: daysAgo(9), lastTended: daysAgo(2) },
    { id: 'jazz_improvisation', label: 'Jazz Improvisation', domain: 'music',
      path: ['Music','Jazz','Improvisation','Jazz Improvisation'],
      description: 'How jazz musicians have a live conversation with chord changes in real time.',
      mode: 'exploring', saved: true, savedAt: daysAgo(6), lastTended: daysAgo(1) },
    { id: 'film_scoring', label: 'Film Scoring', domain: 'music',
      path: ['Music','Composition','Film Scoring'],
      description: 'How motifs and orchestration steer audience emotion scene by scene.',
      mode: 'exploring', saved: true, savedAt: daysAgo(14), lastTended: daysAgo(3) },
    { id: 'street_art_history', label: 'Street Art & Murals', domain: 'art',
      path: ['Art','Contemporary Art','Street Art'],
      description: 'From tagging culture to public murals as civic storytelling.',
      mode: 'mastering', saved: true, savedAt: daysAgo(17), lastTended: daysAgo(5) },
    { id: 'marine_ecology', label: 'Marine Ecology', domain: 'science',
      path: ['Science','Biology','Ecology','Marine Ecology'],
      description: 'Food webs, coral resilience, and ecosystem tipping points.',
      mode: 'exploring', saved: true, savedAt: daysAgo(12), lastTended: daysAgo(1) },
    { id: 'poetry_slam_craft', label: 'Spoken Word Craft', domain: 'literature',
      path: ['Literature','Poetry','Performance Poetry'],
      description: 'Meter, breath, and line breaks designed for live performance.',
      mode: 'exploring', saved: true, savedAt: daysAgo(8), lastTended: daysAgo(2) },
    { id: 'digital_illustration_pipeline', label: 'Digital Illustration Workflow', domain: 'art',
      path: ['Art','Digital Art','Illustration Pipeline'],
      description: 'Thumbnailing, value studies, and final rendering in layered passes.',
      mode: 'mastering', saved: true, savedAt: daysAgo(4), lastTended: daysAgo(1) },
  ],
  elo: {
    music: 1800, art: 1760, science: 1700, literature: 1640, history: 1590,
    philosophy: 1530, math: 1500, cs: 1480, languages: 1475, film: 1470,
    architecture: 1465, cooking: 1460, engineering: 1455,
  },
  knowledge: {
    music_theory_basics: 'know_well', functional_harmony: 'know_little',
    golden_ratio: 'know_well', color_and_perception: 'know_little',
    dna_basics: 'know_well', synesthesia: 'heard_of',
    jazz_improvisation: 'heard_of', climate_science: 'know_little',
    social_media_psychology: 'know_well', story_structure: 'know_little',
  },
  streak: 11,
  sparksToday: 3,
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE 3 — Dr. James Park  (adult, 34, history + philosophy + literature)
// ═══════════════════════════════════════════════════════════════════════════════
const james = {
  user: {
    name: 'Dr. James Park',
    ageGroup: 'adult',
    personality: 'analytical',
    onboardingComplete: true,
    stats: { nodesExplored: 68 },
  },
  tracks: [
    { id: 'byzantine_empire_fall', label: 'Fall of Byzantium', domain: 'history',
      path: ['History','Medieval','Byzantine Empire','Fall of Constantinople'],
      description: 'How 1453 ended a millennium of Roman continuity and reshaped Eurasia.',
      mode: 'mastering', saved: true, savedAt: daysAgo(90), lastTended: daysAgo(5) },
    { id: 'mongol_empire', label: 'The Mongol Empire', domain: 'history',
      path: ['History','Medieval','Central Asia','Mongol Empire'],
      description: 'The largest contiguous empire in history — how it formed, ruled, and collapsed.',
      mode: 'exploring', saved: true, savedAt: daysAgo(82), lastTended: daysAgo(18) },
    { id: 'enlightenment_philosophy', label: 'The Enlightenment', domain: 'history',
      path: ['History','Intellectual History','Enlightenment'],
      description: 'How Locke, Voltaire, and Kant built the operating system of modernity.',
      mode: 'mastering', saved: true, savedAt: daysAgo(75), lastTended: daysAgo(10) },
    { id: 'stoicism', label: 'Stoicism', domain: 'philosophy',
      path: ['Philosophy','Ancient Philosophy','Stoicism'],
      description: 'Control only your thoughts and choices — the philosophy Silicon Valley runs on.',
      mode: 'mastering', saved: true, savedAt: daysAgo(68), lastTended: daysAgo(6) },
    { id: 'phenomenology', label: 'Phenomenology', domain: 'philosophy',
      path: ['Philosophy','Continental Philosophy','Phenomenology'],
      description: 'Husserl and Heidegger on the structure of conscious experience itself.',
      mode: 'exploring', saved: true, savedAt: daysAgo(60), lastTended: daysAgo(22) },
    { id: 'existentialism', label: 'Existentialism', domain: 'philosophy',
      path: ['Philosophy','Continental Philosophy','Existentialism'],
      description: 'Sartre, Camus, Beauvoir: existence precedes essence, and freedom is a burden.',
      mode: 'mastering', saved: true, savedAt: daysAgo(54), lastTended: daysAgo(9) },
    { id: 'wittgenstein_language', label: 'Wittgenstein & Language', domain: 'philosophy',
      path: ['Philosophy','Philosophy of Language','Wittgenstein'],
      description: 'Language games, forms of life, and "whereof one cannot speak..."',
      mode: 'exploring', saved: true, savedAt: daysAgo(47), lastTended: daysAgo(16) },
    { id: 'dostoevsky_underground', label: 'Dostoevsky: The Underground', domain: 'literature',
      path: ['Literature','Russian Literature','Dostoevsky','Notes from Underground'],
      description: 'The first modern anti-hero — spite, free will, and the tyranny of reason.',
      mode: 'mastering', saved: true, savedAt: daysAgo(41), lastTended: daysAgo(8) },
    { id: 'proust_memory', label: 'Proust & Involuntary Memory', domain: 'literature',
      path: ['Literature','Modernist Fiction','Proust','Involuntary Memory'],
      description: 'How a madeleine dipped in tea unleashed seven volumes about time and consciousness.',
      mode: 'exploring', saved: true, savedAt: daysAgo(35), lastTended: daysAgo(14) },
    { id: 'cold_war_history', label: 'Cold War Origins', domain: 'history',
      path: ['History','20th Century','Cold War','Origins'],
      description: 'How a wartime alliance between superpowers became 45 years of near-annihilation.',
      mode: 'exploring', saved: true, savedAt: daysAgo(28), lastTended: daysAgo(12) },
    { id: 'keynesian_economics', label: 'Keynesian Economics', domain: 'economics',
      path: ['Economics','Macroeconomics','Keynesian Economics'],
      description: 'Government spending as stimulus — why demand management dominated policy for decades.',
      mode: 'mastering', saved: true, savedAt: daysAgo(22), lastTended: daysAgo(4) },
    { id: 'climate_policy', label: 'Climate Policy & Economics', domain: 'economics',
      path: ['Economics','Environmental Economics','Climate Policy'],
      description: 'Carbon pricing, externalities, and why markets alone won\'t solve climate change.',
      mode: 'exploring', saved: true, savedAt: daysAgo(16), lastTended: daysAgo(7) },
    { id: 'cognitive_biases', label: 'Cognitive Biases', domain: 'science',
      path: ['Science','Psychology','Cognitive Psychology','Cognitive Biases'],
      description: 'Kahneman and Tversky\'s systematic errors in human judgment and decision-making.',
      mode: 'mastering', saved: true, savedAt: daysAgo(10), lastTended: daysAgo(3) },
    { id: 'power_of_now', label: 'Attention & Mindfulness', domain: 'philosophy',
      path: ['Philosophy','Applied Ethics','Mindfulness & Attention'],
      description: 'The neuroscience of attention, present-moment awareness, and cognitive load.',
      mode: 'exploring', saved: true, savedAt: daysAgo(5), lastTended: daysAgo(1) },
    { id: 'byzantine_trade_networks', label: 'Byzantine Trade Networks', domain: 'history',
      path: ['History','Medieval','Byzantine Empire','Trade Networks'],
      description: 'Silk routes, Mediterranean ports, and coinage as geopolitical leverage.',
      mode: 'exploring', saved: true, savedAt: daysAgo(24), lastTended: daysAgo(7) },
    { id: 'postwar_reconstruction', label: 'Postwar Reconstruction', domain: 'history',
      path: ['History','20th Century','Postwar Europe','Reconstruction'],
      description: 'Marshall Plan dynamics and institutional rebuilding after systemic collapse.',
      mode: 'mastering', saved: true, savedAt: daysAgo(20), lastTended: daysAgo(4) },
    { id: 'greek_tragedy', label: 'Greek Tragedy', domain: 'literature',
      path: ['Literature','Classics','Greek Tragedy'],
      description: 'Fate, agency, and catharsis in Aeschylus, Sophocles, and Euripides.',
      mode: 'mastering', saved: true, savedAt: daysAgo(18), lastTended: daysAgo(2) },
    { id: 'public_choice_theory', label: 'Public Choice Theory', domain: 'economics',
      path: ['Economics','Political Economy','Public Choice'],
      description: 'Applying economic incentives to voting, bureaucracy, and policy design.',
      mode: 'exploring', saved: true, savedAt: daysAgo(13), lastTended: daysAgo(2) },
    { id: 'moral_luck', label: 'Moral Luck', domain: 'philosophy',
      path: ['Philosophy','Ethics','Moral Responsibility','Moral Luck'],
      description: 'How outcomes beyond control still shape moral judgment.',
      mode: 'exploring', saved: true, savedAt: daysAgo(9), lastTended: daysAgo(1) },
    { id: 'historical_methodology', label: 'Historical Methodology', domain: 'history',
      path: ['History','Historiography','Historical Methodology'],
      description: 'Primary sources, archival bias, and how narratives become canon.',
      mode: 'mastering', saved: true, savedAt: daysAgo(7), lastTended: daysAgo(1) },
  ],
  elo: {
    history: 1850, philosophy: 1830, literature: 1790, science: 1680,
    economics: 1670, art: 1620, music: 1580, cs: 1530, math: 1520,
    film: 1515, languages: 1510, architecture: 1500, cooking: 1490,
  },
  knowledge: {
    stoicism: 'know_well', existentialism: 'know_well',
    enlightenment_philosophy: 'know_well', byzantine_empire_fall: 'know_well',
    dostoevsky_underground: 'know_well', phenomenology: 'know_little',
    cognitive_biases: 'know_well', keynesian_economics: 'know_little',
    proust_memory: 'heard_of', wittgenstein_language: 'heard_of',
  },
  streak: 32,
  sparksToday: 1,
};

// ── Sessions (shared structure, profile-specific dates) ──────────────────────
const alexSessions = [
  { id: 's1', date: '2026-04-08', topicLabel: 'Fourier Transforms', topicDomain: 'math',
    duration: 45, type: 'deep_dive', note: 'Convolution theorem finally clicked.', completed: true, completedAt: '2026-04-08T18:30:00.000Z' },
  { id: 's2', date: '2026-04-11', topicLabel: 'Backpropagation', topicDomain: 'cs',
    duration: 60, type: 'practice', note: 'Implemented in NumPy. Gradient checking passed.', completed: true, completedAt: '2026-04-11T21:00:00.000Z' },
  { id: 's3', date: '2026-04-14', topicLabel: 'Quantum Entanglement', topicDomain: 'science',
    duration: 45, type: 'review', note: 'CHSH game framing made weirdness concrete.', completed: true, completedAt: '2026-04-14T19:15:00.000Z' },
  { id: 's4', date: '2026-04-16', topicLabel: 'Modal Logic', topicDomain: 'philosophy',
    duration: 30, type: 'explore', note: 'Kripke accessibility relations clicked.', completed: true, completedAt: '2026-04-16T20:45:00.000Z' },
  { id: 's5', date: '2026-04-19', topicLabel: 'Functional Harmony', topicDomain: 'music',
    duration: 45, type: 'practice', note: 'Bach chorale harmonization exercises.', completed: false, completedAt: null },
  { id: 's6', date: '2026-04-21', topicLabel: 'Riemann Hypothesis', topicDomain: 'math',
    duration: 60, type: 'deep_dive', note: 'Analytic continuation planned.', completed: false, completedAt: null },
  { id: 's7', date: '2026-04-06', topicLabel: 'Dynamic Programming', topicDomain: 'cs',
    duration: 35, type: 'review', note: 'Knapsack variants and memoization edge cases.', completed: true, completedAt: '2026-04-06T20:10:00.000Z' },
  { id: 's8', date: '2026-04-03', topicLabel: "Bell's Theorem", topicDomain: 'science',
    duration: 42, type: 'deep_dive', note: 'Local realism assumptions broken down clearly.', completed: true, completedAt: '2026-04-03T19:40:00.000Z' },
  { id: 's9', date: '2026-03-30', topicLabel: 'Information Entropy', topicDomain: 'cs',
    duration: 38, type: 'explore', note: 'Bits per symbol and compression examples.', completed: true, completedAt: '2026-03-30T22:00:00.000Z' },
];

const mayaSessions = [
  { id: 'm1', date: '2026-04-10', topicLabel: 'Jazz Improvisation', topicDomain: 'music',
    duration: 30, type: 'explore', note: 'ii-V-I progressions make so much more sense now.', completed: true, completedAt: '2026-04-10T17:00:00.000Z' },
  { id: 'm2', date: '2026-04-13', topicLabel: 'Color & Perception', topicDomain: 'art',
    duration: 45, type: 'deep_dive', note: 'The dress debate is actually physics. Mind blown.', completed: true, completedAt: '2026-04-13T18:30:00.000Z' },
  { id: 'm3', date: '2026-04-15', topicLabel: 'DNA Basics', topicDomain: 'science',
    duration: 30, type: 'review', note: 'CRISPR connection to gene editing now clear.', completed: true, completedAt: '2026-04-15T19:00:00.000Z' },
  { id: 'm4', date: '2026-04-17', topicLabel: 'Music Theory Basics', topicDomain: 'music',
    duration: 60, type: 'practice', note: 'Circle of fifths memorized!', completed: true, completedAt: '2026-04-17T20:00:00.000Z' },
  { id: 'm5', date: '2026-04-19', topicLabel: 'Climate Science', topicDomain: 'science',
    duration: 30, type: 'explore', note: 'Feedback loops scarier than I thought.', completed: false, completedAt: null },
  { id: 'm6', date: '2026-04-22', topicLabel: 'Story Structure', topicDomain: 'literature',
    duration: 45, type: 'deep_dive', note: 'Applying to short story draft.', completed: false, completedAt: null },
  { id: 'm7', date: '2026-04-07', topicLabel: 'Street Art & Murals', topicDomain: 'art',
    duration: 35, type: 'review', note: 'Catalogued mural symbolism in three neighborhoods.', completed: true, completedAt: '2026-04-07T17:20:00.000Z' },
  { id: 'm8', date: '2026-04-04', topicLabel: 'Film Scoring', topicDomain: 'music',
    duration: 50, type: 'deep_dive', note: 'Leitmotif examples from animation and thrillers.', completed: true, completedAt: '2026-04-04T18:40:00.000Z' },
  { id: 'm9', date: '2026-03-30', topicLabel: 'Marine Ecology', topicDomain: 'science',
    duration: 30, type: 'explore', note: 'Kelp forest trophic cascades are fascinating.', completed: true, completedAt: '2026-03-30T19:10:00.000Z' },
];

const jamesSessions = [
  { id: 'j1', date: '2026-04-09', topicLabel: 'Stoicism', topicDomain: 'philosophy',
    duration: 45, type: 'deep_dive', note: 'Meditations in dialogue with modern CBT.', completed: true, completedAt: '2026-04-09T21:00:00.000Z' },
  { id: 'j2', date: '2026-04-12', topicLabel: 'Mongol Empire', topicDomain: 'history',
    duration: 60, type: 'review', note: 'Successor khanates and fragmentation patterns.', completed: true, completedAt: '2026-04-12T20:30:00.000Z' },
  { id: 'j3', date: '2026-04-15', topicLabel: 'Dostoevsky: The Underground', topicDomain: 'literature',
    duration: 45, type: 'explore', note: 'Free will vs rational self-interest — the spite argument is devastating.', completed: true, completedAt: '2026-04-15T22:00:00.000Z' },
  { id: 'j4', date: '2026-04-17', topicLabel: 'Cognitive Biases', topicDomain: 'science',
    duration: 30, type: 'practice', note: 'Applied to a policy memo I\'m writing.', completed: true, completedAt: '2026-04-17T19:00:00.000Z' },
  { id: 'j5', date: '2026-04-19', topicLabel: 'Keynesian Economics', topicDomain: 'economics',
    duration: 45, type: 'deep_dive', note: 'Post-Keynesian critique next.', completed: false, completedAt: null },
  { id: 'j6', date: '2026-04-23', topicLabel: 'Existentialism', topicDomain: 'philosophy',
    duration: 60, type: 'explore', note: 'Sartre on bad faith — freedom as burden.', completed: false, completedAt: null },
  { id: 'j7', date: '2026-04-06', topicLabel: 'Historical Methodology', topicDomain: 'history',
    duration: 55, type: 'review', note: 'Cross-checking archival narratives against fiscal records.', completed: true, completedAt: '2026-04-06T20:10:00.000Z' },
  { id: 'j8', date: '2026-04-02', topicLabel: 'Public Choice Theory', topicDomain: 'economics',
    duration: 40, type: 'deep_dive', note: 'Applied rent-seeking lens to current policy debates.', completed: true, completedAt: '2026-04-02T18:30:00.000Z' },
  { id: 'j9', date: '2026-03-29', topicLabel: 'Greek Tragedy', topicDomain: 'literature',
    duration: 48, type: 'explore', note: 'Compared Antigone and Medea on moral responsibility.', completed: true, completedAt: '2026-03-29T21:15:00.000Z' },
];

// ── Activity heatmaps (seeded for rich calendar display) ─────────────────────
function buildActivity(sessions, bonus) {
  const act = {};
  sessions.forEach(s => { if (s.completed) act[s.date] = (act[s.date] || 0) + 3; });
  bonus.forEach(({ date, v }) => { act[date] = (act[date] || 0) + v; });
  return act;
}

const alexActivity = buildActivity(alexSessions, [
  { date: '2026-04-01', v: 5 }, { date: '2026-04-02', v: 4 }, { date: '2026-04-03', v: 2 },
  { date: '2026-04-04', v: 6 }, { date: '2026-04-05', v: 3 }, { date: '2026-04-06', v: 1 },
  { date: '2026-04-07', v: 4 }, { date: '2026-03-29', v: 5 }, { date: '2026-03-28', v: 3 },
  { date: '2026-03-27', v: 2 }, { date: '2026-03-25', v: 4 }, { date: '2026-03-22', v: 6 },
  { date: '2026-03-20', v: 3 }, { date: '2026-03-18', v: 5 }, { date: '2026-03-15', v: 2 },
]);

const mayaActivity = buildActivity(mayaSessions, [
  { date: '2026-04-01', v: 4 }, { date: '2026-04-03', v: 5 }, { date: '2026-04-05', v: 3 },
  { date: '2026-04-07', v: 4 }, { date: '2026-03-31', v: 6 }, { date: '2026-03-29', v: 2 },
  { date: '2026-03-26', v: 5 }, { date: '2026-03-23', v: 3 }, { date: '2026-03-20', v: 4 },
]);

const jamesActivity = buildActivity(jamesSessions, [
  { date: '2026-04-01', v: 3 }, { date: '2026-04-02', v: 5 }, { date: '2026-04-04', v: 4 },
  { date: '2026-04-05', v: 6 }, { date: '2026-04-06', v: 3 }, { date: '2026-04-07', v: 5 },
  { date: '2026-03-30', v: 4 }, { date: '2026-03-28', v: 6 }, { date: '2026-03-26', v: 5 },
  { date: '2026-03-24', v: 4 }, { date: '2026-03-22', v: 3 }, { date: '2026-03-19', v: 5 },
  { date: '2026-03-17', v: 4 }, { date: '2026-03-15', v: 6 }, { date: '2026-03-12', v: 3 },
]);

function buildSearches(prefix, entries = []) {
  return entries.map((entry, i) => ({
    id: `${prefix}-${i + 1}`,
    term: entry.term,
    timestamp: entry.timestamp,
    domain: entry.domain || null,
    source: 'demo',
  }));
}

const DEMO_SEARCHES = {
  alex: buildSearches('alex', [
    { term: 'riemann zeta explicit formula intuition', timestamp: '2026-04-17T22:14:00.000Z', domain: 'math' },
    { term: 'kripke semantics modal logic examples', timestamp: '2026-04-16T20:58:00.000Z', domain: 'philosophy' },
    { term: 'backpropagation vanishing gradients fix', timestamp: '2026-04-15T21:08:00.000Z', domain: 'cs' },
    { term: 'bell inequality chsh game explained', timestamp: '2026-04-13T19:46:00.000Z', domain: 'science' },
    { term: 'residue theorem worked integral examples', timestamp: '2026-04-11T18:24:00.000Z', domain: 'math' },
    { term: 'category theory for programmers functor laws', timestamp: '2026-04-09T20:11:00.000Z', domain: 'cs' },
  ]),
  maya: buildSearches('maya', [
    { term: 'jazz improv backing tracks ii v i', timestamp: '2026-04-17T19:44:00.000Z', domain: 'music' },
    { term: 'street art public mural symbolism', timestamp: '2026-04-16T18:27:00.000Z', domain: 'art' },
    { term: 'dna transcription translation for teens', timestamp: '2026-04-14T21:06:00.000Z', domain: 'science' },
    { term: 'film scoring leitmotif examples', timestamp: '2026-04-12T22:40:00.000Z', domain: 'music' },
    { term: 'climate feedback loops simple explainer', timestamp: '2026-04-09T18:12:00.000Z', domain: 'science' },
    { term: 'spoken word poetry performance tips', timestamp: '2026-04-08T17:31:00.000Z', domain: 'literature' },
  ]),
  james: buildSearches('james', [
    { term: 'byzantine trade routes 11th century', timestamp: '2026-04-17T23:10:00.000Z', domain: 'history' },
    { term: 'public choice theory policy incentives', timestamp: '2026-04-16T21:55:00.000Z', domain: 'economics' },
    { term: 'wittgenstein private language argument', timestamp: '2026-04-15T20:34:00.000Z', domain: 'philosophy' },
    { term: 'dostoevsky notes from underground spite', timestamp: '2026-04-13T22:41:00.000Z', domain: 'literature' },
    { term: 'marshall plan postwar reconstruction data', timestamp: '2026-04-11T19:22:00.000Z', domain: 'history' },
    { term: 'moral luck nagel williams comparison', timestamp: '2026-04-09T18:03:00.000Z', domain: 'philosophy' },
  ]),
};

function opportunitySet(id, timestamp, items) {
  return { id, timestamp, goal: 'open', location: 'San Francisco, CA', school: null, items };
}

const DEMO_OPPORTUNITY_HISTORY = {
  alex: [
    opportunitySet('alex-opp-1', '2026-04-16T18:40:00.000Z', [
      { emoji: '🧠', name: 'Bay Area AI Safety Reading Group', type: 'community', whyItConnects: 'Matches Alex’s AI alignment + modal logic + Bayesian inference threads.', nextStep: 'Join next Thursday session and present one 5-minute paper summary.', timing: 'Weekly, Thursdays' },
      { emoji: '🧮', name: 'Putnam Problem Sprint Circle', type: 'club', whyItConnects: 'Direct fit with deep number theory and proof-style mathematical exploration.', nextStep: 'Attend Saturday sprint and attempt two A-level historical problems.', timing: 'Open weekly' },
      { emoji: '⚛️', name: 'Quantum Foundations Virtual Seminar', type: 'program', whyItConnects: 'Builds on Bell’s theorem + entanglement tracks with researcher Q&A.', nextStep: 'Register and submit one question from your CHSH notes.', timing: 'Next cohort starts May 3' },
    ]),
  ],
  maya: [
    opportunitySet('maya-opp-1', '2026-04-17T17:05:00.000Z', [
      { emoji: '🎷', name: 'Youth Jazz Improv Jam Lab', type: 'club', whyItConnects: 'Aligns with Maya’s jazz improvisation and film scoring explorations.', nextStep: 'Upload one 60-second solo to claim a live session slot.', timing: 'Biweekly' },
      { emoji: '🖌️', name: 'City Mural Apprenticeship', type: 'community', whyItConnects: 'Extends street-art and color-perception threads into public storytelling.', nextStep: 'Submit three sketch thumbnails and a mural concept statement.', timing: 'Applications close May 14' },
      { emoji: '🧬', name: 'Teen BioDesign Challenge', type: 'competition', whyItConnects: 'Connects DNA + climate science interests into practical design projects.', nextStep: 'Form a 3-person team and draft an experiment pitch.', timing: 'Deadline June 1' },
    ]),
  ],
  james: [
    opportunitySet('james-opp-1', '2026-04-18T08:10:00.000Z', [
      { emoji: '🏛️', name: 'Public Policy History Fellows Network', type: 'program', whyItConnects: 'Strong overlap with Byzantine, postwar reconstruction, and public choice tracks.', nextStep: 'Submit a 400-word memo proposal linking history to a modern policy issue.', timing: 'Rolling monthly' },
      { emoji: '📚', name: 'Modern Classics Facilitation Circle', type: 'community', whyItConnects: 'Built for Dostoevsky, Greek tragedy, and existentialism discussion depth.', nextStep: 'Facilitate one 20-minute segment on moral luck in literature.', timing: 'Every other Tuesday' },
      { emoji: '📈', name: 'Macro & Markets Applied Roundtable', type: 'company', whyItConnects: 'Direct fit for Keynesian economics, climate policy, and finance-oriented analysis.', nextStep: 'Bring one chart-based thesis and defend assumptions in roundtable.', timing: 'Next session April 24' },
    ]),
  ],
};

function buildDemoGroups(activeKey) {
  const names = {
    alex: 'Alex Chen',
    maya: 'Maya Rivera',
    james: 'Dr. James Park',
  };
  return [
    {
      id: 'demo_triad_atlas',
      name: 'Curiosity Atlas Cohort',
      description: 'Alex, Maya, and James co-curate a fast-moving interdisciplinary syllabus for live demos.',
      domain: 'history',
      startNode: 'History of Ideas',
      isPublic: true,
      members: [
        { uid: 'demo_alex', name: names.alex, color: '#4A6FA5', isLeader: activeKey === 'alex' },
        { uid: 'demo_maya', name: names.maya, color: '#E07A5F', isLeader: activeKey === 'maya' },
        { uid: 'demo_james', name: names.james, color: '#2D936C', isLeader: activeKey === 'james' },
      ],
      syllabus: [
        { id: 'triad-1', label: 'Fall of Byzantium', path: ['History', 'Medieval', 'Byzantium'], domain: 'history', approved: true, order: 0 },
        { id: 'triad-2', label: 'Modal Logic', path: ['Philosophy', 'Logic', 'Modal Logic'], domain: 'philosophy', approved: true, order: 1 },
        { id: 'triad-3', label: 'Jazz Improvisation', path: ['Music', 'Jazz', 'Improvisation'], domain: 'music', approved: true, order: 2 },
        { id: 'triad-4', label: 'Cognitive Biases', path: ['Science', 'Psychology', 'Cognitive Biases'], domain: 'science', approved: true, order: 3 },
        { id: 'triad-5', label: 'Keynesian Economics', path: ['Economics', 'Macroeconomics', 'Keynes'], domain: 'economics', approved: false, order: 4 },
      ],
      memberCount: 3,
      nodesExplored: 187,
      createdAt: '2026-03-10T15:00:00.000Z',
      isDemo: true,
    },
  ];
}

// ── Exports ───────────────────────────────────────────────────────────────────
export const DEMO_PROFILES = { alex, maya, james };

export const DEMO_PROFILE = alex; // legacy compat

export function loadDemoProfile(key = 'alex') {
  const p = DEMO_PROFILES[key] || DEMO_PROFILES.alex;
  localStorage.setItem('spark_user',   JSON.stringify(p.user));
  localStorage.setItem('spark_tracks', JSON.stringify(p.tracks));
  localStorage.setItem('spark_elo',    JSON.stringify(p.elo));
  localStorage.setItem('spark_knowledge', JSON.stringify(p.knowledge));
  const sessions = key === 'maya' ? mayaSessions : key === 'james' ? jamesSessions : alexSessions;
  localStorage.setItem('spark_study_sessions', JSON.stringify(sessions));
  const activity = key === 'maya' ? mayaActivity : key === 'james' ? jamesActivity : alexActivity;
  localStorage.setItem('spark_activity', JSON.stringify(activity));
  localStorage.setItem('spark_searches', JSON.stringify(DEMO_SEARCHES[key] || []));
  localStorage.setItem('spark_groups', JSON.stringify(buildDemoGroups(key)));
  localStorage.setItem('spark_opportunities_optin', 'true');
  localStorage.setItem('spark_opportunities_history', JSON.stringify(DEMO_OPPORTUNITY_HISTORY[key] || []));
  localStorage.setItem('spark_onboarding_complete', 'true');
  localStorage.setItem('spark_demo_key', key);
  // streak
  localStorage.setItem('spark_streak', JSON.stringify({
    streak: p.streak,
    sparksToday: p.sparksToday,
    lastDate: new Date().toISOString().slice(0, 10),
  }));
}

export function clearDemoProfile() {
  ['spark_user','spark_tracks','spark_elo','spark_knowledge',
   'spark_study_sessions','spark_activity','spark_streak','spark_demo_key','spark_searches','spark_groups','spark_opportunities_optin','spark_opportunities_history']
    .forEach(k => localStorage.removeItem(k));
}

export function getActiveDemoKey() {
  return localStorage.getItem('spark_demo_key') || null;
}
