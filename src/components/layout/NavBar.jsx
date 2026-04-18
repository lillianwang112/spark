import { motion } from 'framer-motion';
import { useUserContext } from '../../hooks/useUserContext.jsx';
import { getDueCards } from '../../models/srs.js';
void motion;

const TABS = [
  { id: 'explore',       label: 'Explore',  icon: ExploreIcon,       kidsLabel: 'Discover' },
  { id: 'tracks',        label: 'Tracks',   icon: TracksIcon,         kidsLabel: 'Saved' },
  { id: 'groups',        label: 'Groups',   icon: GroupsIcon,         kidsLabel: 'Groups' },
  { id: 'opportunities', label: 'World',    icon: OpportunitiesIcon,  kidsLabel: 'World' },
  { id: 'profile',       label: 'Profile',  icon: ProfileIcon,        kidsLabel: 'Me' },
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

function GroupsIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
      <circle cx="9" cy="8" r="3" fill={active ? 'url(#groups-fill)' : 'none'} stroke={active ? '#7B6CF6' : 'currentColor'} strokeWidth="1.7" />
      <circle cx="16" cy="9" r="2.4" fill={active ? 'rgba(123,108,246,0.55)' : 'none'} stroke={active ? '#7B6CF6' : 'currentColor'} strokeWidth="1.5" />
      <path d="M3 18c0-3 2.7-5 6-5s6 2 6 5" fill={active ? 'url(#groups-fill)' : 'none'} stroke={active ? '#7B6CF6' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 14c2 .5 3.5 2 3.5 4" fill="none" stroke={active ? '#7B6CF6' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" opacity={active ? 1 : 0.5} />
      <defs>
        <linearGradient id="groups-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9B8FF6" />
          <stop offset="100%" stopColor="#5B5EA6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function OpportunitiesIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
      <circle
        cx="12" cy="12" r="8.5"
        fill={active ? 'url(#opp-fill)' : 'none'}
        stroke={active ? '#4A6FA5' : 'currentColor'}
        strokeWidth="1.7"
      />
      {/* Latitude lines */}
      <ellipse cx="12" cy="12" rx="3.4" ry="8.5" fill="none" stroke={active ? 'rgba(255,255,255,0.55)' : 'currentColor'} strokeWidth="1.3" opacity={active ? 1 : 0.45} />
      {/* Horizontal band */}
      <line x1="3.5" y1="12" x2="20.5" y2="12" stroke={active ? 'rgba(255,255,255,0.55)' : 'currentColor'} strokeWidth="1.3" opacity={active ? 1 : 0.45} />
      <line x1="5.3" y1="8" x2="18.7" y2="8" stroke={active ? 'rgba(255,255,255,0.40)' : 'currentColor'} strokeWidth="1.1" opacity={active ? 1 : 0.3} />
      <line x1="5.3" y1="16" x2="18.7" y2="16" stroke={active ? 'rgba(255,255,255,0.40)' : 'currentColor'} strokeWidth="1.1" opacity={active ? 1 : 0.3} />
      <defs>
        <linearGradient id="opp-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6C9BD2" />
          <stop offset="100%" stopColor="#2D5F8E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const TAB_COLORS = {
  explore: '#FF6B35',
  tracks: '#2D936C',
  groups: '#7B6CF6',
  opportunities: '#4A6FA5',
  profile: '#FFA62B',
};

export default function NavBar({ activeTab, onTabChange, onOpenSearch }) {
  const user = useUserContext();
  const isKids = user.ageGroup === 'little_explorer';

  const masteringTracks = (user.tracks || []).filter((t) => t.mode === 'mastering');
  const dueCount = getDueCards(masteringTracks).length;

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2 px-3 sm:px-5"
      style={{ maxWidth: 'calc(var(--app-shell-width) + 2.5rem)', paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
      aria-label="Main navigation"
    >
      <div
        className="mx-auto relative flex items-center justify-around rounded-[28px] px-2 py-1.5 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(255,252,246,0.98), rgba(255,244,228,0.92))',
          border: '1px solid rgba(255,255,255,0.88)',
          backdropFilter: 'blur(28px)',
          boxShadow: '0 -2px 0 rgba(255,255,255,0.56), 0 24px 70px rgba(42,42,10,0.22), 0 8px 22px rgba(72,49,10,0.15), inset 0 1px 0 rgba(255,255,255,0.75)',
        }}
      >
        {/* Radial glow wash */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                `radial-gradient(circle at ${activeTab === 'explore' ? '30%' : activeTab === 'tracks' ? '46%' : activeTab === 'groups' ? '58%' : activeTab === 'opportunities' ? '70%' : '85%'} 0%, rgba(${
                  activeTab === 'explore' ? '255,107,53' : activeTab === 'tracks' ? '45,147,108' : activeTab === 'groups' ? '123,108,246' : activeTab === 'opportunities' ? '74,111,165' : '255,166,43'
                },0.18), transparent 70%)`,
              ],
            }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Search FAB */}
        <motion.button
          onClick={() => onOpenSearch?.()}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.90 }}
          className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all focus-visible:outline-2 focus-visible:outline-spark-ember"
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,53,0.16), rgba(255,166,43,0.12))',
            border: '1.5px solid rgba(255,107,53,0.24)',
            boxShadow: '0 6px 18px rgba(255,107,53,0.18)',
          }}
          aria-label="Open universal search"
        >
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="#FF6B35" strokeWidth="1.9" />
            <line x1="12.5" y1="12.5" x2="17" y2="17" stroke="#FF6B35" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
        </motion.button>

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'tracks' && dueCount > 0;
          const label = isKids ? tab.kidsLabel : tab.label;
          const tabColor = TAB_COLORS[tab.id] || '#FF6B35';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-[18px] min-w-[52px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-spark-ember"
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${label}${showBadge ? ` (${dueCount} due)` : ''}`}
            >
              {/* Active halo */}
              {isActive && (
                <motion.span
                  layoutId="tab-halo"
                  className="absolute inset-0 rounded-[18px]"
                  style={{
                    background: `linear-gradient(135deg, ${tabColor}1E, ${tabColor}10)`,
                    boxShadow: `inset 0 0 0 1px ${tabColor}28, 0 4px 14px ${tabColor}18`,
                  }}
                  transition={{ type: 'spring', stiffness: 440, damping: 36 }}
                />
              )}

              <div className="relative z-10">
                {/* Icon with animated scale */}
                <motion.div
                  animate={isActive ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  transition={{ duration: 0.48, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <Icon active={isActive} />
                </motion.div>

                {/* Burst ring on activation */}
                {isActive && (
                  <motion.div
                    key={`burst-${tab.id}`}
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.52, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{ background: `radial-gradient(circle, ${tabColor}55 0%, transparent 70%)` }}
                    aria-hidden="true"
                  />
                )}

                {/* Persistent active glow behind icon */}
                {isActive && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full -z-10"
                    style={{
                      background: `radial-gradient(circle, ${tabColor}28 0%, transparent 70%)`,
                      filter: 'blur(4px)',
                      transform: 'scale(1.6)',
                    }}
                    aria-hidden="true"
                  />
                )}

                {/* Due badge */}
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{
                      background: 'linear-gradient(135deg, #FF8A5A, #E63946)',
                      boxShadow: '0 4px 10px rgba(255,107,53,0.45)',
                    }}
                    aria-hidden="true"
                  >
                    {dueCount > 9 ? '9+' : dueCount}
                  </span>
                )}
              </div>

              <span
                className={`relative z-10 text-[10.5px] font-body font-semibold transition-all duration-200 ${isKids ? 'text-xs' : ''}`}
                style={{ color: isActive ? tabColor : 'var(--text-muted)' }}
              >
                {label}
              </span>

              {/* Bottom indicator */}
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-0.5 h-[3.5px] w-6 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${tabColor}88, ${tabColor})`,
                    boxShadow: `0 0 8px ${tabColor}60`,
                  }}
                  transition={{ type: 'spring', stiffness: 440, damping: 36 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
