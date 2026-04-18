import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import Ember from '../components/ember/Ember.jsx';
import Button from '../components/common/Button.jsx';
import { useUserContext } from '../hooks/useUserContext.jsx';
import { AGE_GROUPS, PERSONALITIES } from '../utils/constants.js';
import { initEloScores } from '../models/elo.js';

// ── Personality options ──
const PERSONALITY_OPTIONS = [
  { id: PERSONALITIES.SPARK,     emoji: '✨', label: 'Spark',     description: 'Enthusiastic & warm — everything is exciting' },
  { id: PERSONALITIES.SAGE,      emoji: '🧘', label: 'Sage',      description: 'Calm & Socratic — guides you to insights' },
  { id: PERSONALITIES.EXPLORER,  emoji: '🧭', label: 'Explorer',  description: 'Adventure guide — you\'re a co-discoverer' },
  { id: PERSONALITIES.PROFESSOR, emoji: '📄', label: 'Professor', description: 'Precise & structured — respects your intelligence' },
];

const AGE_OPTIONS = [
  { id: AGE_GROUPS.LITTLE_EXPLORER, label: 'Kid',     emoji: '🌱', range: 'Ages 5–10' },
  { id: AGE_GROUPS.STUDENT,         label: 'Student', emoji: '📚', range: 'Ages 11–17' },
  { id: AGE_GROUPS.COLLEGE,         label: 'College', emoji: '🎓', range: 'College / Grad' },
  { id: AGE_GROUPS.ADULT,           label: 'Adult',   emoji: '🌍', range: 'Working adult' },
];

const INTENT_OPTIONS = [
  { id: 'explore',  emoji: '🌳', label: 'Explore freely',        desc: 'Discover what you\'re curious about' },
  { id: 'idea',     emoji: '💡', label: 'I have an idea',        desc: 'Go deep on something specific' },
  { id: 'major',    emoji: '🎓', label: 'Pick a college major',  desc: 'Discover fields through real day-in-life signals' },
  { id: 'popular',  emoji: '✨', label: 'Show me what\'s popular', desc: 'See what others are exploring' },
];

const VIBE_POINTS = [
  'Discover before you commit',
  'Explanations that adapt to you',
  'Rabbit holes that become tracks',
];

// ── Little Explorer onboarding ──
function LittleExplorerOnboarding({ onComplete }) {
  const [lStep, setLStep] = useState(0); // 0: ember greeting, 1: name, 2: ready
  const [name, setName] = useState('');
  const [emberMood, setEmberMood] = useState('excited');

  useEffect(() => {
    // Ember greeting animation sequence
    if (lStep === 0) {
      const t1 = setTimeout(() => setEmberMood('celebrating'), 600);
      const t2 = setTimeout(() => setEmberMood('attentive'), 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [lStep]);

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    setLStep(2);
    setEmberMood('excited');
  };

  const handleStart = () => {
    onComplete({
      ageGroup: AGE_GROUPS.LITTLE_EXPLORER,
      personality: PERSONALITIES.SPARK, // Always Spark for kids
      name: name.trim() || 'Explorer',
      eloScores: initEloScores(),
      intent: 'explore',
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center px-6 py-12">
      <AnimatePresence mode="wait">
        {lStep === 0 && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6 text-center max-w-xs"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Ember mood={emberMood} size="xl" glowIntensity={0.9} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <h1 className="font-display text-3xl font-bold text-text-primary">
                Hi!! I'm Ember!!
              </h1>
              <p className="font-body text-text-secondary text-lg leading-relaxed">
                I <span className="text-spark-ember font-semibold">LOVE</span> finding cool stuff.<br />
                Want to find cool stuff together?
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col gap-3 w-full"
            >
              <button
                onClick={() => setLStep(1)}
                className="w-full py-4 px-6 rounded-card bg-spark-ember text-white font-display font-semibold text-xl shadow-lg hover:bg-orange-600 transition-colors active:scale-95"
                style={{ minHeight: 64 }}
              >
                YES!! 🎉
              </button>
              <button
                onClick={() => setLStep(1)}
                className="w-full py-3 px-6 rounded-card bg-bg-secondary text-text-muted font-body text-base hover:bg-[rgba(42,42,42,0.08)] transition-colors"
                style={{ minHeight: 52 }}
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}

        {lStep === 1 && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col items-center gap-6 text-center max-w-xs w-full"
          >
            <Ember mood="curious" size="lg" glowIntensity={0.7} />
            <div>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
                What's your name?
              </h2>
              <p className="font-body text-text-muted text-base">
                I'll remember you! 🌟
              </p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Your name here..."
              className="w-full px-5 py-4 rounded-card bg-bg-secondary border-2 border-[rgba(42,42,42,0.1)] font-body text-text-primary text-xl placeholder-text-muted outline-none focus:border-spark-ember transition-colors text-center"
              style={{ minHeight: 64 }}
              autoFocus
              maxLength={20}
            />

            <button
              onClick={handleNameSubmit}
              disabled={!name.trim()}
              className="w-full py-4 rounded-card bg-spark-ember text-white font-display font-semibold text-xl hover:bg-orange-600 transition-colors disabled:opacity-40 active:scale-95"
              style={{ minHeight: 64 }}
            >
              That's me! →
            </button>
          </motion.div>
        )}

        {lStep === 2 && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex flex-col items-center gap-6 text-center max-w-xs"
          >
            <Ember mood="celebrating" size="xl" glowIntensity={1.0} />
            <div>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                Hi {name}! 🎉
              </h2>
              <p className="font-body text-text-secondary text-lg leading-relaxed">
                I'll show you pictures and ideas.<br />
                Just <span className="text-spark-ember font-semibold">tap the ones you like!</span><br />
                No wrong answers — ever!
              </p>
            </div>

            <button
              onClick={handleStart}
              className="w-full py-4 px-6 rounded-card bg-spark-ember text-white font-display font-semibold text-xl shadow-lg hover:bg-orange-600 transition-colors active:scale-95"
              style={{ minHeight: 64 }}
            >
              Let's go!! 🚀
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Student / College / Adult onboarding ──
export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [ageGroup, setAgeGroupLocal] = useState(AGE_GROUPS.COLLEGE);
  const [personality, setPersonalityLocal] = useState(PERSONALITIES.SPARK);
  const [intent, setIntent] = useState(null);
  const [searchText, setSearchText] = useState('');

  const { completeOnboarding } = useUserContext();

  // If user selected Little Explorer, hand off to that flow
  if (step > 0 && ageGroup === AGE_GROUPS.LITTLE_EXPLORER) {
    return (
      <LittleExplorerOnboarding
        onComplete={(profile) => {
          completeOnboarding(profile);
          onComplete(profile);
        }}
      />
    );
  }

  const handleFinish = () => {
    const profile = {
      ageGroup,
      personality,
      eloScores: initEloScores(),
      intent,
      searchSeed: intent === 'idea' ? searchText.trim() : null,
    };
    completeOnboarding(profile);
    onComplete(profile);
  };

  const totalSteps = 3;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8">
      <div className="spark-orb h-48 w-48 bg-[rgba(255,107,53,0.24)] left-[-3rem] top-[-2rem]" />
      <div className="spark-orb h-56 w-56 bg-[rgba(74,111,165,0.15)] right-[-4rem] top-32" />

      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.76)] px-4 py-2 shadow-card">
              <Ember mood="curious" size="sm" glowIntensity={0.7} />
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">Spark OS for curiosity</span>
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] text-text-primary">
              A learning app that starts before the syllabus.
            </h1>
            <p className="mt-4 max-w-lg font-body text-lg leading-relaxed text-text-secondary">
              Spark finds your entry point, turns scattered intrigue into momentum, and keeps opening better rabbit holes as it learns your taste.
            </p>
            <div className="mt-8 grid gap-3">
              {VIBE_POINTS.map((point, index) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-[20px] bg-[rgba(255,255,255,0.72)] px-4 py-3 shadow-card"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,107,53,0.12)] font-mono text-sm text-spark-ember">
                    0{index + 1}
                  </span>
                  <span className="font-body text-text-primary">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="spark-surface w-full max-w-md rounded-[30px] px-5 py-6 sm:px-7">
          <div className="mb-7 flex flex-col items-center gap-3 text-center">
            <Ember mood="curious" size="lg" glowIntensity={0.7} />
            <div>
              <h1 className="font-display text-3xl font-bold text-text-primary">Spark</h1>
              <p className="font-body text-text-secondary text-sm mt-1">The curiosity engine</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-[rgba(255,107,53,0.08)] px-3 py-1 text-xs font-body font-semibold text-spark-ember">Discovery</span>
              <span className="rounded-full bg-[rgba(45,147,108,0.08)] px-3 py-1 text-xs font-body font-semibold text-[#2D936C]">Deep Dives</span>
              <span className="rounded-full bg-[rgba(91,94,166,0.08)] px-3 py-1 text-xs font-body font-semibold text-[#5B5EA6]">Mastery Loops</span>
            </div>
          </div>

        <div className="flex items-center gap-1.5 mb-6 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? 'w-6 bg-spark-ember' :
                i === step ? 'w-8 bg-spark-ember' :
                'w-3 bg-[rgba(42,42,42,0.12)]'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="age"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="text-center mb-2">
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-1">
                  Who's exploring today?
                </h2>
                <p className="text-text-secondary font-body text-sm">
                  Spark tunes pace, language, and depth to the learner.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {AGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAgeGroupLocal(opt.id)}
                    className={`
                      flex flex-col items-center gap-1.5 p-4 rounded-card border-2 transition-all duration-150
                      focus-visible:outline-2 focus-visible:outline-spark-ember
                      ${ageGroup === opt.id
                        ? 'border-spark-ember bg-[rgba(255,107,53,0.06)]'
                        : 'border-[rgba(42,42,42,0.1)] bg-bg-secondary hover:border-[rgba(255,107,53,0.4)]'}
                    `}
                    aria-pressed={ageGroup === opt.id}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="font-body font-semibold text-text-primary text-sm">{opt.label}</span>
                    <span className="font-body text-text-muted text-xs">{opt.range}</span>
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep(1)} className="w-full mt-2">
                Continue →
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="intent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="text-center mb-2">
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-1">
                  What brings you here?
                </h2>
                <p className="text-text-secondary font-body text-sm">This shapes your first rabbit hole.</p>
              </div>
              <div className="flex flex-col gap-3">
                {INTENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setIntent(opt.id)}
                    className={`
                      flex items-center gap-4 p-4 rounded-card border-2 text-left transition-all duration-150
                      focus-visible:outline-2 focus-visible:outline-spark-ember min-h-[64px]
                      ${intent === opt.id
                        ? 'border-spark-ember bg-[rgba(255,107,53,0.06)]'
                        : 'border-[rgba(42,42,42,0.1)] bg-bg-secondary hover:border-[rgba(255,107,53,0.4)]'}
                    `}
                    aria-pressed={intent === opt.id}
                  >
                    <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                    <div>
                      <p className="font-body font-semibold text-text-primary">{opt.label}</p>
                      <p className="font-body text-text-muted text-sm">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {intent === 'idea' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchText.trim() && setStep(2)}
                      placeholder="What do you want to explore?"
                      className="w-full px-4 py-3 rounded-card bg-bg-secondary border border-[rgba(42,42,42,0.1)] font-body text-text-primary placeholder-text-muted outline-none focus:border-spark-ember transition-colors"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1"
                  disabled={!intent || (intent === 'idea' && !searchText.trim())}
                >
                  Continue →
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="personality"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="text-center mb-2">
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-1">
                  How should Spark talk to you?
                </h2>
                <p className="text-text-secondary font-body text-sm">You can change this any time.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PERSONALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPersonalityLocal(opt.id)}
                    className={`
                      flex flex-col gap-1.5 p-4 rounded-card border-2 text-left transition-all duration-150
                      focus-visible:outline-2 focus-visible:outline-spark-ember
                      ${personality === opt.id
                        ? 'border-spark-ember bg-[rgba(255,107,53,0.06)]'
                        : 'border-[rgba(42,42,42,0.1)] bg-bg-secondary hover:border-[rgba(255,107,53,0.4)]'}
                    `}
                    aria-pressed={personality === opt.id}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="font-body font-semibold text-text-primary text-sm">{opt.label}</span>
                    </div>
                    <span className="font-body text-xs text-text-muted leading-snug">{opt.description}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                <Button onClick={handleFinish} className="flex-1">
                  Let's explore ✨
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
