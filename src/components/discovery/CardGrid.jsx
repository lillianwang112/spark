import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import DiscoveryCard from './DiscoveryCard.jsx';
import Loader from '../common/Loader.jsx';
import Ember from '../ember/Ember.jsx';
import AIService from '../../ai/ai.service.js';
import { useElo } from '../../hooks/useElo.js';
import { BRANCH_TYPE_STYLES, DISCOVERY_CONFIG } from '../../utils/constants.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import MajorDecisionLayer from './MajorDecisionLayer.jsx';

const ROUND_DOMAINS = [
  ['math', 'science', 'cs', 'art'],
  ['music', 'history', 'philosophy', 'engineering'],
  ['literature', 'languages', 'cooking', 'sports'],
  ['dance', 'film', 'architecture', 'math'],
  ['science', 'cs', 'art', 'music'],
];

const DEFAULT_ROUND_CARDS = [
  [
    { text: 'Why do bees build perfect hexagons?', domain: 'math', emoji: '🐝', imageQuery: 'honeycomb geometry', kind: 'mechanism', description: 'Efficiency hides inside patterns that look decorative.' },
    { text: 'How does a computer know what you mean?', domain: 'cs', emoji: '💡', imageQuery: 'natural language processing ai', kind: 'mental_model', description: 'Language becomes code only after brutal simplification.' },
    { text: 'Why do old paintings smell like time?', domain: 'art', emoji: '🖼️', imageQuery: 'oil painting museum canvas', kind: 'craft', description: 'Materials age like memories, not like files.' },
    { text: 'What if gravity just... stopped?', domain: 'science', emoji: '🌍', imageQuery: 'gravity physics space', kind: 'counterfactual', description: 'One missing force would rewrite every ordinary movement.' },
  ],
  [
    { text: 'How does a song get stuck in your head?', domain: 'music', emoji: '🎵', imageQuery: 'earworm music brain', kind: 'mechanism', description: 'Catchiness has structure, not just luck.' },
    { text: 'Why did everyone suddenly stop believing in kings?', domain: 'history', emoji: '👑', imageQuery: 'french revolution history painting', kind: 'forces', description: 'Ideas shift fast when institutions start cracking.' },
    { text: 'Can something be true AND false at the same time?', domain: 'philosophy', emoji: '🤔', imageQuery: 'paradox logic philosophy', kind: 'paradox', description: 'Contradiction is where weak thinking and deep thinking part ways.' },
    { text: 'How do bridges know how much weight they can hold?', domain: 'engineering', emoji: '🌉', imageQuery: 'bridge engineering architecture', kind: 'systems', description: 'Every elegant structure is secretly negotiating failure.' },
  ],
  [
    { text: 'Why can a single sentence change your whole perspective?', domain: 'literature', emoji: '📚', imageQuery: 'book open reading light', kind: 'taste', description: 'Style changes meaning before argument even starts.' },
    { text: "Why does 'no' translate differently in every language?", domain: 'languages', emoji: '🌍', imageQuery: 'world languages linguistics diversity', kind: 'connection', description: 'A tiny refusal can reveal a whole culture.' },
    { text: 'Why does bread get bigger when you bake it?', domain: 'cooking', emoji: '🍞', imageQuery: 'bread baking yeast fermentation', kind: 'experiment', description: 'Heat, gas, and gluten stage a miniature explosion.' },
    { text: "How do athletes' brains work differently?", domain: 'sports', emoji: '⚡', imageQuery: 'sports psychology athlete focus', kind: 'question', description: 'Elite movement depends on perception as much as muscle.' },
  ],
  [
    { text: 'Why does your body sync to music without thinking?', domain: 'dance', emoji: '💃', imageQuery: 'dance movement rhythm body', kind: 'mechanism', description: 'Rhythm reaches the body before the mind catches up.' },
    { text: 'How does a 2-hour movie feel like a whole life?', domain: 'film', emoji: '🎬', imageQuery: 'cinema film storytelling', kind: 'craft', description: 'Editing bends time more than scripts do.' },
    { text: 'Why do ancient buildings still stand after earthquakes?', domain: 'architecture', emoji: '🏛️', imageQuery: 'ancient architecture pillars stone', kind: 'systems', description: 'Old builders often understood force better than they explained it.' },
    { text: 'Why does infinity come in different sizes?', domain: 'math', emoji: '∞', imageQuery: 'infinity mathematics abstract', kind: 'paradox', description: 'The impossible gets stranger when you count it carefully.' },
  ],
  [
    { text: 'How does your gut actually talk to your brain?', domain: 'science', emoji: '🔬', imageQuery: 'gut brain connection biology', kind: 'connection', description: 'Your body runs more negotiations than your thoughts admit.' },
    { text: 'How does a recommendation algorithm know you better than you do?', domain: 'cs', emoji: '🤖', imageQuery: 'algorithm recommendation social media', kind: 'failure', description: 'Prediction gets uncanny right before it gets manipulative.' },
    { text: 'Why do some colors make you hungry?', domain: 'art', emoji: '🎨', imageQuery: 'color psychology marketing food', kind: 'question', description: 'Taste begins in the eye earlier than you think.' },
    { text: 'What does a melody from 400 years ago feel like today?', domain: 'music', emoji: '🎼', imageQuery: 'baroque classical music concert', kind: 'connection', description: 'Old sound can still hit with present-tense force.' },
  ],
];

const GENERATED_KIND_FALLBACKS = ['question', 'mechanism', 'paradox', 'connection'];

function normalizeCard(card, index) {
  return {
    ...card,
    _kind: card._kind || card.kind || GENERATED_KIND_FALLBACKS[index % GENERATED_KIND_FALLBACKS.length],
    _description: card._description || card.description || '',
  };
}

export default function CardGrid({
  userContext,
  onDiscoveryComplete,
  onOpenTopic,
  totalRounds = DISCOVERY_CONFIG.DEFAULT_ROUNDS,
  mode = 'balanced',
  majorMode = false,
  majorField = null,
}) {
  const startRound = mode === 'surprise' ? 2 : mode === 'similar' ? 1 : 0;
  const [round, setRound] = useState(startRound);
  const [cards, setCards] = useState(DEFAULT_ROUND_CARDS[startRound]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [pickedCard, setPickedCard] = useState(null);
  const [emberMood, setEmberMood] = useState('curious');
  const [roundComplete, setRoundComplete] = useState(false);
  const [showDecision, setShowDecision] = useState(false);

  const { ranked, recordPick } = useElo();

  const loadRoundCards = useCallback(async (roundIndex) => {
    if (DEFAULT_ROUND_CARDS[roundIndex]) {
      setCards(DEFAULT_ROUND_CARDS[roundIndex]);
      return;
    }

    setIsLoadingCards(true);
    try {
      const domains = ROUND_DOMAINS[roundIndex % ROUND_DOMAINS.length];
      const generated = await AIService.call('discoveryCards', {
        ageGroup: userContext?.ageGroup || 'college',
        personality: userContext?.personality || 'spark',
        topInterests: ranked.slice(0, 3).map((r) => r.domain),
        domains,
        mode,
        majorMode,
        majorField,
      });
      if (generated && generated.length >= 4) {
        setCards(generated.map(normalizeCard));
      } else {
        setCards(DEFAULT_ROUND_CARDS[roundIndex % DEFAULT_ROUND_CARDS.length]);
      }
    } catch {
      setCards(DEFAULT_ROUND_CARDS[roundIndex % DEFAULT_ROUND_CARDS.length]);
    } finally {
      setIsLoadingCards(false);
    }
  }, [mode, ranked, userContext]);

  useEffect(() => {
    if (round < totalRounds - 1) {
      const timer = setTimeout(() => {
        AIService.preGenerate('discoveryCards', {
          ageGroup: userContext?.ageGroup || 'college',
          personality: userContext?.personality || 'spark',
          topInterests: ranked.slice(0, 3).map((r) => r.domain),
          domains: ROUND_DOMAINS[(round + 1) % ROUND_DOMAINS.length],
        });
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [round, userContext, ranked, totalRounds]);

  const handlePick = useCallback((card) => {
    if (pickedCard || roundComplete) return;

    setPickedCard(card);
    setEmberMood('excited');

    onOpenTopic?.({
      id: `discovery_${card.domain}_${card.text}`.replace(/\W+/g, '_').toLowerCase(),
      label: card.text,
      description: card._description || card.description || '',
      domain: card.domain,
      path: [card.text],
      source: 'discovery',
    });

    const otherDomains = cards
      .filter((c) => c.domain !== card.domain)
      .map((c) => c.domain);
    recordPick(card.domain, otherDomains, round + 1, totalRounds);

    setTimeout(() => {
      setRoundComplete(true);
      setEmberMood('idle');

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= totalRounds) {
          setEmberMood('celebrating');
          if (majorMode) {
            setTimeout(() => setShowDecision(true), 800);
          } else {
            setTimeout(() => onDiscoveryComplete?.(), 800);
          }
        } else {
          setRound(nextRound);
          setPickedCard(null);
          setRoundComplete(false);
          loadRoundCards(nextRound);
        }
      }, 400);
    }, 600);
  }, [cards, pickedCard, roundComplete, round, totalRounds, recordPick, loadRoundCards, onDiscoveryComplete, onOpenTopic]);

  const ageGroup = userContext?.ageGroup || 'college';
  const isKids = ageGroup === 'little_explorer';
  const progressPct = Math.round((((round - startRound) + (pickedCard ? 1 : 0)) / (totalRounds - startRound)) * 100);
  const topDomain = ranked[0]?.domain || cards[0]?.domain;
  const topDomainColor = DOMAIN_COLORS[topDomain] || '#FF6B35';
  const sparkline = useMemo(() => ranked.slice(0, 3).map((r) => r.domain), [ranked]);
  const sampleBranchTypes = useMemo(
    () => ['question', 'mechanism', 'connection'].map((kind) => BRANCH_TYPE_STYLES[kind] || BRANCH_TYPE_STYLES.connection),
    []
  );

  if (showDecision) {
    return (
      <AnimatePresence>
        <MajorDecisionLayer
          ranked={ranked}
          majorField={majorField}
          ageGroup={userContext?.ageGroup || 'college'}
          personality={userContext?.personality || 'spark'}
          onContinue={() => onDiscoveryComplete?.()}
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-0 py-2">
      <div className="w-full rounded-[26px] border border-[rgba(255,255,255,0.7)] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,248,237,0.96))] px-5 py-5 shadow-[0_24px_60px_rgba(72,49,10,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[rgba(42,42,42,0.06)] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">
                {majorMode ? '🎓 Major Exploration' : 'Discovery Run'}
              </span>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-body font-semibold capitalize"
                style={{ background: `${topDomainColor}16`, color: topDomainColor }}
              >
                {topDomain ? `Pulling toward ${topDomain}` : 'Early signal'}
              </span>
            </div>
            <h2 className={`mb-1 text-left font-display font-semibold text-text-primary ${isKids ? 'text-2xl' : 'text-[1.9rem]'}`}>
              {majorMode
                ? (majorField ? `Exploring what ${majorField} actually feels like.` : "Let's figure out what makes you light up.")
                : isKids ? 'Pick the spark that feels the coolest.' : 'Train the engine on what genuinely pulls you in.'}
            </h2>
            <p className={`max-w-xl text-left text-text-secondary ${isKids ? 'font-body-kids text-base' : 'font-body text-[15px]'}`}>
              {majorMode
                ? 'Each scenario reveals whether you like making vs understanding, working alone vs collaborating, open problems vs right answers.'
                : isKids
                ? 'Every tap helps Ember find your next magical rabbit hole.'
                : 'Each choice sharpens your map so Explore starts surfacing richer chains, better explanations, and stronger long-term tracks.'}
            </p>
          </div>
          <div className="rounded-[22px] bg-[rgba(255,107,53,0.08)] px-4 py-3 text-center">
            <Ember mood={emberMood} size={isKids ? 'lg' : 'md'} glowIntensity={0.55} />
            <p className="mt-2 text-[11px] font-body font-semibold uppercase tracking-[0.14em] text-text-muted">
              Round {round + 1}/{totalRounds}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Curiosity Signal', value: `${progressPct}%`, large: true },
            { label: 'Mode', value: `${mode} discovery`, large: false },
            { label: 'Emerging Threads', value: sparkline.length ? sparkline.join(' · ') : 'Still calibrating', large: false },
          ].map(({ label, value, large }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.28 }}
              whileHover={{ scale: 1.03, boxShadow: `0 8px 22px ${topDomainColor}18` }}
              className="rounded-[18px] bg-[rgba(255,255,255,0.78)] px-4 py-3"
            >
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">{label}</p>
              <motion.p
                key={value}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.07 + 0.1 }}
                className={`mt-1 font-body capitalize text-text-primary ${large ? 'font-display text-2xl' : 'text-sm'}`}
              >
                {value}
              </motion.p>
            </motion.div>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
            <span>Momentum</span>
            <span>{Math.max(totalRounds - round - 1, 0)} rounds left</span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(42,42,42,0.08)] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
              style={{ background: `linear-gradient(90deg, ${topDomainColor}, #ffb347)` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sampleBranchTypes.map((branch, i) => (
            <motion.span
              key={branch.label}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 320, damping: 22 }}
              className="rounded-full bg-[rgba(255,255,255,0.74)] px-3 py-1 text-[11px] font-body font-semibold text-text-secondary"
            >
              {branch.emoji} {branch.shortLabel}
            </motion.span>
          ))}
        </div>
      </div>

      {isLoadingCards ? (
        <Loader message="Finding interesting things..." />
      ) : (
        <div key={round} className="grid w-full gap-3 sm:grid-cols-2">
          {cards.map((card, i) => {
            const normalizedCard = normalizeCard(card, i);
            const isPicked = pickedCard?.text === card.text;
            const isUnchosen = !!pickedCard && !isPicked;
            return (
              <div key={`${round}-${card.domain}-${i}`} className="relative">
                <DiscoveryCard
                  card={normalizedCard}
                  index={i}
                  onPick={handlePick}
                  disabled={!!pickedCard}
                  isPicked={isPicked}
                  isUnchosen={isUnchosen}
                  isKids={isKids}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
