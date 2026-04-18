#!/usr/bin/env node
/**
 * Course Pre-warmer — generates full course outlines for popular topics
 * using real educational data from Wikipedia, Khan Academy, and MIT OCW.
 *
 * Saves outlines to Firebase `courses` collection so users get instant
 * course loads without waiting for AI generation.
 *
 * Usage:
 *   VITE_FIREBASE_* env vars must be set (same as .env)
 *   node scripts/prewarm-courses.js [--topic "Category Theory"] [--all] [--domain math]
 *
 * Dependencies: node-fetch (already in devDeps or use native fetch in Node 18+)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// ── Topic library — curated from real course catalogs ──
// Drawn from: Princeton COS, MIT 6.xxx, Khan Academy, Stanford CS/Math/Bio
const TOPIC_LIBRARY = {
  math: [
    { topic: 'Calculus', slug: 'calculus', seed: 'limits, derivatives, integrals, fundamental theorem' },
    { topic: 'Linear Algebra', slug: 'linear_algebra', seed: 'vectors, matrices, eigenvalues, transformations' },
    { topic: 'Probability Theory', slug: 'probability', seed: 'sample spaces, distributions, Bayes theorem, expectation' },
    { topic: 'Category Theory', slug: 'category_theory', seed: 'objects, morphisms, functors, natural transformations, monads' },
    { topic: 'Real Analysis', slug: 'real_analysis', seed: 'sequences, limits, continuity, Riemann integrals, metric spaces' },
    { topic: 'Abstract Algebra', slug: 'abstract_algebra', seed: 'groups, rings, fields, homomorphisms, Galois theory' },
    { topic: 'Number Theory', slug: 'number_theory', seed: 'primes, congruences, RSA, Fermat, modular arithmetic' },
    { topic: 'Topology', slug: 'topology', seed: 'open sets, continuity, compactness, homeomorphisms, manifolds' },
    { topic: 'Statistics', slug: 'statistics', seed: 'hypothesis testing, confidence intervals, regression, distributions' },
    { topic: 'Differential Equations', slug: 'differential_equations', seed: 'ODEs, PDEs, Laplace transforms, phase portraits' },
    { topic: 'Discrete Mathematics', slug: 'discrete_math', seed: 'graph theory, combinatorics, logic, induction, complexity' },
    { topic: 'Game Theory', slug: 'game_theory', seed: 'Nash equilibrium, zero-sum games, mechanism design, cooperation' },
  ],
  cs: [
    { topic: 'Algorithms and Data Structures', slug: 'algorithms', seed: 'sorting, trees, graphs, dynamic programming, complexity' },
    { topic: 'Computer Architecture', slug: 'computer_architecture', seed: 'CPU, memory hierarchy, pipelining, cache, instruction sets' },
    { topic: 'Operating Systems', slug: 'operating_systems', seed: 'processes, scheduling, memory management, file systems, concurrency' },
    { topic: 'Machine Learning', slug: 'machine_learning', seed: 'supervised learning, neural networks, gradient descent, overfitting' },
    { topic: 'Cryptography', slug: 'cryptography', seed: 'symmetric encryption, public key, hash functions, digital signatures' },
    { topic: 'Computer Networks', slug: 'computer_networks', seed: 'TCP/IP, routing, HTTP, DNS, security protocols' },
    { topic: 'Programming Languages', slug: 'programming_languages', seed: 'type systems, lambda calculus, parsing, compilers, semantics' },
    { topic: 'Database Systems', slug: 'database_systems', seed: 'relational model, SQL, transactions, B-trees, normalization' },
    { topic: 'Distributed Systems', slug: 'distributed_systems', seed: 'CAP theorem, consensus, Paxos, replication, fault tolerance' },
    { topic: 'Computer Vision', slug: 'computer_vision', seed: 'convolutions, CNNs, object detection, feature extraction, GANs' },
    { topic: 'Natural Language Processing', slug: 'nlp', seed: 'tokenization, embeddings, transformers, attention, BERT, GPT' },
    { topic: 'Introduction to Programming', slug: 'intro_programming', seed: 'variables, control flow, functions, recursion, data structures' },
  ],
  physics: [
    { topic: 'Classical Mechanics', slug: 'classical_mechanics', seed: 'Newton laws, energy, momentum, Lagrangian, oscillations' },
    { topic: 'Quantum Mechanics', slug: 'quantum_mechanics', seed: 'wave function, Schrödinger equation, superposition, entanglement, measurement' },
    { topic: 'Special Relativity', slug: 'special_relativity', seed: 'Lorentz transforms, time dilation, length contraction, E=mc²' },
    { topic: 'Electromagnetism', slug: 'electromagnetism', seed: 'Maxwell equations, electric fields, magnetic fields, induction, waves' },
    { topic: 'Thermodynamics', slug: 'thermodynamics', seed: 'entropy, laws of thermodynamics, heat engines, statistical mechanics' },
    { topic: 'General Relativity', slug: 'general_relativity', seed: 'spacetime curvature, Einstein field equations, black holes, gravitational waves' },
    { topic: 'Particle Physics', slug: 'particle_physics', seed: 'Standard Model, quarks, bosons, Higgs field, symmetry breaking' },
    { topic: 'Astrophysics', slug: 'astrophysics', seed: 'stellar evolution, black holes, neutron stars, cosmology, dark matter' },
  ],
  biology: [
    { topic: 'Molecular Biology', slug: 'molecular_biology', seed: 'DNA replication, transcription, translation, protein folding, mutations' },
    { topic: 'Genetics', slug: 'genetics', seed: 'Mendelian inheritance, linkage, mutations, epigenetics, CRISPR' },
    { topic: 'Evolution', slug: 'evolution', seed: 'natural selection, genetic drift, speciation, phylogenetics, fitness' },
    { topic: 'Neuroscience', slug: 'neuroscience', seed: 'action potentials, synapses, neural circuits, plasticity, cognition' },
    { topic: 'Cell Biology', slug: 'cell_biology', seed: 'organelles, cell cycle, mitosis, meiosis, signaling pathways' },
    { topic: 'Ecology', slug: 'ecology', seed: 'ecosystems, food webs, population dynamics, biodiversity, climate' },
    { topic: 'Immunology', slug: 'immunology', seed: 'antibodies, T cells, B cells, innate immunity, vaccines' },
  ],
  economics: [
    { topic: 'Microeconomics', slug: 'microeconomics', seed: 'supply and demand, elasticity, market equilibrium, game theory, externalities' },
    { topic: 'Macroeconomics', slug: 'macroeconomics', seed: 'GDP, inflation, monetary policy, fiscal policy, business cycles' },
    { topic: 'Behavioral Economics', slug: 'behavioral_economics', seed: 'cognitive biases, prospect theory, nudges, heuristics, rationality' },
    { topic: 'Financial Markets', slug: 'financial_markets', seed: 'stocks, bonds, derivatives, risk, asset pricing, efficient markets' },
  ],
  philosophy: [
    { topic: 'Philosophy of Mind', slug: 'philosophy_of_mind', seed: 'consciousness, qualia, physicalism, functionalism, Turing test' },
    { topic: 'Ethics', slug: 'ethics', seed: 'utilitarianism, deontology, virtue ethics, moral relativism, applied ethics' },
    { topic: 'Logic and Reasoning', slug: 'logic', seed: 'propositional logic, predicate logic, validity, soundness, paradoxes' },
    { topic: 'Epistemology', slug: 'epistemology', seed: 'knowledge, justification, skepticism, perception, a priori' },
  ],
  history: [
    { topic: 'World War II', slug: 'world_war_2', seed: 'causes, key battles, Holocaust, Manhattan Project, Allied victory, aftermath' },
    { topic: 'The Scientific Revolution', slug: 'scientific_revolution', seed: 'Copernicus, Galileo, Newton, empiricism, Royal Society' },
    { topic: 'The French Revolution', slug: 'french_revolution', seed: 'Bastille, Reign of Terror, Napoleon, Enlightenment, republic' },
    { topic: 'The Cold War', slug: 'cold_war', seed: 'nuclear deterrence, Berlin Wall, proxy wars, space race, détente' },
  ],
};

// Khan Academy topic slugs we can fetch from their API
const KA_TOPIC_MAP = {
  calculus: 'ap-calculus-ab',
  linear_algebra: 'linear-algebra',
  probability: 'statistics-probability',
  algorithms: 'computing/computer-science/algorithms',
  machine_learning: 'computing/computer-science/machine-learning',
  microeconomics: 'economics-finance-domain/microeconomics',
  genetics: 'science/genetics',
  evolution: 'science/high-school-biology/hs-evolution',
};

async function fetchKhanAcademyTopic(slug) {
  try {
    const url = `https://www.khanacademy.org/api/v1/topic/${slug}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title,
      description: data.description,
      children: (data.children || []).slice(0, 8).map(c => ({ title: c.title, kind: c.kind })),
    };
  } catch {
    return null;
  }
}

async function fetchWikiSummary(topic) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.extract || null;
  } catch {
    return null;
  }
}

function buildEnrichedOutlinePrompt(entry, kaData, wikiSummary, ageGroup = 'college') {
  const kaContext = kaData
    ? `\nKhan Academy structure for this topic: ${JSON.stringify(kaData, null, 2).slice(0, 500)}`
    : '';
  const wikiContext = wikiSummary
    ? `\nWikipedia summary: ${wikiSummary.slice(0, 600)}`
    : '';
  const seedContext = entry.seed
    ? `\nKey concepts that must appear: ${entry.seed}`
    : '';

  return {
    systemPrompt: `You are a world-class curriculum designer. You have access to real course structures from Khan Academy, MIT OpenCourseWare, Princeton, and Stanford. Use the reference material provided to ground the course structure in real educational practice. Return only valid JSON.`,
    prompt: `Design a complete course outline for: "${entry.topic}"
${wikiContext}${kaContext}${seedContext}

Target audience: ${ageGroup} learner. Build for genuine mastery — not a survey.

Requirements:
- 5-7 modules that build on each other logically (foundation → frontier)
- 3-5 lessons per module, each with a specific, evocative title (not generic)
- Total estimatedHours: 8-20 hours realistically
- lesson durationMins: 6-12 mins each
- lesson type: concept | example | practice
- prerequisiteKnowledge: none | basic | intermediate
- The tagline must make someone think "I need this"
- Lesson titles should be specific enough to search for on Wikipedia

Return ONLY valid JSON, no markdown:
{
  "title": "...",
  "tagline": "...",
  "emoji": "...",
  "estimatedHours": 0,
  "prerequisiteKnowledge": "none|basic|intermediate",
  "modules": [
    {
      "id": "module_1",
      "title": "...",
      "overview": "...",
      "lessons": [
        { "id": "lesson_1_1", "title": "...", "durationMins": 8, "type": "concept" }
      ]
    }
  ]
}`,
  };
}

async function callAI(prompt, systemPrompt) {
  // Uses Puter.js via a simple fetch to their chat API
  // In Node, we fall back to the Anthropic API if VITE_ANTHROPIC_API_KEY is set
  const anthropicKey = process.env.VITE_ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not set — cannot call AI in pre-warmer');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

function parseJson(text) {
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (!objMatch) return null;
  try { return JSON.parse(objMatch[0]); } catch { return null; }
}

let db;
function initFirebase() {
  const config = {
    apiKey:            process.env.VITE_FIREBASE_API_KEY,
    authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.VITE_FIREBASE_APP_ID,
  };
  if (!config.apiKey) throw new Error('Firebase env vars not set');
  const app = initializeApp(config);
  db = getFirestore(app);
}

async function saveCourse(slug, outline) {
  await setDoc(doc(db, 'courses', slug), {
    outline,
    generatedAt: new Date().toISOString(),
    source: 'prewarm-script',
  });
}

async function courseExists(slug) {
  const snap = await getDoc(doc(db, 'courses', slug));
  return snap.exists();
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);
  const targetTopic = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;
  const targetDomain = args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null;
  const forceRegen = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  console.log('🔥 Spark Course Pre-warmer');
  console.log('═══════════════════════════');

  if (!dryRun) {
    initFirebase();
    console.log('✓ Firebase connected');
  }

  // Collect topics to process
  let topics = [];
  if (targetTopic) {
    // Single topic mode
    topics = [{ topic: targetTopic, slug: targetTopic.toLowerCase().replace(/\s+/g, '_'), seed: '' }];
  } else if (targetDomain) {
    topics = TOPIC_LIBRARY[targetDomain] || [];
  } else {
    // All topics
    topics = Object.values(TOPIC_LIBRARY).flat();
  }

  console.log(`📚 Processing ${topics.length} topics...\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of topics) {
    const { topic, slug } = entry;
    process.stdout.write(`  ${topic}... `);

    try {
      // Skip if already exists (unless --force)
      if (!dryRun && !forceRegen && await courseExists(slug)) {
        console.log('⏭  (cached)');
        skipped++;
        continue;
      }

      // Fetch real educational context
      const [wikiSummary, kaData] = await Promise.allSettled([
        fetchWikiSummary(topic),
        KA_TOPIC_MAP[slug] ? fetchKhanAcademyTopic(KA_TOPIC_MAP[slug]) : Promise.resolve(null),
      ]);

      const wiki = wikiSummary.status === 'fulfilled' ? wikiSummary.value : null;
      const ka = kaData.status === 'fulfilled' ? kaData.value : null;

      if (wiki) process.stdout.write('📖 ');
      if (ka) process.stdout.write('🎯 ');

      // Build enriched prompt
      const { prompt, systemPrompt } = buildEnrichedOutlinePrompt(entry, ka, wiki);

      if (dryRun) {
        console.log('✓ (dry run — would generate)');
        generated++;
        continue;
      }

      // Generate outline
      const raw = await callAI(prompt, systemPrompt);
      const outline = parseJson(raw);

      if (!outline?.modules?.length) {
        console.log('✗ (parse failed)');
        failed++;
        continue;
      }

      // Save to Firebase
      await saveCourse(slug, outline);
      console.log(`✓ (${outline.modules.length} modules, ${outline.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons)`);
      generated++;

      // Rate limit — be nice to APIs
      await new Promise(r => setTimeout(r, 1500));

    } catch (err) {
      console.log(`✗ (${err.message})`);
      failed++;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n═══════════════════════════');
  console.log(`✓ Generated: ${generated}  ⏭ Skipped: ${skipped}  ✗ Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
