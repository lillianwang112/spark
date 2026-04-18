import { motion } from 'framer-motion';
import { KNOWLEDGE_STATE_LABELS } from '../../utils/constants.js';
void motion;

export default function KnowledgeStateTag({
  currentState,
  ageGroup = 'college',
  onSelect,
  compact = false,
}) {
  const labels = ageGroup === 'little_explorer'
    ? KNOWLEDGE_STATE_LABELS.kids
    : KNOWLEDGE_STATE_LABELS.adult;

  const states = Object.entries(labels);

  if (compact && currentState) {
    const { emoji } = labels[currentState] || {};
    return (
      <span className="text-base" title={labels[currentState]?.label} aria-label={labels[currentState]?.label}>
        {emoji}
      </span>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="How well do you know this?"
    >
      {states.map(([key, { emoji, label }]) => {
        const isSelected = currentState === key;
        return (
          <motion.button
            key={key}
            onClick={() => onSelect?.(key)}
            whileHover={isSelected ? {} : { y: -2, scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            animate={
              isSelected
                ? { scale: [1, 1.08, 1], transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } }
                : {}
            }
            transition={{ duration: 0.2 }}
            className={`
              relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-body font-semibold
              transition-colors duration-200 min-h-[38px] overflow-hidden
              ${isSelected
                ? 'text-white shadow-[0_10px_22px_rgba(255,107,53,0.35)]'
                : 'bg-[rgba(42,42,42,0.05)] text-text-secondary hover:bg-[rgba(255,107,53,0.08)] hover:text-spark-ember'
              }
            `}
            style={
              isSelected
                ? { background: 'linear-gradient(135deg, #FF8A5A 0%, #FF6B35 55%, #E63946 100%)' }
                : undefined
            }
            aria-pressed={isSelected}
            aria-label={label}
          >
            {isSelected && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{
                  background:
                    'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.6), rgba(255,255,255,0) 70%)',
                }}
              />
            )}
            <span aria-hidden="true" className="relative text-base leading-none">{emoji}</span>
            <span className="relative">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
