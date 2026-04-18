import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import AIService from '../../ai/ai.service.js';
import Ember from '../ember/Ember.jsx';
import ProgressRing from '../common/ProgressRing.jsx';
import LessonViewer from './LessonViewer.jsx';
import CourseFlashcards from './CourseFlashcards.jsx';
import { loadCourseOutline, saveCourseOutline } from '../../services/firebase.js';
import { fetchWikiSummary } from '../../utils/courseEnrichment.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function loadProgress(topicSlug) {
  try {
    const raw = localStorage.getItem(`spark_course_${topicSlug}`);
    if (!raw) return { completedLessons: new Set(), currentModuleId: null, currentLessonId: null };
    const parsed = JSON.parse(raw);
    return {
      completedLessons: new Set(parsed.completedLessons || []),
      currentModuleId: parsed.currentModuleId || null,
      currentLessonId: parsed.currentLessonId || null,
    };
  } catch {
    return { completedLessons: new Set(), currentModuleId: null, currentLessonId: null };
  }
}

function saveProgress(topicSlug, progress) {
  try {
    localStorage.setItem(`spark_course_${topicSlug}`, JSON.stringify({
      completedLessons: [...progress.completedLessons],
      currentModuleId: progress.currentModuleId,
      currentLessonId: progress.currentLessonId,
    }));
  } catch {
    // storage might be full — ignore
  }
}

// Returns first uncompleted lesson across all modules.
function findNextLesson(outline, completedLessons) {
  for (const mod of outline) {
    for (const lesson of mod.lessons) {
      const key = `${mod.id}::${lesson.id}`;
      if (!completedLessons.has(key)) return { module: mod, lesson };
    }
  }
  return null;
}

// Count total and completed lessons in the outline.
function countLessons(outline, completedLessons) {
  let total = 0;
  let completed = 0;
  for (const mod of outline) {
    total += mod.lessons.length;
    for (const lesson of mod.lessons) {
      if (completedLessons.has(`${mod.id}::${lesson.id}`)) completed++;
    }
  }
  return { total, completed };
}

// Parse raw AI output into the outline shape we need.
function parseOutline(raw) {
  if (!raw) return null;

  // If it's already an object/array
  if (Array.isArray(raw)) return normaliseModules(raw);
  if (typeof raw === 'object' && raw !== null) {
    const arr = raw.modules || raw.outline || raw;
    if (Array.isArray(arr)) return normaliseModules(arr);
  }

  // Try extracting JSON
  try {
    const jsonMatch = (typeof raw === 'string' ? raw : '').match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return normaliseModules(parsed);
    }
    const objMatch = (typeof raw === 'string' ? raw : '').match(/\{[\s\S]*\}/);
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0]);
      const arr = parsed.modules || parsed.outline || [];
      if (Array.isArray(arr)) return normaliseModules(arr);
    }
  } catch {
    // fall through
  }
  return null;
}

function normaliseModules(arr) {
  return arr.map((mod, mi) => ({
    id: mod.id || `m${mi}`,
    title: mod.title || `Module ${mi + 1}`,
    emoji: mod.emoji || '📚',
    // AI prompt uses "overview" for the module description
    description: mod.description || mod.overview || '',
    lessons: (mod.lessons || []).map((l, li) => ({
      id: l.id || `l${li}`,
      title: l.title || `Lesson ${li + 1}`,
      timeMin: l.timeMin || l.durationMins || l.duration || 10,
      description: l.description || '',
    })),
  }));
}

// ── Skeleton outline (shown during generating state) ──────────────────────
function SkeletonOutline() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="w-full max-w-lg mx-auto space-y-3 mt-10 px-4"
    >
      {[3, 4, 2, 5].map((lessonCount, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.22 }}
          className="rounded-[18px] bg-[rgba(0,0,0,0.05)] p-4"
        >
          <div className="h-4 w-32 rounded-full bg-[rgba(0,0,0,0.07)] mb-3" />
          <div className="space-y-2">
            {Array.from({ length: lessonCount }).map((_, li) => (
              <div key={li} className="h-3 rounded-full bg-[rgba(0,0,0,0.05)]" style={{ width: `${55 + li * 8}%` }} />
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Generating screen ─────────────────────────────────────────────────────
const GENERATING_MESSAGES = [
  'Mapping the territory...',
  'Designing your path...',
  'Almost ready...',
];

function GeneratingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1 < GENERATING_MESSAGES.length ? i + 1 : i));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center pt-20 pb-8 px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <Ember mood="thinking" size="xl" glowIntensity={1.0} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="mt-8 font-display text-xl text-text-primary text-center"
        >
          {GENERATING_MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>

      <SkeletonOutline />
    </div>
  );
}

// ── Sidebar module list ────────────────────────────────────────────────────
function Sidebar({ outline, completedLessons, activeModuleId, onSelectModule }) {
  return (
    <div className="h-full overflow-y-auto py-5 px-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
      {outline.map((mod, i) => {
        const modCompleted = mod.lessons.filter((l) =>
          completedLessons.has(`${mod.id}::${l.id}`)
        ).length;
        const isActive = mod.id === activeModuleId;
        const pct = mod.lessons.length ? (modCompleted / mod.lessons.length) * 100 : 0;

        return (
          <motion.button
            key={mod.id}
            onClick={() => onSelectModule(mod.id)}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-[14px] transition-colors"
            style={{
              background: isActive
                ? 'rgba(255,107,53,0.10)'
                : 'transparent',
              border: isActive ? '1.5px solid rgba(255,107,53,0.22)' : '1.5px solid transparent',
            }}
          >
            <ProgressRing
              value={pct}
              max={100}
              size={36}
              stroke={3.5}
              gradientId={`sidebar-ring-${i}`}
              label={`${mod.title}: ${modCompleted}/${mod.lessons.length} lessons`}
            >
              <span className="text-sm">{mod.emoji}</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p
                className="font-body text-[13px] font-semibold leading-tight truncate"
                style={{ color: isActive ? '#FF6B35' : '#2C2C2C' }}
              >
                {mod.title}
              </p>
              <p className="font-mono text-[10px] text-text-muted mt-0.5">
                {mod.lessons.length} lessons
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Module card expanded view ─────────────────────────────────────────────
function ModuleCard({ mod, completedLessons, isExpanded, onToggle, onStartLesson }) {
  const modCompleted = mod.lessons.filter((l) =>
    completedLessons.has(`${mod.id}::${l.id}`)
  ).length;
  const pct = mod.lessons.length ? Math.round((modCompleted / mod.lessons.length) * 100) : 0;

  return (
    <motion.div
      layout
      className="rounded-[18px] overflow-hidden"
      style={{
        border: '1.5px solid rgba(42,42,42,0.08)',
        background: 'rgba(255,255,255,0.85)',
        boxShadow: '0 4px 16px rgba(42,42,42,0.06)',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-[rgba(42,42,42,0.02)] transition-colors"
      >
        <span className="text-2xl flex-shrink-0">{mod.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-base text-text-primary truncate">{mod.title}</p>
          {mod.description && (
            <p className="font-body text-xs text-text-muted mt-0.5 truncate">{mod.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-3">
          <span className="font-mono text-xs text-text-muted">{pct}%</span>
          <ProgressRing
            value={pct}
            max={100}
            size={28}
            stroke={3}
            gradientId={`module-ring-${mod.id}`}
            label={`${mod.title} progress`}
          />
          <motion.span
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-text-muted text-lg leading-none"
          >
            ›
          </motion.span>
        </div>
      </button>

      {/* Lessons list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-4 pt-1 space-y-2"
              style={{ borderTop: '1px solid rgba(42,42,42,0.06)' }}
            >
              {mod.lessons.map((lesson, li) => {
                const key = `${mod.id}::${lesson.id}`;
                const done = completedLessons.has(key);
                return (
                  <motion.button
                    key={lesson.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: li * 0.05, duration: 0.22 }}
                    onClick={() => onStartLesson(mod, lesson)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-colors hover:bg-[rgba(42,42,42,0.04)]"
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{
                        background: done ? 'rgba(45,147,108,0.15)' : 'rgba(255,107,53,0.10)',
                        color: done ? '#2D936C' : '#FF6B35',
                        border: done ? '1px solid rgba(45,147,108,0.25)' : '1px solid rgba(255,107,53,0.2)',
                      }}
                    >
                      {done ? '✓' : li + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-body text-[13px] font-medium truncate"
                        style={{ color: done ? '#A3A393' : '#2C2C2C' }}
                      >
                        {lesson.title}
                      </p>
                    </div>
                    <span className="flex-shrink-0 font-mono text-[10px] text-text-muted">
                      {lesson.timeMin}m
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Outline screen ─────────────────────────────────────────────────────────
function OutlineScreen({
  topic,
  domain,
  outline,
  completedLessons,
  activeModuleId,
  onSelectModule,
  onStartLesson,
  estimatedHours,
  courseEmoji,
  tagline,
}) {
  const [expandedModuleId, setExpandedModuleId] = useState(activeModuleId || outline[0]?.id || null);
  const { total, completed } = countLessons(outline, completedLessons);
  const overallPct = total ? Math.round((completed / total) * 100) : 0;
  const next = findNextLesson(outline, completedLessons);

  const toggleModule = (id) => setExpandedModuleId((prev) => (prev === id ? null : id));

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 border-r border-[rgba(42,42,42,0.07)]"
        style={{ width: 280, background: 'rgba(255,253,247,0.7)' }}
      >
        <div className="px-5 py-4 border-b border-[rgba(42,42,42,0.06)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">Modules</p>
        </div>
        <Sidebar
          outline={outline}
          completedLessons={completedLessons}
          activeModuleId={expandedModuleId}
          onSelectModule={(id) => setExpandedModuleId(id)}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Overall progress bar */}
        <div
          className="sticky top-0 z-10 px-6 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(255,253,247,0.92)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(42,42,42,0.06)',
          }}
        >
          <div className="flex-1 h-1.5 bg-[rgba(42,42,42,0.08)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-spark-ember"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="font-mono text-[11px] text-text-muted flex-shrink-0">
            {completed}/{total}
          </span>
        </div>

        <div className="px-6 py-6 max-w-2xl mx-auto space-y-5">
          {/* Course header */}
          <div className="text-center mb-6">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="block text-6xl mb-4"
              role="img"
              aria-label={topic}
            >
              {courseEmoji}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display font-semibold text-[2rem] text-text-primary leading-tight mb-2"
            >
              {topic}
            </motion.h1>
            {tagline && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="font-body text-text-muted text-base"
              >
                {tagline}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(255,107,53,0.10)', border: '1px solid rgba(255,107,53,0.18)' }}
            >
              <span className="font-mono text-[11px] text-spark-ember">
                ≈ {estimatedHours}h to complete · {total} lessons
              </span>
            </motion.div>
          </div>

          {/* Start Learning CTA */}
          {next && (
            <motion.button
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 24 }}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 28px rgba(255,107,53,0.32)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartLesson(next.module, next.lesson)}
              className="w-full py-4 rounded-[18px] bg-spark-ember text-white font-body font-semibold text-base hover:bg-orange-600 transition-colors min-h-[52px]"
            >
              {completed === 0
                ? `Start Learning → ${next.lesson.title}`
                : `Continue → ${next.lesson.title}`}
            </motion.button>
          )}

          {/* Module cards */}
          <div className="space-y-3">
            {outline.map((mod) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ModuleCard
                  mod={mod}
                  completedLessons={completedLessons}
                  isExpanded={expandedModuleId === mod.id}
                  onToggle={() => toggleModule(mod.id)}
                  onStartLesson={onStartLesson}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lesson top bar ────────────────────────────────────────────────────────
function LessonTopBar({ moduleTitle, lessonTitle, timeMin, onBack }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
      style={{
        borderBottom: '1px solid rgba(42,42,42,0.08)',
        background: 'rgba(255,253,247,0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <button
        onClick={onBack}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-sm text-text-muted hover:text-text-primary hover:bg-[rgba(42,42,42,0.06)] transition-colors min-h-[34px]"
      >
        ← Back
      </button>
      <div className="flex-1 min-w-0 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted truncate">
          {moduleTitle}
        </p>
        <p className="font-display font-semibold text-sm text-text-primary truncate">{lessonTitle}</p>
      </div>
      <span className="flex-shrink-0 font-mono text-[11px] text-text-muted">
        ~{timeMin}m
      </span>
    </div>
  );
}

// ── Complete screen ────────────────────────────────────────────────────────
function CompleteScreen({ isCourseComplete, nextModule, onContinue, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 270, damping: 24 }}
      className="flex flex-col items-center justify-center h-full py-10 px-6 text-center"
    >
      {/* Confetti-style ambient pulses */}
      <div className="relative">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 8,
              height: 8,
              background: ['#FF6B35', '#FFD166', '#2D936C', '#5B5EA6', '#E63946', '#FFA62B'][i],
              top: '50%',
              left: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{
              x: Math.cos((i / 6) * Math.PI * 2) * 70,
              y: Math.sin((i / 6) * Math.PI * 2) * 70,
              opacity: [1, 1, 0],
              scale: [0, 1.4, 0],
            }}
            transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: 'easeOut' }}
          />
        ))}
        <Ember
          mood={isCourseComplete ? 'celebrating' : 'proud'}
          size="xl"
          glowIntensity={1.0}
        />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="font-display font-semibold text-[1.8rem] text-text-primary mt-6 mb-2"
      >
        {isCourseComplete ? 'Course Complete!' : 'Module Complete!'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="font-body text-text-muted text-base max-w-[280px] leading-relaxed mb-8"
      >
        {isCourseComplete
          ? "You've finished every lesson. That's real knowledge, earned."
          : nextModule
          ? `Up next: ${nextModule.title}`
          : 'Keep going — the next module awaits.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {!isCourseComplete && (
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 10px 28px rgba(255,107,53,0.32)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onContinue}
            className="py-3.5 rounded-full bg-spark-ember text-white font-body font-semibold hover:bg-orange-600 transition-colors min-h-[48px]"
          >
            Continue to next module →
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="py-3 rounded-full font-body font-semibold text-sm transition-colors min-h-[44px]"
          style={{ background: 'rgba(42,42,42,0.06)', color: '#6B6B5E' }}
        >
          {isCourseComplete ? 'Back to courses' : 'View course outline'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main CourseViewer ──────────────────────────────────────────────────────
export default function CourseViewer({
  topic,
  domain,
  ageGroup,
  personality,
  topInterests,
  onClose,
}) {
  const topicSlug = slugify(topic);

  // Persistent progress
  const progressRef = useRef(loadProgress(topicSlug));

  const [phase, setPhase] = useState('generating'); // generating | outline | lesson | flashcards | complete
  const [outline, setOutline] = useState(null);
  const [courseEmoji, setCourseEmoji] = useState('📚');
  const [tagline, setTagline] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('3–5');
  const [completedLessons, setCompletedLessons] = useState(progressRef.current.completedLessons);
  const [activeModule, setActiveModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonData, setLessonData] = useState(null); // the completed lesson data for flashcards
  const [isCourseComplete, setIsCourseComplete] = useState(false);

  // Generate course outline on mount — checks Firebase pre-warmed cache first
  useEffect(() => {
    let cancelled = false;
    const topicSlug = slugify(topic);

    async function loadOutline() {
      // 1. Try Firebase pre-warmed course (instant — generated by prewarm script with real sources)
      try {
        const firebaseCourse = await loadCourseOutline(topicSlug);
        if (firebaseCourse && !cancelled) {
          const parsed = parseOutline(firebaseCourse);
          if (parsed?.length) {
            applyOutlineMeta(firebaseCourse, parsed);
            setPhase('outline');
            return;
          }
        }
      } catch { /* fall through */ }

      if (cancelled) return;

      // 2. Fetch Wikipedia context to enrich fresh AI generation
      const wikiData = await fetchWikiSummary(topic).catch(() => null);
      const sourceContext = wikiData?.extract || null;

      if (cancelled) return;

      // 3. AI generation with real Wikipedia grounding
      try {
        const result = await AIService.call('courseOutline', {
          topic, domain, ageGroup, personality, topInterests, sourceContext,
        });
        if (cancelled) return;
        const parsed = parseOutline(result);
        if (parsed?.length) {
          applyOutlineMeta(result, parsed);
          // Cache to Firebase so next user gets instant load
          if (result && typeof result === 'object') {
            saveCourseOutline(topicSlug, result).catch(() => {});
          }
        } else {
          setOutline(buildFallbackOutline(topic, domain));
        }
      } catch {
        if (!cancelled) setOutline(buildFallbackOutline(topic, domain));
      }

      if (!cancelled) setPhase('outline');
    }

    function applyOutlineMeta(raw, parsed) {
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        if (raw.emoji) setCourseEmoji(raw.emoji);
        if (raw.tagline) setTagline(raw.tagline);
        if (raw.estimatedHours) setEstimatedHours(raw.estimatedHours);
      }
      setOutline(parsed);
    }

    loadOutline();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist progress whenever completedLessons changes
  useEffect(() => {
    saveProgress(topicSlug, {
      completedLessons,
      currentModuleId: activeModule?.id || null,
      currentLessonId: activeLesson?.id || null,
    });
  }, [completedLessons, activeModule, activeLesson, topicSlug]);

  const handleStartLesson = useCallback((mod, lesson) => {
    setActiveModule(mod);
    setActiveLesson(lesson);
    setLessonData(null);
    setPhase('lesson');
  }, []);

  const handleLessonComplete = useCallback((data) => {
    // Mark lesson done
    const key = `${activeModule.id}::${activeLesson.id}`;
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setLessonData(data);
    setPhase('flashcards');
  }, [activeModule, activeLesson]);

  const handleFlashcardsComplete = useCallback(() => {
    if (!outline) return;

    // Check if current module is fully done
    const updatedCompleted = new Set(completedLessons);
    const key = `${activeModule.id}::${activeLesson.id}`;
    updatedCompleted.add(key);

    const modDone = activeModule.lessons.every((l) =>
      updatedCompleted.has(`${activeModule.id}::${l.id}`)
    );
    const { total, completed } = countLessons(outline, updatedCompleted);
    const courseDone = completed >= total;

    if (courseDone) {
      setIsCourseComplete(true);
      setPhase('complete');
    } else if (modDone) {
      setPhase('complete');
    } else {
      setPhase('outline');
    }
  }, [outline, completedLessons, activeModule, activeLesson]);

  const handleCompleteContinue = useCallback(() => {
    if (!outline) return;
    // Find the next module
    const currentIdx = outline.findIndex((m) => m.id === activeModule?.id);
    const nextMod = outline[currentIdx + 1];
    if (nextMod) {
      const nextLesson = nextMod.lessons[0];
      if (nextLesson) {
        handleStartLesson(nextMod, nextLesson);
        return;
      }
    }
    setPhase('outline');
  }, [outline, activeModule, handleStartLesson]);

  const nextModule = outline && activeModule
    ? outline[outline.findIndex((m) => m.id === activeModule.id) + 1] || null
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#FFFDF7' }}
    >
      {/* Top nav bar */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(42,42,42,0.08)',
          background: 'rgba(255,253,247,0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Ember mood="attentive" size="xs" glowIntensity={0.5} />
          <span className="font-display font-semibold text-base text-text-primary truncate">
            {topic}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-[rgba(42,42,42,0.08)] transition-colors text-xl leading-none"
          aria-label="Close course"
        >
          ×
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto"
            >
              <GeneratingScreen />
            </motion.div>
          )}

          {phase === 'outline' && outline && (
            <motion.div
              key="outline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <OutlineScreen
                topic={topic}
                domain={domain}
                outline={outline}
                completedLessons={completedLessons}
                activeModuleId={activeModule?.id || outline[0]?.id}
                onSelectModule={(id) => {
                  const mod = outline.find((m) => m.id === id);
                  if (mod) setActiveModule(mod);
                }}
                onStartLesson={handleStartLesson}
                estimatedHours={estimatedHours}
                courseEmoji={courseEmoji}
                tagline={tagline}
              />
            </motion.div>
          )}

          {phase === 'lesson' && activeModule && activeLesson && (
            <motion.div
              key={`lesson-${activeModule.id}-${activeLesson.id}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.28, ease: [0.25, 0.8, 0.25, 1] }}
              className="h-full flex flex-col"
            >
              <LessonTopBar
                moduleTitle={activeModule.title}
                lessonTitle={activeLesson.title}
                timeMin={activeLesson.timeMin}
                onBack={() => setPhase('outline')}
              />
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <LessonViewer
                  topic={topic}
                  moduleTitle={activeModule.title}
                  lesson={activeLesson}
                  moduleIndex={outline?.findIndex((m) => m.id === activeModule.id) ?? 0}
                  lessonIndex={activeModule.lessons.findIndex((l) => l.id === activeLesson.id)}
                  ageGroup={ageGroup}
                  topInterests={topInterests}
                  personality={personality}
                  onComplete={handleLessonComplete}
                  onBack={() => setPhase('outline')}
                />
              </div>
            </motion.div>
          )}

          {phase === 'flashcards' && activeLesson && (
            <motion.div
              key={`flashcards-${activeLesson.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.25, 0.8, 0.25, 1] }}
              className="h-full flex flex-col"
            >
              {/* Flashcards header */}
              <div
                className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
                style={{
                  borderBottom: '1px solid rgba(42,42,42,0.08)',
                  background: 'rgba(255,253,247,0.95)',
                }}
              >
                <button
                  onClick={() => setPhase('outline')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-sm text-text-muted hover:text-text-primary hover:bg-[rgba(42,42,42,0.06)] transition-colors min-h-[34px]"
                >
                  ← Outline
                </button>
                <div className="flex-1 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-spark-ember">
                    Flashcards
                  </p>
                  <p className="font-display font-semibold text-sm text-text-primary truncate">
                    {activeLesson.title}
                  </p>
                </div>
                <div style={{ width: 80 }} />
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6" style={{ scrollbarWidth: 'none' }}>
                <CourseFlashcards
                  topic={topic}
                  lessonTitle={activeLesson.title}
                  keyPoints={lessonData?.keyPoints || []}
                  ageGroup={ageGroup}
                  onComplete={handleFlashcardsComplete}
                />
              </div>
            </motion.div>
          )}

          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto"
            >
              <CompleteScreen
                isCourseComplete={isCourseComplete}
                nextModule={nextModule}
                onContinue={handleCompleteContinue}
                onClose={isCourseComplete ? onClose : () => setPhase('outline')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Fallback outline if AI fails ──────────────────────────────────────────
function buildFallbackOutline(topic, domain) {
  const t = topic || 'This Topic';
  return [
    {
      id: 'm0',
      title: `Introduction to ${t}`,
      emoji: '🌱',
      description: 'Core foundations and key concepts.',
      lessons: [
        { id: 'l0', title: `What is ${t}?`, timeMin: 8, description: '' },
        { id: 'l1', title: 'Core Concepts', timeMin: 10, description: '' },
        { id: 'l2', title: 'Why It Matters', timeMin: 6, description: '' },
      ],
    },
    {
      id: 'm1',
      title: 'Building Deeper Understanding',
      emoji: '🔍',
      description: 'Dive into the mechanisms and patterns.',
      lessons: [
        { id: 'l3', title: 'Key Mechanisms', timeMin: 12, description: '' },
        { id: 'l4', title: 'Real-World Applications', timeMin: 10, description: '' },
      ],
    },
    {
      id: 'm2',
      title: 'Putting It All Together',
      emoji: '🚀',
      description: 'Synthesis and next steps.',
      lessons: [
        { id: 'l5', title: 'Synthesis & Connections', timeMin: 10, description: '' },
        { id: 'l6', title: 'What Comes Next', timeMin: 8, description: '' },
      ],
    },
  ];
}
