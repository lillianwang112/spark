/* eslint-disable react-refresh/only-export-components */
// AI-generated interactive visualization — the most impressive demo feature per spec.
// Generates self-contained HTML/SVG and renders it in a sandboxed iframe.
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import AIService from '../../ai/ai.service.js';

// Only show diagrams for domains where visual interaction adds real value
const DIAGRAM_DOMAINS = new Set(['math', 'cs', 'science', 'engineering', 'philosophy', 'economics', 'history', 'literature']);

export function shouldShowDiagram(domain, ageGroup) {
  if (ageGroup === 'little_explorer') return false; // Keep it simple for kids
  return DIAGRAM_DOMAINS.has(domain);
}

export default function InteractiveDiagram({ node, userContextObj }) {
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef(null);

  const handleReveal = useCallback(async () => {
    setRevealed(true);
    if (html) return;
    setLoading(true);
    setFailed(false);
    try {
      const result = await AIService.call('interactiveDiagram', {
        currentNode: node.label,
        currentPath: node.path || [node.label],
        ageGroup: userContextObj?.ageGroup || 'college',
        topInterests: userContextObj?.topInterests || [],
      });
      if (result && result.includes('<!DOCTYPE')) {
        setHtml(result);
      } else if (result && result.includes('<html')) {
        setHtml(result);
      } else if (result && (result.includes('<svg') || result.includes('<div'))) {
        // Wrap bare SVG/HTML in a minimal page
        setHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:12px;background:#FFFDF7;font-family:'Segoe UI',sans-serif;color:#2C2C2C;}*{box-sizing:border-box;}</style></head><body>${result}</body></html>`);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [node, userContextObj, html]);

  if (!node) return null;

  // Don't render the button at all if already failed (fail silently)
  if (failed && revealed) return null;

  return (
    <div className="px-5 pb-4">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReveal}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[rgba(255,107,53,0.2)] text-spark-ember text-sm font-body font-medium hover:bg-[rgba(255,107,53,0.06)] transition-colors group"
          >
            <span className="text-base group-hover:rotate-12 transition-transform duration-200">✦</span>
            <span>See it in action</span>
          </motion.button>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 py-3 px-1 text-text-muted text-sm font-body"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-spark-ember flex-shrink-0"
              style={{ animation: 'pulse-ember 1s ease-in-out infinite' }}
            />
            Building visualization...
          </motion.div>
        ) : html ? (
          <motion.div
            key="diagram"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden rounded-xl border border-[rgba(42,42,42,0.08)]"
          >
            <iframe
              ref={iframeRef}
              srcDoc={html}
              sandbox="allow-scripts"
              title={`Interactive: ${node.label}`}
              className="w-full border-0 block"
              style={{ height: 320 }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
