import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
import Toast from '../common/Toast.jsx';
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
  // ── New topics ──
  {
    id: 'monty_hall', label: 'The Monty Hall Problem', domain: 'math', emoji: '🚪',
    hook: 'Switching doors doubles your odds. Almost every human instinct says otherwise.',
    body: 'You pick door 1. The host opens door 3 (a goat). Should you switch to door 2? Yes — switching wins 2/3 of the time. When this appeared in Parade magazine in 1990, nearly 1,000 PhDs wrote in saying it was wrong. The host\'s knowledge changes the probability. Your intuition is confidently, provably mistaken.',
  },
  {
    id: 'great_filter', label: 'The Great Filter', domain: 'science', emoji: '🌠',
    hook: 'The universe is 13.8 billion years old. So where is everyone?',
    body: 'The Fermi Paradox: the universe has billions of Earth-like planets and billions of years of head start. We should have been contacted. We haven\'t been. Either intelligence is extraordinarily rare, or civilisations reliably destroy themselves. The terrifying implication: if we find life on Mars, it might be the worst news in human history — it means the filter is ahead of us.',
  },
  {
    id: 'ship_of_theseus', label: 'Ship of Theseus', domain: 'philosophy', emoji: '⚓',
    hook: 'If you replace every plank, is it still the same ship? Your identity depends on the answer.',
    body: 'Over years, every plank of Theseus\'s ship was replaced. Is it still the same ship? Now suppose someone collected all the old planks and rebuilt the original. Which is the real ship? The puzzle scales: your body replaces most cells every decade. Legal identity, personal continuity, and what makes you "you" all rest on this unsolved question.',
  },
  {
    id: 'cognitive_dissonance', label: 'Cognitive Dissonance', domain: 'science', emoji: '🤯',
    hook: 'When your actions contradict your beliefs, you change your beliefs — not your actions.',
    body: 'Leon Festinger studied a cult that predicted the end of the world. When the date passed, members didn\'t abandon the cult — they doubled down and recruited harder. Actions must align with self-image, so when they conflict, the mind rewrites the story. This is why people who suffer for a cause value it more, and why the first step of commitment is so powerful.',
  },
  {
    id: 'tectonic_plates', label: 'Tectonic Plates', domain: 'science', emoji: '🌍',
    hook: 'The continents are moving — at the exact speed your fingernails grow.',
    body: 'Earth\'s crust rides on massive plates that grind, subduct, and collide. The Himalayas are still rising because India is slowly crashing into Asia. 200 million years ago, all land was one continent (Pangaea). In 250 million years, the Americas will drift into Eurasia forming a new supercontinent. Every mountain range is a slow-motion collision we\'re frozen inside.',
  },
  {
    id: 'bioluminescence', label: 'Bioluminescence', domain: 'science', emoji: '✨',
    hook: 'The deep ocean is dark — but most of its creatures make their own light.',
    body: 'Below 200 metres, sunlight vanishes entirely. Yet 76% of deep-sea animals produce their own light via a chemical reaction (luciferin + oxygen). Anglerfish lure prey with glowing lures; firefly squid flash in waves; some bacteria glow so infected fish becomes visible to predators — serving the bacteria by spreading them. Evolution invented light from scratch at least 50 separate times.',
  },
  {
    id: 'mirror_neurons', label: 'Mirror Neurons', domain: 'science', emoji: '🪞',
    hook: 'Your brain fires when you watch someone else act — as if you\'re doing it yourself.',
    body: 'Discovered accidentally in macaque monkeys, mirror neurons fire both when an animal performs an action and when it observes that action. Humans have a homologous system. This may underpin imitation learning, empathy, and even language. When you wince watching someone stub their toe, your motor cortex is literally simulating their pain. Mirror neurons may be what makes culture possible.',
  },
  {
    id: 'tulip_mania', label: 'Tulip Mania', domain: 'economics', emoji: '🌷',
    hook: 'In 1637, a single tulip bulb cost more than a Dutch house. Then it didn\'t.',
    body: 'In 1636, tulip futures contracts became wildly speculative. Rare "broken" tulips (actually virus-infected) fetched fortunes. At the peak, one Semper Augustus bulb sold for 10,000 guilders — the price of a grand Amsterdam canal house. In February 1637, the market collapsed overnight. Tulip mania became history\'s first documented speculative bubble, still studied by economists 400 years later.',
  },
  {
    id: 'nuclear_winter', label: 'Nuclear Winter', domain: 'science', emoji: '☢️',
    hook: 'A regional nuclear war could starve more people than the bombs kill.',
    body: 'Even a "limited" nuclear exchange — say, India vs Pakistan — would inject enough soot into the stratosphere to cool global temperatures by 1-3°C for a decade. Crops would fail across the Northern Hemisphere. Models suggest 2 billion people could die of famine, mostly in countries that had no part in the conflict. The indirect effects dwarf the direct blast casualties.',
  },
  {
    id: 'voynich_manuscript', label: 'The Voynich Manuscript', domain: 'humanities', emoji: '📜',
    hook: 'A 600-year-old illustrated book in an undeciphered language — or the world\'s greatest hoax.',
    body: 'Radiocarbon-dated to 1404–1438, the Voynich Manuscript contains 240 pages of flowing text in an unknown script, alongside illustrations of unidentifiable plants, astronomical diagrams, and naked figures in pools. No cryptographer, codebreaker, or linguist has decoded it. Theories range from an invented language to a hoax. Artificial intelligence failed too. It\'s the most studied unknown text in history.',
  },
  {
    id: 'grandmother_hypothesis', label: 'The Grandmother Hypothesis', domain: 'science', emoji: '👵',
    hook: 'Humans live past reproductive age partly because grandmothers saved their grandchildren.',
    body: 'Almost all animals die shortly after they stop reproducing. Humans don\'t — women can live 40+ years past menopause. The grandmother hypothesis argues this was selected for: grandmothers who foraged for grandchildren allowed mothers to have more children more quickly. This would explain both human longevity and why childhood is so unusually long. Our elders may be the reason we\'re smart.',
  },
  {
    id: 'synesthesia', label: 'Synesthesia', domain: 'science', emoji: '🎨',
    hook: '4% of people automatically see numbers as colors or hear shapes as sounds.',
    body: 'For synesthetes, sensory crosswiring is automatic and consistent: the number 7 is always green, Tuesday always smells like pine. Vladimir Nabokov, Nikola Tesla, and Pharrell Williams all had it. Brain imaging shows these aren\'t metaphors — cross-activation between sensory cortices is measurable. The condition suggests perception is far more constructed and individual than it feels.',
  },
  {
    id: 'biomimicry', label: 'Biomimicry', domain: 'science', emoji: '🦅',
    hook: 'Velcro, bullet trains, and solar panels were all invented by looking at animals.',
    body: 'Velcro was inspired by burr seeds\' hooks. The Shinkansen\'s nose was redesigned from the kingfisher\'s beak to eliminate sonic booms in tunnels. Humpback whale fin tubercles improve wind turbine efficiency by 32%. Termite mounds inspired a passive cooling system for a Zimbabwean building. Evolution has been solving engineering problems for 3.8 billion years — we\'re just starting to read the solutions.',
  },
  {
    id: 'inca_quipu', label: 'Inca Quipu', domain: 'history', emoji: '🪢',
    hook: 'The Inca ran a continent-spanning empire — using only knots.',
    body: 'The Inca had no writing system. Instead, they used quipus — complex arrangements of knotted strings encoding numbers, records, and possibly narrative. At its height, the Inca Empire stretched 4,000 km along the Andes, administered tribute, built 40,000 km of roads, and coordinated armies — all recorded in knots. Most quipus remain undeciphered. We may be reading their accounting ledgers and mistaking them for literature.',
  },
  {
    id: 'arrow_of_time', label: 'Arrow of Time', domain: 'science', emoji: '⏳',
    hook: 'Physics equations work perfectly backwards. So why can\'t you un-break an egg?',
    body: 'Newtonian mechanics, electromagnetism, quantum mechanics — all are time-symmetric. Run the equations backwards and they\'re equally valid. Yet time clearly flows one direction. The answer involves entropy: there are astronomically more disordered states than ordered ones, so disorder increases statistically. But this just pushes the question back — why was the universe so extraordinarily ordered at the Big Bang?',
  },
  {
    id: 'economic_complexity', label: 'Economic Complexity', domain: 'economics', emoji: '🏭',
    hook: 'The best predictor of a country\'s wealth in 20 years? Not GDP — what it makes.',
    body: 'Harvard economist Ricardo Hausmann found that countries\' future income is best predicted by the diversity and sophistication of their current exports — not their GDP or education levels. A country making both chemicals and ball bearings is more complex than one exporting oil. Complexity predicts growth better than almost anything else. Countries don\'t get rich by saving money; they get rich by learning to make hard things.',
  },
  {
    id: 'hagia_sophia', label: 'Hagia Sophia\'s Floating Dome', domain: 'art', emoji: '🕌',
    hook: 'A 1,500-year-old dome that appears to hover — solved with a ring of light.',
    body: 'Built in 537 AD, Hagia Sophia\'s dome seems to float above the nave. The illusion is deliberate: 40 windows pierce its base in a continuous ring, flooding the transition zone with light and hiding the structural supports. The dome\'s base visually disappears. Byzantine architects achieved this without calculus or computers. When an earthquake damaged it in 558, they solved the problem by making the dome taller and lighter — the repair has outlasted every empire since.',
  },
  {
    id: 'turing_test', label: 'The Turing Test', domain: 'cs', emoji: '🤖',
    hook: 'Turing proposed a test for machine intelligence — then suggested it might be meaningless.',
    body: 'In 1950, Alan Turing proposed the "imitation game": if a human can\'t distinguish a machine\'s responses from a human\'s, the machine is intelligent. But the same paper suggests this just moves the question — we can\'t define intelligence, so testing for imitation doesn\'t settle it. GPT-4 passes casual versions of the test. Philosophers still disagree about whether that means anything at all.',
  },
  {
    id: 'habit_loop', label: 'How Habits Form', domain: 'science', emoji: '🔁',
    hook: 'A three-step neurological loop runs roughly 40% of your daily actions — without you.',
    body: 'The habit loop: a cue triggers a routine that delivers a reward. Repeat enough times and the basal ganglia automates the entire sequence, bypassing the prefrontal cortex. This is why habits feel effortless and why they\'re so hard to break — you\'re not fighting bad choices, you\'re fighting automated subroutines. Changing a habit requires keeping the cue and reward identical, but substituting the routine. The loop can\'t be deleted — only overwritten.',
  },
  {
    id: 'humor_psychology', label: 'Why Things Are Funny', domain: 'science', emoji: '😂',
    hook: 'Humor requires exactly two ingredients: a violated expectation that\'s also harmless.',
    body: 'The benign violation theory: something is funny when it simultaneously violates expectations AND is safe/benign. Remove either element — pure surprise without safety (a real threat) or pure benign (a boring surprise) — and the humor evaporates. This explains why the same joke lands differently depending on who\'s in the room, why dark humor needs distance, and why tickling only works if the tickler is friendly.',
  },
  {
    id: 'antimatter', label: 'Antimatter', domain: 'science', emoji: '💥',
    hook: 'For every particle in existence, there\'s an opposite that destroys it on contact.',
    body: 'Every particle has an antimatter twin with opposite charge. When matter meets antimatter, both annihilate in pure energy — the most efficient energy conversion possible. The Big Bang should have created equal amounts. Somehow matter won, by about one part in a billion. That tiny asymmetry is the reason the universe contains anything at all, and nobody knows why it happened.',
  },
  {
    id: 'power_law', label: 'Power Laws', domain: 'math', emoji: '📊',
    hook: 'The same mathematical pattern governs city sizes, earthquakes, wealth, and word frequency.',
    body: 'In a power law distribution, a few items dominate everything. The 20 largest cities hold half the world\'s urban population. The top 1% owns more than the bottom 90%. Earthquake energy follows a power law across 12 orders of magnitude. These distributions have no "typical" value — averages are meaningless. Power laws emerge whenever growth is multiplicative rather than additive, which describes almost everything interesting.',
  },
  {
    id: 'optical_illusions', label: 'Optical Illusions', domain: 'science', emoji: '👀',
    hook: 'Optical illusions don\'t reveal how your eyes fail — they reveal how your brain predicts.',
    body: 'Your visual cortex doesn\'t process raw input; it generates predictions about the world and checks them against incoming data. Optical illusions exploit priors baked in by evolution — assumptions about lighting, depth, and motion. The café wall illusion shows perfectly parallel lines that appear angled. These aren\'t errors; they\'re evidence that perception is a controlled hallucination running on shortcuts that are usually correct.',
  },
  {
    id: 'dead_reckoning', label: 'Dead Reckoning', domain: 'history', emoji: '🧭',
    hook: 'Polynesian navigators crossed 10,000 km of open ocean using only stars, waves, and birds.',
    body: 'Before GPS or compasses, Polynesian wayfinders navigated from Hawaii to New Zealand using memorised star paths, wave patterns (different islands create distinct swells felt underfoot), wind direction, cloud formation above land, and the flight paths of birds. They carried mental maps of the night sky for 150 stars. This knowledge, nearly lost after colonisation, has been painstakingly reconstructed — and proven accurate by experiment.',
  },
  {
    id: 'entropy_information', label: 'Entropy', domain: 'science', emoji: '🌡️',
    hook: 'The universe\'s most relentless force isn\'t gravity — it\'s disorder.',
    body: 'The second law of thermodynamics says entropy (disorder) always increases in a closed system. This is why heat flows hot to cold, why ice melts but water doesn\'t spontaneously freeze, and why your room gets messier. It\'s also why time has a direction. What\'s strange: the laws of physics are time-symmetric. The arrow of time comes entirely from entropy, which itself came from the inexplicably low entropy of the Big Bang.',
  },
  {
    id: 'placebo_effect', label: 'The Placebo Effect', domain: 'science', emoji: '💊',
    hook: 'A sugar pill can genuinely reduce pain — and the effect gets stronger if the pill is bigger.',
    body: 'Placebos work even when patients are told they\'re placebos. More expensive-looking pills work better than cheap ones. Sham surgery often matches real surgery for pain relief. The effect is real and measurable — not just reported: placebos release endorphins, lower blood pressure, and trigger immune responses. This means the brain can modulate pain and inflammation on expectation alone. Medicine doesn\'t fully understand why.',
  },
  {
    id: 'dunbar_number', label: 'Dunbar\'s Number', domain: 'science', emoji: '👥',
    hook: 'Humans can meaningfully maintain exactly ~150 relationships. Social networks don\'t change this.',
    body: 'Robin Dunbar found that primate neocortex size predicts average social group size. For humans, it\'s ~150. This appears across hunter-gatherer bands, Roman army units, Amish communities, and effective company divisions. You can have 5,000 Facebook friends, but you only genuinely track ~150 people\'s lives. Our brains evolved a fixed budget for social complexity, and no technology has expanded it — only redistributed it.',
  },
  {
    id: 'godel', label: "Gödel's Incompleteness", domain: 'math', emoji: '🔄',
    hook: 'Every powerful math system contains true statements it can never prove.',
    body: 'In 1931, Kurt Gödel showed that any consistent formal system powerful enough to include arithmetic must contain statements that are true but unprovable within that system. This destroyed Hilbert\'s program of finding complete, consistent foundations for all mathematics. Worse: such a system cannot prove its own consistency. Mathematics is not and cannot be a closed book. Some truths lie permanently beyond proof.',
  },
  {
    id: 'sound_physics', label: 'Sound is a Lie', domain: 'science', emoji: '🔊',
    hook: 'Sound doesn\'t travel — pressure waves do. Your brain invents the rest.',
    body: 'Sound is the brain\'s interpretation of pressure waves moving through a medium. Nothing "sound-like" exists between a speaker and your ear — only oscillating air pressure. The richness of timbre, the quality of a violin vs. a trumpet, is entirely constructed by your auditory cortex processing overtone patterns. Deaf from birth and surgically given hearing at 20, patients must learn to interpret these signals — the sound experience isn\'t given, it\'s built.',
  },
  {
    id: 'compound_interest', label: 'Compound Interest', domain: 'economics', emoji: '📈',
    hook: 'Einstein allegedly called it the eighth wonder of the world. The math earns the reputation.',
    body: '$1,000 at 7% annual return becomes $7,612 in 30 years — not $3,100. The returns accelerate because each year\'s gains generate their own gains. A 25-year-old who invests $5,000 and never adds anything ends up with more at 65 than a 35-year-old who invests $5,000 every year. The function is exponential, and human brains evolved to reason linearly — making compound interest one of the most consistently underestimated forces in finance.',
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

function SwipeCard({ topic, onSwipeUp, onSwipeDown, onLike, onDig, isTop, zIndex, liked, theme = 'light' }) {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [-150, 150], [-4, 4]);
  const opacity = useTransform(y, [-140, 0, 140], [0.5, 1, 0.5]);
  const color = DOMAIN_COLORS[topic.domain] || '#FF6B35';
  const swipingRef = useRef(false);

  // Imperative flyoff prevents the dragConstraints spring-back from fighting the exit animation
  const handleDragEnd = useCallback((_, info) => {
    if (swipingRef.current) return;
    const vy = info.velocity.y;
    const oy = info.offset.y;
    if (oy < -70 || vy < -450) {
      swipingRef.current = true;
      animate(y, -500, { duration: 0.2, ease: [0.4, 0, 1, 1] }).then(() => {
        swipingRef.current = false;
        onSwipeUp();
      });
    } else if (oy > 70 || vy > 450) {
      swipingRef.current = true;
      animate(y, 500, { duration: 0.2, ease: [0.4, 0, 1, 1] }).then(() => {
        swipingRef.current = false;
        onSwipeDown();
      });
    }
    // else: let Framer Motion spring y back to 0 naturally
  }, [y, onSwipeUp, onSwipeDown]);

  const isLiked = liked;
  const isDark = theme === 'dark';

  return (
    <motion.div
      style={{ y, rotate, opacity, zIndex, touchAction: 'none' }}
      drag={isTop ? 'y' : false}
      dragConstraints={{ top: -300, bottom: 300 }}
      dragElastic={0.12}
      onDragEnd={isTop ? handleDragEnd : undefined}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
    >
      <div
        className="relative w-full h-full rounded-[28px] overflow-hidden flex flex-col"
        style={{
          background: isDark
            ? `linear-gradient(160deg, #110600 0%, #1D0B00 40%, ${color}18 70%, #0E0500 100%)`
            : `linear-gradient(160deg, #FFFFFF 0%, #FFF8ED 45%, ${color}15 78%, #FFF3DF 100%)`,
          border: `1.5px solid ${color}30`,
          boxShadow: isTop
            ? isDark
              ? `0 28px 70px ${color}28, 0 0 0 1px ${color}18, 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`
              : `0 24px 64px ${color}20, 0 10px 30px rgba(72,49,10,0.12), inset 0 1px 0 rgba(255,255,255,0.82)`
            : isDark ? `0 6px 16px rgba(0,0,0,0.20)` : `0 6px 16px rgba(72,49,10,0.12)`,
        }}
      >
        {/* Subtle domain color wash */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 80% 20%, ${color}20 0%, transparent 65%)`,
          }}
          aria-hidden="true"
        />

        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-4 flex-shrink-0 relative z-10">
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
            style={{
              background: `${color}28`,
              color,
              border: `1px solid ${color}40`,
              boxShadow: `0 2px 8px ${color}28`,
            }}
          >
            {topic.domain}
          </span>
          <span className="text-[10px] font-mono opacity-30" style={{ color: isDark ? 'rgba(255,220,180,0.6)' : 'rgba(72,49,10,0.48)' }}>
            ↑ skip · ↓ back
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col px-5 py-3 min-h-0 relative z-10">
          <div className="flex items-start gap-4 mb-3">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
              className="text-5xl leading-none flex-shrink-0"
              style={{ filter: `drop-shadow(0 8px 22px ${color}55)` }}
            >
              {topic.emoji}
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.h2
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.32 }}
                className="font-display text-xl font-bold leading-tight"
                style={{ color: isDark ? '#FFF7EC' : '#2C2C2C' }}
              >
                {topic.label}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.16, duration: 0.3 }}
                className="font-body text-sm font-medium mt-0.5 leading-snug"
                style={{ color }}
              >
                {topic.hook}
              </motion.p>
            </div>
          </div>

          {/* Separator */}
          <div
            className="h-px mb-3 opacity-20"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          />

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.38 }}
            className="font-body text-sm leading-relaxed flex-1"
              style={{
              color: isDark ? 'rgba(255,220,170,0.78)' : 'rgba(72,49,10,0.78)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {topic.body}
          </motion.p>
        </div>

        {/* Actions */}
        {isTop && (
          <div className="flex-shrink-0 px-4 pb-5 pt-2 space-y-2.5 relative z-10">
            <div className="flex justify-center gap-4 text-[10px] font-mono opacity-40" style={{ color: isDark ? 'rgba(255,200,140,0.7)' : 'rgba(72,49,10,0.68)' }}>
              <span><span style={{ color }}>[S]</span> save</span>
              <span className="opacity-40">·</span>
              <span><span style={{ color }}>[D]</span> dig deeper</span>
              <span className="opacity-40">·</span>
              <span>[↑] skip</span>
            </div>
            <div className="flex gap-2.5">
              <motion.button
                whileHover={{ scale: 1.05, y: -2, boxShadow: `0 16px 32px ${isLiked ? '#2D936C' : color}50` }}
                whileTap={{ scale: 0.94 }}
                onClick={onLike}
                className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-[18px] font-body font-bold text-sm text-white"
                style={{
                  background: isLiked
                    ? 'linear-gradient(135deg, #3DB87F, #2D936C)'
                    : `linear-gradient(135deg, ${color}EE, ${color}99)`,
                  boxShadow: `0 10px 28px ${isLiked ? '#2D936C' : color}45`,
                  border: `1px solid ${isLiked ? 'rgba(61,184,127,0.4)' : `${color}55`}`,
                }}
              >
                {isLiked ? '✓ Saved' : '❤️ Save it'}
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.05, y: -2,
                  boxShadow: `0 16px 32px ${color}40`,
                  background: `${color}25`,
                }}
                whileTap={{ scale: 0.94 }}
                onClick={onDig}
                className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-[18px] font-body font-bold text-sm transition-all"
                style={{
                  border: `1.5px solid ${color}50`,
                  color,
                  background: `${color}14`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}
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

export default function FreeFall({ onExit, onDig, theme = 'light' }) {
  const user = useUserContext();
  const [queue] = useState(() => shuffle(TOPICS));
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(new Set());
  const [enterDir, setEnterDir] = useState('up');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const current = queue[idx % queue.length];
  const next = queue[(idx + 1) % queue.length];

  // Immediately change idx — SwipeCard handles its own flyoff animation
  const advance = useCallback((dir) => {
    setEnterDir(dir);
    setIdx((i) => {
      if (dir === 'down' && i === 0) return 0;
      return i + (dir === 'up' ? 1 : -1);
    });
  }, []);

  const handleLike = useCallback(() => {
    if (liked.has(current.id)) {
      advance('up');
      return;
    }
    setLiked((prev) => new Set([...prev, current.id]));
    const node = TopicGraph.resolveTopic(current.label);
    user.addTrack?.({ ...node, saved: true, mode: 'exploring', savedAt: new Date().toISOString() });
    showToast(`✓ Saved "${current.label}" → check your Tracks tab`);
    TopicGraph.rememberSignal(node, 'saves');
    advance('up');
  }, [current, liked, user, advance, showToast]);

  const handleDig = useCallback(() => {
    const node = TopicGraph.resolveTopic(current.label);
    showToast(`Opening ${current.label} in the explorer…`);
    setTimeout(() => onDig?.(node), 350);
  }, [current, onDig, showToast]);

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
  const isDark = theme === 'dark';

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100%',
        paddingBottom: NAV_HEIGHT,
        background: isDark
          ? 'linear-gradient(180deg, #0D0500 0%, #180900 50%, #100600 100%)'
          : 'linear-gradient(180deg, #FFF8ED 0%, #FFFDF7 46%, #F7ECDA 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Ember mood={likedCount > 3 ? 'celebrating' : 'curious'} size="xs" glowIntensity={0.8} />
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: isDark ? 'rgba(255,138,90,0.85)' : 'rgba(145,95,58,0.82)' }}>
              Freefall
            </p>
            {likedCount > 0 && (
              <motion.p
                key={likedCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-[10px] font-body"
                style={{ color: isDark ? 'rgba(255,209,102,0.7)' : 'rgba(61,139,92,0.82)' }}
              >
                {likedCount} saved ✨
              </motion.p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: isDark ? 'rgba(255,180,100,0.45)' : 'rgba(72,49,10,0.5)' }}>
            {idx + 1} / {TOPICS.length}
          </span>
          <button
            onClick={onExit}
            className="text-sm font-body transition-colors px-3 py-1.5 rounded-full"
            style={{
              color: isDark ? 'rgba(255,180,100,0.65)' : 'rgba(72,49,10,0.72)',
              background: isDark ? 'rgba(255,107,53,0.10)' : 'rgba(255,255,255,0.8)',
              border: isDark ? '1px solid rgba(255,107,53,0.18)' : '1px solid rgba(42,42,42,0.12)',
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-2 flex-shrink-0">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(42,42,42,0.08)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Card stack — constrained height so buttons stay visible */}
      <div className="flex-1 relative px-4 pb-2" style={{ minHeight: 0 }}>
        {/* Background card hint */}
        <motion.div
          key={`bg-${next.id}`}
          className="absolute inset-4 rounded-[28px]"
          animate={{ scale: 0.93, y: 12, opacity: 0.5 }}
          style={{
            background: isDark
              ? `linear-gradient(145deg, #1A0900, ${DOMAIN_COLORS[next.domain] || '#FF6B35'}14, #0F0500)`
              : `linear-gradient(145deg, rgba(255,255,255,0.92), ${(DOMAIN_COLORS[next.domain] || '#FF6B35')}14, rgba(255,248,236,0.92))`,
            border: `1.5px solid ${DOMAIN_COLORS[next.domain] || '#FF6B35'}22`,
          }}
        />

        {/* Top card */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`top-${current.id}-${idx}`}
            className="absolute inset-4"
            initial={{ y: enterDir === 'down' ? -50 : 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <SwipeCard
              topic={current}
              isTop
              zIndex={10}
              liked={liked.has(current.id)}
              theme={theme}
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
                style={{
                  background: `${c}22`,
                  color: c,
                  border: `1px solid ${c}38`,
                  boxShadow: `0 2px 8px ${c}28`,
                }}
              >
                {t.emoji} {t.label}
              </span>
            );
          })}
        </motion.div>
      )}

      <Toast
        open={!!toast}
        onClose={() => setToast(null)}
        title={toast}
        variant="calm"
      />
    </div>
  );
}
