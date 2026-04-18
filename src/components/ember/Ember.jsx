import { motion } from 'framer-motion';
void motion;

const MOOD_CONFIGS = {
  idle: {
    shell: { y: [0, -2, 0], rotate: [0, 1.5, 0], scale: [1, 1.02, 1], transition: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' } },
    core: { scale: [1, 1.04, 1], opacity: [0.9, 1, 0.92], transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } },
    spark: { y: [0, -4, 0], opacity: [0.35, 0.75, 0.35], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1,
    mouth: 'M42 76 C48 82 57 82 63 76',
    glow: 0.42,
  },
  thinking: {
    shell: { rotate: [-2, 3, -1, 0], y: [0, -2, 1, 0], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
    core: { scale: [1, 1.08, 0.98, 1], opacity: [0.84, 1, 0.9, 0.84], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
    spark: { x: [-2, 2, -1], y: [0, -7, -2], opacity: [0.2, 0.9, 0.2], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 0.8,
    mouth: 'M43 77 C47 74 58 74 62 77',
    glow: 0.56,
  },
  excited: {
    shell: { y: [0, -8, 0, -5, 0], scale: [1, 1.08, 1, 1.05, 1], transition: { duration: 0.9, repeat: Infinity, ease: 'easeOut' } },
    core: { scale: [1, 1.14, 1], opacity: [0.96, 1, 0.94], transition: { duration: 0.9, repeat: Infinity, ease: 'easeOut' } },
    spark: { y: [0, -10, -2], opacity: [0.25, 1, 0.15], scale: [0.9, 1.2, 0.8], transition: { duration: 1, repeat: Infinity, ease: 'easeOut' } },
    eyeScale: 1.15,
    mouth: 'M40 75 C48 84 58 84 66 75',
    glow: 0.72,
  },
  celebrating: {
    shell: { rotate: [-5, 5, -4, 4, 0], y: [0, -10, 0], scale: [1, 1.1, 1], transition: { duration: 0.7, repeat: 3, ease: 'easeOut' } },
    core: { scale: [1, 1.18, 1], opacity: [0.92, 1, 0.92], transition: { duration: 0.7, repeat: 3, ease: 'easeOut' } },
    spark: { y: [0, -12, 0], opacity: [0.4, 1, 0.15], scale: [0.9, 1.35, 0.85], transition: { duration: 0.8, repeat: 4, ease: 'easeOut' } },
    eyeScale: 1.2,
    mouth: 'M39 75 C48 86 58 86 67 75',
    glow: 0.84,
  },
  proud: {
    shell: { scale: [1, 1.04, 1], rotate: [0, -1.5, 0], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
    core: { scale: [1, 1.05, 1], opacity: [0.92, 1, 0.92], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    spark: { y: [0, -5, 0], opacity: [0.25, 0.82, 0.25], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1.08,
    mouth: 'M41 75 C48 80 57 80 64 75',
    glow: 0.6,
  },
  sheepish: {
    shell: { x: [-2, 2, -1, 0], rotate: [-1, 1, 0], transition: { duration: 0.7, ease: 'easeInOut' } },
    core: { scale: [1, 0.96, 1], opacity: [0.78, 0.86, 0.78], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
    spark: { opacity: [0.1, 0.3, 0.1], y: [0, -2, 0], transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 0.66,
    mouth: 'M44 78 C49 75 55 75 60 78',
    glow: 0.26,
  },
  encouraging: {
    shell: { scale: [1, 1.03, 1], y: [0, -3, 0], transition: { duration: 1.9, repeat: Infinity, ease: 'easeInOut' } },
    core: { scale: [1, 1.08, 1], opacity: [0.9, 1, 0.92], transition: { duration: 1.7, repeat: Infinity, ease: 'easeInOut' } },
    spark: { y: [0, -6, -1], opacity: [0.25, 0.85, 0.25], transition: { duration: 1.7, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1.02,
    mouth: 'M41 76 C48 82 58 82 65 76',
    glow: 0.52,
  },
  attentive: {
    shell: { scale: 1, rotate: [0, -1, 0], transition: { duration: 2.1, repeat: Infinity, ease: 'easeInOut' } },
    core: { scale: [1, 1.03, 1], opacity: [0.92, 0.98, 0.92], transition: { duration: 1.9, repeat: Infinity, ease: 'easeInOut' } },
    spark: { y: [0, -4, 0], opacity: [0.2, 0.65, 0.2], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1.12,
    mouth: 'M43 76 C49 79 56 79 62 76',
    glow: 0.48,
  },
  surprised: {
    shell: { scale: [1, 1.14, 0.98, 1], rotate: [0, 3, -2, 0], transition: { duration: 0.55, ease: 'easeOut' } },
    core: { scale: [1, 1.18, 1], opacity: [0.9, 1, 0.92], transition: { duration: 0.55, ease: 'easeOut' } },
    spark: { y: [0, -12, -2], opacity: [0.3, 1, 0.2], scale: [1, 1.35, 0.9], transition: { duration: 0.6, ease: 'easeOut' } },
    eyeScale: 1.3,
    mouth: 'M47 77 C50 81 54 81 57 77',
    glow: 0.78,
  },
  curious: {
    shell: { rotate: [0, -5, 0, 3, 0], y: [0, -2, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
    core: { scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
    spark: { x: [0, 3, -2, 0], y: [0, -6, -3, 0], opacity: [0.2, 0.9, 0.35, 0.2], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1.08,
    mouth: 'M42 77 C48 80 56 80 63 76',
    glow: 0.5,
  },
};

const SIZE_MAP = {
  xs: 32,
  sm: 44,
  md: 62,
  lg: 90,
  xl: 128,
};

const ORBIT_SPARKS = [
  { cx: 76, cy: 22, r: 2.2, delay: 0 },
  { cx: 88, cy: 44, r: 1.9, delay: 0.25 },
  { cx: 28, cy: 28, r: 1.8, delay: 0.45 },
];

export default function Ember({
  mood = 'idle',
  size = 'md',
  glowIntensity = 1,
  className = '',
  'aria-hidden': ariaHidden = true,
}) {
  const px = SIZE_MAP[size] || SIZE_MAP.md;
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.idle;
  const glowScale = 0.58 + glowIntensity * 0.62;

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: px, height: px * 1.08 }}
      animate={config.shell}
      aria-hidden={ariaHidden}
    >
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(255,140,68,${config.glow * glowIntensity}) 0%, rgba(255,107,53,${config.glow * 0.62 * glowIntensity}) 32%, rgba(91,94,166,${0.08 * glowIntensity}) 62%, rgba(255,253,247,0) 74%)`,
          filter: `blur(${px * 0.18}px)`,
          transform: 'translateY(6%)',
        }}
        animate={{ scale: [glowScale, glowScale * 1.08, glowScale], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.svg
        width={px}
        height={px * 1.08}
        viewBox="0 0 104 118"
        style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="ember-shell-gradient" x1="24" y1="8" x2="84" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFD08D" />
            <stop offset="32%" stopColor="#FF9A4A" />
            <stop offset="72%" stopColor="#FF5E3A" />
            <stop offset="100%" stopColor="#A83B34" />
          </linearGradient>
          <linearGradient id="ember-core-gradient" x1="36" y1="24" x2="68" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7D6" />
            <stop offset="55%" stopColor="#FFD36A" />
            <stop offset="100%" stopColor="#FF8D2F" />
          </linearGradient>
          <linearGradient id="ember-eye-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1F1632" />
            <stop offset="100%" stopColor="#3A2E58" />
          </linearGradient>
          <linearGradient id="ember-eye-white-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="100%" stopColor="#FFECD7" />
          </linearGradient>
          <filter id="ember-shadow" x="-40%" y="-40%" width="180%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="rgba(92,45,18,0.28)" />
          </filter>
          <filter id="ember-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0
                      0 0.63 0 0 0
                      0 0 0.28 0 0
                      0 0 0 0.52 0"
            />
          </filter>
        </defs>

        {ORBIT_SPARKS.map((spark) => (
          <motion.circle
            key={`${spark.cx}-${spark.cy}`}
            cx={spark.cx}
            cy={spark.cy}
            r={spark.r}
            fill="#FFD88A"
            filter="url(#ember-soft-glow)"
            animate={config.spark}
            transition={{
              ...config.spark.transition,
              delay: spark.delay,
            }}
          />
        ))}

        <motion.path
          d="M52 8C58 16 67 20 70 31c5-2 9 1 11 6 2 6-1 11-5 14 8 10 8 27-1 39-6 8-14 12-23 12-9 0-17-4-23-12-9-12-9-29-1-39-4-3-7-8-5-14 2-5 6-8 11-6 3-11 12-15 18-23Z"
          fill="url(#ember-shell-gradient)"
          filter="url(#ember-shadow)"
          animate={{ scaleX: [1, 1.012, 1], scaleY: [1, 1.02, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.path
          d="M26 76c-7 2-10 8-8 13 2 6 8 9 14 8-3-3-4-8-1-14 2-3 0-6-5-7Z"
          fill="rgba(222,113,72,0.58)"
          animate={{ rotate: [-6, 0, -6], x: [0, -1.2, 0] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '28px 82px' }}
        />
        <motion.path
          d="M78 76c7 2 10 8 8 13-2 6-8 9-14 8 3-3 4-8 1-14-2-3 0-6 5-7Z"
          fill="rgba(222,113,72,0.54)"
          animate={{ rotate: [6, 0, 6], x: [0, 1.2, 0] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '76px 82px' }}
        />

        <motion.path
          d="M52 21c7 7 13 12 15 24 2 12-3 27-15 35-12-8-17-23-15-35 2-12 8-17 15-24Z"
          fill="url(#ember-core-gradient)"
          animate={config.core}
        />

        <path
          d="M48 26c5-3 10-3 16 1-4 3-7 8-7 13-5-3-9-2-13 0 0-5 1-10 4-14Z"
          fill="rgba(255,255,255,0.48)"
          opacity="0.76"
        />

        <motion.g
          animate={{ scaleY: [config.eyeScale, config.eyeScale, 0.14, config.eyeScale] }}
          transition={{ duration: 4.4, times: [0, 0.77, 0.81, 1], repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '52px 61px' }}
        >
          <ellipse cx="42" cy="58.5" rx="9.5" ry="10.2" fill="rgba(255,255,255,0.24)" />
          <ellipse cx="62" cy="58.5" rx="9.5" ry="10.2" fill="rgba(255,255,255,0.18)" />
          <ellipse
            cx="42"
            cy="58.5"
            rx="7.6"
            ry="8.8"
            fill="url(#ember-eye-white-gradient)"
            stroke="rgba(127,55,40,0.16)"
            strokeWidth="0.7"
          />
          <ellipse
            cx="62"
            cy="58.5"
            rx="7.6"
            ry="8.8"
            fill="url(#ember-eye-white-gradient)"
            stroke="rgba(127,55,40,0.16)"
            strokeWidth="0.7"
          />
          <motion.ellipse cx="42" cy="60" rx="3.2" ry="4" fill="url(#ember-eye-gradient)" animate={{ cx: [42, 41.6, 42.2, 42], ry: [3.8, 4.2, 3.8] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="62" cy="60" rx="3.2" ry="4" fill="url(#ember-eye-gradient)" animate={{ cx: [62, 61.6, 62.2, 62], ry: [3.8, 4.2, 3.8] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="40.1" cy="57.8" r="1.28" fill="rgba(255,255,255,0.98)" />
          <circle cx="60.1" cy="57.8" r="1.28" fill="rgba(255,255,255,0.98)" />
          <circle cx="43.2" cy="61.8" r="0.55" fill="rgba(255,255,255,0.78)" />
          <circle cx="63.2" cy="61.8" r="0.55" fill="rgba(255,255,255,0.78)" />
        </motion.g>

        <ellipse cx="34" cy="69.2" rx="4.9" ry="2.8" fill="rgba(255,182,157,0.30)" />
        <ellipse cx="70" cy="69.2" rx="4.9" ry="2.8" fill="rgba(255,182,157,0.30)" />

        <path d="M38 38 L32 30 L40 32 Z" fill="rgba(255,255,255,0.42)" />
        <path d="M66 38 L72 30 L64 32 Z" fill="rgba(255,255,255,0.36)" />

        <path d="M40 92c3 0 6 2 8 5-5 1-9 0-12-3 1-1 2-2 4-2Z" fill="rgba(196,98,56,0.82)" />
        <path d="M64 92c-3 0-6 2-8 5 5 1 9 0 12-3-1-1-2-2-4-2Z" fill="rgba(196,98,56,0.82)" />

        <motion.path
          d={config.mouth}
          stroke="rgba(104,34,38,0.62)"
          strokeWidth="1.85"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ scaleX: [1, 1.05, 1], y: [0, 0.5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '52px 77px', transform: 'translateY(-1px) scale(0.62)' }}
        />

        <motion.circle
          cx="80"
          cy="20"
          r="2.1"
          fill="#FFD166"
          animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.path
          d="M30 77c7 7 16 11 22 13 8-2 16-6 23-13"
          stroke="rgba(255,246,228,0.2)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </motion.svg>
    </motion.div>
  );
}
