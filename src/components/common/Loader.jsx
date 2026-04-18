import Ember from '../ember/Ember.jsx';

// Ember-based loading state — never a generic spinner

export default function Loader({ message = 'Thinking...' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8" role="status" aria-live="polite" aria-label={message}>
      <Ember mood="thinking" size="sm" glowIntensity={0.7} />
      {message && (
        <p className="text-sm text-text-muted font-body" aria-hidden="true">{message}</p>
      )}
    </div>
  );
}

// Inline tiny loader (for buttons, tree nodes)
export function InlineLoader({ size = 20 }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      <Ember mood="thinking" size={size <= 20 ? 'xs' : 'sm'} glowIntensity={0.45} />
    </span>
  );
}
