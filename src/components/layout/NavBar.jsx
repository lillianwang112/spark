import { useUserContext } from '../../hooks/useUserContext.jsx';
import { getDueCards } from '../../models/srs.js';

const TABS = [
  { id: 'explore',  label: 'Explore',  icon: '🌳' },
  { id: 'tracks',   label: 'Tracks',   icon: '📌' },
  { id: 'profile',  label: 'Profile',  icon: '✨' },
];

const KIDS_TABS = [
  { id: 'explore',  label: 'Discover', icon: '🌳' },
  { id: 'tracks',   label: 'Saved',    icon: '⭐' },
  { id: 'profile',  label: 'Me',       icon: '✨' },
];

export default function NavBar({ activeTab, onTabChange }) {
  const user = useUserContext();
  const isKids = user.ageGroup === 'little_explorer';
  const tabs = isKids ? KIDS_TABS : TABS;

  // Due count for Tracks badge
  const masteringTracks = (user.tracks || []).filter((t) => t.mode === 'mastering');
  const dueCount = getDueCards(masteringTracks).length;

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2 px-3 pb-3 sm:px-5 sm:pb-5"
      style={{ maxWidth: 'calc(var(--app-shell-width) + 2.5rem)' }}
      aria-label="Main navigation"
    >
      <div
        className="mx-auto flex items-center justify-around rounded-[22px] border border-[rgba(255,255,255,0.68)] bg-[rgba(255,253,247,0.92)] px-2 py-1 shadow-[0_16px_40px_rgba(42,42,42,0.12)] backdrop-blur-xl"
        style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'tracks' && dueCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-[16px] min-w-[64px]
                transition-all duration-200 focus-visible:outline-2 focus-visible:outline-spark-ember
                ${isActive ? 'bg-[rgba(255,107,53,0.1)] text-spark-ember shadow-[inset_0_0_0_1px_rgba(255,107,53,0.08)]' : 'text-text-muted hover:bg-[rgba(42,42,42,0.04)] hover:text-text-secondary'}
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${tab.label}${showBadge ? ` (${dueCount} due)` : ''}`}
            >
              <div className="relative">
                <span className={`text-xl leading-none transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-spark-ember text-white text-[9px] font-bold flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {dueCount > 9 ? '9+' : dueCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-body font-medium ${isKids ? 'text-xs' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-1 w-8 h-0.5 bg-spark-ember rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
