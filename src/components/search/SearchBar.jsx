import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  placeholder = 'Search anything...',
  autoFocus = false,
  onClose,
}) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleKey = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit?.(value.trim());
    }
    if (e.key === 'Escape') {
      onClose?.();
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.label);
    onSubmit?.(suggestion.label, suggestion);
    setIsFocused(false);
  };

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <div className="relative w-full">
      {/* Glow halo behind input when focused */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute -inset-1 rounded-[20px]"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(255,107,53,0.18) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Input */}
      <motion.div
        animate={{
          boxShadow: isFocused
            ? '0 0 0 2.5px rgba(255,107,53,0.5), 0 8px 32px rgba(255,107,53,0.14)'
            : '0 2px 12px rgba(42,42,42,0.08)',
        }}
        transition={{ duration: 0.2 }}
        className="relative flex items-center gap-3 px-4 py-3 bg-bg-secondary rounded-card"
      >
        <motion.span
          animate={isFocused ? { scale: 1, rotate: 0, color: '#FF6B35' } : { scale: [1, 1.12, 1], rotate: [0, 15, -15, 0], color: '#A3A393' }}
          transition={isFocused ? { duration: 0.2 } : { duration: 3, repeat: Infinity, repeatDelay: 4 }}
          className="text-lg flex-shrink-0"
          aria-hidden="true"
        >
          {value ? '🔍' : '✦'}
        </motion.span>

        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="
            flex-1 bg-transparent outline-none border-none
            font-body text-text-primary placeholder-text-muted
            text-[15px]
          "
          aria-label="Search topics"
          aria-autocomplete="list"
          aria-haspopup={showSuggestions}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        {value && (
          <button
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary text-xs transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-sm text-text-muted hover:text-text-primary transition-colors font-body"
          >
            Cancel
          </button>
        )}
      </motion.div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.8, 0.25, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-bg-primary rounded-[18px] shadow-[0_16px_48px_rgba(42,42,42,0.14)] z-50 overflow-hidden border border-[rgba(255,255,255,0.7)]"
            role="listbox"
            aria-label="Search suggestions"
          >
            {suggestions.map((s, i) => {
              const color = DOMAIN_COLORS[s.domain] || '#FF6B35';
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none"
                  style={{ '--hover-bg': `${color}08` }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${color}0A`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                  role="option"
                  aria-selected="false"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-text-primary truncate">{s.label}</p>
                    {s.description && (
                      <p className="font-body text-xs text-text-muted truncate">{s.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.12em] flex-shrink-0" style={{ color }}>
                    {s.domain}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
