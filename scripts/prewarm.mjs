/**
 * Pre-warm script — generates AI content for common topics and saves to Firebase.
 * Run: node scripts/prewarm.mjs [batch]
 *
 * Each batch pre-generates: explainer + keyTakeaways + quickQuiz
 * for a set of topics, for the 'college' and 'adult' age groups.
 * Results are saved to Firebase aiCache collection so ALL users get instant responses.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';

// ── Config (read from .env) ──
function readEnv() {
  const env = {};
  try {
    const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.+)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
  } catch { /* .env missing */ }
  return env;
}

const ENV = readEnv();
const FIREBASE_CONFIG = {
  apiKey:            ENV.VITE_FIREBASE_API_KEY,
  authDomain:        ENV.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         ENV.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     ENV.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             ENV.VITE_FIREBASE_APP_ID,
};
const ANTHROPIC_KEY = ENV.VITE_ANTHROPIC_API_KEY;

// ── Helpers ──
function hashPath(path) {
  if (!Array.isArray(path)) return String(path);
  return path.join('::').toLowerCase().replace(/\s+/g, '_');
}

function parseAIJson(text) {
  if (!text) return null;
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch { return null; }
}

function safeDocId(type, cacheKey) {
  return `${type}__${cacheKey}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 500);
}

// ── Firebase ──
let db;
function initDb() {
  if (!FIREBASE_CONFIG.apiKey) throw new Error('Missing Firebase API key');
  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);
}

async function alreadyCached(docId) {
  try {
    const snap = await getDoc(doc(db, 'aiCache', docId));
    return snap.exists();
  } catch { return false; }
}

async function saveToCache(docId, value) {
  await setDoc(doc(db, 'aiCache', docId), { value, generatedAt: new Date().toISOString() });
}

// ── Anthropic ──
let anthropic;
function initAI() {
  if (!ANTHROPIC_KEY || ANTHROPIC_KEY === 'sk-ant-...') {
    throw new Error('Real Anthropic API key required. Set VITE_ANTHROPIC_API_KEY in .env');
  }
  anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
}

async function callAI(prompt, systemPrompt) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content[0].text;
}

// ── Prompt builders (mirrors src/ai/prompts.js) ──
function explainerPrompt(topic, ageGroup) {
  const wordLimit = ['little_explorer', 'student'].includes(ageGroup) ? 200 : 300;
  return {
    systemPrompt: `You write crystal-clear, engaging educational explanations. Never use jargon without defining it. No bullet points — flowing prose only. Under ${wordLimit} words total.`,
    prompt: `Explain "${topic}" in 3 paragraphs:
1. A hook that surprises or intrigues (1-2 sentences)
2. The core concept with an analogy or concrete example
3. A teaser that makes the reader want to go deeper

Age group: ${ageGroup}. No markdown formatting. Plain paragraphs only.`,
  };
}

function keyTakeawaysPrompt(topic, ageGroup) {
  const wordLimit = ageGroup === 'little_explorer' ? 12 : 20;
  return {
    systemPrompt: `You write punchy, memorable key points. Each under ${wordLimit} words. Return ONLY valid JSON array.`,
    prompt: `Give 3 key takeaways about "${topic}" that are surprising, memorable, and useful.

Return only: ["takeaway1", "takeaway2", "takeaway3"]

No explanation, no markdown, pure JSON array.`,
  };
}

function quickQuizPrompt(topic, ageGroup) {
  const difficulty = ['little_explorer', 'student'].includes(ageGroup) ? 'easy' : 'moderate';
  return {
    systemPrompt: `You write educational multiple-choice questions. ${difficulty} difficulty. Return ONLY valid JSON.`,
    prompt: `Write 1 multiple-choice question about "${topic}".

Return only:
{"question":"...", "options":["A","B","C","D"], "correct":0, "explanation":"One sentence why."}

The "correct" field is the 0-indexed position of the right answer.
No markdown, pure JSON only.`,
  };
}

// ── Main ──
async function prewarm(topics, batchLabel) {
  console.log(`[${batchLabel}] Starting — ${topics.length} topics`);

  for (const { label, path, domain } of topics) {
    const topicPath = path || [label];
    const pathHash = hashPath(topicPath);

    for (const ageGroup of ['college', 'adult']) {
      const tasks = [
        {
          type: 'explainer',
          cacheKey: `ex:${pathHash}:${label}:${ageGroup}:spark`,
          prompt: explainerPrompt(label, ageGroup),
          isJson: false,
        },
        {
          type: 'keyTakeaways',
          cacheKey: `kt:${pathHash}:${label}:${ageGroup}`,
          prompt: keyTakeawaysPrompt(label, ageGroup),
          isJson: true,
        },
        {
          type: 'quickQuiz',
          cacheKey: `qq:${pathHash}:${label}:${ageGroup}`,
          prompt: quickQuizPrompt(label, ageGroup),
          isJson: true,
        },
      ];

      for (const task of tasks) {
        const docId = safeDocId(task.type, task.cacheKey);
        if (await alreadyCached(docId)) {
          process.stdout.write('.');
          continue;
        }
        try {
          const raw = await callAI(task.prompt.prompt, task.prompt.systemPrompt);
          const value = task.isJson ? parseAIJson(raw) : raw;
          if (value) {
            await saveToCache(docId, value);
            process.stdout.write('✓');
          } else {
            process.stdout.write('✗');
          }
        } catch (err) {
          process.stdout.write('!');
          console.error(`\n  Error for ${label}/${task.type}:`, err.message);
        }
        // Rate limit: 2 req/s to stay within Haiku limits
        await new Promise(r => setTimeout(r, 500));
      }
    }
    console.log(`  ${label} (${domain})`);
  }

  console.log(`\n[${batchLabel}] Done!`);
}

// ── Topic batches ──
const ALL_BATCHES = {
  math: [
    { label: 'Linear Algebra', domain: 'math', path: ['Mathematics', 'Algebra', 'Linear Algebra'] },
    { label: 'Abstract Algebra', domain: 'math', path: ['Mathematics', 'Algebra', 'Abstract Algebra'] },
    { label: 'Topology', domain: 'math', path: ['Mathematics', 'Geometry', 'Topology'] },
    { label: 'Fractal Geometry', domain: 'math', path: ['Mathematics', 'Geometry', 'Fractal Geometry'] },
    { label: 'Number Theory', domain: 'math', path: ['Mathematics', 'Number Theory'] },
    { label: 'Prime Numbers', domain: 'math', path: ['Mathematics', 'Number Theory', 'Prime Numbers'] },
    { label: 'Cryptography', domain: 'math', path: ['Mathematics', 'Number Theory', 'Cryptography'] },
    { label: 'Calculus', domain: 'math', path: ['Mathematics', 'Analysis', 'Calculus'] },
    { label: 'Complex Analysis', domain: 'math', path: ['Mathematics', 'Analysis', 'Complex Analysis'] },
    { label: 'Probability Theory', domain: 'math', path: ['Mathematics', 'Probability', 'Probability Theory'] },
    { label: 'Bayesian Inference', domain: 'math', path: ['Mathematics', 'Probability', 'Bayesian Inference'] },
    { label: 'Game Theory', domain: 'math', path: ['Mathematics', 'Game Theory'] },
    { label: 'Category Theory', domain: 'math', path: ['Mathematics', 'Category Theory'] },
    { label: 'Four Color Theorem', domain: 'math', path: ['Mathematics', 'Combinatorics', 'Four Color Theorem'] },
    { label: 'Infinity', domain: 'math', path: ['Mathematics', 'Infinity'] },
  ],
  science: [
    { label: 'Black Holes', domain: 'science', path: ['Science', 'Physics', 'Astrophysics', 'Black Holes'] },
    { label: 'Quantum Entanglement', domain: 'science', path: ['Science', 'Physics', 'Quantum Mechanics', 'Quantum Entanglement'] },
    { label: 'Quantum Mechanics', domain: 'science', path: ['Science', 'Physics', 'Quantum Mechanics'] },
    { label: 'General Relativity', domain: 'science', path: ['Science', 'Physics', 'General Relativity'] },
    { label: 'Thermodynamics', domain: 'science', path: ['Science', 'Physics', 'Thermodynamics'] },
    { label: 'Chaos Theory', domain: 'science', path: ['Science', 'Physics', 'Chaos Theory'] },
    { label: 'DNA', domain: 'science', path: ['Science', 'Biology', 'Genetics', 'DNA'] },
    { label: 'Evolution', domain: 'science', path: ['Science', 'Biology', 'Evolution'] },
    { label: 'Epigenetics', domain: 'science', path: ['Science', 'Biology', 'Genetics', 'Epigenetics'] },
    { label: 'Neuroscience', domain: 'science', path: ['Science', 'Biology', 'Neuroscience'] },
    { label: 'Dark Matter', domain: 'science', path: ['Science', 'Physics', 'Astrophysics', 'Dark Matter'] },
    { label: 'Emergence', domain: 'science', path: ['Science', 'Complex Systems', 'Emergence'] },
    { label: 'Fermentation', domain: 'science', path: ['Science', 'Chemistry', 'Biochemistry', 'Fermentation'] },
    { label: 'Antibiotic Resistance', domain: 'science', path: ['Science', 'Biology', 'Microbiology', 'Antibiotic Resistance'] },
    { label: 'CRISPR', domain: 'science', path: ['Science', 'Biology', 'Genetics', 'CRISPR'] },
  ],
  cs: [
    { label: 'Neural Networks', domain: 'cs', path: ['Computer Science', 'Machine Learning', 'Neural Networks'] },
    { label: 'Algorithms', domain: 'cs', path: ['Computer Science', 'Algorithms'] },
    { label: 'Cryptography', domain: 'cs', path: ['Computer Science', 'Security', 'Cryptography'] },
    { label: 'Operating Systems', domain: 'cs', path: ['Computer Science', 'Systems', 'Operating Systems'] },
    { label: 'Distributed Systems', domain: 'cs', path: ['Computer Science', 'Systems', 'Distributed Systems'] },
    { label: 'Compilers', domain: 'cs', path: ['Computer Science', 'Languages', 'Compilers'] },
    { label: 'Information Theory', domain: 'cs', path: ['Computer Science', 'Information Theory'] },
    { label: 'Turing Completeness', domain: 'cs', path: ['Computer Science', 'Theory', 'Turing Completeness'] },
    { label: 'Byzantine Fault Tolerance', domain: 'cs', path: ['Computer Science', 'Distributed Systems', 'Byzantine Fault Tolerance'] },
    { label: 'Reinforcement Learning', domain: 'cs', path: ['Computer Science', 'Machine Learning', 'Reinforcement Learning'] },
    { label: 'Large Language Models', domain: 'cs', path: ['Computer Science', 'Machine Learning', 'Large Language Models'] },
    { label: 'Blockchain', domain: 'cs', path: ['Computer Science', 'Distributed Systems', 'Blockchain'] },
    { label: 'Functional Programming', domain: 'cs', path: ['Computer Science', 'Programming Paradigms', 'Functional Programming'] },
    { label: 'Computer Vision', domain: 'cs', path: ['Computer Science', 'Machine Learning', 'Computer Vision'] },
    { label: 'P vs NP', domain: 'cs', path: ['Computer Science', 'Theory of Computation', 'P vs NP'] },
  ],
  philosophy: [
    { label: 'Stoicism', domain: 'philosophy', path: ['Philosophy', 'Ethics', 'Stoicism'] },
    { label: 'Consciousness', domain: 'philosophy', path: ['Philosophy', 'Philosophy of Mind', 'Consciousness'] },
    { label: 'Free Will', domain: 'philosophy', path: ['Philosophy', 'Metaphysics', 'Free Will'] },
    { label: 'Epistemology', domain: 'philosophy', path: ['Philosophy', 'Epistemology'] },
    { label: 'Utilitarianism', domain: 'philosophy', path: ['Philosophy', 'Ethics', 'Utilitarianism'] },
    { label: 'Existentialism', domain: 'philosophy', path: ['Philosophy', 'Existentialism'] },
    { label: 'Philosophy of Language', domain: 'philosophy', path: ['Philosophy', 'Philosophy of Language'] },
    { label: 'The Hard Problem of Consciousness', domain: 'philosophy', path: ['Philosophy', 'Philosophy of Mind', 'The Hard Problem of Consciousness'] },
    { label: 'Moral Relativism', domain: 'philosophy', path: ['Philosophy', 'Ethics', 'Moral Relativism'] },
    { label: 'Plato\'s Theory of Forms', domain: 'philosophy', path: ['Philosophy', 'Metaphysics', 'Plato\'s Theory of Forms'] },
    { label: 'Nietzsche', domain: 'philosophy', path: ['Philosophy', 'Nietzsche'] },
    { label: 'Kant\'s Categorical Imperative', domain: 'philosophy', path: ['Philosophy', 'Ethics', 'Kant\'s Categorical Imperative'] },
    { label: 'Logical Positivism', domain: 'philosophy', path: ['Philosophy', 'Logic', 'Logical Positivism'] },
    { label: 'The Ship of Theseus', domain: 'philosophy', path: ['Philosophy', 'Metaphysics', 'Identity', 'The Ship of Theseus'] },
    { label: 'Simulation Theory', domain: 'philosophy', path: ['Philosophy', 'Metaphysics', 'Simulation Theory'] },
  ],
  art_music: [
    { label: 'The Golden Ratio', domain: 'art', path: ['Art & Design', 'Principles', 'The Golden Ratio'] },
    { label: 'Color Theory', domain: 'art', path: ['Art & Design', 'Color Theory'] },
    { label: 'Bauhaus', domain: 'art', path: ['Art & Design', 'Movements', 'Bauhaus'] },
    { label: 'Perspective Drawing', domain: 'art', path: ['Art & Design', 'Techniques', 'Perspective Drawing'] },
    { label: 'Music Theory', domain: 'music', path: ['Music', 'Theory', 'Music Theory'] },
    { label: 'Harmony', domain: 'music', path: ['Music', 'Theory', 'Harmony'] },
    { label: 'Jazz Improvisation', domain: 'music', path: ['Music', 'Jazz', 'Jazz Improvisation'] },
    { label: 'Sound Synthesis', domain: 'music', path: ['Music', 'Technology', 'Sound Synthesis'] },
    { label: 'Why Music Moves Us', domain: 'music', path: ['Music', 'Psychology', 'Why Music Moves Us'] },
    { label: 'Counterpoint', domain: 'music', path: ['Music', 'Theory', 'Counterpoint'] },
    { label: 'Impressionism', domain: 'art', path: ['Art & Design', 'Movements', 'Impressionism'] },
    { label: 'Surrealism', domain: 'art', path: ['Art & Design', 'Movements', 'Surrealism'] },
    { label: 'Typography', domain: 'art', path: ['Art & Design', 'Design', 'Typography'] },
    { label: 'Sacred Geometry', domain: 'art', path: ['Art & Design', 'Principles', 'Sacred Geometry'] },
    { label: 'Origami Mathematics', domain: 'art', path: ['Art & Design', 'Mathematics', 'Origami Mathematics'] },
  ],
  history_humanities: [
    { label: 'The Enlightenment', domain: 'history', path: ['History', 'Periods', 'The Enlightenment'] },
    { label: 'The Scientific Revolution', domain: 'history', path: ['History', 'Periods', 'The Scientific Revolution'] },
    { label: 'The Renaissance', domain: 'history', path: ['History', 'Periods', 'The Renaissance'] },
    { label: 'Industrial Revolution', domain: 'history', path: ['History', 'Periods', 'Industrial Revolution'] },
    { label: 'Cold War', domain: 'history', path: ['History', 'Events', 'Cold War'] },
    { label: 'Language Shapes Thought', domain: 'humanities', path: ['Humanities', 'Linguistics', 'Language Shapes Thought'] },
    { label: 'Sapir-Whorf Hypothesis', domain: 'humanities', path: ['Humanities', 'Linguistics', 'Sapir-Whorf Hypothesis'] },
    { label: 'Semiotics', domain: 'humanities', path: ['Humanities', 'Linguistics', 'Semiotics'] },
    { label: 'Cultural Evolution', domain: 'humanities', path: ['Humanities', 'Anthropology', 'Cultural Evolution'] },
    { label: 'The Printing Press', domain: 'history', path: ['History', 'Technology', 'The Printing Press'] },
    { label: 'Ancient Greek Philosophy', domain: 'history', path: ['History', 'Philosophy', 'Ancient Greek Philosophy'] },
    { label: 'The Silk Road', domain: 'history', path: ['History', 'Trade', 'The Silk Road'] },
    { label: 'Colonialism', domain: 'history', path: ['History', 'Events', 'Colonialism'] },
    { label: 'The French Revolution', domain: 'history', path: ['History', 'Events', 'The French Revolution'] },
    { label: 'Democracy\'s Origins', domain: 'history', path: ['History', 'Politics', 'Democracy\'s Origins'] },
  ],
  economics_social: [
    { label: 'Supply and Demand', domain: 'economics', path: ['Economics', 'Fundamentals', 'Supply and Demand'] },
    { label: 'Behavioral Economics', domain: 'economics', path: ['Economics', 'Behavioral Economics'] },
    { label: 'Game Theory in Economics', domain: 'economics', path: ['Economics', 'Game Theory in Economics'] },
    { label: 'Inflation', domain: 'economics', path: ['Economics', 'Macroeconomics', 'Inflation'] },
    { label: 'Why Markets Crash', domain: 'economics', path: ['Economics', 'Financial Markets', 'Why Markets Crash'] },
    { label: 'Network Effects', domain: 'economics', path: ['Economics', 'Digital Economy', 'Network Effects'] },
    { label: 'Tragedy of the Commons', domain: 'economics', path: ['Economics', 'Public Goods', 'Tragedy of the Commons'] },
    { label: 'Social Dilemmas', domain: 'social', path: ['Social Science', 'Social Dilemmas'] },
    { label: 'Cognitive Biases', domain: 'social', path: ['Social Science', 'Psychology', 'Cognitive Biases'] },
    { label: 'Why We Sleep', domain: 'science', path: ['Science', 'Biology', 'Neuroscience', 'Why We Sleep'] },
    { label: 'Flow State', domain: 'social', path: ['Social Science', 'Psychology', 'Flow State'] },
    { label: 'Dunning-Kruger Effect', domain: 'social', path: ['Social Science', 'Psychology', 'Dunning-Kruger Effect'] },
    { label: 'How Memory Works', domain: 'science', path: ['Science', 'Biology', 'Neuroscience', 'How Memory Works'] },
    { label: 'The Placebo Effect', domain: 'science', path: ['Science', 'Medicine', 'The Placebo Effect'] },
    { label: 'Decision Making Under Uncertainty', domain: 'social', path: ['Social Science', 'Psychology', 'Decision Making Under Uncertainty'] },
  ],
  crossdomain: [
    // Freefall topics and cross-domain connectors
    { label: 'Information Theory', domain: 'cs', path: ['Information Theory'] },
    { label: 'Complex Systems', domain: 'science', path: ['Complex Systems'] },
    { label: 'Systems Thinking', domain: 'social', path: ['Systems Thinking'] },
    { label: 'Emergence', domain: 'science', path: ['Emergence'] },
    { label: 'Self-Organization', domain: 'science', path: ['Self-Organization'] },
    { label: 'Fermat\'s Last Theorem', domain: 'math', path: ["Fermat's Last Theorem"] },
    { label: 'Gödel\'s Incompleteness Theorems', domain: 'math', path: ["Gödel's Incompleteness Theorems"] },
    { label: 'The Halting Problem', domain: 'cs', path: ['The Halting Problem'] },
    { label: 'Arrow\'s Impossibility Theorem', domain: 'math', path: ["Arrow's Impossibility Theorem"] },
    { label: 'The Observer Effect', domain: 'science', path: ['The Observer Effect'] },
    { label: 'Heisenberg Uncertainty Principle', domain: 'science', path: ['Science', 'Physics', 'Quantum Mechanics', 'Heisenberg Uncertainty Principle'] },
    { label: 'Second Law of Thermodynamics', domain: 'science', path: ['Science', 'Physics', 'Thermodynamics', 'Second Law of Thermodynamics'] },
    { label: 'The Many-Worlds Interpretation', domain: 'science', path: ['Science', 'Physics', 'Quantum Mechanics', 'The Many-Worlds Interpretation'] },
    { label: 'Occam\'s Razor', domain: 'philosophy', path: ['Philosophy', 'Logic', "Occam's Razor"] },
    { label: 'Recursion', domain: 'cs', path: ['Computer Science', 'Concepts', 'Recursion'] },
  ],
};

// ── Entry point ──
const batchName = process.argv[2] || 'math';
const batch = ALL_BATCHES[batchName];

if (!batch) {
  console.error(`Unknown batch "${batchName}". Available: ${Object.keys(ALL_BATCHES).join(', ')}`);
  process.exit(1);
}

console.log(`Spark Pre-warmer — batch: ${batchName}`);
console.log(`Firebase project: ${FIREBASE_CONFIG.projectId}`);

try {
  initDb();
  initAI();
  await prewarm(batch, batchName);
  process.exit(0);
} catch (err) {
  console.error('Fatal:', err.message);
  process.exit(1);
}
