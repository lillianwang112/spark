#!/usr/bin/env node
/**
 * generate-demo-cache.mjs
 * Pre-generates ALL content needed for a flawless Spark demo:
 *   • Course outlines + every lesson content + flashcards (for all demo tracks)
 *   • Discovery node children (levels 3–6 for all 6 domains)
 *   • Explainers + keyTakeaways + quickQuiz for every node in demo track paths
 *
 * Saves results directly into src/data/ JSON files (zero-latency bundled cache).
 * Skips anything already cached. Can be interrupted and resumed.
 *
 * Usage:
 *   node scripts/generate-demo-cache.mjs
 *   node scripts/generate-demo-cache.mjs --only courses
 *   node scripts/generate-demo-cache.mjs --only discovery
 *   node scripts/generate-demo-cache.mjs --persona alex
 *
 * Requirements:
 *   VITE_ANTHROPIC_API_KEY must be a real key in .env
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const DATA = join(ROOT, 'src', 'data');

// ── Config ──────────────────────────────────────────────────────────────────
function readEnv() {
  const env = {};
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
  } catch { /* .env missing */ }
  return env;
}

const ENV = readEnv();
const API_KEY = ENV.VITE_ANTHROPIC_API_KEY || '';

if (!API_KEY || API_KEY.startsWith('sk-ant-...') || API_KEY.length < 30) {
  console.error('\n❌  Real Anthropic API key required.');
  console.error('   Set VITE_ANTHROPIC_API_KEY=sk-ant-... in .env\n');
  process.exit(1);
}

const ai = new Anthropic({ apiKey: API_KEY });
const CONCURRENCY = 3;
const DELAY_MS = 600; // be gentle with rate limits

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function hashPath(path) {
  if (!Array.isArray(path)) return String(path);
  return path.join('::').toLowerCase().replace(/\s+/g, '_');
}

function co(topic, age) {
  return `co:${topic.replace(/\s+/g,'_').slice(0,30)}:${age}`;
}
function lc(topic, lessonTitle, age) {
  return `lc:${topic.replace(/\s+/g,'_').slice(0,20)}:${lessonTitle.replace(/\s+/g,'_').slice(0,25)}:${age}`;
}
function lf(topic, lessonTitle, age) {
  return `lf:${topic.replace(/\s+/g,'_').slice(0,20)}:${lessonTitle.replace(/\s+/g,'_').slice(0,25)}:${age}`;
}
function nc(path, node, age) {
  return `nc:${hashPath(path)}:${node}:${age}`;
}
function ex(path, node, age) {
  return `ex:${hashPath(path)}:${node}:${age}:spark`;
}
function kt(path, node, age) {
  return `kt:${hashPath(path)}:${node}:${age}`;
}
function qq(path, node, age) {
  return `qq:${hashPath(path)}:${node}:${age}`;
}

function parseJson(text) {
  if (!text) return null;
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```\s*$/i,'').trim();
    return JSON.parse(cleaned);
  } catch { return null; }
}

async function callClaude(prompt, systemPrompt, maxTokens = 2000) {
  const msg = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    system: systemPrompt || 'Return only valid JSON with no markdown fences.',
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content[0]?.text || '';
}

// ── Cache files ───────────────────────────────────────────────────────────────
const CACHE_FILES = {
  demo:       join(DATA, 'courses_demo.json'),
  math:       join(DATA, 'courses_math.json'),
  cs:         join(DATA, 'courses_cs.json'),
  cs2:        join(DATA, 'courses_cs2_humanities.json'),
  physics:    join(DATA, 'courses_physics.json'),
  bio:        join(DATA, 'courses_bio_econ.json'),
  prewarmed:  join(DATA, 'prewarmed.json'),
};

function loadCache(file) {
  if (!existsSync(file)) return {};
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return {}; }
}

function saveCache(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// Load all caches
const caches = {};
for (const [name, file] of Object.entries(CACHE_FILES)) {
  caches[name] = loadCache(file);
}

// Merged read (checks all caches)
function has(key) {
  return Object.values(caches).some(c => key in c);
}

function set(cacheFile, key, val) {
  caches[cacheFile][key] = val;
  saveCache(CACHE_FILES[cacheFile], caches[cacheFile]);
}

// ── Progress ──────────────────────────────────────────────────────────────────
let total = 0, done = 0, skipped = 0;

function log(emoji, msg) {
  process.stdout.write(`\r${emoji} [${done + skipped}/${total}] ${msg.slice(0,70).padEnd(72)}\n`);
}

// ── Prompts ───────────────────────────────────────────────────────────────────
function courseOutlinePrompt(topic, ageGroup) {
  const lvl = {
    little_explorer: 'Simple, concrete, story-driven. Avoid abstractions.',
    student: 'Conversational and relatable. Connect to real life.',
    college: 'Intellectually rigorous. Surface genuine complexity.',
    adult: 'Respect their intelligence. Dense but clear. Practical.',
  }[ageGroup] || 'Clear, precise, intellectually engaging.';

  return {
    system: 'You are a world-class curriculum designer. Return only valid JSON with no markdown fences.',
    user: `Design a complete course outline for: "${topic}".
Learner: age_group=${ageGroup}. ${lvl}

Requirements:
- 5-7 modules building logically from foundation to frontier
- Each module: 3-4 lessons
- Total 8-18 estimated hours
- lesson durationMins: 6-12 mins each
- lesson type: concept|example|practice
- First module: approachable. Last module: synthesis/frontier payoff.
- Titles evocative and specific, not generic.

Return ONLY this JSON shape:
{
  "title": "...",
  "tagline": "One compelling hook sentence",
  "emoji": "single emoji",
  "estimatedHours": number,
  "prerequisiteKnowledge": "none|basic|intermediate",
  "modules": [
    {
      "id": "module_1",
      "title": "...",
      "overview": "What this module unlocks — 1 sentence",
      "lessons": [
        { "id": "lesson_1_1", "title": "...", "durationMins": 8, "type": "concept|example|practice" }
      ]
    }
  ]
}`,
  };
}

function lessonContentPrompt(topic, moduleTitle, lessonTitle, lessonIdx, ageGroup) {
  const lvl = {
    little_explorer: 'Simple sentences. Concrete. No jargon.',
    student: 'Conversational. Culturally relevant. Occasional wit.',
    college: 'Precise and honest about complexity. Intellectually engaging.',
    adult: 'Dense but clear. Respect their intelligence and time.',
  }[ageGroup] || 'Clear, precise, intellectually engaging.';
  const words = ['little_explorer','student'].includes(ageGroup) ? 'Under 280 words' : 'Under 380 words';

  return {
    system: 'You are a master teacher writing for Khan Academy and 3Blue1Brown. Return only valid JSON with no markdown fences.',
    user: `Write lesson content for:
Course: "${topic}" | Module: "${moduleTitle}" | Lesson: "${lessonTitle}" (lesson ${lessonIdx + 1})
Age: ${ageGroup}. ${lvl} ${words} total across all sections.

Requirements:
- 3-5 sections total
- First section type="concept" — essential foundation
- At least one type="analogy" — concrete metaphor
- At least one type="example" — something picturable
- hook: one surprising sentence that opens cold (NOT a section)
- keyPoints: 3-4 punchy bullet facts
- checkIn: one conceptual question + concise answer (tests understanding, not trivia)

Return ONLY:
{
  "title": "...",
  "hook": "...",
  "sections": [{"heading":"...","body":"2-4 sentences","type":"concept|analogy|example|deep_dive"}],
  "keyPoints": ["..."],
  "checkIn": {"question":"...","answer":"..."}
}`,
  };
}

function lessonFlashcardsPrompt(topic, lessonTitle, keyPoints, ageGroup) {
  const lvl = { college:'Precise, test conceptual edges.', adult:'Clear, direct.', student:'Punchy, conversational.', little_explorer:'Simple words.' }[ageGroup] || 'Clear.';
  return {
    system: 'You create active-recall flashcards. Return only a valid JSON array with no markdown fences.',
    user: `6-8 flashcards for:
Topic: "${topic}" | Lesson: "${lessonTitle}"
Key points: ${(keyPoints||[]).join('; ')}
${lvl}

Mix types — at least one each:
- definition: "What is X?" → concise definition
- application: when/why would you use X?
- true_or_false: a definitive statement → answer + one-sentence reason
- fill_in_blank: "X works by ___" → the concept

Front: ≤15 words. Back: ≤25 words.

Return ONLY JSON array:
[{"front":"...","back":"...","type":"definition|application|true_or_false|fill_in_blank"}]`,
  };
}

function nodeChildrenPrompt(currentNode, currentPath, ageGroup) {
  const pathStr = Array.isArray(currentPath) ? currentPath.join(' → ') : currentPath;
  return {
    system: 'You are a world-class educator. Return only a valid JSON array with no markdown fences.',
    user: `Generate 5-6 child topic nodes to explore from "${currentNode}". Path: ${pathStr}.

Rules:
- Each label: novel, specific topic name (2-5 words), searchable on Wikipedia
- NEVER reuse ancestor labels
- Mix: go deeper + branch sideways to surprising connections
- At least one counterintuitive angle
- Each description: one compelling sentence, ≤15 words
- Age group: ${ageGroup}

Return ONLY:
[{"id":"snake_case_id","label":"...","description":"...","difficulty":"beginner|intermediate|advanced","surpriseFactor":true|false}]`,
  };
}

function explainerPrompt(currentNode, currentPath, ageGroup) {
  const pathStr = Array.isArray(currentPath) ? currentPath.join(' → ') : currentPath;
  return {
    system: 'You are a master educator. Write vivid, precise explainers. No markdown, just prose.',
    user: `Write a 3-paragraph explainer for "${currentNode}" (path: ${pathStr}).
Age group: ${ageGroup}.
- Para 1: Hook — start with something surprising or counterintuitive
- Para 2: The core concept — what it actually is and why it matters
- Para 3: Why this leads somewhere interesting — open a door to the next question
Concise: 150-200 words total. No headers.`,
  };
}

function keyTakeawaysPrompt(currentNode, ageGroup) {
  return {
    system: 'Return only a valid JSON array with no markdown fences.',
    user: `Generate 4 key takeaways for "${currentNode}" for a ${ageGroup} learner.
Each takeaway: one punchy sentence, max 18 words. Make them genuinely insightful, not generic.
Return ONLY: ["...","...","...","..."]`,
  };
}

function quickQuizPrompt(currentNode, ageGroup) {
  return {
    system: 'Return only a valid JSON array with no markdown fences.',
    user: `Generate 3 quiz questions for "${currentNode}" for a ${ageGroup} learner.
Mix types: one conceptual, one application, one true/false.
Return ONLY:
[{"question":"...","options":["A)...","B)...","C)...","D)..."],"answer":"A"|"B"|"C"|"D","explanation":"one sentence"}]`,
  };
}

// ── Demo track list ───────────────────────────────────────────────────────────
const DEMO_TRACKS = [
  // Alex (college)
  { topic: 'Riemann Hypothesis', path: ['Mathematics','Number Theory','Prime Numbers','Riemann Hypothesis'], age: 'college' },
  { topic: 'P vs NP', path: ['Mathematics','Computational Complexity','P vs NP'], age: 'college' },
  { topic: 'Fourier Transforms', path: ['Mathematics','Harmonic Analysis','Fourier Transforms'], age: 'college' },
  { topic: "Gödel's Incompleteness", path: ['Mathematics','Logic',"Gödel's Incompleteness Theorems"], age: 'college' },
  { topic: 'Quantum Entanglement', path: ['Science','Physics','Quantum Mechanics','Quantum Entanglement'], age: 'college' },
  { topic: "Bell's Theorem", path: ['Science','Physics','Quantum Mechanics',"Bell's Theorem"], age: 'college' },
  { topic: 'CRISPR-Cas9', path: ['Science','Biology','Molecular Biology','CRISPR-Cas9'], age: 'college' },
  { topic: 'Entropy & the Arrow of Time', path: ['Science','Physics','Thermodynamics','Entropy'], age: 'college' },
  { topic: 'Backpropagation', path: ['Computer Science','Machine Learning','Neural Networks','Backpropagation'], age: 'college' },
  { topic: 'RSA Cryptography', path: ['Computer Science','Cryptography','Public-Key','RSA'], age: 'college' },
  { topic: 'Dynamic Programming', path: ['Computer Science','Algorithms','Dynamic Programming'], age: 'college' },
  { topic: 'Hard Problem of Consciousness', path: ['Philosophy','Philosophy of Mind','Hard Problem of Consciousness'], age: 'college' },
  { topic: 'Modal Logic', path: ['Philosophy','Logic','Modal Logic'], age: 'college' },
  { topic: 'Functional Harmony', path: ['Music','Theory','Functional Harmony'], age: 'college' },
  { topic: 'Complex Analysis & Residue Theorem', path: ['Mathematics','Complex Analysis','Residue Theorem'], age: 'college' },
  { topic: 'Information Theory & Entropy', path: ['Mathematics','Information Theory'], age: 'college' },
  { topic: 'Bayesian Inference', path: ['Mathematics','Probability','Bayesian Inference'], age: 'college' },
  { topic: 'Category Theory & Functors', path: ['Mathematics','Abstract Algebra','Category Theory'], age: 'college' },
  { topic: 'Ethics of AI Alignment', path: ['Philosophy','Ethics','AI Alignment'], age: 'college' },
  // Maya (hs)
  { topic: 'Music Theory Basics', path: ['Music','Theory','Music Theory Basics'], age: 'student' },
  { topic: 'Functional Harmony', path: ['Music','Theory','Functional Harmony'], age: 'student' },
  { topic: 'Synesthesia', path: ['Science','Neuroscience','Synesthesia'], age: 'student' },
  { topic: 'Color and Perception', path: ['Science','Perception','Color and Perception'], age: 'student' },
  { topic: 'The Golden Ratio', path: ['Mathematics','Patterns','The Golden Ratio'], age: 'student' },
  { topic: 'Renaissance Art', path: ['Arts','History','Renaissance Art'], age: 'student' },
  { topic: 'Human Evolution', path: ['Science','Biology','Anthropology','Human Evolution'], age: 'student' },
  { topic: 'DNA and Genetics', path: ['Science','Biology','Genetics','DNA and Genetics'], age: 'student' },
  { topic: 'Social Media Psychology', path: ['Social Science','Psychology','Social Media Psychology'], age: 'student' },
  { topic: 'Creative Writing & Narrative Structure', path: ['Literature','Craft','Narrative Structure'], age: 'student' },
  { topic: 'Climate Science', path: ['Science','Earth Science','Climate Science'], age: 'student' },
  { topic: 'Jazz Improvisation', path: ['Music','Jazz','Jazz Improvisation'], age: 'student' },
  // James (adult)
  { topic: 'Fall of the Byzantine Empire', path: ['History','Medieval','Byzantine Empire'], age: 'adult' },
  { topic: 'Mongol Empire', path: ['History','Medieval','Mongol Empire'], age: 'adult' },
  { topic: 'The Enlightenment', path: ['History','Intellectual History','The Enlightenment'], age: 'adult' },
  { topic: 'Stoic Philosophy', path: ['Philosophy','Hellenistic','Stoicism'], age: 'adult' },
  { topic: 'Phenomenology', path: ['Philosophy','Continental','Phenomenology'], age: 'adult' },
  { topic: 'Existentialism', path: ['Philosophy','Continental','Existentialism'], age: 'adult' },
  { topic: 'Wittgenstein & Language Games', path: ['Philosophy','Analytic','Wittgenstein'], age: 'adult' },
  { topic: "Dostoevsky's Underground Man", path: ['Literature','Russian Literature','Dostoevsky'], age: 'adult' },
  { topic: 'Proust & Memory', path: ['Literature','French Literature','Proust'], age: 'adult' },
  { topic: 'Cold War History', path: ['History','Modern','Cold War'], age: 'adult' },
  { topic: 'Keynesian Economics', path: ['Economics','Macroeconomics','Keynesian Economics'], age: 'adult' },
  { topic: 'Climate Policy', path: ['Policy','Environment','Climate Policy'], age: 'adult' },
  { topic: 'Cognitive Biases', path: ['Psychology','Behavioral Science','Cognitive Biases'], age: 'adult' },
];

// Discovery paths to expand (node children for levels 3-6)
const DISCOVERY_PATHS = [
  // Math domain — expand beyond seed data's level 3
  { node: 'Linear Algebra',     path: ['math','algebra','linear_algebra'], age: 'college' },
  { node: 'Abstract Algebra',   path: ['math','algebra','abstract_algebra'], age: 'college' },
  { node: 'Topology',           path: ['math','geometry','topology'], age: 'college' },
  { node: 'Number Theory',      path: ['math','number_theory'], age: 'college' },
  { node: 'Prime Numbers',      path: ['math','number_theory','primes'], age: 'college' },
  { node: 'Calculus',           path: ['math','analysis','calculus'], age: 'college' },
  { node: 'Complex Analysis',   path: ['math','analysis','complex'], age: 'college' },
  { node: 'Real Analysis',      path: ['math','analysis','real_analysis'], age: 'college' },
  { node: 'Probability Theory', path: ['math','probability','probability'], age: 'college' },
  { node: 'Bayesian Inference', path: ['math','probability','bayesian'], age: 'college' },
  { node: 'Graph Theory',       path: ['math','combinatorics','graph_theory'], age: 'college' },
  // CS domain
  { node: 'Neural Networks',    path: ['cs','ai_ml','neural_nets'], age: 'college' },
  { node: 'Transformers',       path: ['cs','ai_ml','transformers'], age: 'college' },
  { node: 'Dynamic Programming', path: ['cs','algorithms','dynamic_prog'], age: 'college' },
  { node: 'Computational Complexity', path: ['cs','algorithms','complexity'], age: 'college' },
  { node: 'Cryptography',       path: ['cs','security','cryptography'], age: 'college' },
  { node: 'Operating Systems',  path: ['cs','systems','os'], age: 'college' },
  // Science
  { node: 'Quantum Mechanics',  path: ['science','physics','quantum'], age: 'college' },
  { node: 'Quantum Entanglement', path: ['science','physics','quantum','quantum_entanglement'], age: 'college' },
  { node: 'Thermodynamics',     path: ['science','physics','thermodynamics'], age: 'college' },
  { node: 'Molecular Biology',  path: ['science','biology','molecular'], age: 'college' },
  { node: 'Evolution',          path: ['science','biology','evolution'], age: 'college' },
  { node: 'Neuroscience',       path: ['science','biology','neuroscience'], age: 'college' },
  // Philosophy
  { node: 'Philosophy of Mind', path: ['philosophy','philosophy_of_mind'], age: 'college' },
  { node: 'Ethics',             path: ['philosophy','ethics'], age: 'college' },
  { node: 'Logic',              path: ['philosophy','logic'], age: 'college' },
  { node: 'Stoicism',           path: ['philosophy','hellenistic','stoicism'], age: 'adult' },
  { node: 'Existentialism',     path: ['philosophy','continental','existentialism'], age: 'adult' },
  // History
  { node: 'Medieval Europe',    path: ['history','medieval'], age: 'adult' },
  { node: 'Cold War',           path: ['history','modern','cold_war'], age: 'adult' },
  { node: 'Ancient Rome',       path: ['history','ancient','rome'], age: 'adult' },
  { node: 'World War II',       path: ['history','modern','wwii'], age: 'adult' },
  // Literature
  { node: 'Russian Literature', path: ['literature','traditions','russian'], age: 'adult' },
  { node: 'Modernism',          path: ['literature','movements','modernism'], age: 'adult' },
  // Music
  { node: 'Music Theory',       path: ['music','theory'], age: 'student' },
  { node: 'Jazz',               path: ['music','jazz'], age: 'student' },
  { node: 'Classical Music',    path: ['music','classical'], age: 'college' },
  // Arts
  { node: 'Renaissance Art',    path: ['arts','history','renaissance'], age: 'student' },
  { node: 'Impressionism',      path: ['arts','movements','impressionism'], age: 'student' },
  { node: 'Color Theory',       path: ['arts','fundamentals','color_theory'], age: 'student' },
  // Psychology/Social
  { node: 'Cognitive Psychology', path: ['psychology','cognitive'], age: 'adult' },
  { node: 'Social Psychology',  path: ['psychology','social'], age: 'adult' },
  { node: 'Behavioral Economics', path: ['economics','behavioral'], age: 'adult' },
];

// ── Generator ─────────────────────────────────────────────────────────────────
async function gen(cacheFile, key, promptObj, parser, label) {
  if (has(key)) { skipped++; return; }
  try {
    const text = await callClaude(promptObj.user, promptObj.system, 2400);
    const val = parser === 'json' ? parseJson(text) : text;
    if (!val) { log('⚠', `Parse failed: ${label}`); return; }
    set(cacheFile, key, val);
    done++;
    log('✓', label);
  } catch (e) {
    log('✗', `${label}: ${e.message?.slice(0,40)}`);
  }
  await sleep(DELAY_MS);
}

async function runQueue(tasks) {
  // Run CONCURRENCY tasks at a time
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    await Promise.all(tasks.slice(i, i + CONCURRENCY).map(t => t()));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const onlyMode = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const personaFilter = args.includes('--persona') ? args[args.indexOf('--persona') + 1] : null;

async function main() {
  console.log('\n🔥 Spark Demo Cache Generator\n');

  const tasks = [];

  // ── PHASE 1: Course content ──────────────────────────────────────────────
  if (!onlyMode || onlyMode === 'courses') {
    let trackList = DEMO_TRACKS;
    if (personaFilter === 'alex') trackList = DEMO_TRACKS.filter(t => t.age === 'college');
    if (personaFilter === 'maya') trackList = DEMO_TRACKS.filter(t => t.age === 'student');
    if (personaFilter === 'james') trackList = DEMO_TRACKS.filter(t => t.age === 'adult');

    for (const track of trackList) {
      const { topic, age } = track;
      const outlineKey = co(topic, age);

      // Course outline
      tasks.push(async () => {
        if (has(outlineKey)) { skipped++; return; }
        const p = courseOutlinePrompt(topic, age);
        const text = await callClaude(p.user, p.system, 2800);
        const outline = parseJson(text);
        if (!outline) { log('⚠', `outline parse fail: ${topic}`); return; }
        set('demo', outlineKey, outline);
        done++;
        log('✓', `outline: ${topic}`);
        await sleep(DELAY_MS);

        // All lesson content + flashcards for this course
        for (const mod of outline.modules || []) {
          for (let li = 0; li < (mod.lessons || []).length; li++) {
            const lesson = mod.lessons[li];
            const lcKey = lc(topic, lesson.title, age);
            const lfKey = lf(topic, lesson.title, age);

            if (!has(lcKey)) {
              await sleep(DELAY_MS);
              const p2 = lessonContentPrompt(topic, mod.title, lesson.title, li, age);
              const t2 = await callClaude(p2.user, p2.system, 2000);
              const content = parseJson(t2);
              if (content) {
                set('demo', lcKey, content);
                done++;
                log('✓', `lesson: ${topic} › ${lesson.title.slice(0,35)}`);

                if (!has(lfKey)) {
                  await sleep(DELAY_MS);
                  const p3 = lessonFlashcardsPrompt(topic, lesson.title, content.keyPoints, age);
                  const t3 = await callClaude(p3.user, p3.system, 1200);
                  const cards = parseJson(t3);
                  if (cards) {
                    set('demo', lfKey, cards);
                    done++;
                    log('✓', `cards: ${topic} › ${lesson.title.slice(0,35)}`);
                  }
                }
              }
            }
          }
        }
      });
    }
  }

  // ── PHASE 2: Discovery node children + explainers ────────────────────────
  if (!onlyMode || onlyMode === 'discovery') {
    for (const dp of DISCOVERY_PATHS) {
      const { node, path, age } = dp;
      const ncKey = nc(path, node, age);
      const exKey = ex(path, node, age);
      const ktKey = kt(path, node, age);
      const qqKey = qq(path, node, age);

      tasks.push(() => gen('prewarmed', ncKey, nodeChildrenPrompt(node, path, age), 'json', `nc: ${node}`));
      tasks.push(() => gen('prewarmed', exKey, explainerPrompt(node, path, age), 'text', `ex: ${node}`));
      tasks.push(() => gen('prewarmed', ktKey, keyTakeawaysPrompt(node, age), 'json', `kt: ${node}`));
      tasks.push(() => gen('prewarmed', qqKey, quickQuizPrompt(node, age), 'json', `qq: ${node}`));
    }

    // Explainers for all demo track paths' leaf nodes
    for (const track of DEMO_TRACKS) {
      const { topic, path, age } = track;
      const node = path[path.length - 1];
      const exKey = ex(path, node, age);
      const ktKey = kt(path, node, age);
      const qqKey = qq(path, node, age);
      tasks.push(() => gen('prewarmed', exKey, explainerPrompt(node, path, age), 'text', `ex: ${topic}`));
      tasks.push(() => gen('prewarmed', ktKey, keyTakeawaysPrompt(node, age), 'json', `kt: ${topic}`));
      tasks.push(() => gen('prewarmed', qqKey, quickQuizPrompt(node, age), 'json', `qq: ${topic}`));
    }
  }

  total = tasks.length;
  console.log(`📋 ${total} tasks queued (${skipped} already cached)\n`);

  await runQueue(tasks);

  console.log(`\n✅ Done! Generated ${done} items, skipped ${skipped} cached.\n`);
  console.log('   Files updated:');
  console.log('   • src/data/courses_demo.json');
  console.log('   • src/data/prewarmed.json');
  console.log('\n   Rebuild the app to bundle the new cache:\n   npm run build\n');
}

main().catch(e => { console.error(e); process.exit(1); });
