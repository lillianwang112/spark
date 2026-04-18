import { KNOWLEDGE_STATE_LABELS } from '../../utils/constants.js';

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
          <button
            key={key}
            onClick={() => onSelect?.(key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body
              transition-all duration-150 min-h-[36px]
              ${isSelected
                ? 'bg-spark-ember text-white shadow-sm'
                : 'bg-[rgba(42,42,42,0.06)] text-text-secondary hover:bg-[rgba(255,107,53,0.1)] hover:text-spark-ember'
              }
            `}
            aria-pressed={isSelected}
            aria-label={label}
          >
            <span aria-hidden="true">{emoji}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
