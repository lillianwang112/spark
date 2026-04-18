import { motion } from 'framer-motion';
void motion;

// ── Ember SVG States ──
// excited, thinking, proud, curious, idle, celebrating, encouraging, attentive, sheepish

const MOOD_CONFIGS = {
  idle: {
    bodyAnim: { scale: [1, 1.02, 1], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1,
    glowOpacity: 0.3,
    glowScale: 1,
  },
  thinking: {
    bodyAnim: { rotate: [-2, 2, -1, 1, 0], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 0.85,
    glowOpacity: 0.5,
    glowScale: 1.05,
  },
  excited: {
    bodyAnim: { y: [0, -8, 0, -5, 0], scale: [1, 1.06, 1], transition: { duration: 0.7, repeat: Infinity, ease: 'easeOut' } },
    eyeScale: 1.2,
    glowOpacity: 0.7,
    glowScale: 1.3,
  },
  celebrating: {
    bodyAnim: { rotate: [-5, 5, -5, 5, 0], y: [0, -12, 0], scale: [1, 1.1, 1], transition: { duration: 0.5, repeat: 3, ease: 'easeOut' } },
    eyeScale: 1.3,
    glowOpacity: 0.9,
    glowScale: 1.5,
  },
  proud: {
    bodyAnim: { scale: [1, 1.04, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1.1,
    glowOpacity: 0.6,
    glowScale: 1.2,
  },
  sheepish: {
    bodyAnim: { x: [-2, 2, -1, 1, 0], transition: { duration: 0.5 } },
    eyeScale: 0.7,
    glowOpacity: 0.2,
    glowScale: 0.9,
  },
  encouraging: {
    bodyAnim: { scale: [1, 1.03, 1], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1.05,
    glowOpacity: 0.5,
    glowScale: 1.1,
  },
  attentive: {
    bodyAnim: { scale: 1 },
    eyeScale: 1.15,
    glowOpacity: 0.45,
    glowScale: 1.05,
  },
  surprised: {
    bodyAnim: { scale: [1, 1.15, 0.95, 1], transition: { duration: 0.4, times: [0, 0.3, 0.7, 1] } },
    eyeScale: 1.4,
    glowOpacity: 0.8,
    glowScale: 1.4,
  },
  curious: {
    bodyAnim: { rotate: [0, -8, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    eyeScale: 1.1,
    glowOpacity: 0.4,
    glowScale: 1.1,
  },
};

const SIZE_MAP = {
  xs:  32,
  sm:  40,
  md:  56,
  lg:  80,
  xl:  120,
};

export default function Ember({
  mood = 'idle',
  size = 'md',
  glowIntensity = 1,   // 0-1: 0=new user, 1=heavy user
  className = '',
  'aria-hidden': ariaHidden = true,
}) {
  const px = SIZE_MAP[size] || SIZE_MAP.md;
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.idle;
  const eyeRadius = Math.max(2, px * 0.07);
  const eyeSpread = px * 0.14;
  const eyeY = px * 0.42;
  const glow = px * 0.6 * (0.4 + glowIntensity * 0.6);

  const glowColor = 'rgba(255, 107, 53,';

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: px, height: px }}
      animate={config.bodyAnim}
      aria-hidden={ariaHidden}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: px + glow,
          height: px + glow,
          left: -(glow / 2),
          top: -(glow / 2),
          background: `radial-gradient(circle, ${glowColor}${config.glowOpacity * glowIntensity}), transparent 70%)`,
        }}
        animate={{ scale: [config.glowScale, config.glowScale * 1.08, config.glowScale] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Body (filled circle) */}
      <motion.svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Body */}
        <motion.circle
          cx="50" cy="55" r="38"
          fill="#FF6B35"
          filter="url(#ember-glow)"
        />

        {/* Cheeks (warmth) */}
        <circle cx="30" cy="65" r="8" fill="rgba(255,200,150,0.35)" />
        <circle cx="70" cy="65" r="8" fill="rgba(255,200,150,0.35)" />

        {/* Eyes */}
        <motion.g animate={{ scaleY: config.eyeScale }} style={{ transformOrigin: `50px ${eyeY * 1.06}px` }}>
          {/* Left eye */}
          <ellipse
            cx={50 - eyeSpread}
            cy={42}
            rx={eyeRadius * 1.1}
            ry={eyeRadius * (mood === 'sheepish' ? 0.6 : 1.2)}
            fill="white"
          />
          {/* Left pupil */}
          <circle cx={50 - eyeSpread} cy={42.5} r={eyeRadius * 0.6} fill="#1A1A2E" />

          {/* Right eye */}
          <ellipse
            cx={50 + eyeSpread}
            cy={42}
            rx={eyeRadius * 1.1}
            ry={eyeRadius * (mood === 'sheepish' ? 0.6 : 1.2)}
            fill="white"
          />
          {/* Right pupil */}
          <circle cx={50 + eyeSpread} cy={42.5} r={eyeRadius * 0.6} fill="#1A1A2E" />
        </motion.g>

        {/* Smile / expression */}
        {mood === 'celebrating' || mood === 'excited' ? (
          <path d="M 36 68 Q 50 80 64 68" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : mood === 'sheepish' ? (
          <path d="M 38 70 Q 50 67 62 70" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 38 68 Q 50 76 62 68" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}

        {/* Thinking dots */}
        {mood === 'thinking' && (
          <g>
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx={60 + i * 8}
                cy={22}
                r={2.5}
                fill="rgba(255,255,255,0.7)"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </g>
        )}

        {/* Glow filter */}
        <defs>
          <filter id="ember-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </motion.svg>
    </motion.div>
  );
}
