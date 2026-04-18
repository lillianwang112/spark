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
import Loader from './components/common/Loader.jsx';
import { OPEN_DEEP_DIVE_EVENT } from './utils/navigation.js';

import './styles/globals.css';
import './styles/animations.css';

void motion;

const PAGE_META = {
  explore: { label: 'Curiosity Engine', mood: 'curious' },
  tracks:  { label: 'Care · Tend · Master', mood: 'attentive' },
  profile: { label: 'Your living portrait', mood: 'proud' },
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
    if (onboardingResult?.intent === 'idea') return onboardingResult.searchSeed;
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
        onSpark={pingStreak}
        streakState={streakState}
      />
    ),
    tracks:  <Tracks onSpark={pingStreak} />,
    profile: <Profile streakState={streakState} />,
  };

  const meta = PAGE_META[activeTab] || PAGE_META.explore;

  return (
    <div className="spark-shell px-2 pb-0 pt-2 sm:px-5 sm:pt-4">
      {/* Ambient background orbs */}
      <div className="spark-orb hidden sm:block h-48 w-48 bg-[rgba(255,107,53,0.24)] left-6 top-8" />
      <div className="spark-orb hidden sm:block h-56 w-56 bg-[rgba(74,111,165,0.18)] right-4 top-40" />
      <div className="spark-orb hidden sm:block h-40 w-40 bg-[rgba(255,209,102,0.22)] left-[40%] bottom-20" />

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

        <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
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
