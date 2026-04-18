import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import AIService from '../../ai/ai.service.js';
import Ember from '../ember/Ember.jsx';
import { fetchLessonSourceContext } from '../../utils/courseEnrichment.js';

// ── Shimmer skeleton for lesson content loading ──
function LessonSkeleton() {
  return (
    <div className="px-6 py-8 space-y-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-center gap-3 mb-8">
        <Ember mood="thinking" size="sm" glowIntensity={0.9} />
        <span className="font-body text-sm text-text-muted">Preparing your lesson...</span>
      </div>
      {[120, 80, 160, 100].map((h, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.18 }}
          className="rounded-[18px] animate-pulse bg-[rgba(0,0,0,0.06)]"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

// ── Section card — concept / analogy / example / deep_dive ──
function SectionCard({ section, index }) {
  const config = {
    concept: {
      bg: '#FFFFFF',
      border: 'rgba(42,42,42,0.10)',
      prefix: null,
      labelColor: 'rgba(42,42,42,0.38)',
      label: 'Concept',
    },
    analogy: {
      bg: '#FFF8F0',
      border: 'rgba(255,166,43,0.22)',
      prefix: '💡',
      labelColor: '#FFA62B',
      label: 'Analogy',
    },
    example: {
      bg: 'rgba(0,0,0,0.04)',
      border: 'rgba(42,42,42,0.08)',
      prefix: '🔍',
      labelColor: 'rgba(42,42,42,0.5)',
      label: 'Example',
    },
    deep_dive: {
      bg: 'rgba(0,0,0,0.06)',
      border: 'rgba(42,42,42,0.12)',
      prefix: '🔬',
      labelColor: 'rgba(42,42,42,0.56)',
      label: 'Deep Dive',
    },
  };

  const c = config[section.type] || config.concept;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: 0.08 + index * 0.09, ease: [0.25, 0.8, 0.25, 1] }}
      className="rounded-[18px] px-5 py-4"
      style={{
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        boxShadow: '0 2px 8px rgba(42,42,42,0.04)',
      }}
    >
      <p
        className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2.5 flex items-center gap-1.5"
        style={{ color: c.labelColor }}
      >
        {c.prefix && <span>{c.prefix}</span>}
        {c.label}
      </p>
      <p className="font-body text-[15px] text-text-primary leading-relaxed whitespace-pre-wrap">
        {section.content}
      </p>
    </motion.div>
  );
}

// ── Check-in question with collapsible answer reveal ──
function CheckIn({ question, answer }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.5 }}
      className="rounded-[18px] overflow-hidden"
      style={{
        border: '1.5px solid rgba(255,107,53,0.18)',
        background: 'rgba(255,107,53,0.04)',
      }}
    >
      <div className="px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-spark-ember mb-2.5">
          🧠 Test Yourself
        </p>
        <p className="font-body text-[15px] text-text-primary leading-relaxed font-medium">
          {question}
        </p>
      </div>

      <div
        className="px-5 pb-1 pt-0"
        style={{ borderTop: '1px solid rgba(255,107,53,0.12)' }}
      >
        <button
          onClick={() => setRevealed((r) => !r)}
          className="w-full text-left py-3 flex items-center justify-between group"
          aria-expanded={revealed}
        >
          <span className="font-body text-sm font-semibold text-spark-ember">
            {revealed ? 'Hide answer' : 'Test yourself'}
          </span>
          <motion.span
            animate={{ rotate: revealed ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-spark-ember text-base"
          >
            ›
          </motion.span>
        </button>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26 }}
              className="overflow-hidden"
            >
              <div className="pb-4">
                <p className="font-body text-[14px] text-text-primary leading-relaxed">
                  {answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Key points list ──
function KeyPoints({ points }) {
  if (!points?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.42 }}
      className="rounded-[18px] px-5 py-4"
      style={{
        background: 'rgba(255,253,247,0.9)',
        border: '1.5px solid rgba(42,42,42,0.08)',
        boxShadow: '0 4px 16px rgba(42,42,42,0.05)',
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted mb-3">
        ✦ Key Points
      </p>
      <ul className="space-y-2.5">
        {points.map((pt, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.48 + i * 0.07, duration: 0.26 }}
            className="flex items-start gap-3"
          >
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white mt-0.5"
              style={{ background: '#FF6B35' }}
            >
              {i + 1}
            </span>
            <span className="font-body text-[14px] text-text-primary leading-relaxed">{pt}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// Normalise a sections array — AI returns { type, body } but renderer needs { type, content }
function normaliseSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => ({
    type: s.type || 'concept',
    content: s.content || s.body || '',
  }));
}

// ── Parses AI response into structured lesson data ──
function parseLessonContent(raw) {
  if (!raw) return null;

  // If it looks like JSON, parse it directly
  if (typeof raw === 'object' && raw !== null) {
    return {
      hook: raw.hook || '',
      sections: normaliseSections(raw.sections),
      keyPoints: Array.isArray(raw.keyPoints) ? raw.keyPoints : [],
      checkIn: raw.checkIn || null,
    };
  }

  // Try JSON parse
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        hook: parsed.hook || '',
        sections: normaliseSections(parsed.sections),
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        checkIn: parsed.checkIn || null,
      };
    }
  } catch {
    // fall through to text parse
  }

  // Plain text fallback — treat as a single concept section
  const lines = raw.split('\n').filter(Boolean);
  const hook = lines[0] || '';
  const body = lines.slice(1).join('\n').trim();
  return {
    hook,
    sections: body ? [{ type: 'concept', content: body }] : [],
    keyPoints: [],
    checkIn: null,
  };
}

// ── Main LessonViewer ──
export default function LessonViewer({
  topic,
  moduleTitle,
  lesson,
  moduleIndex,
  lessonIndex,
  ageGroup,
  topInterests,
  personality,
  onComplete,
  onBack,
}) {
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    let cancelled = false;
    const abort = new AbortController();
    setLoading(true);
    setError(false);
    setLessonData(null);

    (async () => {
      // Fetch real Wikipedia context (non-blocking — degrades gracefully)
      const sourceContext = await fetchLessonSourceContext(lesson.title, topic, abort.signal).catch(() => null);
      if (cancelled) return;
      return AIService.call('lessonContent', {
        topic,
        moduleTitle,
        lessonTitle: lesson.title,
        lessonIndex,
        ageGroup,
        topInterests,
        personality,
        sourceContext,
      });
    })()
      .then((result) => {
        if (cancelled) return;
        const parsed = parseLessonContent(result);
        if (parsed) {
          setLessonData(parsed);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => { cancelled = true; abort.abort(); };
  }, [topic, moduleTitle, lesson, lessonIndex, ageGroup, topInterests, personality]);

  if (loading) return <LessonSkeleton />;

  if (error || !lessonData) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
        <Ember mood="sheepish" size="md" />
        <p className="font-body text-text-muted text-sm max-w-[260px]">
          Couldn't load this lesson right now. Try going back and reopening it.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full font-body font-semibold text-sm transition-colors"
          style={{ background: 'rgba(42,42,42,0.06)', color: '#2C2C2C' }}
        >
          ← Go back
        </button>
      </div>
    );
  }

  const { hook, sections, keyPoints, checkIn } = lessonData;

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full">
      {/* Hook — big italic text in ember color */}
      {hook && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.25, 0.8, 0.25, 1] }}
          className="px-6 pt-6 pb-4"
        >
          <p
            className="font-display text-[1.35rem] leading-snug italic"
            style={{ color: '#FF6B35' }}
          >
            {hook}
          </p>
        </motion.div>
      )}

      {/* Content sections */}
      <div className="px-6 pb-4 space-y-3">
        {sections.map((section, i) => (
          <SectionCard key={i} section={section} index={i} />
        ))}
      </div>

      {/* Key points */}
      {keyPoints?.length > 0 && (
        <div className="px-6 pb-4">
          <KeyPoints points={keyPoints} />
        </div>
      )}

      {/* Check-in question */}
      {checkIn?.question && (
        <div className="px-6 pb-4">
          <CheckIn question={checkIn.question} answer={checkIn.answer} />
        </div>
      )}

      {/* CTA — proceed to flashcards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.65 }}
        className="px-6 pb-8 pt-2"
      >
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 10px 28px rgba(255,107,53,0.32)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onComplete(lessonData)}
          className="w-full py-4 rounded-[18px] bg-spark-ember text-white font-body font-semibold text-base hover:bg-orange-600 transition-colors min-h-[52px]"
        >
          I got this → Flashcards
        </motion.button>
      </motion.div>
    </div>
  );
}
