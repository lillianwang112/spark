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
  sm: 42,
  md: 58,
  lg: 84,
  xl: 120,
};

const ORBIT_SPARKS = [
  { cx: 78, cy: 24, r: 2.6, delay: 0 },
  { cx: 91, cy: 48, r: 2.2, delay: 0.25 },
  { cx: 30, cy: 30, r: 2.1, delay: 0.45 },
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
          d="M52 8C64 20 76 30 80 49c4 20-4 39-17 49-4 4-7 9-11 12-4-3-7-8-11-12C28 88 20 69 24 49 28 30 40 20 52 8Z"
          fill="url(#ember-shell-gradient)"
          filter="url(#ember-shadow)"
        />

        <motion.path
          d="M53 24c8 8 14 16 15 29 1 12-5 24-16 31-11-7-17-19-15-31 1-13 8-21 16-29Z"
          fill="url(#ember-core-gradient)"
          animate={config.core}
        />

        <path
          d="M53 18c5 6 9 10 10 17-7-2-13 2-17 7 1-10 2-17 7-24Z"
          fill="rgba(255,255,255,0.55)"
          opacity="0.72"
        />

        <motion.g
          animate={{ scaleY: config.eyeScale }}
          style={{ transformOrigin: '52px 61px' }}
        >
          <motion.path
            d="M38 58c3-4 8-4 11 0-2 5-9 5-11 0Z"
            fill="url(#ember-eye-gradient)"
          />
          <motion.path
            d="M55 58c3-4 8-4 11 0-2 5-9 5-11 0Z"
            fill="url(#ember-eye-gradient)"
          />
          <circle cx="43.8" cy="58.3" r="1.05" fill="rgba(255,255,255,0.8)" />
          <circle cx="60.8" cy="58.3" r="1.05" fill="rgba(255,255,255,0.8)" />
        </motion.g>

        <motion.path
          d={config.mouth}
          stroke="rgba(70,24,32,0.72)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
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
