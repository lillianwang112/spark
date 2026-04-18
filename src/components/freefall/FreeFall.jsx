import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { useUserContext } from '../../hooks/useUserContext.jsx';
import TopicGraph from '../../services/topicGraph.js';
void motion;

const TOPICS = [
  {
    id: 'black_holes', label: 'Black Holes', domain: 'science', emoji: '🕳️',
    hook: 'What happens when gravity crushes space itself into nothing?',
    body: 'A black hole is a region of space where gravity is so strong that nothing — not even light — can escape. They form when massive stars collapse, and at their centre is a singularity where our physics breaks down entirely. The event horizon is the point of no return: cross it, and you never come back.',
  },
  {
    id: 'quantum_entanglement', label: 'Quantum Entanglement', domain: 'science', emoji: '⚛️',
    hook: 'Two particles connected across the universe — Einstein called it "spooky action".',
    body: 'When two particles become entangled, measuring one instantly determines the state of the other — no matter the distance. This isn\'t sending information; it\'s a correlation baked into reality itself. Einstein hated it. Experiments have confirmed it at distances over 1,200 km.',
  },
  {
    id: 'infinity', label: 'Infinity', domain: 'math', emoji: '∞',
    hook: 'Some infinities are bigger than others. This is provably true.',
    body: 'Georg Cantor proved that the infinity of real numbers is strictly larger than the infinity of whole numbers — you can\'t pair them up one-to-one no matter how hard you try. This means there are different sizes of infinity, a result so counterintuitive that Cantor\'s contemporaries thought he was insane.',
  },
  {
    id: 'prime_numbers', label: 'Prime Numbers', domain: 'math', emoji: '🔢',
    hook: 'The universe\'s random-looking code that humans still haven\'t cracked.',
    body: 'Primes are numbers divisible only by 1 and themselves. They appear to scatter randomly, yet they underpin all internet encryption. The Riemann Hypothesis — which predicts their distribution — has a $1 million prize and has resisted proof for 165 years. Your credit card depends on them.',
  },
  {
    id: 'topology', label: 'Topology', domain: 'math', emoji: '🍩',
    hook: 'Why a donut and a coffee mug are mathematically the same object.',
    body: 'Topology studies properties that survive continuous stretching or squishing — but never tearing or gluing. A donut and a mug both have exactly one hole, so topologically they\'re identical. A sphere and a cube? Also the same. This abstraction is why GPS, MRI machines, and even social networks work.',
  },
  {
    id: 'neural_networks', label: 'Neural Networks', domain: 'cs', emoji: '🧠',
    hook: 'How computers learned to see and think — by imitating neurons.',
    body: 'A neural network is layers of simple functions (neurons) that transform data. Trained on examples, they adjust billions of internal weights until patterns emerge. The same architecture that recognises your face in a photo generates essays, proteins, and music. It works — we just don\'t fully understand why.',
  },
  {
    id: 'chaos_theory', label: 'Chaos Theory', domain: 'science', emoji: '🦋',
    hook: 'A butterfly flapping wings in Brazil might set off a tornado in Texas.',
    body: 'Chaotic systems are perfectly deterministic yet practically unpredictable: tiny differences in starting conditions grow exponentially. Weather is the classic example — precise prediction beyond ~10 days is fundamentally impossible. This isn\'t a measurement problem; it\'s baked into the mathematics of nonlinear systems.',
  },
  {
    id: 'stoicism', label: 'Stoicism', domain: 'philosophy', emoji: '🏛️',
    hook: 'Ancient Roman philosophy that Silicon Valley quietly runs on today.',
    body: 'Stoics held that we control only our thoughts and choices — not outcomes, reputation, or the actions of others. Marcus Aurelius ruled an empire while writing private reminders to stay calm and act with virtue regardless of result. Modern cognitive behavioural therapy borrowed its entire framework from Stoic practice.',
  },
  {
    id: 'golden_ratio', label: 'The Golden Ratio', domain: 'art', emoji: '🌻',
    hook: 'The number that shows up in sunflowers, shells, galaxies, and great art.',
    body: 'φ ≈ 1.618. Divide a line so the whole is to the larger part as the larger is to the smaller — that ratio is φ. It appears in plant spirals, nautilus shells, and the proportions of the Parthenon. Whether it\'s truly "more beautiful" is debated, but its presence in nature is genuinely remarkable.',
  },
  {
    id: 'music_harmony', label: 'Why Music Moves Us', domain: 'music', emoji: '🎵',
    hook: 'Why certain chord progressions make you feel things you cannot describe.',
    body: 'Music exploits expectation. Tension is built by harmonic instability; resolution releases it — triggering the brain\'s reward circuits much like food or touch. Minor keys evolved associations with sadness through cultural exposure, not biology. The goosebumps you feel? That\'s dopamine, provoked by a particularly surprising musical moment.',
  },
  {
    id: 'fermat_last', label: "Fermat's Last Theorem", domain: 'math', emoji: '📐',
    hook: 'A 350-year-old margin note that took one man his entire life to prove.',
    body: 'In 1637, Fermat wrote that no whole numbers satisfy aⁿ + bⁿ = cⁿ for n > 2 — and claimed he had "a marvellous proof, too long for this margin." The proof wasn\'t found until 1995, when Andrew Wiles spent 7 secret years solving it using 20th-century mathematics Fermat could never have imagined.',
  },
  {
    id: 'sapir_whorf', label: 'Language Shapes Thought', domain: 'humanities', emoji: '🗣️',
    hook: 'The language you speak might change what you can think about.',
    body: 'The Sapir-Whorf hypothesis asks whether language determines thought or just influences it. Some languages lack future tense — speakers save more money. Some have dozens of words for snow, enabling finer distinctions. Russian speakers, with separate words for light and dark blue, process those shades faster than English speakers.',
  },
  {
    id: 'emergence', label: 'Emergence', domain: 'science', emoji: '🐜',
    hook: 'How simple rules create complex beauty that nobody designed.',
    body: 'An ant colony has no architect, yet builds ventilated cities. Traffic jams appear with no single bad driver. Consciousness emerges from neurons that individually do nothing conscious. Emergence means the whole is not just more than its parts — it\'s qualitatively different, obeying rules that can\'t be read from the components alone.',
  },
  {
    id: 'cryptography', label: 'Cryptography', domain: 'cs', emoji: '🔐',
    hook: 'The math protecting every message you have ever sent online.',
    body: 'Modern encryption uses the fact that multiplying two large primes is trivial, but factoring the result is practically impossible. Your browser generates a secret key with a server in milliseconds using this asymmetry. Every HTTPS padlock in your address bar is a live demonstration of a mathematical trapdoor.',
  },
  {
    id: 'dark_matter', label: 'Dark Matter', domain: 'science', emoji: '🌌',
    hook: '85% of the universe is invisible stuff we cannot detect or touch.',
    body: 'Galaxies spin too fast — their outer edges should fly off, but they don\'t. Something invisible provides extra gravity. We call it dark matter. It doesn\'t emit, absorb, or reflect light. We\'ve weighed it, mapped where it must be, and built enormous detectors to find its particles. So far: nothing. It\'s the universe\'s biggest open secret.',
  },
  {
    id: 'consciousness', label: 'Consciousness', domain: 'philosophy', emoji: '👁️',
    hook: 'Why is there something it is like to be you? Nobody actually knows.',
    body: 'The "hard problem of consciousness" is explaining why physical processes in the brain produce subjective experience at all. We can map every neuron firing when you see red — but not why there\'s something it feels like to see red, rather than just processing happening in the dark. This question has no scientific consensus and may require entirely new concepts to answer.',
  },
  {
    id: 'information_theory', label: 'Information Theory', domain: 'cs', emoji: '📡',
    hook: 'Claude Shannon proved that information has physics, just like matter does.',
    body: 'Shannon asked: how much data can you compress before losing something? He discovered entropy — a precise measure of uncertainty — governs the answer. Every file you ZIP, every phone call you make, every video streamed uses his mathematics. His 1948 paper essentially invented the digital age in 27 pages.',
  },
  {
    id: 'evolution', label: 'Evolution', domain: 'science', emoji: '🦎',
    hook: 'No one designed the eye — it invented itself over 500 million years.',
    body: 'Evolution by natural selection requires only three things: variation, inheritance, and differential reproduction. Given enough time and generations, it produces structures of stunning complexity — eyes evolved independently 40 different times. The human genome contains ~3 billion base pairs refined by 3.8 billion years of editing with no goal in mind.',
  },
  {
    id: 'category_theory', label: 'Category Theory', domain: 'math', emoji: '🔗',
    hook: 'The most abstract math ever invented — and somehow the most useful.',
    body: 'Category theory studies structure itself: not numbers or shapes, but the relationships between mathematical objects. It reveals that logic, computation, and geometry are secretly the same thing viewed from different angles. Programming languages like Haskell are built on it. Physicists use it to unify quantum mechanics and spacetime.',
  },
  {
    id: 'epigenetics', label: 'Epigenetics', domain: 'science', emoji: '🧬',
    hook: 'Your experiences can rewrite which genes your children express.',
    body: 'Epigenetics is the layer above DNA: chemical tags that switch genes on or off without changing the sequence itself. Stress, diet, and trauma can alter these tags — and some changes are heritable. Children of famine survivors show metabolic changes three generations later. Your lifestyle edits an instruction manual your descendants will read.',
  },
  {
    id: 'four_color', label: 'Four Color Theorem', domain: 'math', emoji: '🗺️',
    hook: 'Any map can be colored with just 4 colors so no neighbors match.',
    body: 'Every map, no matter how complex, can be colored so no two adjacent regions share a color — and you never need more than four colors. The proof, confirmed in 1976, was the first major theorem proven partly by computer (checking 1,936 cases). Mathematicians were unsettled: was a computer-assisted proof really a proof?',
  },
  {
    id: 'compilers', label: 'How Compilers Work', domain: 'cs', emoji: '⚙️',
    hook: 'The program that translates human ideas into silicon electricity pulses.',
    body: 'A compiler reads your code, checks its grammar (parsing), understands its meaning (semantic analysis), and translates it to machine instructions the CPU executes. Modern compilers also optimise — reordering and rewriting your code to run faster while preserving behaviour. When you compile, millions of transformations happen in milliseconds.',
  },
  {
    id: 'markets_crash', label: 'Why Markets Crash', domain: 'economics', emoji: '📉',
    hook: 'Markets crash not because of bad news, but because everyone expects a crash.',
    body: 'Financial crises are self-fulfilling prophecies. If enough investors believe others will sell, selling becomes rational — even if the underlying assets are fine. This is "bank run" logic at scale. The 2008 crash happened partly because complex financial instruments made it impossible to know who held the risk, so everyone assumed the worst and stopped lending.',
  },
  {
    id: 'sleep_science', label: 'Why We Sleep', domain: 'science', emoji: '😴',
    hook: 'We spend a third of our lives unconscious — and still do not know exactly why.',
    body: 'Sleep does more than rest the body. During slow-wave sleep, the brain\'s glymphatic system flushes toxic proteins linked to Alzheimer\'s. REM sleep consolidates memories and regulates emotion. One sleepless night impairs performance more than legal intoxication — yet we\'ve only recently begun to understand the mechanisms behind any of it.',
  },
  {
    id: 'origami_math', label: 'Origami Mathematics', domain: 'math', emoji: '🦢',
    hook: 'Paper folding has solved problems that classical geometry cannot touch.',
    body: 'The Huzita-Hatori axioms show that origami can trisect angles and double cubes — problems the ancient Greeks proved impossible with compass and straightedge. Origami mathematics now designs airbags that fold into steering wheels, space telescope mirrors that unfurl in orbit, and medical stents that open inside arteries.',
  },
  {
    id: 'color_theory', label: 'Color & Perception', domain: 'art', emoji: '🎨',
    hook: 'Colors do not exist in reality — they are constructed entirely by your brain.',
    body: 'Light is electromagnetic waves. Your retina has three cone types tuned to different wavelengths. Your brain combines their signals and generates color — a subjective experience with no counterpart in the physical world. The same wavelength can appear different colours in different contexts (the "dress" debate was real physics). Mantis shrimp have 16 cone types.',
  },
  {
    id: 'dna', label: 'How DNA Works', domain: 'science', emoji: '🧬',
    hook: 'Every cell in your body carries a 2-metre instruction manual folded tight.',
    body: 'DNA is a double helix of four bases (A, T, G, C) whose sequence encodes proteins. Your ~3 billion base pairs, if uncoiled, would stretch 2 metres — but are crammed into a nucleus 6 micrometres wide. Cells read sections of this code constantly, assembling proteins that build structure, carry signals, and run metabolism.',
  },
  {
    id: 'game_theory', label: 'Game Theory', domain: 'math', emoji: '♟️',
    hook: 'The math behind why rational people cooperate or betray each other.',
    body: 'Game theory models strategic decisions where outcomes depend on others\' choices. The Prisoner\'s Dilemma shows why two rational actors betray each other even when cooperation would benefit both. Nash equilibria predict stable outcomes in competition. Auction design, nuclear deterrence, and evolutionary biology all run on this mathematics.',
  },
  {
    id: 'fermentation', label: 'Fermentation', domain: 'science', emoji: '🍺',
    hook: 'Billions of invisible creatures turning sugar into flavour and life.',
    body: 'Fermentation is microorganisms converting sugars to acids, gases, or alcohols without oxygen. Yeast makes bread rise and beer ferment; bacteria make yogurt and kimchi. It was humanity\'s first biotechnology — 9,000-year-old wine jars have been found in China. Modern biotech uses fermentation to manufacture insulin and COVID vaccines.',
  },
  {
    id: 'byzantine', label: 'The Byzantine Problem', domain: 'cs', emoji: '⚔️',
    hook: 'How to reach truth when some of the people you trust are lying to you.',
    body: 'The Byzantine Generals Problem asks: how do distributed systems reach consensus when some nodes are traitors sending contradictory messages? Solving it requires redundancy — at most 1/3 of nodes can be faulty. Bitcoin\'s blockchain, Ethereum\'s consensus, and fault-tolerant military systems all implement variants of Byzantine fault tolerance.',
  },
  {
    id: 'fractals', label: 'Fractal Geometry', domain: 'math', emoji: '🌀',
    hook: 'Infinite complexity hiding inside the simplest mathematical rules.',
    body: 'A fractal is a shape that looks the same at every scale — zoom in anywhere and you see the same structure. The Mandelbrot set comes from iterating z² + c and checking if the result diverges. Coastlines, lungs, snowflakes, and market prices are all fractal. Mandelbrot\'s 1982 book invented a new branch of geometry from a simple equation.',
  },
  {
    id: 'antibiotics', label: 'Antibiotic Resistance', domain: 'science', emoji: '🦠',
    hook: 'Evolution is happening right now, inside hospitals, faster than we imagined.',
    body: 'Antibiotics work by exploiting vulnerabilities in bacterial biology. But bacteria reproduce millions of times daily — any random mutation that survives becomes the dominant strain. We\'ve been selecting for resistance by overprescribing and underfinishing courses. WHO estimates drug-resistant infections will kill more people than cancer by 2050 unless we act now.',
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// NAV_HEIGHT accounts for the fixed bottom NavBar so card buttons aren't hidden
const NAV_HEIGHT = 90;

function SwipeCard({ topic, onSwipeUp, onSwipeDown, onLike, onDig, isTop, zIndex, liked }) {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [-150, 150], [-4, 4]);
  const opacity = useTransform(y, [-140, 0, 140], [0.5, 1, 0.5]);
  const color = DOMAIN_COLORS[topic.domain] || '#FF6B35';
  const dragRef = useRef(null);

  const handleDragEnd = useCallback((_, info) => {
    const vy = info.velocity.y;
    const oy = info.offset.y;
    if (oy < -70 || vy < -450) {
      onSwipeUp();
    } else if (oy > 70 || vy > 450) {
      onSwipeDown();
    }
  }, [onSwipeUp, onSwipeDown]);

  const isLiked = liked;

  return (
    <motion.div
      ref={dragRef}
      style={{ y, rotate, opacity, zIndex, touchAction: 'none' }}
      drag={isTop ? 'y' : false}
      dragConstraints={{ top: -250, bottom: 250 }}
      dragElastic={0.14}
      onDragEnd={isTop ? handleDragEnd : undefined}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
    >
      <div
        className="relative w-full h-full rounded-[24px] overflow-hidden flex flex-col"
        style={{
          background: `linear-gradient(160deg, ${color}18 0%, rgba(255,253,247,0.98) 50%, ${color}08 100%)`,
          border: `1.5px solid ${color}22`,
          boxShadow: isTop ? `0 16px 48px ${color}1E, 0 6px 20px rgba(0,0,0,0.07)` : '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-4 flex-shrink-0">
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
            style={{ background: `${color}14`, color }}
          >
            {topic.domain}
          </span>
          <span className="text-[10px] font-mono text-text-muted opacity-40">↑ skip · ↓ back</span>
        </div>

        {/* Main content — scrollable if needed */}
        <div className="flex-1 flex flex-col px-5 py-3 min-h-0">
          <div className="flex items-start gap-4 mb-3">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.05 }}
              className="text-5xl leading-none flex-shrink-0"
              style={{ filter: `drop-shadow(0 6px 18px ${color}38)` }}
            >
              {topic.emoji}
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.h2
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08, duration: 0.3 }}
                className="font-display text-xl font-bold text-text-primary leading-tight"
              >
                {topic.label}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.14, duration: 0.3 }}
                className="font-body text-sm text-spark-ember font-medium mt-0.5 leading-snug"
              >
                {topic.hook}
              </motion.p>
            </div>
          </div>

          {/* Body — the substance */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="font-body text-sm text-text-secondary leading-relaxed flex-1"
            style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}
          >
            {topic.body}
          </motion.p>
        </div>

        {/* Actions */}
        {isTop && (
          <div className="flex-shrink-0 px-4 pb-4 pt-2 space-y-2">
            {/* Keyboard hints */}
            <div className="flex justify-center gap-4 text-[10px] font-mono text-text-muted">
              <span><span style={{ color }}>[S]</span> save</span>
              <span className="opacity-30">·</span>
              <span><span style={{ color }}>[D]</span> dig deeper</span>
              <span className="opacity-30">·</span>
              <span><span style={{ color: '#E63946' }}>[↑]</span> skip</span>
            </div>
            <div className="flex gap-2.5">
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={onLike}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[16px] font-body font-semibold text-sm text-white"
                style={{
                  background: isLiked
                    ? `linear-gradient(135deg, #2D936C, #2D936C99)`
                    : `linear-gradient(135deg, ${color}, ${color}cc)`,
                  boxShadow: `0 6px 20px ${isLiked ? '#2D936C' : color}38`,
                }}
              >
                {isLiked ? '✓ Saved' : '❤️ Save it'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={onDig}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[16px] font-body font-semibold text-sm border-2"
                style={{ borderColor: `${color}38`, color, background: `${color}0A` }}
              >
                ✦ Dig deeper
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function FreeFall({ onExit, onDig, userContextObj }) {
  const user = useUserContext();
  const [queue] = useState(() => shuffle(TOPICS));
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(new Set());
  const [exitDir, setExitDir] = useState(null);

  const current = queue[idx % queue.length];
  const next = queue[(idx + 1) % queue.length];

  const advance = useCallback((dir) => {
    setExitDir(dir);
    setTimeout(() => {
      setIdx((i) => {
        if (dir === 'down' && i === 0) return 0;
        return i + (dir === 'up' ? 1 : -1);
      });
      setExitDir(null);
    }, 230);
  }, []);

  const handleLike = useCallback(() => {
    if (liked.has(current.id)) {
      advance('up');
      return;
    }
    setLiked((prev) => new Set([...prev, current.id]));
    const node = TopicGraph.resolveTopic(current.label);
    user.addTrack?.({ ...node, saved: true, savedAt: new Date().toISOString() });
    TopicGraph.rememberSignal(node, 'saves');
    advance('up');
  }, [current, liked, user, advance]);

  const handleDig = useCallback(() => {
    const node = TopicGraph.resolveTopic(current.label);
    onDig?.(node);
  }, [current, onDig]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case 'ArrowUp': advance('up'); break;
        case 'ArrowDown': if (idx > 0) advance('down'); break;
        case 's': case 'S': handleLike(); break;
        case 'd': case 'D': case 'Enter': handleDig(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advance, handleLike, handleDig, idx]);

  const likedCount = liked.size;
  const progress = Math.min((idx / Math.max(TOPICS.length - 1, 1)) * 100, 100);
  const color = DOMAIN_COLORS[current.domain] || '#FF6B35';

  return (
    <div
      className="flex flex-col bg-bg-primary"
      style={{ height: '100%', paddingBottom: NAV_HEIGHT }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Ember mood={likedCount > 3 ? 'celebrating' : 'curious'} size="xs" glowIntensity={0.6} />
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Freefall</p>
            {likedCount > 0 && (
              <p className="text-[10px] font-body text-text-muted">{likedCount} saved</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-muted">{idx + 1} / {TOPICS.length}</span>
          <button
            onClick={onExit}
            className="text-sm font-body text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-[rgba(42,42,42,0.07)]"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-2 flex-shrink-0">
        <div className="h-1 bg-[rgba(42,42,42,0.07)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Card stack — constrained height so buttons stay visible */}
      <div className="flex-1 relative px-4 pb-2" style={{ minHeight: 0 }}>
        {/* Background card hint */}
        <motion.div
          key={`bg-${next.id}`}
          className="absolute inset-4 rounded-[24px]"
          animate={{ scale: 0.94, y: 10, opacity: 0.6 }}
          style={{
            background: `${DOMAIN_COLORS[next.domain] || '#FF6B35'}10`,
            border: `1.5px solid ${DOMAIN_COLORS[next.domain] || '#FF6B35'}15`,
          }}
        />

        {/* Top card */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`top-${current.id}-${idx}`}
            className="absolute inset-4"
            initial={{ y: exitDir === 'down' ? -50 : 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={exitDir === 'up'
              ? { y: -110, opacity: 0, scale: 0.92, transition: { duration: 0.22 } }
              : { y: 70, opacity: 0, scale: 0.96, transition: { duration: 0.18 } }
            }
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <SwipeCard
              topic={current}
              isTop
              zIndex={10}
              liked={liked.has(current.id)}
              onSwipeUp={() => advance('up')}
              onSwipeDown={() => idx > 0 && advance('down')}
              onLike={handleLike}
              onDig={handleDig}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Liked pills */}
      {liked.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-4 pb-1 flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {queue.filter((t) => liked.has(t.id)).map((t) => {
            const c = DOMAIN_COLORS[t.domain] || '#FF6B35';
            return (
              <span
                key={t.id}
                className="flex-shrink-0 text-[10px] font-body font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `${c}14`, color: c, border: `1px solid ${c}22` }}
              >
                {t.emoji} {t.label}
              </span>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
