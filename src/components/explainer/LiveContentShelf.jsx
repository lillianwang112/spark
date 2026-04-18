import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
void motion;
import { fetchTopicContent } from '../../services/liveContent.js';

function SourceSkeleton({ compact }) {
  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {Array.from({ length: compact ? 2 : 3 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.15 }}
            className="rounded-[18px] bg-[rgba(42,42,42,0.06)]"
            style={{ aspectRatio: compact ? '1 / 1' : '1.15 / 1' }}
          />
        ))}
      </div>
      <div className="rounded-[18px] bg-[rgba(42,42,42,0.05)] p-4 space-y-2">
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="h-3 w-24 rounded bg-[rgba(42,42,42,0.08)]"
        />
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.1 }}
          className="h-4 w-3/4 rounded bg-[rgba(42,42,42,0.08)]"
        />
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.2 }}
          className="h-3 w-full rounded bg-[rgba(42,42,42,0.06)]"
        />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted flex items-center gap-1.5">
      <span className="text-spark-ember opacity-60">✦</span>
      {children}
    </p>
  );
}

export default function LiveContentShelf({ node, compact = false }) {
  const [state, setState] = useState({ status: 'loading', summary: null, related: [], images: [], papers: [], lessons: [] });

  useEffect(() => {
    if (!node?.label) return undefined;
    let cancelled = false;

    fetchTopicContent(node.label, {
      imageCount: compact ? 2 : 4,
      paperCount: compact ? 3 : 4,
      lessonCount: compact ? 2 : 4,
    })
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'ready', ...data });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: 'error', summary: null, related: [], images: [], papers: [], lessons: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [compact, node?.label]);

  if (!node?.label) return null;

  const hasContent = state.summary || state.images.length > 0 || state.papers.length > 0 || state.related.length > 0 || state.lessons.length > 0;

  return (
    <div className="space-y-4">
      {state.status === 'loading' && <SourceSkeleton compact={compact} />}

      {state.status !== 'loading' && hasContent && (
        <>
          {state.images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-2"
            >
              <SectionLabel>Real Images</SectionLabel>
              <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {state.images.slice(0, compact ? 2 : 3).map((image, i) => (
                  <motion.a
                    key={image.url}
                    href={image.sourceUrl || image.url}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(42,42,42,0.15)' }}
                    className="overflow-hidden rounded-[18px] bg-[rgba(42,42,42,0.05)] block"
                    style={{ aspectRatio: compact ? '1 / 1' : '1.15 / 1' }}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                    />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

          {state.summary && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="rounded-[18px] bg-[rgba(255,107,53,0.06)] border border-[rgba(255,107,53,0.12)] p-4"
            >
              <SectionLabel>Encyclopedia</SectionLabel>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold leading-tight text-text-primary">
                    {state.summary.title}
                  </p>
                  {state.summary.description && (
                    <p className="mt-1 text-xs font-body font-semibold uppercase tracking-[0.12em] text-text-muted">
                      {state.summary.description}
                    </p>
                  )}
                </div>
                <motion.a
                  href={state.summary.url}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.06, boxShadow: '0 8px 20px rgba(255,107,53,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-body font-semibold text-spark-ember shadow-[0_8px_20px_rgba(72,49,10,0.06)]"
                >
                  Open ↗
                </motion.a>
              </div>
              {state.summary.extract && (
                <p className="mt-3 text-sm leading-relaxed text-text-primary">
                  {state.summary.extract}
                </p>
              )}
            </motion.div>
          )}

          {state.papers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="space-y-2"
            >
              <SectionLabel>Papers</SectionLabel>
              <div className="grid gap-2">
                {state.papers.slice(0, compact ? 2 : 3).map((paper, i) => (
                  <motion.a
                    key={paper.id}
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.28 }}
                    whileHover={{ x: 3, boxShadow: '0 8px 24px rgba(42,42,42,0.1)', backgroundColor: 'rgba(255,255,255,1)' }}
                    className="rounded-[18px] border border-[rgba(42,42,42,0.06)] bg-white/70 p-3 block"
                    style={{ display: 'block' }}
                  >
                    <p className="font-body text-sm font-semibold leading-snug text-text-primary">
                      {paper.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      {[paper.venue, paper.year].filter(Boolean).join(' · ')}
                      {paper.authors.length > 0 ? ` · ${paper.authors.join(', ')}` : ''}
                    </p>
                    <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.12em] text-spark-ember">
                      {paper.citedByCount > 0 ? `${paper.citedByCount} citations` : 'Research link'} ↗
                    </p>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

          {state.lessons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="space-y-2"
            >
              <SectionLabel>Lessons</SectionLabel>
              <div className="grid gap-2">
                {state.lessons.slice(0, compact ? 2 : 4).map((lesson, i) => (
                  <motion.a
                    key={lesson.id}
                    href={lesson.url}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.28 }}
                    whileHover={{ x: 3, boxShadow: '0 8px 24px rgba(42,42,42,0.1)', backgroundColor: 'rgba(255,255,255,1)' }}
                    className="rounded-[18px] border border-[rgba(42,42,42,0.06)] bg-white/70 p-3 block"
                    style={{ display: 'block' }}
                  >
                    <p className="font-body text-sm font-semibold leading-snug text-text-primary">
                      {lesson.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      {lesson.kind} · {lesson.description || 'Structured lesson from Khan Academy'}
                    </p>
                    <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.12em] text-spark-ember">
                      Learn ↗
                    </p>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

          {state.related.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
              className="space-y-2"
            >
              <SectionLabel>Keep Pulling</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {state.related.slice(0, compact ? 2 : 3).map((item, i) => (
                  <motion.a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 320, damping: 22 }}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,107,53,0.12)' }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-full bg-[rgba(42,42,42,0.05)] px-3 py-1.5 text-sm font-body text-text-primary"
                    title={item.snippet}
                  >
                    {item.title}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
