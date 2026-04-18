/* eslint-disable react-refresh/only-export-components */
// AI-generated interactive visualization — the most impressive demo feature per spec.
// Generates self-contained HTML/SVG and renders it in a sandboxed iframe.
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import AIService from '../../ai/ai.service.js';

// Show diagrams for any domain where visualization genuinely helps understanding
const DIAGRAM_DOMAINS = new Set([
  'math', 'cs', 'science', 'engineering', 'philosophy',
  'history', 'literature', 'music', 'architecture', 'film',
]);

export function shouldShowDiagram(domain, ageGroup) {
  if (ageGroup === 'little_explorer') return false;
  return DIAGRAM_DOMAINS.has(domain);
}

export default function InteractiveDiagram({ node, userContextObj, autoReveal = false }) {
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef(null);

  const generate = useCallback(async () => {
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
      if (result && (result.includes('<!DOCTYPE') || result.includes('<html'))) {
        setHtml(result);
      } else if (result && (result.includes('<svg') || result.includes('<div') || result.includes('<canvas'))) {
        setHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:14px;background:#FFFDF7;font-family:'Segoe UI',sans-serif;color:#2C2C2C;font-size:14px;}*{box-sizing:border-box;}</style></head><body>${result}</body></html>`);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [node, userContextObj, html]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    generate();
  }, [generate]);

  // Auto-reveal: start generation 1.5s after mount (let explainer text load first)
  useEffect(() => {
    if (!autoReveal) return;
    const timer = setTimeout(() => {
      setRevealed(true);
      generate();
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoReveal]);

  if (!node) return null;
  if (failed && revealed) return null;

  return (
    <div className="px-5 pb-5 pt-1">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(255,107,53,0.18)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReveal}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 mt-1 rounded-[18px] border border-[rgba(255,107,53,0.25)] text-spark-ember text-sm font-body font-semibold bg-[rgba(255,107,53,0.04)] transition-colors"
          >
            <motion.span
              className="text-base"
              animate={{ rotate: [0, 18, -12, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 3 }}
            >
              ✦
            </motion.span>
            <span>See it in action</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-60 ml-0.5">Interactive</span>
          </motion.button>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-5 px-1"
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-spark-ember"
                  animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="font-body text-sm text-text-muted">Building interactive visualization...</span>
          </motion.div>
        ) : html ? (
          <motion.div
            key="diagram"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted mb-2.5 flex items-center gap-1.5">
              <span className="text-spark-ember">✦</span>
              Interactive · {node.label}
            </p>
            <div className="overflow-hidden rounded-[18px] border border-[rgba(42,42,42,0.08)] shadow-[0_8px_28px_rgba(42,42,42,0.08)]">
              <iframe
                ref={iframeRef}
                srcDoc={html}
                sandbox="allow-scripts"
                title={`Interactive visualization: ${node.label}`}
                className="w-full border-0 block"
                style={{ height: 340 }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
