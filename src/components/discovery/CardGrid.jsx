import { useState, useEffect, useCallback, useMemo } from 'react';
import DiscoveryCard from './DiscoveryCard.jsx';
import Loader from '../common/Loader.jsx';
import Ember from '../ember/Ember.jsx';
import AIService from '../../ai/ai.service.js';
import { useElo } from '../../hooks/useElo.js';
import { BRANCH_TYPE_STYLES, DISCOVERY_CONFIG } from '../../utils/constants.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';

const ROUND_DOMAINS = [
  ['math', 'science', 'cs', 'art'],
  ['music', 'history', 'philosophy', 'engineering'],
  ['literature', 'languages', 'cooking', 'sports'],
  ['dance', 'film', 'architecture', 'math'],
  ['science', 'cs', 'art', 'music'],
];

const DEFAULT_ROUND_CARDS = [
  [
    { text: 'Why do bees build perfect hexagons?', domain: 'math', emoji: '🐝', imageQuery: 'honeycomb geometry' },
    { text: 'How does a computer know what you mean?', domain: 'cs', emoji: '💡', imageQuery: 'natural language processing ai' },
    { text: 'Why do old paintings smell like time?', domain: 'art', emoji: '🖼️', imageQuery: 'oil painting museum canvas' },
    { text: 'What if gravity just... stopped?', domain: 'science', emoji: '🌍', imageQuery: 'gravity physics space' },
  ],
  [
    { text: 'How does a song get stuck in your head?', domain: 'music', emoji: '🎵', imageQuery: 'earworm music brain' },
    { text: 'Why did everyone suddenly stop believing in kings?', domain: 'history', emoji: '👑', imageQuery: 'french revolution history painting' },
    { text: 'Can something be true AND false at the same time?', domain: 'philosophy', emoji: '🤔', imageQuery: 'paradox logic philosophy' },
    { text: 'How do bridges know how much weight they can hold?', domain: 'engineering', emoji: '🌉', imageQuery: 'bridge engineering architecture' },
  ],
  [
    { text: 'Why can a single sentence change your whole perspective?', domain: 'literature', emoji: '📚', imageQuery: 'book open reading light' },
    { text: "Why does 'no' translate differently in every language?", domain: 'languages', emoji: '🌍', imageQuery: 'world languages linguistics diversity' },
    { text: 'Why does bread get bigger when you bake it?', domain: 'cooking', emoji: '🍞', imageQuery: 'bread baking yeast fermentation' },
    { text: "How do athletes' brains work differently?", domain: 'sports', emoji: '⚡', imageQuery: 'sports psychology athlete focus' },
  ],
  [
    { text: 'Why does your body sync to music without thinking?', domain: 'dance', emoji: '💃', imageQuery: 'dance movement rhythm body' },
    { text: 'How does a 2-hour movie feel like a whole life?', domain: 'film', emoji: '🎬', imageQuery: 'cinema film storytelling' },
    { text: 'Why do ancient buildings still stand after earthquakes?', domain: 'architecture', emoji: '🏛️', imageQuery: 'ancient architecture pillars stone' },
    { text: 'Why does infinity come in different sizes?', domain: 'math', emoji: '∞', imageQuery: 'infinity mathematics abstract' },
  ],
  [
    { text: 'How does your gut actually talk to your brain?', domain: 'science', emoji: '🔬', imageQuery: 'gut brain connection biology' },
    { text: 'How does a recommendation algorithm know you better than you do?', domain: 'cs', emoji: '🤖', imageQuery: 'algorithm recommendation social media' },
    { text: 'Why do some colors make you hungry?', domain: 'art', emoji: '🎨', imageQuery: 'color psychology marketing food' },
    { text: 'What does a melody from 400 years ago feel like today?', domain: 'music', emoji: '🎼', imageQuery: 'baroque classical music concert' },
  ],
];

export default function CardGrid({
  userContext,
  onDiscoveryComplete,
  totalRounds = DISCOVERY_CONFIG.DEFAULT_ROUNDS,
  mode = 'balanced',
}) {
  const [round, setRound] = useState(0);
  const [cards, setCards] = useState(DEFAULT_ROUND_CARDS[0]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [pickedCard, setPickedCard] = useState(null);
  const [emberMood, setEmberMood] = useState('curious');
  const [roundComplete, setRoundComplete] = useState(false);

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
      });
      if (generated && generated.length >= 4) {
        setCards(generated);
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
          setTimeout(() => onDiscoveryComplete?.(), 800);
        } else {
          setRound(nextRound);
          setPickedCard(null);
          setRoundComplete(false);
          loadRoundCards(nextRound);
        }
      }, 400);
    }, 600);
  }, [cards, pickedCard, roundComplete, round, totalRounds, recordPick, loadRoundCards, onDiscoveryComplete]);

  const ageGroup = userContext?.ageGroup || 'college';
  const isKids = ageGroup === 'little_explorer';
  const progressPct = Math.round(((round + (pickedCard ? 1 : 0)) / totalRounds) * 100);
  const topDomain = ranked[0]?.domain || cards[0]?.domain;
  const topDomainColor = DOMAIN_COLORS[topDomain] || '#FF6B35';
  const sparkline = useMemo(() => ranked.slice(0, 3).map((r) => r.domain), [ranked]);
  const sampleBranchTypes = useMemo(
    () => ['question', 'mechanism', 'connection'].map((kind) => BRANCH_TYPE_STYLES[kind] || BRANCH_TYPE_STYLES.connection),
    []
  );

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-0 py-2">
      <div className="w-full rounded-[26px] border border-[rgba(255,255,255,0.7)] bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,248,237,0.96))] px-5 py-5 shadow-[0_24px_60px_rgba(72,49,10,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[rgba(42,42,42,0.06)] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-text-muted">
                Discovery Run
              </span>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-body font-semibold capitalize"
                style={{ background: `${topDomainColor}16`, color: topDomainColor }}
              >
                {topDomain ? `Pulling toward ${topDomain}` : 'Early signal'}
              </span>
            </div>
            <h2 className={`mb-1 text-left font-display font-semibold text-text-primary ${isKids ? 'text-2xl' : 'text-[1.9rem]'}`}>
              {isKids ? 'Pick the spark that feels the coolest.' : 'Train the engine on what genuinely pulls you in.'}
            </h2>
            <p className={`max-w-xl text-left text-text-secondary ${isKids ? 'font-body-kids text-base' : 'font-body text-[15px]'}`}>
              {isKids
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
          <div className="rounded-[18px] bg-[rgba(255,255,255,0.78)] px-4 py-3">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Curiosity Signal</p>
            <p className="mt-1 font-display text-2xl text-text-primary">{progressPct}%</p>
          </div>
          <div className="rounded-[18px] bg-[rgba(255,255,255,0.78)] px-4 py-3">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Mode</p>
            <p className="mt-1 text-sm font-body capitalize text-text-primary">{mode} discovery</p>
          </div>
          <div className="rounded-[18px] bg-[rgba(255,255,255,0.78)] px-4 py-3">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Emerging Threads</p>
            <p className="mt-1 text-sm font-body text-text-primary">{sparkline.length ? sparkline.join(' · ') : 'Still calibrating'}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
            <span>Momentum</span>
            <span>{Math.max(totalRounds - round - 1, 0)} rounds left</span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(42,42,42,0.08)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${topDomainColor}, #ffb347)` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sampleBranchTypes.map((branch) => (
            <span
              key={branch.label}
              className="rounded-full bg-[rgba(255,255,255,0.74)] px-3 py-1 text-[11px] font-body font-semibold text-text-secondary"
            >
              {branch.emoji} {branch.shortLabel}
            </span>
          ))}
        </div>
      </div>

      {isLoadingCards ? (
        <Loader message="Finding interesting things..." />
      ) : (
        <div key={round} className="grid w-full gap-3 sm:grid-cols-2">
          {cards.map((card, i) => (
            <div key={`${round}-${card.domain}-${i}`} className="relative">
              <DiscoveryCard
                card={card}
                index={i}
                onPick={handlePick}
                disabled={!!pickedCard}
                isKids={isKids}
              />
              {pickedCard?.domain === card.domain && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-card"
                  style={{ background: `${DOMAIN_COLORS[card.domain]}22` }}
                >
                  <span className="text-3xl">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
