// The first tree moment — seed → sprout → sapling
// This is the emotional peak of onboarding. Handle with care.
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import Ember from '../ember/Ember.jsx';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';

const stages = [
  { id: 'seed',    delay: 0,    duration: 600  },
  { id: 'sprout',  delay: 700,  duration: 800  },
  { id: 'sapling', delay: 1600, duration: 1000 },
  { id: 'tree',    delay: 2700, duration: 500  },
];

export default function SeedSprout({ topDomains = [], onComplete }) {
  const [stage, setStage] = useState('seed');
  const [emberMood, setEmberMood] = useState('attentive');

  const primaryColor = topDomains[0] ? DOMAIN_COLORS[topDomains[0]] : '#FF6B35';
  const secondColor  = topDomains[1] ? DOMAIN_COLORS[topDomains[1]] : '#2D936C';
  const thirdColor   = topDomains[2] ? DOMAIN_COLORS[topDomains[2]] : '#5B5EA6';

  useEffect(() => {
    const timers = [];

    timers.push(setTimeout(() => setStage('sprout'),  stages[1].delay));
    timers.push(setTimeout(() => {
      setStage('sapling');
      setEmberMood('excited');
    }, stages[2].delay));
    timers.push(setTimeout(() => {
      setStage('tree');
      setEmberMood('celebrating');
    }, stages[3].delay));
    timers.push(setTimeout(() => {
      onComplete?.();
    }, 3800));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      {/* Ember watches proudly */}
      <div className="relative">
        <Ember mood={emberMood} size="md" glowIntensity={0.7} />
        <AnimatePresence>
          {stage === 'sapling' && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="absolute -top-2 -right-2 text-sm bg-bg-primary rounded-full px-1.5 py-0.5 shadow-card"
            >
              🎉
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SVG Tree Growing */}
      <div className="relative flex items-end justify-center" style={{ width: 200, height: 180 }}>
        <svg viewBox="0 0 200 180" width="200" height="180" aria-label="Your knowledge tree is sprouting">

          {/* Ground */}
          <motion.ellipse
            cx="100" cy="168" rx="40" ry="6"
            fill={`${primaryColor}30`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />

          {/* Seed */}
          <AnimatePresence>
            {stage === 'seed' && (
              <motion.ellipse
                key="seed"
                cx="100" cy="162" rx="8" ry="6"
                fill={primaryColor}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5, times: [0, 0.6, 1] }}
              />
            )}
          </AnimatePresence>

          {/* Trunk */}
          <AnimatePresence>
            {(stage === 'sprout' || stage === 'sapling' || stage === 'tree') && (
              <motion.rect
                key="trunk"
                x="96" y="110" width="8" height="55"
                rx="4"
                fill={primaryColor}
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ transformOrigin: '100px 165px' }}
              />
            )}
          </AnimatePresence>

          {/* First leaves (sprout) */}
          <AnimatePresence>
            {(stage === 'sprout' || stage === 'sapling' || stage === 'tree') && (
              <>
                <motion.ellipse
                  key="leaf-l1"
                  cx="85" cy="108" rx="14" ry="10"
                  fill={primaryColor}
                  opacity={0.85}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ transformOrigin: '96px 110px' }}
                />
                <motion.ellipse
                  key="leaf-r1"
                  cx="115" cy="108" rx="14" ry="10"
                  fill={primaryColor}
                  opacity={0.85}
                  initial={{ scale: 0, rotate: 20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ transformOrigin: '104px 110px' }}
                />
                {/* Top leaf */}
                <motion.ellipse
                  key="leaf-top"
                  cx="100" cy="95" rx="12" ry="15"
                  fill={primaryColor}
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Second tier of branches (sapling) */}
          <AnimatePresence>
            {(stage === 'sapling' || stage === 'tree') && (
              <>
                {/* Left branch */}
                <motion.path
                  key="branch-l"
                  d="M 98 130 Q 70 118 60 108"
                  stroke={secondColor}
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <motion.ellipse
                  key="cluster-l"
                  cx="58" cy="100" rx="18" ry="14"
                  fill={secondColor}
                  opacity={0.8}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                />

                {/* Right branch */}
                <motion.path
                  key="branch-r"
                  d="M 102 130 Q 130 118 140 108"
                  stroke={thirdColor}
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                />
                <motion.ellipse
                  key="cluster-r"
                  cx="142" cy="100" rx="18" ry="14"
                  fill={thirdColor}
                  opacity={0.8}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Flowering sparkles when tree stage */}
          <AnimatePresence>
            {stage === 'tree' && (
              <>
                {/* Small sparkle dots on canopy */}
                {[
                  { x: 55,  y: 88, r: 3.5 },
                  { x: 100, y: 72, r: 4   },
                  { x: 145, y: 88, r: 3.5 },
                  { x: 78,  y: 96, r: 3   },
                  { x: 122, y: 96, r: 3   },
                  { x: 100, y: 62, r: 2.5 },
                  { x: 65,  y: 80, r: 2.5 },
                  { x: 135, y: 80, r: 2.5 },
                ].map((pos, i) => (
                  <motion.circle
                    key={`spark-${i}`}
                    cx={pos.x} cy={pos.y}
                    r={pos.r}
                    fill={i % 2 === 0 ? '#FFD700' : '#FFF4CF'}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1.6, 1, 1.1, 1],
                      opacity: [0, 1, 0.9, 1, 0.75],
                    }}
                    transition={{ delay: i * 0.06, duration: 0.6, type: 'spring', stiffness: 400, damping: 18 }}
                  />
                ))}
                {/* Radial glow pulse */}
                <motion.circle
                  cx={100} cy={100}
                  r={0}
                  fill="none"
                  stroke="#FFD70060"
                  strokeWidth={2}
                  initial={{ r: 0, opacity: 0.8 }}
                  animate={{ r: 65, opacity: 0 }}
                  transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
                />
                <motion.circle
                  cx={100} cy={100}
                  r={0}
                  fill="none"
                  stroke="#FF8A5A40"
                  strokeWidth={3}
                  initial={{ r: 0, opacity: 0.6 }}
                  animate={{ r: 80, opacity: 0 }}
                  transition={{ duration: 1.4, delay: 0.25, ease: 'easeOut' }}
                />
              </>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* Caption */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.35, type: stage === 'tree' ? 'spring' : 'tween', stiffness: 320, damping: 22 }}
          className={`text-center max-w-[240px] ${stage === 'tree' ? 'font-display font-semibold text-text-primary text-base' : 'font-display text-text-secondary text-sm'}`}
        >
          {stage === 'seed'    && 'Your curiosity takes root...'}
          {stage === 'sprout'  && 'Something\'s growing...'}
          {stage === 'sapling' && 'Your tree is coming alive!'}
          {stage === 'tree'    && 'Your knowledge tree is ready ✨'}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
