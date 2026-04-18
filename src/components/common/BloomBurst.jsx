import { motion } from 'framer-motion';
void motion;

// A circle of blooming petals for celebratory moments (flowering gate, mastery unlock).
export default function BloomBurst({ active = false, size = 180, color = '#FFD166' }) {
  if (!active) return null;
  const petals = 8;
  const radius = size / 2;
  const petalW = size * 0.22;
  const petalH = size * 0.38;

  return (
    <div
      className="pointer-events-none relative"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i / petals) * 360;
        return (
          <motion.span
            key={i}
            className="absolute block"
            style={{
              top: '50%',
              left: '50%',
              width: petalW,
              height: petalH,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              background: `linear-gradient(180deg, ${color}, #FF8A5A)`,
              boxShadow: `0 4px 14px ${color}55`,
              transformOrigin: '50% 100%',
              transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0.95],
              scale: [0, 1.15, 1],
            }}
            transition={{ delay: i * 0.045, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          />
        );
      })}
      <motion.span
        className="absolute top-1/2 left-1/2 block rounded-full"
        style={{
          width: radius * 0.7,
          height: radius * 0.7,
          background: 'radial-gradient(circle, #FFF4CF 0%, #FFD166 60%, #FF8A5A 100%)',
          boxShadow: `0 0 30px ${color}80`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1], scale: [0, 1.25, 1] }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      />
    </div>
  );
}
