# CLAUDE.md — Spark: The Curiosity Engine

> **"Curiosity is the primitive, not knowledge."**

Spark is a lifelong learning app that solves **the step before learning starts**. It discovers what lights you up through a beautiful, concrete, interactive experience — then takes you as deep as you want to go on any topic, with AI explanations tailored to exactly who you are.

**One-line pitch:** "Every learning app assumes you already know what you want to learn. We solve the step before that."

**The complete arc:** Discover → Explore → Learn → Understand → Push (research frontier) → Act (opportunities)

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Design System](#design-system)
4. [The AI Layer](#the-ai-layer)
5. [Core Loop](#core-loop)
6. [Onboarding Flows](#onboarding-flows)
7. [Discovery Phase & Elo Model](#discovery-phase--elo-model)
8. [Knowledge Tree](#knowledge-tree)
9. [The Explainer](#the-explainer)
10. [Knowledge State Tagging & 2D User Model](#knowledge-state-tagging--2d-user-model)
11. [Exploring vs Mastering](#exploring-vs-mastering)
12. [The Mastering Suite](#the-mastering-suite)
13. [The Living Tree & Branch States](#the-living-tree--branch-states)
14. [Tending Mechanics](#tending-mechanics)
15. [Pruning & Dormancy](#pruning--dormancy)
16. [Goals as Ghost Branches](#goals-as-ghost-branches)
17. [Universal Search](#universal-search)
18. [Visual Content Strategy](#visual-content-strategy)
19. [Profiles & Identity](#profiles--identity)
20. [Journey Timeline & Memory View](#journey-timeline--memory-view)
21. [Retention Philosophy & Hooks](#retention-philosophy--hooks)
22. [Ember — The Mascot](#ember--the-mascot)
23. [Firebase Schema](#firebase-schema)
24. [Seed Data](#seed-data)
25. [Error Handling & Fallbacks](#error-handling--fallbacks)
26. [Hackathon Demo Strategy](#hackathon-demo-strategy)
27. [Post-Hackathon Roadmap](#post-hackathon-roadmap)
28. [Philosophical Guardrails](#philosophical-guardrails)
29. [Accessibility](#accessibility)
30. [Deployment & Infrastructure](#deployment--infrastructure)
31. [Code Style & Conventions](#code-style--conventions)
32. [Performance](#performance)
33. [The North Star](#the-north-star)
34. [Open Questions & Design Decisions](#open-questions--design-decisions)
35. [Contributing & Team Guidance](#contributing--team-guidance)

---

## Project Structure

```
spark/
├── CLAUDE.md
├── index.html                   # Puter.js loaded async here
├── src/
│   ├── App.jsx                  # Root: UserContextProvider > TreeProvider > AppShell
│   ├── main.jsx
│   ├── ai/
│   │   ├── ai.service.js        # THE abstraction layer — ALL AI calls route through here
│   │   ├── prompts.js           # All prompt type templates, parameterized
│   │   ├── personalities.js     # 4 personality system prompts + Little Explorer modifier
│   │   └── cache.js             # Client-side caching with TTL
│   ├── components/
│   │   ├── common/              # Button, Card, Toggle, Loader, Modal, KnowledgeStateTag
│   │   ├── discovery/           # CardGrid, DiscoveryCard, RoundTracker
│   │   ├── tree/                # TreeRenderer, TreeNode, BranchPath, GhostNode
│   │   ├── explainer/           # ExplainerCard, InteractiveDiagram, ImageGrid
│   │   ├── tracks/              # TracksView, TrackCard, ModeToggle, TendingSession
│   │   ├── mastering/           # LearnMode, Flashcards, MatchGame, TestMode
│   │   ├── profile/             # LivingTreeViz, BadgeCard, PersonalitySummary, DomainConstellation
│   │   ├── journey/             # TimelineScrubber, PeriodView, NarrativeCard, YearInSpark
│   │   ├── search/              # SearchBar, InstantExplainer, CuriosityLog
│   │   ├── onboarding/          # AgeSelector, DiscoveryIntro, PersonalityPicker, BranchQuestion
│   │   ├── ember/               # Ember SVG component, mood state machine, glow system
│   │   ├── opportunities/       # OpportunityCard, OpportunityFeed (post-hackathon)
│   │   ├── groups/              # GroupTree, SyllabusBuilder, MemberBranches (post-hackathon)
│   │   └── layout/              # NavBar, TabBar, ResponsiveShell, PageTransition
│   ├── hooks/
│   │   ├── useElo.js            # Elo scoring logic with recency weighting
│   │   ├── useSRS.js            # SM-2 algorithm
│   │   ├── useTree.jsx          # Tree state: expand, collapse, navigate, pre-generation
│   │   ├── useUserContext.jsx   # Profile, Elo, personality, knowledge states (localStorage)
│   │   ├── useAuth.js           # Firebase auth (anon → Google upgrade)
│   │   ├── useBranchState.js    # flowering/healthy/thirsty/wilting/dormant calculator
│   │   ├── useBadges.js         # Badge calculation from exploration stats
│   │   └── useSearch.js         # Search with autocomplete, history, fuzzy matching
│   ├── models/
│   │   ├── elo.js               # Elo rating calculations
│   │   ├── srs.js               # SM-2 variant (Got it / Kinda / Nope)
│   │   └── branchState.js       # State transition logic with time decay
│   ├── services/
│   │   ├── firebase.js          # Firebase config, Firestore helpers, Auth
│   │   ├── images.js            # Unsplash image search
│   │   └── storage.js           # Local persistence (IndexedDB fallback)
│   ├── styles/
│   │   ├── globals.css          # CSS variables, design tokens, base styles
│   │   ├── animations.css       # All keyframe animations
│   │   └── tree.css             # Tree rendering complex styles
│   ├── utils/
│   │   ├── constants.js         # Age groups, domains, colors, thresholds, badge criteria
│   │   ├── seedData.js          # Static seed nodes for top 3 levels of all major domains
│   │   ├── domainColors.js      # Domain → color mapping with saturation helpers
│   │   └── helpers.js           # debounce, fuzzy match, path hashing, parseAIJson
│   └── pages/
│       ├── Onboarding.jsx       # Age-specific onboarding flow router
│       ├── Explore.jsx          # Discovery + tree exploration
│       ├── Tracks.jsx           # Learning tracks + SRS review + tending
│       └── Profile.jsx          # Living tree, badges, journey, personality summary
├── package.json
├── vite.config.js
└── firebase.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **React 18+** (Vite) |
| Styling | **Tailwind CSS v3** + custom CSS |
| AI (hackathon) | **Puter.js** — free, no API key. Loaded `async` in index.html. KNOWN ISSUE: blocked on eduroam — use mobile hotspot for demo. |
| AI (production) | **Claude API** — swap `VITE_AI_BACKEND=claude`. Nothing else changes. |
| Database | **Firebase Firestore** (gracefully degraded if unconfigured) |
| Auth | **Firebase Auth** — anonymous → Google upgrade |
| Hosting | **Firebase Hosting** |
| Animations | **CSS Keyframes** + **Framer Motion** |
| SRS | **SM-2 variant** from Zhongwen Learn |

---

## Design System

Warm, alive, natural — not a dashboard. Rejects standard blue/purple ed-tech aesthetic.

### Color Palette

```css
:root {
  --spark-ember:        #FF6B35;
  --spark-warmth:       #FFA62B;
  --spark-flame:        #E63946;

  --bg-primary:         #FFFDF7;    /* NEVER pure white */
  --bg-secondary:       #FFF8ED;
  --bg-dark:            #1A1A2E;
  --bg-dark-card:       #16213E;

  --domain-math:        #2B59C3;
  --domain-science:     #2D936C;
  --domain-cs:          #5B5EA6;
  --domain-art:         #E07A5F;
  --domain-music:       #7B2D8B;
  --domain-history:     #8B6914;
  --domain-literature:  #C1666B;
  --domain-philosophy:  #4A6FA5;
  --domain-engineering: #D4A373;
  --domain-languages:   #3A7D44;
  --domain-cooking:     #D35400;
  --domain-sports:      #27AE60;
  --domain-dance:       #E74C8B;
  --domain-film:        #2C3E50;
  --domain-architecture:#8E6F47;

  --branch-flowering:   #FFD700;
  --branch-dormant:     #8B8B7A;
  /* healthy = domain color 100% sat | thirsty = 70% | wilting = 40% */

  --text-primary:       #2C2C2C;
  --text-secondary:     #6B6B5E;
  --text-muted:         #A3A393;
  --success:            #2D936C;
  --warning:            #FFA62B;
  --error:              #E63946;

  --tree-bg:            #F5F0E6;
  --ghost-node:         rgba(0,0,0,0.12);
  --research-frontier:  rgba(255,215,0,0.3);
}
```

### Typography

```css
--font-display: 'Fraunces', serif;
--font-body: 'Source Sans 3', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--font-display-kids: 'Baloo 2', cursive;
--font-body-kids: 'Nunito', sans-serif;
```

**NEVER use Inter, Roboto, Arial, or system-ui.**

### Spacing & Motion

- Base unit: `4px`. Card radius: `16px`. Card shadow: `0 2px 12px rgba(42,42,42,0.08)`. Min tap target: `48px`.
- **Organic motion:** `cubic-bezier(0.34, 1.56, 0.64, 1)` bouncy, `ease-out` settling. Stagger: 50–80ms.
- **AI loading = Ember thinking.** Never generic spinner.
- **`prefers-reduced-motion`:** Replace growth animations with opacity fades.

---

## The AI Layer

### Architecture — CRITICAL

**Every AI call routes through `AIService.call()`. NEVER call Puter.js or any AI API directly from a component.**

```
ai.service.js → getCacheKey → AICache.get → [hit: return] [miss: buildPrompt → complete → parse → AICache.set → return]
                                                                              ↑ retry once on failure → FALLBACKS[type]
```

Change `VITE_AI_BACKEND` from `'puter'` to `'claude'` to swap backends. Nothing else changes.

**Puter.js note:** Loaded `async` in index.html. `ai.service.js` polls `window.puter` with `waitForPuter()` before calling — app loads instantly, AI calls wait up to 10s for puter to initialize.

### User Context Object

```javascript
const buildUserContext = (user, currentNode = null) => ({
  ageGroup: user.ageGroup,        // 'little_explorer' | 'student' | 'college' | 'adult'
  name: user.name || 'Explorer',
  personality: user.personality,  // 'spark' | 'sage' | 'explorer' | 'professor'
  topInterests: user.topInterests,
  knowledgeStates: user.knowledgeStates,
  explorationStyle: user.explorationStyle,
  currentNode: currentNode?.label || null,
  currentPath: currentNode?.path || [],
  language: user.language || 'en'
});
```

### Personality System

| Personality | Voice | Best For |
|-------------|-------|----------|
| ✨ **Spark** (default) | Enthusiastic, warm, celebratory | Anyone wanting energy and delight |
| 🧘 **Sage** | Calm, Socratic, asks questions back | Self-directed learners |
| 🧭 **Explorer** | Adventurous, vivid metaphors | Narrative thinkers, transitioning kids |
| 📄 **Professor** | Precise, structured, no fluff | College/adult who finds enthusiasm patronizing |

Little Explorers: always `spark` + `LITTLE_EXPLORER_MOD` ("Speak in short sentences. Use words a 7-year-old knows. Be Ember — tiny magical spark, user's best friend."). No personality choice shown.

### The Six Prompt Types

#### TYPE 1: Discovery Cards
```
Target: <100ms | Cache: by age group | Fallback: local pre-written sets

"Generate 4 discovery card prompts for a {ageGroup} user. Top interests: {topInterests}.
Rules: concrete question/scenario (never abstract label), under 12 words, secretly represents
one domain from {domains} (never name it), language calibrated to {ageGroup}.
Return ONLY valid JSON: [{text, domain, imageQuery, emoji}]"
```

Same interest, different framing: Math → "Why do bees build hexagons?" (kids) vs "What is category theory?" (college).

#### TYPE 2: Node Children
```
Target: <100ms | 3-LAYER: seed → pre-generate → cache

"At node '{currentNode}'. Path: {currentPath}. Generate 4-6 children.
Mix depth/breadth. One surprising child. One beginner-accessible, one deeper than expected.
Tailor to {ageGroup} + {topInterests}.
Return ONLY valid JSON: [{label, description_one_sentence, difficulty, surprise_factor}]"
```

**User never sees a spinner on the tree.** Layer 1: static seed (instant) → Layer 2: pre-generate on landing → Layer 3: Firestore cache by path+age.

#### TYPE 3: Explainer
```
Target: <3s | Cache: by path+age+personality

"Explain '{currentNode}' to {name}.
Profile: age={ageGroup}, path={currentPath}, knowledge={knowledgeState}, interests={topInterests}

Structure:
1. Hook — surprising/counterintuitive (max 20 words)
2. Core idea — plain language, calibrated to {ageGroup} (2-3 sentences)
3. Vivid analogy connecting to {topInterests}
4. Example they can picture
5. Teaser — something deeper to explore

Under 200 words for kids/students, 300 for college/adult. Never jargon without explaining."
```

#### TYPE 4: Personality Summary
```
Target: <5s | Cache: until behavior changes

"Domains: {topDomains}, Style: {explorationStyle}, Avg depth: {avgDepth},
Surprising path: {surprisingPath}, Knowledge: {dominant}, Badge: {badge}
Under 60 words. Second person. Warm, specific. No generic phrases."
```

#### TYPE 5: Journey Narrative
```
Target: <5s | Cache: per period

"Narrative for {period}. Nodes: {nodeSequence}, Domains: {domainList}, Style: {style vs typical}
2-3 sentences. Second person. Warm, specific. One pattern observation.
Never 'great job' or 'keep it up'. Sound like a perceptive friend."
```

#### TYPE 6: Interactive Diagram
```
"Generate self-contained HTML/SVG interactive visualization of '{node}' for {ageGroup}.
Must be interactive (at minimum hoverable). No external dependencies. Max 200 lines.
Young users: colorful/simple. Advanced: technically accurate."
```

**Latency rule:** Anything the user didn't ask for = instant. Anything they requested = up to 3–5s.

### State Management

React Context + useReducer (not Redux). Three providers: `AuthProvider > UserContextProvider > TreeProvider`. All user state debounce-syncs to Firestore (2s). Tree cache: Firestore-first, IndexedDB offline fallback.

---

## Core Loop

1. **Age onboarding** (10s) → sets language, visual style, domain pool, AI depth
2. **"Do you have an idea?" branch** → yes / kinda / no idea
3. **Discovery phase** — card grid with Elo scoring (~5 rounds)
4. **Knowledge tree** — top interests as branching tree, infinitely expandable
5. **Explainer** — profile-aware AI explanation at any node
6. **Knowledge state tag** — one-tap self-assessment after explainer
7. **Tracks + SRS** — save consciously, spaced repetition for retention

---

## Onboarding Flows

**Cross-cutting:** No account to start (anonymous auth). Sign-up prompted at first save-to-Tracks. "Rediscover your interests" available in Settings.

### The "Do You Have an Idea?" Branch

| Answer | Behavior |
|--------|----------|
| **"Yes, I have an idea"** | Text input → jump to that node in tree. Elo bypassed; profile seeded from input. |
| **"Kinda, show me options"** | Broad category cards → discovery within domain. |
| **"No idea, just exploring"** | Full random cross-domain discovery. |

### By Age Group

**Little Explorer (5–10):** Ember-led. Black screen → glowing dot grows into Ember → TTS greeting → name input → first card pick → seed plants → tree opens. Full Ember personality throughout.

**Student (11–17):** Logo animation → "What brings you here?" → 3 quick questions (grade, interests, learning pref: see/do/read/hear) → personality selector (Spark pre-selected) → discovery.

**College/Adult:** "The app that figures out what you actually want to learn." → intent choice (explore freely / already know → text / what's popular) → personality selector (Professor more prominent) → discovery or direct tree.

---

## Discovery Phase & Elo Model

4 cards/round × ~5 rounds (~20 pairwise comparisons). Cards: vivid image + concrete prompt, never abstract labels, never domain labels. Round count configurable in `constants.js`.

**Elo persists across sessions.** Discovery lives in Explore tab permanently (not just onboarding). Two modes: "Similar" (high-Elo domains) vs "Surprise me" (low-Elo or unexplored). Binary toggle.

```javascript
// src/models/elo.js
const K = 32, BASE = 1500, RECENCY_BOOST = 1.2;
const expected = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
const update = (winner, losers, scores, round, totalRounds) => {
  const w = 1 + (RECENCY_BOOST - 1) * (round / totalRounds);
  for (const l of losers) {
    const e = expected(scores[winner], scores[l]);
    scores[winner] += K * w * (1 - e);
    scores[l]      += K * w * (0 - (1 - e));
  }
  return scores;
};
// All domains start at 1500. Saving to Tracks = +2 wins. Pruning = weak negative signal.
```

### "Add to My Tracks" — The One-Way Valve

**Explore and Learn are separate modes.** The "Add to my tracks" button is persistent on any expanded node, search result, or explainer card. Sends the node to Tracks tab. Prevents the app from feeling like homework.

---

## Knowledge Tree

### Node Model

```javascript
{
  id, label, description, domain, parentId, path: [],
  children: [], depth, difficulty, surpriseFactor,
  knowledgeState, mode: 'exploring'|'mastering',
  branchState: 'flowering'|'healthy'|'thirsty'|'wilting'|'dormant',
  srsData: { interval, easeFactor, nextReview, history } | null,
  timestamp, lastTended, explainerCache,
  saved: boolean, pruned: boolean, isGhost: boolean,
  connections: []
}
```

### Growth Animation Sequence
1. Branch extends from parent (200ms ease-out)
2. Node circle fades in (150ms)
3. Domain color fills outward (100ms)
4. Pulse ripple on parent (300ms)
5. If parent thirsty → golden sunlight shimmer up to root (400ms)

**First tree moment is sacred.** Seed → sprout → sapling animation. Ember watches proudly. Emotional peak of onboarding.

---

## The Explainer

"✨ Explain this to me" triggers Prompt Type 3. Structure always: **hook → core → analogy → example → teaser.** Knowledge state tag appears AFTER reading — never before.

---

## Knowledge State Tagging & 2D User Model

**Older:** ✨ Totally new / 👂 Heard of it / 🌱 Know a little / ✅ Know this well
**Kids:** ✨ Never seen this! / 🤔 Sounds familiar / 👍 I know a bit! / 🌟 I know this one!

One tap, no confirmation, re-taggable. Displays as colored dot on saved nodes in Tracks.

**2D Model (Interest × Knowledge):**

| | Low Knowledge | High Knowledge |
|---|---|---|
| **High Interest** | Priority target — start from basics | Go deeper — skip foundations |
| **Low Interest** | Maybe poorly framed — try different example | Don't resurface — done |

**SRS seeding:** new → interval 1, heard_of → 1, know_little → 3, know_well → 14 or skip.

---

## Exploring vs Mastering

Toggle on any saved node: `🏔 Exploring ↔ 🎯 Mastering`. Default always Exploring. Little Explorers: no toggle.

**Exploring:** No flashcards/SRS/tests/reminders. Tending via Water/Sunlight/Connection only. Can achieve healthy branches. Cannot flower.

**Mastering:** Full suite unlocks. SRS activates. Can flower.

**Switching:** Exploring→Mastering: SRS seeds from knowledge tags. Mastering→Exploring: SRS pauses, history preserved, flowers retained but won't grow.

---

## The Mastering Suite

All modes from Zhongwen Learn, adapted for concepts (not vocabulary).

**Learn Mode:** Front = concept + path. Back = personalized explainer + notes. Must complete first pass before other modes unlock.

**Flashcards:** SRS-driven. SM-2 algorithm. Got it / Kinda / Nope. Surface-level nodes: simple cards. Deep nodes: richer cards with diagram + connected node + follow-up question.

**Match Game:** Concept names ↔ one-line descriptions. Cross-domain version: match concepts to fields across math/biology/music. Most game-like for young users, genuinely challenging for advanced.

**Test Mode:** AI-generated, fresh each time. Probes understanding not recall. MCQ + short answer. Age-calibrated difficulty (true/false for Little Explorer → synthesis across nodes for Research users). Results feed SRS.

**The Flowering Gate:** Branch flowers only in Mastering mode. Requirements: all nodes in Learn mode → SRS reviews consistent → Test above threshold → at least one Connection made. Bloom animation. Ember at full brightness. *"You actually know this now."*

---

## The Living Tree & Branch States

### Growth Stages

| Stage | Trigger |
|-------|---------|
| 🌱 Seed | Just joined |
| 🌿 Sapling | 20+ nodes, 2+ domains |
| 🌳 Growing | 100+ nodes, 5+ domains |
| 🌲 Rooted | 500+ nodes, tracks completed |
| ✨ Ancient | Long-term heavy use, badges, groups |

### Branch States

| State | Visual | Trigger |
|-------|--------|---------|
| 🌸 Flowering | Full color, warm glow, flowers at tip | Mastering gate met |
| 🌿 Healthy | Full domain color, saturated | Active tending, recent exploration |
| 🍂 Thirsty | 70% saturation, yellow-orange | SRS due + no activity 14 days |
| 🥀 Wilting | 40% color, thin | SRS overdue 14+ days / 30 days no interaction |
| 🪵 Dormant | Grey-brown, bare | 60+ days no interaction. Always revivable. |

Thresholds are configurable in `constants.js` — these defaults need playtesting.

---

## Tending Mechanics

**💧 Water (Active Recall):** SRS review → branch color increases + ripple up from roots. Performance maps directly to visual recovery — nail it → full color, struggle → partial.

**☀️ Sunlight (Going Deeper):** Explore child node → sunlight flows to parent automatically. Curiosity keeps branches alive without deliberate review.

**🌱 Connection (Linking Threads):** Connect two cross-domain nodes → both get growth pulse, tendril appears. Over time transforms tree from branching structure into a network — how knowledge actually works.

**Tending Session:** 5–10 cards max. No penalty for stopping partway. Ember: attentive → warm as branches recover → full glow if everything tended.

---

## Pruning & Dormancy

**Dormancy:** Permanent archaeological record. Always revivable — one SRS card → color begins returning.

**Pruning:** Long-press → confirm (friction intentional) → falling-leaves animation → archived → "Grow somewhere else instead?" Ember: *"Good call. Let's put that energy somewhere that matters."*

---

## Goals as Ghost Branches

Goal set → branch appears on tree, mostly bare. Ghost nodes show the path from current position to goal.

- **Exploring goal:** Ghost nodes outlined in domain color, translucent. Flag at tip in domain color.
- **Mastering goal:** Ghost nodes + small lock icons, unlock sequentially through Learn mode. Flag in **gold**.

As user explores goal-path nodes, ghosts solidify with color flooding in. Goal achieved when branch flowers (mastering) or all target nodes explored (exploring). Multiple simultaneous goals = multiple flagged branches visible at once.

---

## Universal Search

Persistent search bar on every screen. Curiosity search, not catalog search.

### 4-Layer Experience

1. **Instant Explainer** (always): 3–5 sentence explainer via Prompt Type 3. <3s.
2. **Knowledge State Tag** (one tap): Four options below explainer.
3. **Tree Entry Point** (one tap): "Go deeper →" opens tree at that node.
4. **Save Without Committing** (one tap): "Save for later" → lightweight Curious About list.

**Curiosity Log:** Every search logged. Highest-signal data — unprompted searches = pure curiosity. Feeds Elo, journey narrative.

**Technical:** Top 1,000 concepts pre-cached. Autocomplete after 2 chars. Fuzzy matching handles typos ("bioluminesence" → bioluminescence). Voice for Little Explorers (Web Speech API).

---

## Visual Content Strategy

**Every concept should be experienceable before it's explainable.**

| Type | Approach | Status |
|------|----------|--------|
| Static Images | Unsplash Source, AI generates search query from context | ✅ Built |
| AI Interactive Diagrams | Self-contained HTML/SVG via Prompt Type 6, sandboxed iframe | ✅ Built |
| Rich Embeds (Desmos, GeoGebra, PhET, 3Dmol, Visualgo) | Best-in-class tools per domain | Post-hackathon |

**Decision framework per node:** Rich embed exists? → use it. Math/computational + benefits from interactivity? → generate SVG/HTML. Static image adds value? → image search. Too abstract? → skip, trust the explainer.

---

## Profiles & Identity

**Living Tree:** Centerpiece. Grows with exploration. Never reset.

**Pinned Threads:** User-curated rabbit holes. Shows full drill-down path. Individually public/private. Public = shareable link that drops anyone at that node.

**"Currently Exploring":** Auto-populated from most recent active track.

**Badges:**

| Title | Criteria |
|-------|----------|
| The Cartographer | 10+ domains |
| The Spelunker | 7+ levels deep |
| The Polymath | 5+ unrelated tracks |
| The Rabbit | 3+ unrelated detours |
| The Architect | Longest branch |
| First Principles | Drills to foundations before saving |

**Personality Summary:** AI-generated (Prompt Type 4), ~60 words, specific, shareable.

**Domain Constellation:** Interest distribution across domains as constellation or bloom pattern — bigger where explored more. Complements the tree.

---

## Journey Timeline & Memory View

**Timeline Scrubber:** Horizontal scrubber below living tree. Drag backward → tree un-grows. Forward → re-grows with branch animation. Scrubber thumb = small Ember icon. Context nodes at 40% opacity; active period nodes at full opacity with pulsing Ember-orange glow.

**Five Period Views:** Day (node-by-node narrative) → Week (heatmap + curiosity streak) → Month (domain delta + deepest rabbit hole) → Year (timelapse + "Year in Spark" AI paragraph, screenshot-worthy) → Lifetime (complete tree + origin story callout + stats).

**Language:** "sparks" not "nodes", "worlds" not "domains", "curiosity" not "activity." Identity-affirming throughout.

---

## Retention Philosophy & Hooks

| Duolingo | Spark |
|----------|-------|
| Don't break your streak | Keep your tree alive |
| Lose gems | Branch gets thirsty — water when ready |
| Leaderboard | Your tree is yours alone |
| Completion % | Branch flowering |
| Progress loss | Dormancy — always revivable |

**Share This Thread:** `spark.app/thread/{encodedPath}` drops anyone at that exact node. Contagious curiosity, not competition.

**Two-month absence:** Tree shown dormant and grey-brown. Ember sitting at base, looking up. *"Your tree missed you. Want to wake it up?"* No accusation. No guilt.

---

## Ember — The Mascot

Sentient spark, oversized Pixar-style eyes, warm, glowing. Pure SVG + CSS. 10 mood states: excited, surprised, thinking, proud, curious, idle, celebrating, encouraging, attentive, sheepish.

| Age Group | Behavior |
|-----------|----------|
| Little Explorer | Full guide. Speaks (TTS). Bounces. Reacts to every pick with emotion. |
| Student | Corner glow. Subtle reactions (pulse, color shift). Never speaks. |
| College/Adult | Tiny icon. Appears at key moments only: first discovery, first badge, errors. |

**Key moments:** Each card pick (Little Explorer: "Ooh interesting choice!!") · Explainer loading (concentrating) · Tending session end (warm if branches recovered, full glow if all tended) · Pruning (calm, supportive) · Error (sheepish, "trying again...") · Two-month absence (sitting quietly at base) · Dormant branch hover ("This one's been resting — want to wake it up?")

---

## Firebase Schema

```
users/{uid}/
  profile: { name, ageGroup, personality, createdAt, learningPref }
  eloScores: { [domain]: 1500+ }
  knowledgeStates: { [pathHash]: state }
  explorationStyle, badges, stats: { nodesExplored, domains, deepest, streak, firstSpark, treeStage }

tracks/{uid}/{trackId}: { nodeId, path, mode, branchState, srsData, connections, timestamps }

nodes/{pathHash}/{ageGroup}/: { children, explainers: {personality: text}, imageQueries }

searches/{uid}/{searchId}: { term, knowledgeState, timestamp, wentDeeper, savedForLater }

pruned/{uid}/{nodeId}: { originalPath, knowledgeState, srsHistory, prunedAt }

groups/{groupId}/: { name, leader, members, rootNode, syllabus, tree }
```

---

## Seed Data

Static top-3-level nodes for all major domains. Zero latency for first ~3 taps. See `src/utils/seedData.js` for the full implementation.

Structure: `{ math: { children: { algebra: { children: { linear_algebra, abstract_algebra, ... } } } } }`

Domains covered: math, cs, science, art, music, history, philosophy, engineering, languages, literature, cooking, dance, film, architecture.

---

## Error Handling & Fallbacks

| Prompt | Fallback |
|--------|----------|
| Discovery cards | 10 pre-written sets locally |
| Children (top 3 levels) | Static seed, always instant |
| Children (deeper) | Ember thinking → "still figuring this out" |
| Explainer | Cached from another session → Ember sheepish + retry |
| All | 8s timeout → silent retry → friendly error |

Wrap every AI-dependent component: `<EmberErrorBoundary fallback={<EmberSheepish message="Still figuring this one out..." />}>`.

**Puter.js on eduroam:** Blocked on some university networks. Workaround: mobile hotspot. `ai.service.js` polls `window.puter` via `waitForPuter()` — app loads instantly regardless.

---

## Hackathon Demo Strategy

**Scope:** Full loop for college students. All-ages vision in pitch.

### Must Ship (in order)
1. **Universal search** — highest demo impact, lowest effort
2. **Onboarding** — college flow, 3 screens max
3. **Discovery cards** — 4×5 rounds + Elo
4. **Knowledge tree** — expandable, 3+ levels
5. **Explainer** — profile-aware, structured
6. **Knowledge tags** — one-tap after explainer
7. **Save to tracks** — basic save + view

### Nice to Have
Interactive diagrams, images, badges, branch states, Ember moods.

### Demo Script (2 min)
Onboarding → discovery → tree → expand 3 deep → explainer → tag → search one word → instant result → "this grows for a lifetime."

### Why Tree Animation Matters for Demo
Watching a branch visibly grow in real time is the most memorable visual moment for a judge seeing 20 projects. Invest here.

---

## Post-Hackathon Roadmap

**Phase 1 (Weeks 1–2):** All 4 onboarding flows, Ember full moods, tree branch animations, images per node, interactive diagram polish, branching "do you have an idea?" question.

**Phase 2 (Months 1–2):** Full mastering suite (Learn Mode, Match Game, Test Mode, Flowering gate), all branch states, tending session, Exploring/Mastering toggle, profile page, journey timeline, pruning mechanics.

**Phase 3 (Months 2–3):** Social (share thread links, social proof in search, follow threads, curiosity streaks, basic groups).

**Phase 4 (Months 3–6):** Research Frontier, College Major Exploration Mode, Opportunities tab, Claude API migration, rich domain embeds (Desmos, GeoGebra, PhET), Year in Spark, ghost branches for goals.

**Phase 5 (Month 6+):** Visual routing engine, full group trees, school integration, career transition signals, domain constellation/knowledge atlas, timeline scrubber, i18n, native mobile.

---

## Philosophical Guardrails

1. **More curious or more anxious?** Only "more curious."
2. **Curiosity free, mastery conscious.** Exploring ≠ lesser.
3. **Tree is honest.** No fake progress.
4. **No endpoint.** Age 7 to 70.
5. **Experienceable before explainable.**
6. **Inconsistency is a feature.**
7. **Latency kills curiosity.** >1s for unasked content = broken.
8. **Identity > metrics.**
9. **Care > anxiety.**
10. **Explore and Learn: separate modes, one-way valve.**
11. **Every recommendation has a specific reason.**

---

## Accessibility

- All interactive elements keyboard-navigable
- Color is **never** the sole indicator — shapes, patterns, labels supplement it
- Tree nodes: `aria-labels` with full path context (e.g., "Math, Algebra, Linear Algebra — Healthy")
- Little Explorer: min 48px tap targets, voice input via Web Speech API
- `prefers-reduced-motion`: replace all growth animations with opacity fades
- WCAG AA contrast minimum for all text
- All search API images include AI-generated alt text

---

## Deployment & Infrastructure

```bash
npm run build
firebase deploy --only hosting
```

Firebase keys in `.env`. Project: `spark-curiosity-112`. PWA installable from any browser.

**Claude API migration (post-hackathon):** Change `VITE_AI_BACKEND=claude` in `.env`. Enables streaming (explainers appear word by word), system prompt caching (cuts cost), model routing (Haiku for node children, Sonnet for explainers).

---

## Code Style & Conventions

- Functional components only, custom hooks for reusable logic
- Named exports (default only for pages)
- PascalCase components, camelCase utils
- AI prompts in dedicated files, **NEVER inline**
- JSON from AI: strip markdown fences, validate shape, fallback if malformed (`parseAIJson` in helpers.js)
- Fallbacks for everything AI-dependent
- No user-facing abbreviations

---

## Performance

| Metric | Target |
|--------|--------|
| FCP | <1.5s |
| TTI | <3s |
| Explainer | <3s |
| Tree expansion | <100ms |
| Discovery cards | <100ms |
| Bundle | <500KB |
| Lighthouse PWA | >90 |

---

## The North Star

A first-generation college student with no research mentor follows a thread from "I think I like math" to a map of open problems in algebraic topology with a reading path to understand them.

A child follows curiosity about patterns → teenager finds a competition → college student finds a lab → adult finds the company they were always going to work for, before they knew it existed.

**The same tree. The same Ember. A whole life navigated. Every line of code serves that vision.**

---

## Open Questions & Design Decisions

| Question | Current Thinking | Status |
|----------|-----------------|--------|
| Discovery rounds before tree appears? | ~5 rounds, needs playtesting | **Default 5, make configurable in constants.js** |
| Puter.js vs Claude API for hackathon? | Puter.js (free, no key, blocked on eduroam) | **Puter.js with async load + hotspot workaround** |
| Interactive visuals: generate via AI or embed tools? | Both — AI for most, embeds for specific domains | **See Visual Content Strategy** |
| Does Elo update when user saves tracks? | Yes — tracks are strong positive signal | **Yes, implemented** |
| "Similar vs. different" toggle — binary or slider? | Binary | **Binary, implemented** |
| Branch state timing thresholds? | Healthy→Thirsty: 3 days SRS overdue / 14 days no explore. Thirsty→Wilting: 14 days / 30 days. Wilting→Dormant: 60 days. | **Use these defaults, make configurable, tune post-launch** |
| App name finalized? | Spark | **Final** |

---

## Contributing & Team Guidance

### For Claude Code Specifically
- **Always check this file first** when implementing a feature
- **Follow hackathon priority order** if building during the hackathon weekend
- **Use exact prompt templates** from the AI Layer section — don't improvise prompts
- **Match the design system exactly** — warm off-white backgrounds, Fraunces display font, 16px border radius
- **Pre-generate aggressively** — user should never see a spinner on the tree
- **Test with multiple age groups** — an explainer that works for college students may be terrible for a 7-year-old
- **When in doubt, choose the option that preserves curiosity over the one that optimizes engagement metrics**

### PR Checklist
- [ ] Feature passes philosophical guardrails (curious > anxious)
- [ ] AI calls go through `AIService.call()`, never direct
- [ ] Fallback exists for every AI-dependent path
- [ ] Works on mobile (48px min tap targets)
- [ ] No generic spinner — Ember thinking state used for loading
- [ ] Matches design system (colors, fonts, spacing, radius)
- [ ] Keyboard navigable, aria-labels, color not sole indicator

---

*Maintainer: Lillian Wang (lillianwang112) | github.com/lillianwang112/spark | April 2026*
