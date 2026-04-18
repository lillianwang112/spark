import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserContextProvider, useUserContext } from './hooks/useUserContext.jsx';
import { TreeProvider } from './hooks/useTree.jsx';
import useStreak from './hooks/useStreak.js';
import NavBar from './components/layout/NavBar.jsx';
import Topbar from './components/layout/Topbar.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Explore from './pages/Explore.jsx';
import Tracks from './pages/Tracks.jsx';
import Profile from './pages/Profile.jsx';
import Opportunities from './pages/Opportunities.jsx';
import Groups from './pages/Groups.jsx';
import GlobalSearch from './components/search/GlobalSearch.jsx';
import Loader from './components/common/Loader.jsx';
import { OPEN_DEEP_DIVE_EVENT } from './utils/navigation.js';

import './styles/globals.css';
import './styles/animations.css';

void motion;

const PAGE_META = {
  explore:       { label: 'Curiosity Engine',      mood: 'curious' },
  tracks:        { label: 'Care · Tend · Master',  mood: 'attentive' },
  groups:        { label: 'Learn Together',         mood: 'encouraging' },
  profile:       { label: 'Your living portrait',  mood: 'proud' },
  opportunities: { label: 'Real World',             mood: 'proud' },
};

function AppShell() {
  const user = useUserContext();
  const { isLoading, onboardingComplete } = user;
  const streakState = useStreak();
  const { streak, sparksToday, dailyGoal, pingStreak } = streakState;

  const [activeTab, setActiveTab] = useState('explore');
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState(null);
  const [pendingDeepDive, setPendingDeepDive] = useState(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [pendingGlobalSearch, setPendingGlobalSearch] = useState(null);

  const userContextObj = useMemo(() => ({
    ageGroup: user.ageGroup,
    personality: user.personality,
    topInterests: Object.entries(user.eloScores || {}).sort(([, a], [, b]) => b - a).slice(0, 3).map(([d]) => d),
    name: user.name,
  }), [user.ageGroup, user.personality, user.eloScores, user.name]);

  // When "Rediscover interests" resets onboardingComplete, re-show onboarding
  useEffect(() => {
    if (!onboardingComplete && onboardingDone) {
      setOnboardingDone(false);
      setOnboardingResult(null);
    }
  }, [onboardingComplete, onboardingDone]);

  const threadSearch = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const thread = params.get('thread');
    return thread ? decodeURIComponent(thread) : null;
  }, []);

  const exploreInitialSearch = useMemo(() => {
    if (threadSearch) {
      const parts = threadSearch.split('/').filter(Boolean);
      return parts[parts.length - 1]?.replace(/-/g, ' ') || null;
    }
    if (onboardingResult?.intent === 'idea' || onboardingResult?.intent === 'major') return onboardingResult.searchSeed;
    return null;
  }, [threadSearch, onboardingResult]);

  useEffect(() => {
    const handleOpenDeepDive = (event) => {
      setPendingDeepDive(event.detail || null);
      setActiveTab('explore');
    };

    window.addEventListener(OPEN_DEEP_DIVE_EVENT, handleOpenDeepDive);
    return () => window.removeEventListener(OPEN_DEEP_DIVE_EVENT, handleOpenDeepDive);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader message="Lighting the spark..." />
      </div>
    );
  }

  const shouldOnboard = !onboardingComplete && !onboardingDone;

  if (shouldOnboard) {
    return (
      <Onboarding
        onComplete={(result) => {
          pingStreak();
          setOnboardingResult(result);
          setOnboardingDone(true);
        }}
      />
    );
  }

  const pages = {
    explore: (
      <Explore
        initialSearch={exploreInitialSearch}
        onboardingIntent={onboardingResult?.intent || null}
        pendingDeepDive={pendingDeepDive}
        onConsumePendingDeepDive={() => setPendingDeepDive(null)}
        pendingGlobalSearch={pendingGlobalSearch}
        onConsumePendingGlobalSearch={() => setPendingGlobalSearch(null)}
        onSpark={pingStreak}
        streakState={streakState}
      />
    ),
    tracks:       <Tracks onSpark={pingStreak} />,
    groups:       <Groups />,
    opportunities: <Opportunities userContextObj={userContextObj} />,
    profile:      <Profile streakState={streakState} />,
  };

  const meta = PAGE_META[activeTab] || PAGE_META.explore;

  return (
    <div className="spark-shell px-2 pb-0 pt-2 sm:px-5 sm:pt-4">
      {/* Ambient background orbs — vivid, animated */}
      <div className="spark-orb h-40 w-40 sm:h-64 sm:w-64 bg-[rgba(255,107,53,0.34)] left-2 top-4 sm:left-6 sm:top-8" />
      <div className="spark-orb h-44 w-44 sm:h-72 sm:w-72 bg-[rgba(74,111,165,0.26)] right-2 top-32 sm:right-4 sm:top-44" />
      <div className="spark-orb h-36 w-36 sm:h-56 sm:w-56 bg-[rgba(255,209,102,0.32)] left-[30%] bottom-16 sm:left-[38%] sm:bottom-24" />
      <div className="spark-orb h-28 w-28 sm:h-44 sm:w-44 bg-[rgba(123,45,139,0.18)] right-[20%] top-[45%]" />

      <div
        className="spark-surface relative flex flex-col overflow-hidden rounded-[32px]"
        style={{ minHeight: 'calc(100dvh - 24px)' }}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <Topbar
          userName={user.name}
          ageGroup={user.ageGroup}
          streak={streak}
          sparksToday={sparksToday}
          dailyGoal={dailyGoal}
          emberMood={meta.mood}
          label={meta.label}
        />

        <main
          id="main-content"
          className="flex-1 overflow-hidden relative"
          style={{ paddingBottom: 100 }}
          tabIndex={-1}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
              style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}
            >
              {pages[activeTab]}
            </motion.div>
          </AnimatePresence>
        </main>

        <NavBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSearch={() => setGlobalSearchOpen(true)}
        />

        <GlobalSearch
          open={globalSearchOpen}
          onClose={() => setGlobalSearchOpen(false)}
          userContextObj={userContextObj}
          onGoDeeper={(q) => {
            setPendingGlobalSearch(q);
            setActiveTab('explore');
            setGlobalSearchOpen(false);
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <UserContextProvider>
      <TreeProvider>
        <AppShell />
      </TreeProvider>
    </UserContextProvider>
  );
}
