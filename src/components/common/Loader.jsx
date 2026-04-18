import { motion } from 'framer-motion';
import Ember from '../ember/Ember.jsx';
import Sparkles from './Sparkles.jsx';

// Ember-based loading state — never a generic spinner

export default function Loader({ message = 'Thinking...', size = 'sm', withSparkles = true }) {
  return (
    <div
      className="relative flex flex-col items-center gap-3 py-8"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative h-24 w-24 flex items-center justify-center">
        {withSparkles && (
          <div className="pointer-events-none absolute inset-0">
            <Sparkles count={6} color="#FFB85E" seed={11} />
          </div>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-3 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,209,102,0.35) 0%, rgba(255,107,53,0.14) 50%, rgba(255,255,255,0) 72%)',
            animation: 'glow-breathe 2.4s ease-in-out infinite',
          }}
        />
        <Ember mood="thinking" size={size} glowIntensity={0.75} />
      </div>
      {message && (
        <motion.p
          className="font-body text-sm text-text-muted"
          animate={{ opacity: [1, 0.55, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          {message}
        </motion.p>
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
