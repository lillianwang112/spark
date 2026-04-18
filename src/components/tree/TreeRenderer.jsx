import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import { useTree } from '../../hooks/useTree.jsx';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { useBranchState, BRANCH_STATE_CONFIG } from '../../hooks/useBranchState.js';
import { useUserContext } from '../../hooks/useUserContext.jsx';
import Ember from '../ember/Ember.jsx';

// One card in the drill-down list
function DrillCard({ node, index, onDrillInto, onExplain, onSave }) {
  const color = DOMAIN_COLORS[node.domain] || '#FF6B35';
  const user = useUserContext();
  // Find if this node is saved in tracks — if so, show its health state
  const savedTrack = useMemo(
    () => user.tracks?.find((t) => t.id === node.id),
    [user.tracks, node.id],
  );
  const { state: branchState, config: stateConfig } = useBranchState(savedTrack);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      whileHover={{
        y: -3,
        scale: 1.01,
        boxShadow: `0 12px 32px ${color}22, 0 2px 8px rgba(42,42,42,0.06)`,
        borderColor: `${color}40`,
      }}
      transition={{ delay: index * 0.04, duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative rounded-xl bg-bg-secondary overflow-hidden"
      style={{ border: `1px solid ${color}1A` }}
    >
      {/* Left accent stripe */}
      <div
        className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-xl"
        style={{ backgroundColor: `${color}60` }}
        aria-hidden="true"
      />
      {/* Tap to drill in */}
      <button
        onClick={() => onDrillInto(node)}
        className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-[rgba(42,42,42,0.03)] active:bg-[rgba(42,42,42,0.06)] transition-colors min-h-[52px]"
        aria-label={`Explore ${node.label}`}
      >
        {/* Domain dot — shows health state if saved, domain color if not */}
        <div className="relative flex-shrink-0 mt-px" aria-hidden="true">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: savedTrack ? (BRANCH_STATE_CONFIG[branchState]?.glowColor || color) : color,
              opacity: savedTrack ? (BRANCH_STATE_CONFIG[branchState]?.saturation ?? 1) : 0.9,
            }}
          />
          {savedTrack && branchState === 'flowering' && (
            <span className="absolute -top-1.5 -right-1.5 text-[9px] leading-none">🌸</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-sm text-text-primary leading-tight">
            {node.label}
          </p>
          {node.description && (
            <p className="font-body text-xs text-text-muted leading-snug mt-0.5 line-clamp-2">
              {node.description}
            </p>
          )}
        </div>
        {/* Branch state badge for saved nodes */}
        {savedTrack && branchState !== 'healthy' && (
          <span className="flex-shrink-0 text-[11px]" title={stateConfig?.label}>
            {stateConfig?.emoji}
          </span>
        )}
        {node.children?.length > 0 && (
          <span className="flex-shrink-0 text-text-muted text-xs font-mono">{node.children.length}›</span>
        )}
        {!node.children?.length && (
          <span className="flex-shrink-0 text-text-muted text-base leading-none" aria-hidden="true">›</span>
        )}
      </button>

      {/* Actions */}
      <div className="px-3 pb-2.5 flex gap-2 flex-wrap" style={{ borderTop: `1px solid ${color}18` }}>
        <button
          onClick={(e) => { e.stopPropagation(); onExplain(node); }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,107,53,0.18)] min-h-[28px]"
          style={{ background: `${color}18`, color }}
          aria-label={`Explain ${node.label}`}
        >
          ✨ Explain
        </button>
        {!node.saved ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSave(node); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(42,42,42,0.06)] text-text-muted text-xs font-medium hover:bg-[rgba(42,42,42,0.1)] transition-colors min-h-[28px]"
            aria-label={`Save ${node.label}`}
          >
            📌 Save
          </button>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(45,147,108,0.1)] text-[#2D936C] text-xs font-medium min-h-[28px]">
            ✓ Saved
          </span>
        )}
        {node.difficulty && (
          <span className="ml-auto flex items-center px-2 py-1 rounded-full bg-[rgba(42,42,42,0.04)] text-[10px] font-mono text-text-muted capitalize">
            {node.difficulty}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// drillStack: [{id, label, domain}] — path from root to current node
// Empty = showing the top-level roots
export default function TreeRenderer({ onExplain, onSave, drillStack = [], onDrillInto, onDrillToDepth }) {
  const { roots, nodes, loading } = useTree();

  const currentEntry = drillStack.length > 0 ? drillStack[drillStack.length - 1] : null;
  const currentNode = currentEntry ? nodes[currentEntry.id] : null;
  const isLoading = currentEntry ? !!loading[currentEntry.id] : false;

  const items = useMemo(() => {
    if (drillStack.length === 0) return roots;
    if (!currentNode) return [];
    return (currentNode.children || []).map((id) => nodes[id]).filter(Boolean);
  }, [drillStack.length, currentNode, roots, nodes]);

  if (!roots || roots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-text-muted">
        <div className="text-4xl">🌱</div>
        <p className="font-body text-sm">Your tree will grow here as you explore</p>
      </div>
    );
  }

  const currentColor = currentEntry ? (DOMAIN_COLORS[currentEntry.domain] || '#FF6B35') : '#FF6B35';

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      {drillStack.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-0.5 flex-wrap min-h-[32px]"
          role="navigation"
          aria-label="Breadcrumb"
        >
          <button
            onClick={() => onDrillToDepth(0)}
            className="text-xs text-text-muted hover:text-text-secondary font-body transition-colors px-1 py-1 rounded min-h-[28px] flex items-center"
            aria-label="Go back to top level"
          >
            ← Home
          </button>
          {drillStack.map((entry, i) => (
            <span key={entry.id} className="flex items-center gap-0.5">
              <span className="text-text-muted text-xs" aria-hidden="true">/</span>
              <button
                onClick={() => { if (i < drillStack.length - 1) onDrillToDepth(i + 1); }}
                disabled={i === drillStack.length - 1}
                className={`text-xs font-body px-1 py-1 rounded transition-colors min-h-[28px] flex items-center ${
                  i === drillStack.length - 1
                    ? 'text-text-primary font-semibold cursor-default'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
                aria-current={i === drillStack.length - 1 ? 'page' : undefined}
              >
                {entry.label}
              </button>
            </span>
          ))}
        </motion.div>
      )}

      {/* Description of current node */}
      {currentNode?.description && (
        <motion.div
          key={currentEntry.id + '_desc'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-3 py-2 rounded-lg text-xs font-body text-text-secondary leading-relaxed"
          style={{ background: `${currentColor}08`, borderLeft: `3px solid ${currentColor}40` }}
        >
          {currentNode.description}
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-3 py-8 text-text-muted justify-center">
          <Ember mood="thinking" size="xs" glowIntensity={0.5} />
          <span className="font-body text-sm">Exploring deeper...</span>
        </div>
      )}

      {/* Node cards */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEntry?.id || 'roots'}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {items.map((node, i) => (
              <DrillCard
                key={node.id}
                node={node}
                index={i}
                onDrillInto={onDrillInto}
                onExplain={onExplain}
                onSave={onSave}
              />
            ))}

            {items.length === 0 && drillStack.length > 0 && (
              <div className="text-center py-8 text-text-muted font-body text-sm">
                <span className="text-2xl block mb-2">🔭</span>
                This is the frontier — more to discover here soon
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
