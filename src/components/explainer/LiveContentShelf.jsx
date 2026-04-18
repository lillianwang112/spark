import { useEffect, useState } from 'react';
import { fetchTopicContent } from '../../services/liveContent.js';

function SourceSkeleton({ compact }) {
  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {Array.from({ length: compact ? 2 : 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[18px] bg-[rgba(42,42,42,0.06)]"
            style={{ aspectRatio: compact ? '1 / 1' : '1.15 / 1' }}
          />
        ))}
      </div>
      <div className="animate-pulse rounded-[18px] bg-[rgba(42,42,42,0.05)] p-4">
        <div className="h-3 w-24 rounded bg-[rgba(42,42,42,0.08)]" />
        <div className="mt-3 h-4 w-3/4 rounded bg-[rgba(42,42,42,0.08)]" />
        <div className="mt-2 h-3 w-full rounded bg-[rgba(42,42,42,0.06)]" />
        <div className="mt-2 h-3 w-5/6 rounded bg-[rgba(42,42,42,0.06)]" />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">
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
            <div className="space-y-2">
              <SectionLabel>Real Images</SectionLabel>
              <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {state.images.slice(0, compact ? 2 : 3).map((image) => (
                  <a
                    key={image.url}
                    href={image.sourceUrl || image.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-[18px] bg-[rgba(42,42,42,0.05)]"
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      style={{ aspectRatio: compact ? '1 / 1' : '1.15 / 1' }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {state.summary && (
            <div className="rounded-[18px] bg-[rgba(255,107,53,0.06)] p-4">
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
                <a
                  href={state.summary.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-body font-semibold text-spark-ember shadow-[0_8px_20px_rgba(72,49,10,0.06)]"
                >
                  Open ↗
                </a>
              </div>
              {state.summary.extract && (
                <p className="mt-3 text-sm leading-relaxed text-text-primary">
                  {state.summary.extract}
                </p>
              )}
            </div>
          )}

          {state.papers.length > 0 && (
            <div className="space-y-2">
              <SectionLabel>Papers</SectionLabel>
              <div className="grid gap-2">
                {state.papers.slice(0, compact ? 2 : 3).map((paper) => (
                  <a
                    key={paper.id}
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[18px] border border-[rgba(42,42,42,0.06)] bg-white/70 p-3 transition-colors hover:bg-white"
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
                  </a>
                ))}
              </div>
            </div>
          )}

          {state.lessons.length > 0 && (
            <div className="space-y-2">
              <SectionLabel>Lessons</SectionLabel>
              <div className="grid gap-2">
                {state.lessons.slice(0, compact ? 2 : 4).map((lesson) => (
                  <a
                    key={lesson.id}
                    href={lesson.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[18px] border border-[rgba(42,42,42,0.06)] bg-white/70 p-3 transition-colors hover:bg-white"
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
                  </a>
                ))}
              </div>
            </div>
          )}

          {state.related.length > 0 && (
            <div className="space-y-2">
              <SectionLabel>Keep Pulling</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {state.related.slice(0, compact ? 2 : 3).map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[rgba(42,42,42,0.05)] px-3 py-1.5 text-sm font-body text-text-primary transition-colors hover:bg-[rgba(255,107,53,0.1)]"
                    title={item.snippet}
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
