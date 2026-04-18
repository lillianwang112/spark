import { motion } from 'framer-motion';
import { BRANCH_STATES } from '../../utils/constants.js';
void motion;

const STATE_CONFIG = {
  [BRANCH_STATES.FLOWERING]: {
    emoji: '🌸', label: 'Flowering',
    background: 'linear-gradient(135deg, rgba(255,209,102,0.24), rgba(255,138,90,0.18))',
    color: '#8B6914',
    border: 'rgba(255, 209, 102, 0.55)',
    pulse: true,
  },
  [BRANCH_STATES.HEALTHY]: {
    emoji: '🌿', label: 'Healthy',
    background: 'linear-gradient(135deg, rgba(45,147,108,0.14), rgba(91,207,160,0.08))',
    color: '#2D936C',
    border: 'rgba(45, 147, 108, 0.35)',
  },
  [BRANCH_STATES.THIRSTY]: {
    emoji: '🍂', label: 'Thirsty',
    background: 'linear-gradient(135deg, rgba(212,163,115,0.22), rgba(255,166,43,0.12))',
    color: '#8B6914',
    border: 'rgba(212, 163, 115, 0.45)',
  },
  [BRANCH_STATES.WILTING]: {
    emoji: '🥀', label: 'Wilting',
    background: 'linear-gradient(135deg, rgba(193,102,107,0.22), rgba(230,57,70,0.12))',
    color: '#9B3843',
    border: 'rgba(193, 102, 107, 0.45)',
  },
  [BRANCH_STATES.DORMANT]: {
    emoji: '🪵', label: 'Dormant',
    background: 'linear-gradient(135deg, rgba(139,139,122,0.22), rgba(107,107,94,0.12))',
    color: '#6B6B5E',
    border: 'rgba(139, 139, 122, 0.45)',
  },
};

export default function BranchStateBadge({ state, size = 'md', hideHealthy = true }) {
  const cfg = STATE_CONFIG[state];
  if (!cfg) return null;
  if (hideHealthy && state === BRANCH_STATES.HEALTHY) return null;

  const sizeStyles = size === 'lg'
    ? 'px-3 py-1 text-xs'
    : size === 'sm'
      ? 'px-1.5 py-0.5 text-[9px]'
      : 'px-2 py-0.5 text-[10px]';

  return (
    <motion.span
      animate={cfg.pulse ? { scale: [1, 1.04, 1] } : undefined}
      transition={cfg.pulse ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
      className={`inline-flex items-center gap-1 rounded-full font-body font-semibold ${sizeStyles}`}
      style={{
        background: cfg.background,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span aria-hidden="true">{cfg.emoji}</span>
      <span>{cfg.label}</span>
    </motion.span>
  );
}
