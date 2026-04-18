import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPARKLE_POSITIONS = [
  { x: -18, y: -12, delay: 0.05 },
  { x: 22, y: -18, delay: 0.1 },
  { x: -24, y: 10, delay: 0.08 },
  { x: 28, y: 8, delay: 0.12 },
  { x: 4, y: -22, delay: 0.06 },
  { x: -8, y: 20, delay: 0.14 },
];

function SparkleParticle({ x, y, delay }) {
  return (
    <motion.span
      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
      animate={{ x, y, scale: [0, 1, 0], opacity: [1, 1, 0] }}
      transition={{ duration: 0.65, delay, ease: 'easeOut' }}
      className="pointer-events-none absolute left-1/2 top-1/2 text-xs select-none"
      aria-hidden="true"
    >
      ✦
    </motion.span>
  );
}

// Floating toast that auto-dismisses. Supports a gold/ember variant.
export default function Toast({ open, onClose, title, subtitle, variant = 'default', duration = 2400, icon }) {
  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  const variantStyles = {
    default: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,247,233,0.92))',
      border: '1px solid rgba(255, 181, 94, 0.24)',
      color: 'var(--text-primary)',
    },
    celebrate: {
      background: 'linear-gradient(135deg, #FFD166 0%, #FF8A5A 55%, #E63946 100%)',
      border: '1px solid rgba(255, 209, 102, 0.6)',
      color: '#fff',
    },
    calm: {
      background: 'linear-gradient(135deg, rgba(45,147,108,0.94), rgba(36,118,86,0.9))',
      border: '1px solid rgba(45,147,108,0.55)',
      color: '#fff',
    },
  };
  const style = variantStyles[variant] || variantStyles.default;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 bottom-24 z-[110] flex justify-center px-4"
          initial={{ opacity: 0, y: 18, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.94 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div
            role="status"
            aria-live="polite"
            className="relative flex items-center gap-3 rounded-[22px] px-4 py-3 shadow-[0_24px_60px_rgba(72,49,10,0.3)] backdrop-blur-xl max-w-sm overflow-visible"
            style={style}
          >
            {/* Particle burst on celebrate */}
            {variant === 'celebrate' && (
              <div className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2" aria-hidden="true">
                {SPARKLE_POSITIONS.map((pos, i) => (
                  <SparkleParticle key={i} {...pos} />
                ))}
              </div>
            )}

            {icon && (
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 18 }}
                className="text-xl leading-none flex-shrink-0"
              >
                {icon}
              </motion.span>
            )}
            <div className="min-w-0">
              <p className="font-display text-base font-semibold leading-tight">{title}</p>
              {subtitle && (
                <p className="mt-0.5 font-body text-xs leading-relaxed opacity-90">{subtitle}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
