import { motion } from 'framer-motion';
void motion;

// Animated flame icon paired with the streak count. Gets warmer as the streak grows.
export default function StreakFlame({ streak = 1, size = 'md', showLabel = true, pulse = true, className = '' }) {
  const intensity = Math.min(1, streak / 14);
  const sizes = {
    xs: { h: 18, w: 14, font: 'text-xs' },
    sm: { h: 22, w: 18, font: 'text-sm' },
    md: { h: 28, w: 22, font: 'text-base' },
    lg: { h: 40, w: 32, font: 'text-xl' },
  };
  const s = sizes[size] || sizes.md;

  const topStop = streak >= 7 ? '#FFE08A' : '#FFD166';
  const midStop = streak >= 14 ? '#FF6B35' : streak >= 7 ? '#FF8A5A' : '#FFA62B';
  const bottomStop = streak >= 14 ? '#C62A2F' : '#E63946';

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} aria-label={`${streak} day streak`}>
      <motion.svg
        width={s.w}
        height={s.h}
        viewBox="0 0 32 40"
        style={{ overflow: 'visible' }}
        animate={pulse ? { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] } : undefined}
        transition={pulse ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        <defs>
          <linearGradient id={`flame-gradient-${streak}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={topStop} />
            <stop offset="45%" stopColor={midStop} />
            <stop offset="100%" stopColor={bottomStop} />
          </linearGradient>
          <radialGradient id={`flame-core-${streak}`} cx="50%" cy="65%" r="50%">
            <stop offset="0%" stopColor="#FFF4CF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFD166" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M16 1C16 1 9 10 9 18c0 2 1 4 2 5-3-1-5-4-5-7-3 8 0 18 10 22 10-3 13-13 10-22 0 3-2 6-5 7 1-1 2-3 2-5 0-8-7-17-7-17Z"
          fill={`url(#flame-gradient-${streak})`}
          style={{
            filter: `drop-shadow(0 4px ${8 + intensity * 10}px rgba(255, 107, 53, ${0.3 + intensity * 0.4}))`,
          }}
        />
        <ellipse cx="16" cy="28" rx="5" ry="7" fill={`url(#flame-core-${streak})`} />
      </motion.svg>
      {showLabel && (
        <span className={`streak-flame font-display font-semibold ${s.font}`}>{streak}</span>
      )}
    </span>
  );
}
