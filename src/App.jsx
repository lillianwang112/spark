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
import { loadDemoProfile, getActiveDemoKey } from './data/demoProfile.js';

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

const DEMO_META = {
  alex:  { name: 'Alex Chen',     emoji: '🧮', label: 'College · STEM',     color: '#4A6FA5' },
  maya:  { name: 'Maya Rivera',   emoji: '🎨', label: 'High School · Arts', color: '#E07A5F' },
  james: { name: 'Dr. James Park',emoji: '📚', label: 'Adult · Humanities', color: '#2D936C' },
};
const DEMO_ORDER = ['alex', 'maya', 'james'];

// ── Floating demo-mode switcher ───────────────────────────────────────────────
// Always visible — works on mobile (tap) and desktop (Shift+1/2/3)
// Hidden activation: tap the 🔥 button 3 times fast to reveal if not in demo mode
function DemoSwitcher({ activeKey }) {
  const [open, setOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [revealed, setRevealed] = useState(!!activeKey);
  const meta = activeKey ? DEMO_META[activeKey] : null;

  function switchTo(key) {
    loadDemoProfile(key);
    window.location.href = `${window.location.pathname}?demo=${key}`;
  }

  // Triple-tap to reveal when not in demo mode
  function handleTriggerTap() {
    if (revealed) { setOpen(v => !v); return; }
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 3) { setRevealed(true); setOpen(true); setTapCount(0); }
    else { setTimeout(() => setTapCount(0), 800); }
  }

  // Keyboard: Shift+1/2/3 on desktop
  useEffect(() => {
    const handler = (e) => {
      if (!e.shiftKey) return;
      if (e.code === 'Digit1') switchTo('alex');
      if (e.code === 'Digit2') switchTo('maya');
      if (e.code === 'Digit3') switchTo('james');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest('[data-demo-switcher]')) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const btnColor = meta?.color || '#FF6B35';

  return (
    <div data-demo-switcher="" className="fixed bottom-28 right-3 z-[200] sm:bottom-32 sm:right-5 flex flex-col items-end">
      <AnimatePresence>
        {open && revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="mb-2 rounded-[22px] p-2 flex flex-col gap-1"
            style={{
              background: 'rgba(255,252,246,0.97)',
              border: '1px solid rgba(255,170,120,0.35)',
              boxShadow: '0 20px 48px rgba(72,49,10,0.22), 0 0 0 1px rgba(255,170,120,0.18)',
              backdropFilter: 'blur(24px)',
              minWidth: 186,
            }}
          >
            <p className="text-[9px] font-mono uppercase tracking-[0.24em] px-2.5 pt-1.5 pb-1" style={{ color: 'rgba(145,95,58,0.6)' }}>
              👁 Demo Profiles
            </p>
            {DEMO_ORDER.map((key, i) => {
              const m = DEMO_META[key];
              const isActive = key === activeKey;
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { setOpen(false); switchTo(key); }}
                  className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left w-full active:scale-95 transition-transform"
                  style={{
                    background: isActive ? `${m.color}22` : 'rgba(72,49,10,0.04)',
                    border: isActive ? `1.5px solid ${m.color}55` : '1.5px solid transparent',
                    boxShadow: isActive ? `0 4px 16px ${m.color}30` : 'none',
                  }}
                >
                  <span className="text-xl leading-none">{m.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold leading-tight" style={{ color: isActive ? '#1A1A1A' : 'rgba(60,40,10,0.9)' }}>
                      {m.name}
                    </p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: isActive ? m.color : 'rgba(145,95,58,0.55)' }}>
                      {m.label}{isActive ? ' ✓' : ''}
                    </p>
                  </div>
                  {isActive && (
                    <span className="ml-auto text-[10px] font-bold" style={{ color: m.color }}>ON</span>
                  )}
                </motion.button>
              );
            })}
            <p className="text-[8px] font-mono text-center pb-1 pt-0.5" style={{ color: 'rgba(145,95,58,0.35)' }}>
              desktop: Shift+1/2/3
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onPointerDown={handleTriggerTap}
        className="flex items-center gap-1.5 rounded-full shadow-lg select-none"
        style={{
          padding: revealed ? '8px 14px' : '9px 12px',
          background: revealed
            ? 'rgba(255,252,246,0.96)'
            : 'rgba(255,252,246,0.55)',
          border: `1.5px solid ${btnColor}${revealed ? '55' : '25'}`,
          boxShadow: revealed
            ? `0 8px 28px rgba(72,49,10,0.18), 0 0 0 1px ${btnColor}20`
            : `0 4px 12px rgba(72,49,10,0.08)`,
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
        }}
        aria-label="Switch demo profile"
      >
        <span className="text-base leading-none">{meta?.emoji || '🔥'}</span>
        {revealed && (
          <>
            <span className="text-[11px] font-mono font-bold" style={{ color: btnColor }}>
              {meta ? meta.name.split(' ')[0] : 'Demo'}
            </span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.18 }}
              className="text-[9px] opacity-40"
            >▲</motion.span>
          </>
        )}
      </motion.button>
    </div>
  );
}

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
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('spark_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Demo mode: read ?demo= param once on mount and auto-load
  const demoKey = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') || null;
  }, []);

  useEffect(() => {
    if (demoKey && ['alex', 'maya', 'james'].includes(demoKey)) {
      const stored = localStorage.getItem('spark_demo_key');
      if (stored !== demoKey) {
        loadDemoProfile(demoKey);
        window.location.reload();
      }
    }
  }, [demoKey]);

  const activeDemoKey = demoKey || getActiveDemoKey();

  const userContextObj = useMemo(() => ({
    ageGroup: user.ageGroup,
    personality: user.personality,
    topInterests: Object.entries(user.eloScores || {}).sort(([, a], [, b]) => b - a).slice(0, 3).map(([d]) => d),
    name: user.name,
  }), [user.ageGroup, user.personality, user.eloScores, user.name]);

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

  useEffect(() => {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    try { localStorage.setItem('spark_theme', theme); } catch { /* ignore */ }
  }, [theme]);

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
        theme={theme}
      />
    ),
    tracks:       <Tracks onSpark={pingStreak} />,
    groups:       <Groups />,
    opportunities: <Opportunities userContextObj={userContextObj} />,
    profile:      <Profile streakState={streakState} />,
  };

  const meta = PAGE_META[activeTab] || PAGE_META.explore;

  return (
    <div className={`spark-shell px-2 pb-0 pt-2 sm:px-5 sm:pt-4 ${theme === 'dark' ? 'theme-dark' : ''}`}>
      {/* Ambient background orbs */}
      <div className="spark-orb h-40 w-40 sm:h-64 sm:w-64 bg-[rgba(255,107,53,0.34)] left-2 top-4 sm:left-6 sm:top-8" />
      <div className="spark-orb h-44 w-44 sm:h-72 sm:w-72 bg-[rgba(74,111,165,0.26)] right-2 top-32 sm:right-4 sm:top-44" />
      <div className="spark-orb h-36 w-36 sm:h-56 sm:w-56 bg-[rgba(255,209,102,0.32)] left-[30%] bottom-16 sm:left-[38%] sm:bottom-24" />
      <div className="spark-orb h-28 w-28 sm:h-44 sm:w-44 bg-[rgba(123,45,139,0.18)] right-[20%] top-[45%]" />

      <div
        className="spark-surface relative flex flex-col overflow-hidden rounded-[32px]"
        style={{ minHeight: 'calc(100dvh - 24px)' }}
      >
        <a href="#main-content" className="skip-link">Skip to main content</a>

        <Topbar
          userName={user.name}
          ageGroup={user.ageGroup}
          streak={streak}
          sparksToday={sparksToday}
          dailyGoal={dailyGoal}
          emberMood={meta.mood}
          label={meta.label}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
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
          theme={theme}
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

      {/* Demo switcher — always mounted; triple-tap 🔥 to reveal when not in demo mode */}
      <DemoSwitcher activeKey={activeDemoKey} />
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
