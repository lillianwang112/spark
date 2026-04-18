import { motion } from 'framer-motion';
import { useUserContext } from '../../hooks/useUserContext.jsx';
import { getDueCards } from '../../models/srs.js';
void motion;

const TABS = [
  { id: 'explore',  label: 'Explore',  icon: ExploreIcon, kidsLabel: 'Discover' },
  { id: 'tracks',   label: 'Tracks',   icon: TracksIcon,  kidsLabel: 'Saved' },
  { id: 'profile',  label: 'Profile',  icon: ProfileIcon, kidsLabel: 'Me' },
];

function ExploreIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
      <path
        d="M12 3c3.5 4 5 7 5 10a5 5 0 1 1-10 0c0-3 1.5-6 5-10Z"
        fill={active ? 'url(#explore-fill)' : 'none'}
        stroke={active ? '#FF6B35' : 'currentColor'}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 9c1.6 2 2.4 3.6 2.4 5.2a2.4 2.4 0 0 1-4.8 0c0-1.6.8-3.2 2.4-5.2Z"
        fill={active ? '#FFD166' : 'rgba(42,42,42,0.15)'}
        opacity={active ? 1 : 0.7}
      />
      <defs>
        <linearGradient id="explore-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8A5A" />
          <stop offset="100%" stopColor="#E63946" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TracksIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
      <path
        d="M6 4h12l-2 7h2l-6 9-6-9h2L6 4Z"
        fill={active ? 'url(#tracks-fill)' : 'none'}
        stroke={active ? '#2D936C' : 'currentColor'}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="tracks-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BCFA0" />
          <stop offset="100%" stopColor="#2D936C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
      <circle cx="12" cy="12" r="9" fill={active ? 'url(#profile-fill)' : 'none'} stroke={active ? '#FFA62B' : 'currentColor'} strokeWidth="1.7" />
      <path
        d="M12 6l1.3 3.3L17 10l-3.3 1.3L12 15l-1.3-3.7L7 10l3.7-0.7L12 6Z"
        fill={active ? '#fff' : 'currentColor'}
        opacity={active ? 1 : 0.65}
      />
      <defs>
        <linearGradient id="profile-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FF8A5A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function NavBar({ activeTab, onTabChange }) {
  const user = useUserContext();
  const isKids = user.ageGroup === 'little_explorer';

  // Due count for Tracks badge
  const masteringTracks = (user.tracks || []).filter((t) => t.mode === 'mastering');
  const dueCount = getDueCards(masteringTracks).length;

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2 px-3 sm:px-5"
      style={{ maxWidth: 'calc(var(--app-shell-width) + 2.5rem)', paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
      aria-label="Main navigation"
    >
      <div
        className="mx-auto relative flex items-center justify-around rounded-[26px] border border-[rgba(255,255,255,0.72)] bg-[rgba(255,253,247,0.94)] px-2 py-1.5 shadow-[0_18px_50px_rgba(42,42,42,0.16)] backdrop-blur-xl overflow-hidden"
      >
        {/* Glow wash behind the active tab */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,166,43,0.18),transparent_70%)]" />
        </div>

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'tracks' && dueCount > 0;
          const label = isKids ? tab.kidsLabel : tab.label;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-[18px] min-w-[72px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-spark-ember"
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${label}${showBadge ? ` (${dueCount} due)` : ''}`}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-halo"
                  className="absolute inset-0 rounded-[18px]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,166,43,0.18), rgba(255,107,53,0.12))',
                    boxShadow: 'inset 0 0 0 1px rgba(255,107,53,0.18)',
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <div className="relative z-10">
                <motion.div
                  animate={isActive ? { scale: [1, 1.22, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <Icon active={isActive} />
                </motion.div>
                {isActive && (
                  <motion.div
                    key={`glow-${tab.id}`}
                    initial={{ scale: 0.6, opacity: 0.7 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background: tab.id === 'explore'
                        ? 'radial-gradient(circle, rgba(255,107,53,0.5) 0%, transparent 70%)'
                        : tab.id === 'tracks'
                          ? 'radial-gradient(circle, rgba(45,147,108,0.5) 0%, transparent 70%)'
                          : 'radial-gradient(circle, rgba(255,166,43,0.5) 0%, transparent 70%)',
                    }}
                    aria-hidden="true"
                  />
                )}
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-[0_4px_10px_rgba(255,107,53,0.4)]"
                    style={{ background: 'linear-gradient(135deg, #FF8A5A, #E63946)' }}
                    aria-hidden="true"
                  >
                    {dueCount > 9 ? '9+' : dueCount}
                  </span>
                )}
              </div>
              <span
                className={`relative z-10 text-[10.5px] font-body font-semibold transition-colors ${
                  isActive ? 'text-spark-ember' : 'text-text-muted'
                } ${isKids ? 'text-xs' : ''}`}
              >
                {label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-0.5 h-[3px] w-6 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #FFD166, #FF6B35)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
