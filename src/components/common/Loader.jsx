// Ember-based loading state — never a generic spinner

export default function Loader({ message = 'Thinking...' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8" role="status" aria-live="polite" aria-label={message}>
      <div className="relative">
        <div
          className="w-10 h-10 rounded-full bg-spark-ember animate-pulse-ember"
          style={{ animation: 'pulse-ember 1.4s ease-in-out infinite' }}
        />
        {/* Eyes */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
        </div>
      </div>
      {message && (
        <p className="text-sm text-text-muted font-body" aria-hidden="true">{message}</p>
      )}
    </div>
  );
}

// Inline tiny loader (for buttons, tree nodes)
export function InlineLoader({ size = 20 }) {
  return (
    <span
      className="inline-block rounded-full bg-spark-ember"
      style={{
        width: size,
        height: size,
        animation: 'pulse-ember 1.2s ease-in-out infinite',
      }}
      aria-hidden="true"
    />
  );
}
