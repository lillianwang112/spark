import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UserContextProvider, useUserContext } from './hooks/useUserContext.jsx';
import { TreeProvider } from './hooks/useTree.jsx';
import NavBar from './components/layout/NavBar.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Explore from './pages/Explore.jsx';
import Tracks from './pages/Tracks.jsx';
import Profile from './pages/Profile.jsx';
import Loader from './components/common/Loader.jsx';
import Ember from './components/ember/Ember.jsx';
import { OPEN_DEEP_DIVE_EVENT } from './utils/navigation.js';

import './styles/globals.css';
import './styles/animations.css';

// Inner shell — consumes UserContext
function AppShell() {
  const { isLoading, onboardingComplete } = useUserContext();
  const [activeTab, setActiveTab] = useState('explore');
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState(null);
  const [pendingDeepDive, setPendingDeepDive] = useState(null);

  const shellGuide = useMemo(() => {
    if (activeTab === 'tracks') {
      return {
        mood: 'attentive',
        label: 'Tree Care',
        copy: 'A quick review or a small revive keeps the canopy feeling alive.',
      };
    }
    if (activeTab === 'profile') {
      return {
        mood: 'proud',
        label: 'Identity',
        copy: 'This should feel like your map of obsessions, not a settings page.',
      };
    }
    return {
      mood: pendingDeepDive ? 'excited' : 'curious',
      label: pendingDeepDive ? 'Rabbit Hole Open' : 'Curiosity Engine',
      copy: pendingDeepDive
        ? `Dropping you back into ${pendingDeepDive.label}.`
        : 'Follow sparks that feel weirdly magnetic and let the tree branch on its own.',
    };
  }, [activeTab, pendingDeepDive]);

  // Handle ?thread= in URL (shared thread links)
  const threadSearch = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const thread = params.get('thread');
    return thread ? decodeURIComponent(thread) : null;
  }, []);

  // Compute initial search — must be declared before any conditional returns (Rules of Hooks)
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
        pendingDeepDive={pendingDeepDive}
        onConsumePendingDeepDive={() => setPendingDeepDive(null)}
      />
    ),
    tracks:  <Tracks />,
    profile: <Profile />,
  };

  return (
    <div className="spark-shell px-3 pb-0 pt-3 sm:px-5 sm:pt-5">
      <div className="spark-orb hidden sm:block h-40 w-40 bg-[rgba(255,107,53,0.22)] left-8 top-8" />
      <div className="spark-orb hidden sm:block h-48 w-48 bg-[rgba(74,111,165,0.16)] right-6 top-40" />

      <div
        className="spark-surface flex flex-col overflow-hidden rounded-[28px]"
        style={{ minHeight: 'calc(100dvh - 24px)', position: 'relative' }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-48 bg-[radial-gradient(circle_at_top,rgba(255,166,43,0.18),transparent_70%)]" />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <main
          id="main-content"
          className="flex-1 overflow-hidden relative"
          style={{ paddingBottom: 88 }}
          tabIndex={-1}
        >
          <AnimatePresence mode="wait" initial={false}>
            <div
              key={activeTab}
              style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}
            >
              {pages[activeTab]}
            </div>
          </AnimatePresence>
        </main>

        <div className="pointer-events-none absolute right-4 top-4 z-20 hidden max-w-[280px] rounded-[24px] border border-[rgba(255,255,255,0.7)] bg-[rgba(255,250,242,0.82)] px-4 py-3 shadow-[0_18px_50px_rgba(72,49,10,0.12)] backdrop-blur-xl lg:flex lg:items-start lg:gap-3">
          <Ember mood={shellGuide.mood} size="sm" glowIntensity={0.8} />
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
              {shellGuide.label}
            </p>
            <p className="mt-1 font-body text-sm leading-relaxed text-text-secondary">
              {shellGuide.copy}
            </p>
          </div>
        </div>

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
