// ResearchFrontier.jsx — 4-layer research experience
// Activated from DeepDive when pathLength >= 4 and ageGroup is college/adult

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import AIService from '../../ai/ai.service.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { parseAIJson } from '../../utils/helpers.js';

// ── Difficulty badge ──
function DifficultyBadge({ level }) {
  const styles = {
    beginner: { bg: 'rgba(34,197,94,0.15)', color: '#16a34a', label: 'Beginner' },
    intermediate: { bg: 'rgba(249,115,22,0.15)', color: '#ea580c', label: 'Intermediate' },
    advanced: { bg: 'rgba(239,68,68,0.15)', color: '#dc2626', label: 'Advanced' },
  };
  const s = styles[level] || styles.intermediate;
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ── Accessibility badge ──
function AccessibilityBadge({ level }) {
  const styles = {
    accessible: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a', label: 'Accessible' },
    intermediate: { bg: 'rgba(249,115,22,0.12)', color: '#ea580c', label: 'Intermediate' },
    technical: { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed', label: 'Technical' },
  };
  const s = styles[level] || styles.intermediate;
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ── Question type badge ──
function QuestionTypeBadge({ type }) {
  const map = {
    recurring: { emoji: '🔁', label: 'Recurring', color: '#6366f1' },
    disagreement: { emoji: '⚡', label: 'Active debate', color: '#f59e0b' },
    adjacency: { emoji: '🌉', label: 'Unexplored link', color: '#06b6d4' },
  };
  const m = map[type] || map.recurring;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: `${m.color}18`, color: m.color }}
    >
      {m.emoji} {m.label}
    </span>
  );
}

// ── WorkType badge ──
function WorkTypeBadge({ type }) {
  const map = {
    theoretical: { color: '#6366f1', label: 'Theoretical' },
    empirical: { color: '#10b981', label: 'Empirical' },
    computational: { color: '#3b82f6', label: 'Computational' },
    experimental: { color: '#f59e0b', label: 'Experimental' },
    interdisciplinary: { color: '#ec4899', label: 'Interdisciplinary' },
  };
  const m = map[type] || { color: '#6b7280', label: type };
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wide px-3 py-1 rounded-full"
      style={{ background: `${m.color}18`, color: m.color, border: `1px solid ${m.color}30` }}
    >
      {m.label}
    </span>
  );
}

// ── Ghost shimmer node card ──
function GhostQuestionCard({ question, color, selected, onClick }) {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <motion.div
      animate={{ opacity: selected ? 1 : [0.5, 0.8, 0.5] }}
      transition={selected ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      className="rounded-[20px] p-4 cursor-pointer"
      style={{
        border: `1.5px dashed ${selected ? color : color + '60'}`,
        background: selected ? `${color}14` : `${color}08`,
        boxShadow: selected ? `0 0 0 2px ${color}40, 0 8px 32px ${color}20` : 'none',
        transition: 'box-shadow 0.2s, background 0.2s, border-color 0.2s',
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <QuestionTypeBadge type={question.type} />
        {selected && (
          <span className="text-[10px] font-mono" style={{ color }}>● Selected</span>
        )}
      </div>
      <p className="font-display text-sm font-semibold text-white mb-1.5">{question.title}</p>
      <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {question.question}
      </p>

      {/* Collapsible why */}
      <button
        className="mt-2 text-[11px] font-mono flex items-center gap-1 transition-opacity"
        style={{ color: 'rgba(255,255,255,0.45)' }}
        onClick={(e) => { e.stopPropagation(); setWhyOpen((v) => !v); }}
      >
        {whyOpen ? '▾' : '▸'} Why it's hard
      </button>
      <AnimatePresence>
        {whyOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {question.why}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Excitement */}
      {question.excitement && (
        <div
          className="mt-3 rounded-[12px] px-3 py-2"
          style={{ background: `${color}10`, borderLeft: `2px solid ${color}50` }}
        >
          <p className="text-[10px] font-mono uppercase tracking-wide mb-0.5" style={{ color: `${color}80` }}>
            Breakthrough would unlock
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {question.excitement}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── Layer: Bridge ──
function BridgeLayer({ data, color, onNext }) {
  return (
    <motion.div
      key="bridge"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-white mb-1">
          🌉 Before the frontier
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Here's what you'll need to approach this area
        </p>
      </div>

      {/* Overview */}
      <div
        className="rounded-[18px] px-4 py-4"
        style={{ background: `${color}10`, border: `1px solid ${color}25` }}
      >
        <p className="text-[14px] leading-relaxed text-white">{data.bridge.overview}</p>
      </div>

      {/* Prerequisites */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Prerequisites
        </p>
        {(data.bridge.prerequisites || []).map((prereq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="flex items-start justify-between gap-3 rounded-[14px] px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white mb-0.5">{prereq.concept}</p>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{prereq.why}</p>
            </div>
            <div className="flex-shrink-0 mt-0.5">
              <DifficultyBadge level={prereq.difficulty} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full rounded-[18px] py-4 font-display text-[1.05rem] font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
          boxShadow: `0 10px 30px ${color}30`,
        }}
      >
        Enter the map →
      </motion.button>
    </motion.div>
  );
}

// ── Layer: Map ──
function MapLayer({ data, color, onNext }) {
  const connectors = [
    'This opened the door to…',
    'Building on this…',
    'Which then made possible…',
  ];

  return (
    <motion.div
      key="map"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-white mb-1">
          🗺️ How the thinking evolved
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Landmark papers that shaped this field
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-3 top-0 bottom-0 w-[2px]"
          style={{ background: `linear-gradient(180deg, ${color}80 0%, ${color}20 100%)` }}
        />

        <div className="space-y-2 pl-10">
          {(data.papers || []).map((paper, i) => (
            <div key={i}>
              {/* Timeline dot */}
              <div
                className="absolute left-[6px] w-3 h-3 rounded-full mt-5"
                style={{ background: color, boxShadow: `0 0 8px ${color}70` }}
              />

              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="rounded-[18px] px-4 py-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[13px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {paper.authors} · {paper.year}
                  </p>
                  <AccessibilityBadge level={paper.accessibility} />
                </div>
                <p className="font-display text-[15px] font-semibold italic text-white mb-2">
                  {paper.title}
                </p>
                <p className="text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span className="font-mono uppercase tracking-wide text-[10px]" style={{ color: `${color}80` }}>Problem: </span>
                  {paper.question}
                </p>
                <p className="text-[13px] leading-relaxed text-white mb-2">{paper.insight}</p>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span className="font-mono uppercase tracking-wide text-[10px]" style={{ color: `${color}80` }}>Context: </span>
                  {paper.context}
                </p>
              </motion.div>

              {/* Narrative connector between papers */}
              {i < (data.papers || []).length - 1 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="text-[11px] font-mono py-2 pl-1"
                  style={{ color: `${color}70` }}
                >
                  {connectors[i % connectors.length]}
                </motion.p>
              )}
            </div>
          ))}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="w-full rounded-[18px] py-4 font-display text-[1.05rem] font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
          boxShadow: `0 10px 30px ${color}30`,
        }}
      >
        See the open questions →
      </motion.button>
    </motion.div>
  );
}

// ── Layer: Edge ──
function EdgeLayer({ data, color, onSelectQuestion }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (q) => {
    setSelected(q);
  };

  return (
    <motion.div
      key="edge"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-white mb-1">
          🔬 What nobody knows yet
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          These questions live at the actual frontier of human knowledge
        </p>
      </div>

      <div className="space-y-3">
        {(data.openQuestions || []).map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
          >
            <GhostQuestionCard
              question={q}
              color={color}
              selected={selected?.title === q.title}
              onClick={() => handleSelect(q)}
            />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectQuestion(selected)}
              className="w-full rounded-[18px] py-4 font-display text-[1.05rem] font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
                boxShadow: `0 10px 30px ${color}30`,
              }}
            >
              Explore this question →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Layer: Contribution ──
function ContributionLayer({ node, openQuestion, color, onBack, userContextObj }) {
  const [contribData, setContribData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setContribData(null);

    AIService.call('researchContribution', {
      currentNode: node.label,
      openQuestion,
      ageGroup: userContextObj?.ageGroup || 'college',
      personality: userContextObj?.personality || 'spark',
    }).then((result) => {
      if (cancelled) return;
      const parsed = typeof result === 'string' ? parseAIJson(result) : result;
      setContribData(parsed);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [openQuestion?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      key="contribution"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold text-white mb-1">
          🚀 What it would take
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          How to start working on this question
        </p>
      </div>

      {/* Selected question context */}
      <div
        className="rounded-[14px] px-4 py-3"
        style={{ background: `${color}10`, border: `1px solid ${color}25` }}
      >
        <p className="text-[10px] font-mono uppercase tracking-wide mb-1" style={{ color: `${color}80` }}>
          Your question
        </p>
        <p className="text-[13px] text-white leading-relaxed">{openQuestion?.question}</p>
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          {[90, 70, 85, 60].map((w, i) => (
            <motion.div
              key={i}
              className="h-4 rounded-full"
              style={{ width: `${w}%`, background: 'rgba(255,255,255,0.06)' }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
          <p className="text-center text-[12px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Mapping the path in…
          </p>
        </div>
      ) : contribData ? (
        <div className="space-y-4">
          {/* Work type */}
          {contribData.workType && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Type of work
              </p>
              <WorkTypeBadge type={contribData.workType} />
            </div>
          )}

          {/* Prerequisites */}
          {contribData.prerequisites?.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                You'll need
              </p>
              <div className="space-y-1.5">
                {contribData.prerequisites.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ color }} className="text-sm mt-0.5">›</span>
                    <p className="text-[13px] text-white leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environment */}
          {contribData.environment && (
            <div
              className="rounded-[14px] px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Research environment
              </p>
              <p className="text-[13px] text-white leading-relaxed">{contribData.environment}</p>
            </div>
          )}

          {/* First step — highlighted */}
          {contribData.firstStep && (
            <div
              className="rounded-[16px] px-4 py-4"
              style={{
                background: `${color}12`,
                border: `1.5px solid ${color}35`,
                boxShadow: `0 4px 20px ${color}18`,
              }}
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] mb-2" style={{ color }}>
                Your first step this week
              </p>
              <p className="text-[14px] font-semibold text-white mb-2">{contribData.firstStep.action}</p>
              {contribData.firstStep.resource && (
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <span className="font-mono text-[10px]" style={{ color: `${color}80` }}>Start with: </span>
                  {contribData.firstStep.resource}
                </p>
              )}
            </div>
          )}

          {/* Researchers */}
          {contribData.researchers?.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                People working on this
              </p>
              <div className="space-y-2">
                {contribData.researchers.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-[14px] px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-white">{r.name}</p>
                      <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.affiliation}</p>
                    </div>
                    <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{r.relevance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-sm py-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Couldn't load contribution details — try again.
        </p>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        ← Back to open questions
      </button>
    </motion.div>
  );
}

// ── Main ResearchFrontier component ──
export default function ResearchFrontier({ node, userContextObj, onBack }) {
  const [layer, setLayer] = useState('loading');
  const [data, setData] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const color = DOMAIN_COLORS[node?.domain] || '#FF6B35';

  useEffect(() => {
    let cancelled = false;
    setLayer('loading');
    setData(null);
    setSelectedQuestion(null);

    AIService.call('researchFrontier', {
      currentNode: node.label,
      currentPath: node.path || [node.label],
      ageGroup: userContextObj?.ageGroup || 'college',
      personality: userContextObj?.personality || 'spark',
    }).then((result) => {
      if (cancelled) return;
      const parsed = typeof result === 'string' ? parseAIJson(result) : result;
      setData(parsed);
      setLayer('bridge');
    }).catch(() => {
      if (!cancelled) setLayer('bridge'); // show empty state gracefully
    });

    return () => { cancelled = true; };
  }, [node?.label]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectQuestion = (q) => {
    setSelectedQuestion(q);
    setLayer('contribution');
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-6 pb-16 overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #0A0A14 0%, #0D1117 50%, #0A0C0F 100%)',
      }}
    >
      {/* Back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          ← Back
        </button>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span
          className="text-[10px] font-mono uppercase tracking-[0.18em]"
          style={{ color: `${color}70` }}
        >
          Research Frontier
        </span>
      </div>

      {/* Node label header */}
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1" style={{ color: `${color}70` }}>
          {node?.domain || 'Topic'}
        </p>
        <h1 className="font-display text-3xl font-bold text-white leading-tight">
          {node?.label}
        </h1>
      </div>

      {/* Layer progress indicator */}
      {layer !== 'loading' && (
        <div className="flex items-center gap-2 mb-6">
          {['bridge', 'map', 'edge', 'contribution'].map((l, i) => {
            const layerOrder = ['bridge', 'map', 'edge', 'contribution'];
            const currentIdx = layerOrder.indexOf(layer);
            const isActive = l === layer;
            const isDone = layerOrder.indexOf(l) < currentIdx;
            return (
              <div key={l} className="flex items-center gap-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 24 : 8,
                    background: isActive ? color : isDone ? `${color}60` : 'rgba(255,255,255,0.15)',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Loading state */}
      {layer === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.88, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <p className="text-[13px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Mapping the frontier…
          </p>
        </div>
      )}

      {/* Layer content */}
      <AnimatePresence mode="wait">
        {layer === 'bridge' && data && (
          <BridgeLayer key="bridge" data={data} color={color} onNext={() => setLayer('map')} />
        )}
        {layer === 'map' && data && (
          <MapLayer key="map" data={data} color={color} onNext={() => setLayer('edge')} />
        )}
        {layer === 'edge' && data && (
          <EdgeLayer key="edge" data={data} color={color} onSelectQuestion={handleSelectQuestion} />
        )}
        {layer === 'contribution' && selectedQuestion && (
          <ContributionLayer
            key="contribution"
            node={node}
            openQuestion={selectedQuestion}
            color={color}
            userContextObj={userContextObj}
            onBack={() => setLayer('edge')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
