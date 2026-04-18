import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { InlineLoader } from '../common/Loader.jsx';
import { useBranchState, getBranchDisplayColor } from '../../hooks/useBranchState.js';
import { BRANCH_STATES } from '../../utils/constants.js';

function useShareThread() {
  const [copied, setCopied] = useState(false);
  const share = useCallback((path) => {
    const encoded = (path || []).join('/').toLowerCase().replace(/\s+/g, '-');
    const url = `${window.location.origin}/?thread=${encodeURIComponent(encoded)}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback: show the URL
      prompt('Copy this link:', url);
    });
  }, []);
  return { share, copied };
}

export default function TreeNode({
  node,
  savedTrack,        // The corresponding saved track (if any) — used for branch state
  isExpanded,
  isActive,
  isLoading,
  onExpand,
  onSelect,
  onSave,
  depth = 0,
}) {
  const [hovering, setHovering] = useState(false);
  const { share, copied } = useShareThread();
  const domainColor = DOMAIN_COLORS[node.domain] || '#FF6B35';
  const isRoot = depth === 0;
  const isSaved = node.saved;

  // Branch state — only meaningful for saved tracks
  const { state: branchState, config: branchConfig } = useBranchState(savedTrack || null);
  const displayColor = savedTrack
    ? getBranchDisplayColor(domainColor, branchState)
    : domainColor;

  // Dot glow: active or flowering
  const dotGlow = isActive
    ? `0 0 8px ${displayColor}80`
    : branchState === BRANCH_STATES.FLOWERING
    ? `0 0 10px #FFD70080, 0 0 20px #FFD70040`
    : 'none';

  // Show branch state emoji only for non-healthy saved nodes (not in tree root labels)
  const showBranchEmoji = savedTrack && branchState !== BRANCH_STATES.HEALTHY && !isRoot;

  return (
    <div className="relative">
      {/* Connector line (for non-roots) */}
      {!isRoot && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l-2 transition-colors duration-500"
          style={{
            borderColor: `${displayColor}${savedTrack ? '60' : '40'}`,
            marginLeft: -1,
            borderWidth: savedTrack ? (branchConfig?.lineWidth || 2) : 1,
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className={`mb-1 ${depth === 0 ? '' : 'ml-4'}`}
      >
        {/* Node button */}
        <button
          onClick={() => onExpand(node.id)}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className={`
            group w-full flex items-center gap-2 px-3 py-2 rounded-xl
            transition-all duration-150 text-left
            focus-visible:outline-2 focus-visible:outline-spark-ember
            min-h-[44px]
            ${isActive
              ? 'bg-[rgba(255,107,53,0.08)] text-text-primary'
              : hovering
              ? 'bg-[rgba(42,42,42,0.04)] text-text-primary'
              : 'text-text-primary'}
          `}
          aria-expanded={isExpanded}
          aria-label={`${node.label}${node.description ? ': ' + node.description : ''}${savedTrack ? ` (${branchState})` : ''}`}
        >
          {/* Domain dot — reflects branch state for saved nodes */}
          <div
            className="flex-shrink-0 rounded-full transition-all duration-500"
            style={{
              width: isRoot ? 12 : (branchConfig?.dotSize ? Math.min(branchConfig.dotSize, 10) : 8),
              height: isRoot ? 12 : (branchConfig?.dotSize ? Math.min(branchConfig.dotSize, 10) : 8),
              backgroundColor: displayColor,
              boxShadow: dotGlow,
            }}
            aria-hidden="true"
          />

          {/* Label */}
          <span className={`
            font-body leading-tight flex-1
            ${isRoot ? 'font-semibold text-base' : 'text-sm font-medium'}
          `}>
            {node.label}
          </span>

          {/* Branch state emoji for saved + non-healthy nodes */}
          {showBranchEmoji && (
            <span className="flex-shrink-0 text-xs opacity-70" aria-hidden="true">
              {branchConfig?.emoji}
            </span>
          )}

          {/* Loading indicator */}
          {isLoading && <InlineLoader size={16} />}

          {/* Expand indicator */}
          {!isLoading && (
            <motion.span
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 text-text-muted text-xs"
              aria-hidden="true"
            >
              ›
            </motion.span>
          )}
        </button>

        {/* Active node panel: description + actions */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 overflow-hidden"
            >
              <div
                className="border-l-2 pl-3 py-2 mb-2"
                style={{ borderColor: `${displayColor}60` }}
              >
                {node.description && (
                  <p className="text-sm text-text-secondary leading-relaxed mb-2">
                    {node.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect?.(node); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(255,107,53,0.1)] text-spark-ember text-xs font-medium hover:bg-[rgba(255,107,53,0.2)] transition-colors min-h-[32px]"
                    aria-label={`Explain ${node.label}`}
                  >
                    ✨ Explain this
                  </button>

                  {!isSaved ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSave?.(node); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(42,42,42,0.06)] text-text-secondary text-xs font-medium hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[32px]"
                      aria-label={`Save ${node.label} to tracks`}
                    >
                      📌 Add to Tracks
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgba(45,147,108,0.1)] text-[#2D936C] text-xs font-medium">
                      ✓ Saved
                    </span>
                  )}

                  {/* Share this thread */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      share([...(node.path || []), node.label]);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px] ${
                      copied
                        ? 'bg-[rgba(45,147,108,0.12)] text-[#2D936C]'
                        : 'bg-[rgba(42,42,42,0.06)] text-text-muted hover:bg-[rgba(42,42,42,0.1)]'
                    }`}
                    aria-label="Share this thread"
                  >
                    {copied ? '✓ Copied!' : '↗ Share'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
