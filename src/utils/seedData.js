// Static seed data — top 3 levels for all domains
// Zero-latency for first ~3 taps

export const SEED_DATA = {
  math: {
    id: 'math', label: 'Mathematics', domain: 'math',
    description: 'The language of patterns, structures, and logic',
    children: {
      algebra: {
        id: 'algebra', label: 'Algebra', domain: 'math',
        description: 'The language of patterns and relationships',
        children: {
          linear_algebra:     { id: 'linear_algebra',     label: 'Linear Algebra',     domain: 'math', description: 'Vectors, matrices, and transformations — the geometry of many dimensions' },
          abstract_algebra:   { id: 'abstract_algebra',   label: 'Abstract Algebra',   domain: 'math', description: 'Groups, rings, and fields — the deep structure of math' },
          algebraic_topology: { id: 'algebraic_topology', label: 'Algebraic Topology', domain: 'math', description: 'Using algebra to study shapes that can stretch' },
          boolean_algebra:    { id: 'boolean_algebra',    label: 'Boolean Algebra',    domain: 'math', description: 'The math inside every computer chip' },
        }
      },
      geometry: {
        id: 'geometry', label: 'Geometry', domain: 'math',
        description: 'The mathematics of shape, space, and position',
        children: {
          euclidean:    { id: 'euclidean',    label: 'Euclidean Geometry',    domain: 'math', description: 'Points, lines, circles — the geometry you know' },
          topology:     { id: 'topology',     label: 'Topology',              domain: 'math', description: 'Geometry without measurement — stretching is allowed' },
          differential: { id: 'differential_geometry', label: 'Differential Geometry', domain: 'math', description: 'Curves, surfaces, and the math of curvature' },
          fractal:      { id: 'fractal',      label: 'Fractal Geometry',      domain: 'math', description: 'Patterns that repeat at every scale' },
        }
      },
      number_theory: {
        id: 'number_theory', label: 'Number Theory', domain: 'math',
        description: 'The deep properties of whole numbers',
        children: {
          primes:       { id: 'primes',       label: 'Prime Numbers',          domain: 'math', description: 'The atoms of arithmetic — why do they feel infinite?' },
          cryptography: { id: 'cryptography', label: 'Cryptography',           domain: 'math', description: 'How number theory protects your secrets online' },
          diophantine:  { id: 'diophantine',  label: 'Diophantine Equations',  domain: 'math', description: "Equations where only whole numbers are allowed — Fermat's Last Theorem lives here" },
          analytic_nt:  { id: 'analytic_nt',  label: 'Analytic Number Theory', domain: 'math', description: 'Using calculus to understand integers' },
        }
      },
      analysis: {
        id: 'analysis', label: 'Analysis', domain: 'math',
        description: 'The rigorous study of continuity, limits, and infinity',
        children: {
          calculus:     { id: 'calculus',     label: 'Calculus',           domain: 'math', description: 'How to measure change and accumulation — the language of physics' },
          real_analysis:{ id: 'real_analysis',label: 'Real Analysis',      domain: 'math', description: 'Why does calculus actually work? The rigorous answer.' },
          complex:      { id: 'complex',      label: 'Complex Analysis',   domain: 'math', description: "Calculus with imaginary numbers — surprisingly beautiful" },
          functional:   { id: 'functional',   label: 'Functional Analysis',domain: 'math', description: 'Calculus applied to infinite-dimensional spaces' },
        }
      },
      probability: {
        id: 'probability', label: 'Probability & Statistics', domain: 'math',
        description: 'The mathematics of uncertainty and randomness',
        children: {
          probability:  { id: 'probability_theory', label: 'Probability Theory', domain: 'math', description: 'How to reason about uncertain events rigorously' },
          statistics:   { id: 'statistics',    label: 'Statistics',           domain: 'math', description: 'Drawing conclusions from data — and knowing when not to' },
          stochastic:   { id: 'stochastic',    label: 'Stochastic Processes', domain: 'math', description: 'Math for systems that evolve randomly over time' },
          bayesian:     { id: 'bayesian',      label: 'Bayesian Inference',   domain: 'math', description: 'How beliefs should update when you get new evidence' },
        }
      },
      combinatorics: {
        id: 'combinatorics', label: 'Combinatorics', domain: 'math',
        description: 'The art of counting — cleverly',
        children: {
          graph_theory: { id: 'graph_theory', label: 'Graph Theory',      domain: 'math', description: 'Networks, connections, and the math of relationships' },
          enumeration:  { id: 'enumeration',  label: 'Enumeration',        domain: 'math', description: 'How many ways can something be arranged?' },
          ramsey:       { id: 'ramsey',       label: 'Ramsey Theory',      domain: 'math', description: 'Order must emerge from chaos — but how much chaos is needed?' },
          coding_theory:{ id: 'coding_theory',label: 'Coding Theory',      domain: 'math', description: 'The math behind error-correcting codes and data transmission' },
        }
      },
    }
  },

  cs: {
    id: 'cs', label: 'Computer Science', domain: 'cs',
    description: 'The science of computation, information, and automation',
    children: {
      algorithms: {
        id: 'algorithms', label: 'Algorithms', domain: 'cs',
        description: 'Step-by-step recipes for solving problems',
        children: {
          sorting:       { id: 'sorting',      label: 'Sorting Algorithms',   domain: 'cs', description: 'How do you arrange a billion items as fast as possible?' },
          graph_algos:   { id: 'graph_algos',  label: 'Graph Algorithms',     domain: 'cs', description: 'Finding paths, clusters, and flows in networks' },
          dynamic_prog:  { id: 'dynamic_prog', label: 'Dynamic Programming',  domain: 'cs', description: 'Solving hard problems by breaking them into subproblems' },
          complexity:    { id: 'complexity',   label: 'Computational Complexity', domain: 'cs', description: 'Why are some problems fundamentally harder than others?' },
        }
      },
      ai_ml: {
        id: 'ai_ml', label: 'AI & Machine Learning', domain: 'cs',
        description: 'Teaching computers to learn from data',
        children: {
          neural_nets:   { id: 'neural_nets',  label: 'Neural Networks',      domain: 'cs', description: 'Loosely inspired by brains — what makes them so powerful?' },
          transformers:  { id: 'transformers', label: 'Transformers',          domain: 'cs', description: 'The architecture behind GPT, BERT, and modern AI' },
          reinforcement: { id: 'reinforcement',label: 'Reinforcement Learning',domain: 'cs', description: 'Learning by doing — how AlphaGo and game-playing AIs work' },
          computer_vision:{ id: 'computer_vision', label: 'Computer Vision', domain: 'cs', description: 'Teaching machines to see and understand images' },
        }
      },
      systems: {
        id: 'systems', label: 'Systems', domain: 'cs',
        description: 'How computers actually work under the hood',
        children: {
          os:            { id: 'os',            label: 'Operating Systems',    domain: 'cs', description: 'The software that manages everything on your machine' },
          distributed:   { id: 'distributed',   label: 'Distributed Systems',  domain: 'cs', description: 'How do thousands of machines work together reliably?' },
          databases:     { id: 'databases',     label: 'Databases',            domain: 'cs', description: 'The science of storing, querying, and protecting data' },
          networking:    { id: 'networking',    label: 'Computer Networking',  domain: 'cs', description: 'How data travels across the internet' },
        }
      },
      theory: {
        id: 'theory', label: 'Theory of Computing', domain: 'cs',
        description: "What can and can't be computed — and why",
        children: {
          automata:      { id: 'automata',      label: 'Automata Theory',      domain: 'cs', description: 'Abstract machines and the languages they recognize' },
          computability: { id: 'computability', label: 'Computability Theory', domain: 'cs', description: 'Some problems have no algorithmic solution — provably' },
          information:   { id: 'information',   label: 'Information Theory',   domain: 'cs', description: "Claude Shannon's theory of what information actually is" },
          lambda:        { id: 'lambda',        label: 'Lambda Calculus',      domain: 'cs', description: 'The mathematical foundation of functional programming' },
        }
      },
      security: {
        id: 'security', label: 'Security', domain: 'cs',
        description: 'Protecting information in a connected world',
        children: {
          cryptography_cs:{ id: 'cryptography_cs', label: 'Applied Cryptography', domain: 'cs', description: 'Protocols that keep your messages secret' },
          hacking:       { id: 'hacking',       label: 'Ethical Hacking',     domain: 'cs', description: 'Finding and fixing vulnerabilities before attackers do' },
          blockchain:    { id: 'blockchain',    label: 'Blockchain',           domain: 'cs', description: 'How to achieve consensus without trust' },
          privacy:       { id: 'privacy',       label: 'Privacy Tech',         domain: 'cs', description: 'Zero-knowledge proofs, differential privacy, and more' },
        }
      },
      programming_languages: {
        id: 'programming_languages', label: 'Programming Languages', domain: 'cs',
        description: 'How we design languages for humans to talk to machines',
        children: {
          type_theory:   { id: 'type_theory',   label: 'Type Theory',          domain: 'cs', description: 'How types prevent bugs and encode proofs' },
          compilers:     { id: 'compilers',     label: 'Compilers',            domain: 'cs', description: 'How source code becomes machine instructions' },
          fp:            { id: 'fp',            label: 'Functional Programming',domain: 'cs', description: 'Programming without side effects — math as code' },
          pl_design:     { id: 'pl_design',     label: 'Language Design',      domain: 'cs', description: 'What makes a programming language beautiful or painful?' },
        }
      },
    }
  },

  science: {
    id: 'science', label: 'Science', domain: 'science',
    description: 'Understanding the physical and living world through evidence',
    children: {
      physics: {
        id: 'physics', label: 'Physics', domain: 'science',
        description: 'The fundamental laws governing matter, energy, and spacetime',
        children: {
          quantum:       { id: 'quantum',       label: 'Quantum Mechanics',    domain: 'science', description: 'Reality is deeply weird at small scales' },
          relativity:    { id: 'relativity',    label: 'Relativity',           domain: 'science', description: "Space and time are the same thing — Einstein's revolution" },
          thermodynamics:{ id: 'thermodynamics',label: 'Thermodynamics',       domain: 'science', description: 'Why heat flows, engines work, and entropy always increases' },
          condensed:     { id: 'condensed',     label: 'Condensed Matter',     domain: 'science', description: 'Superconductors, superfluids, and the hidden order of materials' },
        }
      },
      biology: {
        id: 'biology', label: 'Biology', domain: 'science',
        description: 'The science of life in all its forms',
        children: {
          genetics:      { id: 'genetics',      label: 'Genetics & DNA',       domain: 'science', description: 'The instruction manual for every living thing' },
          evolution:     { id: 'evolution',     label: 'Evolution',            domain: 'science', description: 'How life diversifies over billions of years' },
          neuroscience:  { id: 'neuroscience',  label: 'Neuroscience',         domain: 'science', description: 'How brains work — and why they sometimes don\'t' },
          cell_biology:  { id: 'cell_biology',  label: 'Cell Biology',         domain: 'science', description: 'The machinery of life, one cell at a time' },
        }
      },
      chemistry: {
        id: 'chemistry', label: 'Chemistry', domain: 'science',
        description: 'Matter, its properties, and the transformations it undergoes',
        children: {
          organic:       { id: 'organic',       label: 'Organic Chemistry',    domain: 'science', description: 'Carbon-based molecules — the chemistry of life' },
          quantum_chem:  { id: 'quantum_chem',  label: 'Quantum Chemistry',    domain: 'science', description: 'Using quantum mechanics to understand chemical bonds' },
          biochemistry:  { id: 'biochemistry',  label: 'Biochemistry',         domain: 'science', description: 'The molecular processes inside living cells' },
          materials:     { id: 'materials',     label: 'Materials Science',    domain: 'science', description: 'Engineering matter at the atomic level' },
        }
      },
      astronomy: {
        id: 'astronomy', label: 'Astronomy & Cosmology', domain: 'science',
        description: 'The universe at its largest scales',
        children: {
          black_holes:   { id: 'black_holes',   label: 'Black Holes',          domain: 'science', description: "Objects so dense that light can't escape" },
          cosmology:     { id: 'cosmology',     label: 'Cosmology',            domain: 'science', description: 'The origin, structure, and fate of the universe' },
          exoplanets:    { id: 'exoplanets',    label: 'Exoplanets',           domain: 'science', description: 'Worlds orbiting other stars — and the search for life' },
          dark_matter:   { id: 'dark_matter',   label: 'Dark Matter & Energy', domain: 'science', description: "95% of the universe is something we can't directly detect" },
        }
      },
    }
  },

  art: {
    id: 'art', label: 'Art & Design', domain: 'art',
    description: 'Visual expression, beauty, and the language of images',
    children: {
      visual_arts: {
        id: 'visual_arts', label: 'Visual Arts', domain: 'art',
        description: 'Painting, drawing, and the art of making images',
        children: {
          oil_painting:  { id: 'oil_painting',  label: 'Oil Painting',         domain: 'art', description: 'Rich, luminous, slow-drying — the medium of the old masters' },
          watercolor:    { id: 'watercolor',    label: 'Watercolor',           domain: 'art', description: 'Transparent, fluid, and unforgiving — beauty in accidents' },
          digital_art:   { id: 'digital_art',   label: 'Digital Art',          domain: 'art', description: 'New tools for human creativity — from pixel art to AI collaboration' },
          sculpture:     { id: 'sculpture',     label: 'Sculpture',            domain: 'art', description: 'Art you can walk around — volume, mass, and space' },
        }
      },
      design: {
        id: 'design', label: 'Design', domain: 'art',
        description: 'Making things that are both beautiful and functional',
        children: {
          graphic_design:{ id: 'graphic_design',label: 'Graphic Design',       domain: 'art', description: 'Visual communication — typography, color, layout' },
          ux_design:     { id: 'ux_design',     label: 'UX Design',            domain: 'art', description: 'Designing how people experience software and systems' },
          fashion:       { id: 'fashion',       label: 'Fashion Design',        domain: 'art', description: 'Clothing as culture, identity, and craft' },
          industrial:    { id: 'industrial',    label: 'Industrial Design',    domain: 'art', description: 'The design of objects — from chairs to iPhones' },
        }
      },
      art_history: {
        id: 'art_history', label: 'Art History', domain: 'art',
        description: 'How visual art has reflected and shaped human history',
        children: {
          renaissance:   { id: 'renaissance',   label: 'Renaissance',          domain: 'art', description: 'The rebirth of classical ideals — and the birth of perspective' },
          modernism:     { id: 'modernism',     label: 'Modernism',            domain: 'art', description: 'When artists broke every rule — Picasso, Mondrian, Pollock' },
          contemporary:  { id: 'contemporary',  label: 'Contemporary Art',     domain: 'art', description: 'Art since 1970 — concept over craft, questions over answers' },
          street_art:    { id: 'street_art',    label: 'Street Art & Graffiti',domain: 'art', description: 'Art that exists without permission — Banksy and beyond' },
        }
      },
    }
  },

  music: {
    id: 'music', label: 'Music', domain: 'music',
    description: 'Sound organized in time — the most universal human art',
    children: {
      instruments: {
        id: 'instruments', label: 'Instruments', domain: 'music',
        description: 'The tools of musical expression',
        children: {
          piano:         { id: 'piano',         label: 'Piano',                domain: 'music', description: 'Strings struck by hammers — the instrument of Bach, Beethoven, and jazz' },
          guitar:        { id: 'guitar',        label: 'Guitar',               domain: 'music', description: 'Six strings, infinite voices — classical, flamenco, blues, metal' },
          violin:        { id: 'violin',        label: 'Violin',               domain: 'music', description: 'The singing string instrument at the heart of the orchestra' },
          oboe:          { id: 'oboe',          label: 'Oboe',                 domain: 'music', description: 'Haunting double-reed sound — often the most technically demanding instrument' },
          theremin:      { id: 'theremin',      label: 'Theremin',             domain: 'music', description: 'Play music without touching anything — the first electronic instrument' },
          synth:         { id: 'synth',         label: 'Synthesizers',         domain: 'music', description: 'Electronic instruments that generate any sound imaginable' },
        }
      },
      theory: {
        id: 'music_theory', label: 'Music Theory', domain: 'music',
        description: 'The grammar and syntax of musical language',
        children: {
          harmony:       { id: 'harmony',       label: 'Harmony',              domain: 'music', description: 'Chords, progressions, and why some combinations feel tense or resolved' },
          counterpoint:  { id: 'counterpoint',  label: 'Counterpoint',         domain: 'music', description: "Bach's art: multiple independent melodies that work together perfectly" },
          rhythm:        { id: 'rhythm',        label: 'Rhythm & Meter',       domain: 'music', description: 'How time is organized in music — from 4/4 to complex polyrhythm' },
          atonality:     { id: 'atonality',     label: 'Atonality & Serialism',domain: 'music', description: 'When composers abandoned the key system entirely — Schoenberg, Webern' },
        }
      },
      genres: {
        id: 'genres', label: 'Genres & Styles', domain: 'music',
        description: 'The many traditions of musical expression',
        children: {
          jazz:          { id: 'jazz',          label: 'Jazz',                 domain: 'music', description: 'Improvisation, swing, and the uniquely American art form' },
          classical:     { id: 'classical',     label: 'Classical Music',      domain: 'music', description: 'From Bach to Beethoven to Mahler — 300 years of orchestral music' },
          electronic:    { id: 'electronic',    label: 'Electronic Music',     domain: 'music', description: 'From Kraftwerk to techno to ambient — sound as material' },
          folk:          { id: 'folk',          label: 'Folk & World Music',   domain: 'music', description: 'Music rooted in place, community, and oral tradition' },
        }
      },
    }
  },

  history: {
    id: 'history', label: 'History', domain: 'history',
    description: 'How we got here — the human story across time',
    children: {
      ancient: {
        id: 'ancient', label: 'Ancient History', domain: 'history',
        description: 'The first civilizations and the world they built',
        children: {
          egypt:         { id: 'egypt',         label: 'Ancient Egypt',        domain: 'history', description: '3,000 years of pharaohs, pyramids, and an extraordinary civilization' },
          rome:          { id: 'rome',          label: 'Rome',                 domain: 'history', description: 'From city-state to empire to the shape of the modern world' },
          greece:        { id: 'greece',        label: 'Ancient Greece',       domain: 'history', description: 'Democracy, philosophy, mathematics — the Greek foundations' },
          china_ancient: { id: 'china_ancient', label: 'Ancient China',        domain: 'history', description: 'The world\'s oldest continuous civilization' },
        }
      },
      modern: {
        id: 'modern', label: 'Modern History', domain: 'history',
        description: 'The last 500 years that shaped the world we live in',
        children: {
          revolutions:   { id: 'revolutions',   label: 'Age of Revolutions',   domain: 'history', description: 'French, American, Haitian — how the modern political order emerged' },
          ww1_ww2:       { id: 'ww1_ww2',       label: 'World Wars',           domain: 'history', description: 'The two conflicts that remade the 20th century' },
          cold_war:      { id: 'cold_war',       label: 'Cold War',            domain: 'history', description: 'Fifty years of ideological conflict between superpowers' },
          decolonization:{ id: 'decolonization', label: 'Decolonization',      domain: 'history', description: 'How empires ended and new nations were born' },
        }
      },
      thematic: {
        id: 'thematic', label: 'Thematic History', domain: 'history',
        description: 'History through specific lenses',
        children: {
          science_history:{ id: 'science_history', label: 'History of Science', domain: 'history', description: 'How humans discovered how the world works' },
          economic:      { id: 'economic',      label: 'Economic History',     domain: 'history', description: 'From barter to capitalism — how economies evolved' },
          social:        { id: 'social',        label: 'Social History',       domain: 'history', description: 'History from the bottom up — ordinary people, not rulers' },
          ideas:         { id: 'ideas',         label: 'History of Ideas',     domain: 'history', description: 'How concepts like democracy, liberty, and justice evolved' },
        }
      },
    }
  },

  philosophy: {
    id: 'philosophy', label: 'Philosophy', domain: 'philosophy',
    description: 'The hardest questions about existence, knowledge, and value',
    children: {
      ethics: {
        id: 'ethics', label: 'Ethics & Moral Philosophy', domain: 'philosophy',
        description: 'What is right, what is wrong, and why it matters',
        children: {
          utilitarianism:{ id: 'utilitarianism',label: 'Utilitarianism',       domain: 'philosophy', description: 'Maximize happiness — and the surprising places this leads' },
          deontology:    { id: 'deontology',    label: 'Deontology',           domain: 'philosophy', description: "Kant's ethics: some things are wrong regardless of consequences" },
          virtue_ethics: { id: 'virtue_ethics', label: 'Virtue Ethics',        domain: 'philosophy', description: "Aristotle's answer: be a good person, not just a rule-follower" },
          metaethics:    { id: 'metaethics',    label: 'Metaethics',           domain: 'philosophy', description: 'Are moral facts real? What does "wrong" even mean?' },
        }
      },
      epistemology: {
        id: 'epistemology', label: 'Epistemology', domain: 'philosophy',
        description: 'What is knowledge, and how do we get it?',
        children: {
          skepticism:    { id: 'skepticism',    label: 'Skepticism',           domain: 'philosophy', description: 'How do you know anything is real? The question that haunts philosophy' },
          empiricism:    { id: 'empiricism',    label: 'Empiricism',           domain: 'philosophy', description: 'Locke, Hume, and the idea that all knowledge comes from experience' },
          rationalism:   { id: 'rationalism',   label: 'Rationalism',          domain: 'philosophy', description: 'Descartes and the idea that reason alone can reach certain truth' },
          science_phil:  { id: 'science_phil',  label: 'Philosophy of Science',domain: 'philosophy', description: 'What makes a theory scientific? Why does science work?' },
        }
      },
      metaphysics: {
        id: 'metaphysics', label: 'Metaphysics', domain: 'philosophy',
        description: 'What is reality, fundamentally?',
        children: {
          consciousness: { id: 'consciousness', label: 'Philosophy of Mind',   domain: 'philosophy', description: 'Why is there something it\'s like to be you? The hard problem.' },
          free_will:     { id: 'free_will',     label: 'Free Will',            domain: 'philosophy', description: 'Do you actually make choices? What would that even mean?' },
          ontology:      { id: 'ontology',      label: 'Ontology',             domain: 'philosophy', description: 'What kinds of things actually exist?' },
          time_phil:     { id: 'time_phil',     label: 'Philosophy of Time',   domain: 'philosophy', description: 'Does the past still exist? Is the future real? Is time even real?' },
        }
      },
    }
  },

  engineering: {
    id: 'engineering', label: 'Engineering', domain: 'engineering',
    description: 'Designing and building the physical and digital world',
    children: {
      software: {
        id: 'software_eng', label: 'Software Engineering', domain: 'engineering',
        description: 'The craft of building reliable, maintainable software',
        children: {
          system_design: { id: 'system_design', label: 'System Design',        domain: 'engineering', description: 'How do you build software that millions of people can use?' },
          devops:        { id: 'devops',        label: 'DevOps & Infra',       domain: 'engineering', description: 'Automating how software gets built, deployed, and monitored' },
          testing:       { id: 'testing',       label: 'Testing & Reliability',domain: 'engineering', description: 'How do you know your software actually works?' },
          open_source:   { id: 'open_source',   label: 'Open Source',          domain: 'engineering', description: 'Collaborative software development in public' },
        }
      },
      mechanical: {
        id: 'mechanical', label: 'Mechanical Engineering', domain: 'engineering',
        description: 'Forces, motion, and the design of physical machines',
        children: {
          robotics:      { id: 'robotics',      label: 'Robotics',             domain: 'engineering', description: 'Building machines that sense, think, and act in the physical world' },
          thermodynamics_eng:{ id: 'thermodynamics_eng', label: 'Thermal Systems', domain: 'engineering', description: 'Engines, refrigerators, and power — thermodynamics applied' },
          materials_eng: { id: 'materials_eng', label: 'Materials Engineering',domain: 'engineering', description: 'Designing new materials for strength, flexibility, or conductivity' },
          fluid_dynamics:{ id: 'fluid_dynamics',label: 'Fluid Dynamics',       domain: 'engineering', description: 'How air and water flow — the science of flight and ocean currents' },
        }
      },
      electrical: {
        id: 'electrical', label: 'Electrical Engineering', domain: 'engineering',
        description: 'Electricity, signals, and the hardware behind computing',
        children: {
          circuits:      { id: 'circuits',      label: 'Circuit Design',       domain: 'engineering', description: 'How electrons flow through resistors, capacitors, and transistors' },
          semiconductors:{ id: 'semiconductors',label: 'Semiconductors',       domain: 'engineering', description: 'The physics that makes chips possible' },
          signal_proc:   { id: 'signal_proc',   label: 'Signal Processing',    domain: 'engineering', description: 'How audio, images, and radio signals are analyzed and transformed' },
          power_systems: { id: 'power_systems', label: 'Power Systems',        domain: 'engineering', description: 'How electricity is generated, transmitted, and distributed' },
        }
      },
    }
  },

  literature: {
    id: 'literature', label: 'Literature', domain: 'literature',
    description: 'Language as art — stories, poems, and the written word',
    children: {
      fiction: {
        id: 'fiction', label: 'Fiction', domain: 'literature',
        description: 'Invented stories and the truths they tell',
        children: {
          novel:         { id: 'novel',         label: 'The Novel',            domain: 'literature', description: 'The dominant art form of the last 300 years — and what it does uniquely' },
          short_stories: { id: 'short_stories', label: 'Short Stories',        domain: 'literature', description: 'Economy of language — Chekhov, Carver, Borges' },
          sci_fi:        { id: 'sci_fi',        label: 'Science Fiction',      domain: 'literature', description: 'Using the future and alternate worlds to interrogate the present' },
          magical_realism:{ id: 'magical_realism', label: 'Magical Realism',  domain: 'literature', description: 'The magical woven into the ordinary — García Márquez, Rushdie' },
        }
      },
      poetry: {
        id: 'poetry', label: 'Poetry', domain: 'literature',
        description: 'Language compressed to its most essential and musical',
        children: {
          classical_poetry:{ id: 'classical_poetry', label: 'Classical Poetry', domain: 'literature', description: 'Homer, Virgil, Li Bai — the epic and lyric traditions' },
          modern_poetry: { id: 'modern_poetry', label: 'Modern Poetry',        domain: 'literature', description: 'Whitman to Plath — how poetry was remade in the 20th century' },
          slam:          { id: 'slam',          label: 'Spoken Word & Slam',   domain: 'literature', description: 'Poetry as performance — oral tradition for a new era' },
          form:          { id: 'form',          label: 'Form & Prosody',       domain: 'literature', description: 'Sonnets, haiku, free verse — how form shapes meaning' },
        }
      },
      writing_craft: {
        id: 'writing_craft', label: 'The Craft of Writing', domain: 'literature',
        description: 'How great writing is made',
        children: {
          narrative:     { id: 'narrative',     label: 'Narrative Structure',  domain: 'literature', description: "How stories are shaped — three acts, hero's journey, and beyond" },
          voice:         { id: 'voice',         label: 'Voice & Style',        domain: 'literature', description: 'The distinctive quality that makes writing sound like someone' },
          revision:      { id: 'revision',      label: 'Revision & Editing',   domain: 'literature', description: 'Great writing is rewriting — the craft of making it better' },
          nonfiction:    { id: 'nonfiction',    label: 'Creative Nonfiction',  domain: 'literature', description: 'True stories told with literary craft — memoir, essay, journalism' },
        }
      },
    }
  },

  languages: {
    id: 'languages', label: 'Languages', domain: 'languages',
    description: 'The systems humans use to communicate and think',
    children: {
      linguistics: {
        id: 'linguistics', label: 'Linguistics', domain: 'languages',
        description: 'The scientific study of language itself',
        children: {
          phonetics:     { id: 'phonetics',     label: 'Phonetics & Phonology',domain: 'languages', description: 'The sounds of language — how mouths make meaning' },
          syntax:        { id: 'syntax',        label: 'Syntax',               domain: 'languages', description: 'How words combine into sentences — universal structures' },
          semantics:     { id: 'semantics',     label: 'Semantics & Pragmatics',domain: 'languages', description: "How meaning works — and why 'Can you pass the salt?' is a request" },
          historical_ling:{ id: 'historical_ling', label: 'Historical Linguistics', domain: 'languages', description: 'How languages change over centuries and descend from common ancestors' },
        }
      },
      specific_languages: {
        id: 'specific_languages', label: 'Language Learning', domain: 'languages',
        description: 'Learning specific human languages',
        children: {
          mandarin:      { id: 'mandarin',      label: 'Mandarin Chinese',     domain: 'languages', description: 'The most spoken language on Earth — tones, characters, and culture' },
          arabic:        { id: 'arabic',        label: 'Arabic',               domain: 'languages', description: 'The language of the Quran, al-jabr, and a billion people' },
          japanese:      { id: 'japanese',      label: 'Japanese',             domain: 'languages', description: 'Three writing systems and a deeply different grammar' },
          latin:         { id: 'latin',         label: 'Latin',                domain: 'languages', description: 'The dead language that shaped every European language' },
        }
      },
    }
  },

  cooking: {
    id: 'cooking', label: 'Cooking & Food', domain: 'cooking',
    description: 'The science and art of transforming ingredients',
    children: {
      techniques: {
        id: 'techniques', label: 'Techniques', domain: 'cooking',
        description: 'The fundamental skills of the kitchen',
        children: {
          knife_skills:  { id: 'knife_skills',  label: 'Knife Skills',         domain: 'cooking', description: 'Mise en place and the mastery that separates cooks from chefs' },
          fermentation:  { id: 'fermentation',  label: 'Fermentation',         domain: 'cooking', description: 'Cheese, bread, wine, kimchi — life transforming food' },
          baking_science:{ id: 'baking_science',label: 'Baking Science',       domain: 'cooking', description: 'Chemistry as pastry — why bread rises and soufflés fall' },
          emulsification:{ id: 'emulsification',label: 'Emulsification',       domain: 'cooking', description: 'Mayonnaise, hollandaise, vinaigrette — the science of mixing unmixables' },
        }
      },
      cuisines: {
        id: 'cuisines', label: 'World Cuisines', domain: 'cooking',
        description: 'The culinary traditions of the world',
        children: {
          japanese_cuisine:{ id: 'japanese_cuisine', label: 'Japanese Cuisine', domain: 'cooking', description: 'Umami, precision, and a philosophy of respect for ingredients' },
          french_cuisine:{ id: 'french_cuisine',label: 'French Cuisine',       domain: 'cooking', description: 'The foundation of modern Western cooking — mother sauces and beyond' },
          indian_cuisine:{ id: 'indian_cuisine',label: 'Indian Cuisine',       domain: 'cooking', description: 'A continent of flavors — spice as structure, not just heat' },
          west_african:  { id: 'west_african',  label: 'West African Cuisine', domain: 'cooking', description: 'The underappreciated origin of much American and Caribbean food' },
        }
      },
      food_science: {
        id: 'food_science', label: 'Food Science', domain: 'cooking',
        description: 'The chemistry and physics of cooking',
        children: {
          maillard:      { id: 'maillard',      label: 'Maillard Reaction',    domain: 'cooking', description: 'The chemistry of browning — why toast is delicious' },
          flavor:        { id: 'flavor',        label: 'Flavor Science',       domain: 'cooking', description: 'Smell, taste, texture, and why food is mostly nose' },
          food_history:  { id: 'food_history',  label: 'History of Food',      domain: 'cooking', description: 'Spice trade, refrigeration, and how food shaped civilizations' },
          nutrition:     { id: 'nutrition',     label: 'Nutrition Science',    domain: 'cooking', description: 'What food actually does to your body — separating science from fads' },
        }
      },
    }
  },

  film: {
    id: 'film', label: 'Film', domain: 'film',
    description: 'Moving images as art, story, and cultural force',
    children: {
      craft: {
        id: 'film_craft', label: 'Film Craft', domain: 'film',
        description: 'The technical and artistic tools of filmmaking',
        children: {
          cinematography:{ id: 'cinematography', label: 'Cinematography',      domain: 'film', description: 'How the camera frames, moves, and lights the world — the visual language of film' },
          editing:       { id: 'editing',        label: 'Film Editing',        domain: 'film', description: 'Montage, rhythm, and the invisible art that makes movies work' },
          sound_design:  { id: 'sound_design',   label: 'Sound Design',        domain: 'film', description: "Half of film is sound — and most of the time you don't notice it" },
          directing:     { id: 'directing',      label: 'Directing',           domain: 'film', description: 'Translating a script into a world on screen — the director\'s vision' },
        }
      },
      history_genres: {
        id: 'film_history', label: 'Film History & Genres', domain: 'film',
        description: 'How cinema evolved and the forms it took',
        children: {
          silent_era:    { id: 'silent_era',    label: 'Silent Cinema',        domain: 'film', description: 'Chaplin, Eisenstein, Lang — when cinema invented its language without sound' },
          new_waves:     { id: 'new_waves',     label: 'New Wave Cinema',      domain: 'film', description: 'French, Italian, Korean — movements that remade film' },
          documentary:   { id: 'documentary',   label: 'Documentary',          domain: 'film', description: 'Truth through film — from Nanook of the North to The Act of Killing' },
          animation:     { id: 'animation',     label: 'Animation',            domain: 'film', description: 'From Disney to Studio Ghibli to stop-motion — every frame made by hand' },
        }
      },
    }
  },

  architecture: {
    id: 'architecture', label: 'Architecture', domain: 'architecture',
    description: 'The art and science of designing spaces for human life',
    children: {
      styles: {
        id: 'arch_styles', label: 'Architectural Styles', domain: 'architecture',
        description: 'The great traditions and movements in building design',
        children: {
          gothic:        { id: 'gothic',        label: 'Gothic Architecture',  domain: 'architecture', description: 'Soaring cathedrals, pointed arches, and the art of letting in light' },
          modernism_arch:{ id: 'modernism_arch',label: 'Modernist Architecture',domain: 'architecture', description: 'Le Corbusier, Mies van der Rohe — form follows function' },
          organic:       { id: 'organic',       label: 'Organic Architecture', domain: 'architecture', description: "Frank Lloyd Wright and building in harmony with nature" },
          parametric:    { id: 'parametric',    label: 'Parametric Design',   domain: 'architecture', description: 'Algorithms and computation in architectural form — Zaha Hadid' },
        }
      },
      urban: {
        id: 'urban', label: 'Urban Design & Planning', domain: 'architecture',
        description: 'How we design cities and public spaces',
        children: {
          urbanism:      { id: 'urbanism',      label: 'Urbanism',             domain: 'architecture', description: "What makes cities livable? Jane Jacobs vs Robert Moses" },
          sustainable:   { id: 'sustainable',   label: 'Sustainable Design',   domain: 'architecture', description: 'Buildings that work with climate rather than against it' },
          public_space:  { id: 'public_space',  label: 'Public Space',         domain: 'architecture', description: 'Parks, squares, streets — the shared rooms of a city' },
          landscape:     { id: 'landscape',     label: 'Landscape Architecture',domain: 'architecture', description: 'Designing the land itself — gardens, parks, and terrain' },
        }
      },
    }
  },

  dance: {
    id: 'dance', label: 'Dance', domain: 'dance',
    description: 'The body in motion as expression and communication',
    children: {
      classical: {
        id: 'classical_dance', label: 'Classical Dance', domain: 'dance',
        description: 'Codified dance forms with long technical traditions',
        children: {
          ballet:        { id: 'ballet',        label: 'Ballet',               domain: 'dance', description: 'The classical tradition — pointe shoes, codified vocabulary, and pure line' },
          contemporary:  { id: 'contemporary_dance', label: 'Contemporary Dance', domain: 'dance', description: 'Post-ballet — release technique, improvisation, and conceptual movement' },
          bharatanatyam: { id: 'bharatanatyam', label: 'Bharatanatyam',         domain: 'dance', description: 'Ancient Indian classical dance — mudras, abhinaya, and devotion' },
          chinese_dance: { id: 'chinese_dance', label: 'Chinese Classical Dance',domain: 'dance', description: 'Han, minority, and folk traditions of Chinese movement' },
        }
      },
      social: {
        id: 'social_dance', label: 'Social & Street Dance', domain: 'dance',
        description: 'Dance that lives in communities and parties',
        children: {
          hip_hop:       { id: 'hip_hop',       label: 'Hip-Hop Dance',        domain: 'dance', description: 'Breaking, popping, locking — born in the Bronx in the 1970s' },
          salsa:         { id: 'salsa',         label: 'Salsa & Latin Dance',  domain: 'dance', description: 'Afro-Cuban rhythms, footwork, and partner improvisation' },
          west_african_dance:{ id: 'west_african_dance', label: 'West African Dance', domain: 'dance', description: 'Community, ceremony, and the roots of so much dance tradition' },
          tap:           { id: 'tap',           label: 'Tap Dance',            domain: 'dance', description: 'Percussion from the feet — jazz rhythms made physical' },
        }
      },
    }
  },

  sports: {
    id: 'sports', label: 'Sports & Movement', domain: 'sports',
    description: 'Human physical achievement and the science behind it',
    children: {
      movement_science: {
        id: 'movement_science', label: 'Movement Science', domain: 'sports',
        description: 'The biology and physics of how humans move',
        children: {
          biomechanics:  { id: 'biomechanics',  label: 'Biomechanics',         domain: 'sports', description: 'The physics of the human body in motion' },
          exercise_sci:  { id: 'exercise_sci',  label: 'Exercise Science',     domain: 'sports', description: 'How training changes the body at a cellular level' },
          sports_psych:  { id: 'sports_psych',  label: 'Sports Psychology',    domain: 'sports', description: 'Mental performance, flow states, and what champions actually think about' },
          nutrition_sports:{ id: 'nutrition_sports', label: 'Sports Nutrition', domain: 'sports', description: 'Fueling performance — what elite athletes actually eat and why' },
        }
      },
      specific_sports: {
        id: 'specific_sports', label: 'Sports Strategy & Tactics', domain: 'sports',
        description: 'The game theory and strategy behind sports',
        children: {
          basketball:    { id: 'basketball',    label: 'Basketball',           domain: 'sports', description: 'Analytics, spacing, and the tactical evolution of the sport' },
          soccer:        { id: 'soccer',        label: 'Soccer / Football',    domain: 'sports', description: 'The world\'s game — pressing, possession, and cultural phenomenon' },
          chess:         { id: 'chess',         label: 'Chess',                domain: 'sports', description: 'The eternal game — patterns, calculation, and positional understanding' },
          martial_arts:  { id: 'martial_arts',  label: 'Martial Arts',         domain: 'sports', description: 'Combat, discipline, and the philosophy of controlled force' },
        }
      },
    }
  },
};

// Flat lookup by ID for fast access
export const SEED_INDEX = {};
function buildIndex(node) {
  if (node.id) SEED_INDEX[node.id] = node;
  if (node.children) {
    Object.values(node.children).forEach(buildIndex);
  }
}
Object.values(SEED_DATA).forEach(buildIndex);

// Get children of a node by ID (returns array)
export function getSeedChildren(nodeId) {
  const node = SEED_INDEX[nodeId];
  if (!node?.children) return null;
  return Object.values(node.children).map((child) => ({
    ...child,
    children: child.children ? Object.values(child.children) : [],
  }));
}

// Get node by ID
export function getSeedNode(nodeId) {
  return SEED_INDEX[nodeId] || null;
}

// All top-level domain nodes as array
export const ROOT_NODES = Object.values(SEED_DATA);
