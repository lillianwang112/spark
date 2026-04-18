import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;

export default function KeyTakeaways({ takeaways, color }) {
  const [checked, setChecked] = useState(new Set());

  const toggle = (idx) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const allDone = takeaways.length > 0 && checked.size === takeaways.length;

  return (
    <div className="space-y-2">
      {takeaways.map((takeaway, idx) => {
        const isDone = checked.has(idx);
        return (
          <motion.button
            key={idx}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.09, duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggle(idx)}
            className="w-full flex items-start gap-3 text-left px-4 py-3.5 rounded-[18px] transition-all duration-200"
            style={{
              background: isDone ? `${color}0E` : 'rgba(255,255,255,0.6)',
              border: `1.5px solid ${isDone ? `${color}40` : 'rgba(42,42,42,0.08)'}`,
              boxShadow: isDone ? `0 4px 16px ${color}14` : '0 2px 8px rgba(42,42,42,0.04)',
            }}
          >
            <motion.span
              animate={isDone ? { scale: [0.7, 1.25, 1], rotate: [0, -15, 0] } : {}}
              transition={{ duration: 0.4, type: 'spring', stiffness: 380, damping: 20 }}
              className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] border-2 font-bold transition-all duration-200"
              style={{
                borderColor: isDone ? color : 'rgba(42,42,42,0.22)',
                background: isDone ? color : 'transparent',
                color: 'white',
              }}
            >
              {isDone && '✓'}
            </motion.span>
            <p
              className="flex-1 text-sm font-body leading-relaxed transition-colors duration-200"
              style={{ color: isDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}
            >
              {takeaway}
            </p>
            {!isDone && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                className="flex-shrink-0 text-[10px] font-mono text-text-muted self-center"
              >
                tap ✓
              </motion.span>
            )}
          </motion.button>
        );
      })}

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-[16px]"
            style={{
              background: `linear-gradient(135deg, ${color}12, ${color}06)`,
              border: `1px solid ${color}30`,
            }}
          >
            <motion.span
              animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6 }}
              className="text-base"
            >
              ✦
            </motion.span>
            <p className="text-sm font-body font-semibold" style={{ color }}>
              All key ideas locked in
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
