import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
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
      {/* Input */}
      <div
        className={`
          flex items-center gap-3 px-4 py-3 bg-bg-secondary rounded-card
          transition-all duration-200
          ${isFocused
            ? 'shadow-[0_0_0_2px_rgba(255,107,53,0.4)] shadow-card'
            : 'shadow-card hover:shadow-card-hover'}
        `}
      >
        <span className="text-text-muted text-lg flex-shrink-0" aria-hidden="true">
          {value ? '🔍' : '✦'}
        </span>

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
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-bg-primary rounded-card shadow-card-hover z-50 overflow-hidden border border-[rgba(42,42,42,0.06)]"
            role="listbox"
            aria-label="Search suggestions"
          >
            {suggestions.map((s) => {
              const color = DOMAIN_COLORS[s.domain] || '#FF6B35';
              return (
                <button
                  key={s.id}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(42,42,42,0.04)] transition-colors focus-visible:outline-none focus-visible:bg-[rgba(255,107,53,0.06)]"
                  role="option"
                  aria-selected="false"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-text-primary truncate">{s.label}</p>
                    {s.description && (
                      <p className="font-body text-xs text-text-muted truncate">{s.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-text-muted capitalize flex-shrink-0">{s.domain}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
