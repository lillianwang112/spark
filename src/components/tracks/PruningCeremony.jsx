import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
void motion;

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

// Pruning ceremony: confirmed deletion with falling-leaves + encouraging Ember line.
export default function PruningCeremony({ track, open, onConfirm, onCancel }) {
  const [phase, setPhase] = useState('confirm'); // 'confirm' | 'falling' | 'done'

  useEffect(() => {
    if (!open) setPhase('confirm');
  }, [open]);

  useEffect(() => {
    if (phase !== 'falling') return undefined;
    const id = setTimeout(() => setPhase('done'), 1200);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'done') return undefined;
    const id = setTimeout(() => onConfirm?.(), 900);
    return () => clearTimeout(id);
  }, [phase, onConfirm]);

  const leaves = useMemo(
    () => {
      const rng = mulberry32(track?.id ? track.id.toString().length * 7919 : 42);
      return Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: (rng() - 0.5) * 200,
        delay: rng() * 0.4,
        rotate: rng() * 720,
        hue: [24, 18, 200, 36, 12][i % 5],
      }));
    },
    [track?.id]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(42,42,42,0.55)] backdrop-blur-sm px-4"
          onClick={phase === 'confirm' ? onCancel : undefined}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,247,233,0.97),rgba(255,232,198,0.9))] p-6 shadow-[0_40px_90px_rgba(72,49,10,0.24)]"
            onClick={(e) => e.stopPropagation()}
          >
            {phase === 'confirm' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <Ember mood="attentive" size="lg" glowIntensity={0.6} />
                <div>
                  <h3 className="font-display text-2xl font-semibold text-text-primary">
                    Let this branch go?
                  </h3>
                  <p className="mt-2 font-body text-sm text-text-secondary leading-relaxed">
                    <span className="font-semibold text-text-primary">"{track?.label}"</span> will settle
                    into the archive — curiosity you chose, once. Growth can still happen somewhere else.
                  </p>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={onCancel}
                    className="btn btn-secondary"
                  >
                    Keep it
                  </button>
                  <button
                    onClick={() => setPhase('falling')}
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #C1666B 0%, #8B3A44 100%)',
                      color: 'white',
                      boxShadow: '0 10px 24px rgba(193,102,107,0.35)',
                    }}
                  >
                    Let it fall
                  </button>
                </div>
              </div>
            )}

            {phase === 'falling' && (
              <div className="relative flex flex-col items-center gap-3 py-4">
                <Ember mood="encouraging" size="lg" glowIntensity={0.55} />
                <p className="font-display text-xl text-text-primary">Good call.</p>
                <p className="font-body text-sm text-text-secondary text-center max-w-xs">
                  Let's put that energy somewhere that matters.
                </p>
                <div className="pointer-events-none relative h-40 w-full overflow-hidden">
                  {leaves.map((l) => (
                    <motion.span
                      key={l.id}
                      className="absolute top-0 left-1/2 block h-3 w-4"
                      style={{
                        background: `hsl(${l.hue}, 70%, 55%)`,
                        borderRadius: '60% 20% 60% 20%',
                        '--fall-x': `${l.x}px`,
                      }}
                      initial={{ opacity: 0, y: 0, rotate: 0 }}
                      animate={{ opacity: [0, 1, 1, 0], y: 160, x: l.x, rotate: l.rotate }}
                      transition={{ duration: 1.1, delay: l.delay, ease: 'easeIn' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {phase === 'done' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <Ember mood="proud" size="lg" glowIntensity={0.6} />
                <p className="font-display text-xl text-text-primary">Archived.</p>
                <p className="font-body text-sm text-text-secondary max-w-xs">
                  Grow somewhere else instead.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
