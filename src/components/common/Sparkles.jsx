import { useMemo } from 'react';
import { motion } from 'framer-motion';
void motion;

// Scatters a small number of sparkles inside the container. Purely decorative.
export default function Sparkles({ count = 6, color = '#FFD166', className = '', seed = 0 }) {
  const particles = useMemo(() => {
    const rng = mulberry32(seed || 1);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top: Math.round(rng() * 90) + '%',
      left: Math.round(rng() * 95) + '%',
      size: 5 + Math.round(rng() * 7),
      delay: rng() * 1.6,
      duration: 1.6 + rng() * 1.4,
    }));
  }, [count, seed]);

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      {particles.map((p) => (
        <motion.svg
          key={p.id}
          width={p.size}
          height={p.size}
          viewBox="0 0 10 10"
          style={{ position: 'absolute', top: p.top, left: p.left }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.3], rotate: [0, 180] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M5 0l1.1 3.1L9 4 6 5.5 5 9 4 5.5 1 4l2.9-0.9z"
            fill={color}
            opacity="0.95"
          />
        </motion.svg>
      ))}
    </div>
  );
}

function mulberry32(seed) {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
