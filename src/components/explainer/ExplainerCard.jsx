import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import { useTopicImage } from '../../hooks/useTopicImage.js';
import Loader from '../common/Loader.jsx';
import MathText from '../common/MathText.jsx';
import KnowledgeStateTag from '../common/KnowledgeStateTag.jsx';
import Ember from '../ember/Ember.jsx';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import InteractiveDiagram, { shouldShowDiagram } from './InteractiveDiagram.jsx';
import DomainEmbed, { getDomainEmbed } from './DomainEmbed.jsx';
import { copyThreadUrl } from '../../utils/threads.js';
import TopicGraph from '../../services/topicGraph.js';
import TeachingSession from './TeachingSession.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import KeyTakeaways from './KeyTakeaways.jsx';
import QuickQuiz from './QuickQuiz.jsx';
import AIService from '../../ai/ai.service.js';
import { fetchTopicContent } from '../../services/liveContent.js';

function TopicImageCard({ imageUrl, imageTitle, color }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 6 }}
      className="relative rounded-[16px] overflow-hidden"
      style={{
        border: `1px solid ${color}22`,
        background: `${color}08`,
        maxHeight: 200,
      }}
    >
      <img
        src={imageUrl}
        alt={imageTitle}
        className="w-full object-cover"
        style={{ maxHeight: 200 }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
      {loaded && imageTitle && (
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-[10px] font-mono text-white"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
        >
          {imageTitle} · Wikipedia
        </div>
      )}
    </motion.div>
  );
}

function SectionHeader({ icon, label, color, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: `${color}99` }}>
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </span>
        <div className="h-px" style={{ background: `${color}25`, width: 28 }} />
      </div>
      {right}
    </div>
  );
}

function WikiCard({ summary, color }) {
  if (!summary) return null;
  return (
    <motion.a
      href={summary.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -2, boxShadow: '0 12px 32px rgba(42,42,42,0.12)' }}
      className="block rounded-[18px] p-4 no-underline"
      style={{
        background: `linear-gradient(135deg, ${color}0A, rgba(255,253,247,0.9) 70%)`,
        border: `1px solid ${color}22`,
        display: 'block',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-display text-base font-semibold leading-tight text-text-primary">{summary.title}</p>
        <span
          className="flex-shrink-0 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full"
          style={{ background: `${color}16`, color }}
        >
          Wiki ↗
        </span>
      </div>
      {summary.description && (
        <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-text-muted mb-2">{summary.description}</p>
      )}
      {summary.extract && (
        <p className="text-[13px] font-body text-text-secondary leading-relaxed line-clamp-3">{summary.extract}</p>
      )}
    </motion.a>
  );
}

function PaperCard({ paper, index, color }) {
  return (
    <motion.a
      href={paper.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.28 }}
      whileHover={{ x: 4, boxShadow: '0 8px 24px rgba(42,42,42,0.1)' }}
      className="block rounded-[16px] border border-[rgba(42,42,42,0.06)] bg-white/80 p-3.5 no-underline"
      style={{ display: 'block' }}
    >
      <p className="font-body text-sm font-semibold leading-snug text-text-primary line-clamp-2">{paper.title}</p>
      <p className="mt-1 text-[11px] text-text-muted font-mono">
        {[paper.venue, paper.year].filter(Boolean).join(' · ')}
        {paper.authors?.length ? ` · ${paper.authors.slice(0, 2).join(', ')}` : ''}
      </p>
      <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.1em]" style={{ color }}>
        {paper.citedByCount > 0 ? `${paper.citedByCount.toLocaleString()} citations` : 'Research'} ↗
      </p>
    </motion.a>
  );
}

function LessonCard({ lesson, index, color }) {
  const kindIcon = { video: '▶', article: '📄', exercise: '✏️', topic: '📚' }[lesson.kind] || '📚';
  return (
    <motion.a
      href={lesson.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.28 }}
      whileHover={{ x: 4, boxShadow: '0 8px 24px rgba(42,42,42,0.1)' }}
      className="flex items-start gap-3 rounded-[16px] border border-[rgba(42,42,42,0.06)] bg-white/80 p-3.5 no-underline"
      style={{ display: 'flex' }}
    >
      <span
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
        style={{ background: `${color}14`, color }}
      >
        {kindIcon}
      </span>
      <div className="min-w-0">
        <p className="font-body text-sm font-semibold leading-snug text-text-primary line-clamp-2">{lesson.title}</p>
        <p className="mt-0.5 text-[11px] text-text-muted capitalize">{lesson.kind} · Khan Academy</p>
      </div>
    </motion.a>
  );
}

function YouTubeCTA({ query, color }) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' explained')}`;
  return (
    <motion.a
      href={searchUrl}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3, boxShadow: '0 14px 36px rgba(0,0,0,0.18)' }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 rounded-[18px] px-5 py-4 no-underline overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', display: 'flex' }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 80% 20%, rgba(255,0,0,0.18), transparent 70%)' }}
        aria-hidden="true"
      />
      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#FF0000' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-white font-body font-semibold text-sm">Watch on YouTube</p>
        <p className="text-white/50 text-[11px] font-mono mt-0.5 truncate">{query} explained →</p>
      </div>
    </motion.a>
  );
}

function ImagesStrip({ images, color }) {
  if (!images?.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {images.slice(0, 5).map((img, i) => (
        <motion.a
          key={img.url}
          href={img.sourceUrl || img.url}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.28 }}
          whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(42,42,42,0.18)' }}
          className="flex-shrink-0 overflow-hidden rounded-[14px]"
          style={{ width: 100, height: 74, background: `${color}15`, display: 'block' }}
        >
          <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
        </motion.a>
      ))}
    </div>
  );
}

function RelatedPills({ related, color }) {
  if (!related?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {related.slice(0, 5).map((item, i) => (
        <motion.a
          key={item.url}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-full px-3 py-1.5 text-[12px] font-body font-semibold no-underline"
          style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}
          title={item.snippet}
        >
          {item.title} →
        </motion.a>
      ))}
    </div>
  );
}

function SectionSkeleton({ height = 80 }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity }}
      className="rounded-[18px] bg-[rgba(42,42,42,0.06)]"
      style={{ height }}
    />
  );
}

function formatExplainerText(text) {
  if (!text) return { lead: '', body: [], teaser: '' };
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= 3) {
    return { lead: paragraphs[0], body: paragraphs.slice(1, -1), teaser: paragraphs[paragraphs.length - 1] };
  }
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((p) => p.trim()).filter(Boolean) || [text];
  return {
    lead: sentences[0] || text,
    body: sentences.slice(1, -1).length ? [sentences.slice(1, -1).join(' ')] : [],
    teaser: sentences.length > 1 ? sentences[sentences.length - 1] : '',
  };
}

function ExplainerCardInner({
  node,
  userContextObj,
  knowledgeState,
  onKnowledgeTag,
  onSave,
  onGoDeeper,
  onStartTeaching,
  compact,
}) {
  const [text, setText] = useState(null);
  const [status, setStatus] = useState('loading');
  const [showTag, setShowTag] = useState(false);
  const [emberMood, setEmberMood] = useState('thinking');
  const [savedLocal, setSavedLocal] = useState(false);
  const [shareState, setShareState] = useState('idle');
  const [takeaways, setTakeaways] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [content, setContent] = useState(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const secondaryLoadedRef = useRef(false);

  const color = node?.domain ? DOMAIN_COLORS[node.domain] : '#FF6B35';
  const { imageUrl, imageTitle } = useTopicImage(node?.label, true);
  const ageGroup = userContextObj?.ageGroup || 'college';
  const explorerName = userContextObj?.name || 'Explorer';
  const topInterests = useMemo(() => userContextObj?.topInterests || [], [userContextObj?.topInterests]);

  const topicContext = useMemo(() => ({
    name: explorerName,
    explorationStyle: userContextObj?.explorationStyle || 'balanced',
    personality: userContextObj?.personality || 'spark',
    topInterests,
    knowledgeStates: { [node?.id]: knowledgeState || null },
    ageGroup,
  }), [ageGroup, explorerName, knowledgeState, node?.id, topInterests, userContextObj]);

  const explainerBlocks = useMemo(() => formatExplainerText(text), [text]);

  // Load main explanation
  useEffect(() => {
    if (!node) return undefined;
    let cancelled = false;
    const timers = [];
    secondaryLoadedRef.current = false;
    setText(null); setStatus('loading'); setTakeaways(null);
    setQuiz(null); setContent(null); setShowTag(false); setEmberMood('thinking');

    TopicGraph.getExplainer(node, topicContext)
      .then((result) => {
        if (cancelled) return;
        setText(result); setStatus('ready'); setEmberMood('proud');
        timers.push(setTimeout(() => { if (!cancelled) setShowTag(true); }, 900));
        timers.push(setTimeout(() => { if (!cancelled) setEmberMood('attentive'); }, 2000));
      })
      .catch(() => {
        if (cancelled) return;
        setText(`${node.label} is a fascinating area waiting to be explored.`);
        setStatus('error'); setShowTag(true); setEmberMood('sheepish');
      });

    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [node, topicContext]);

  // Load secondary content in parallel
  useEffect(() => {
    if (!node || compact || secondaryLoadedRef.current) return undefined;
    secondaryLoadedRef.current = true;
    let cancelled = false;

    const params = { currentNode: node.label, currentPath: node.path || [node.label], ageGroup, topInterests };

    Promise.allSettled([
      AIService.call('keyTakeaways', params),
      AIService.call('quickQuiz', params),
      fetchTopicContent(node.label, { imageCount: 5, paperCount: 3, lessonCount: 3, videoCount: 2 }),
    ]).then(([tw, qz, cnt]) => {
      if (cancelled) return;
      if (tw.status === 'fulfilled' && Array.isArray(tw.value) && tw.value.length) setTakeaways(tw.value);
      if (qz.status === 'fulfilled' && qz.value?.question && Array.isArray(qz.value?.options)) setQuiz(qz.value);
      if (cnt.status === 'fulfilled') setContent(cnt.value);
    });

    TopicGraph.warmTopic(node, topicContext).catch(() => {});
    return () => { cancelled = true; };
  }, [node, compact, ageGroup, topInterests, topicContext]);

  if (!node) return null;

  const hasVideos = content?.videos?.length > 0;
  const showDiagram = !compact && status === 'ready' && text && shouldShowDiagram(node, ageGroup);

  return (
    <div className="overflow-hidden rounded-card bg-bg-secondary shadow-card">

      {/* HERO */}
      <div
        className="relative overflow-hidden px-5 pb-4 pt-5"
        style={{
          background: `linear-gradient(135deg, ${color}16 0%, ${color}08 55%, transparent 100%)`,
          borderBottom: `1px solid ${color}20`,
        }}
      >
        <div
          className="pointer-events-none absolute top-0 right-0 w-32 h-32"
          style={{ background: `radial-gradient(circle at 85% 15%, ${color}18, transparent 65%)` }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {node.path?.length > 1 && (
              <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em] flex flex-wrap items-center gap-1">
                {node.path.slice(0, -1).map((step, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span style={{ color: `${color}50` }}>›</span>}
                    <span style={{ color: `${color}80` }}>{step}</span>
                  </span>
                ))}
                <span style={{ color: `${color}50` }}>›</span>
              </p>
            )}
            <p className="mb-0.5 text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: `${color}CC` }}>
              {node.domain || 'Topic'}
            </p>
            <h2 className={`font-display font-semibold leading-tight text-text-primary ${compact ? 'text-lg' : 'text-[1.4rem]'}`}>
              {node.label}
            </h2>
          </div>
          <Ember mood={emberMood} size="sm" glowIntensity={emberMood === 'thinking' ? 0.9 : 0.55} />
        </div>
      </div>

      {/* EXPLANATION */}
      <div className="px-5 py-5">
        {status === 'loading' ? (
          <Loader message="Ember is thinking..." />
        ) : (
          <div className="space-y-3">
            {imageUrl && (
              <TopicImageCard imageUrl={imageUrl} imageTitle={imageTitle} color={color} />
            )}
            {explainerBlocks.lead && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 }}
                className={`font-display leading-snug text-text-primary ${compact ? 'text-[1.05rem]' : 'text-[1.22rem]'}`}
              >
                <MathText text={explainerBlocks.lead} />
              </motion.div>
            )}
            {explainerBlocks.body.map((para, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18 + i * 0.09 }}
                className="font-body text-[15px] leading-relaxed text-text-primary"
              >
                <MathText text={para} />
              </motion.div>
            ))}
            {explainerBlocks.teaser && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.32 }}
                className="relative overflow-hidden rounded-[18px] px-4 py-3.5 mt-1"
                style={{ background: `${color}0E`, borderLeft: `3px solid ${color}55` }}
              >
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  animate={{ x: ['-100%', '220%'] }}
                  transition={{ duration: 2.4, delay: 1, repeat: Infinity, repeatDelay: 6 }}
                  style={{ background: `linear-gradient(90deg, transparent, ${color}14, transparent)` }}
                  aria-hidden="true"
                />
                <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: `${color}80` }}>
                  Next doorway ›
                </p>
                <MathText text={explainerBlocks.teaser} className="font-body text-[14px] leading-relaxed text-text-primary" as="p" />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* KEY TAKEAWAYS */}
      {!compact && (
        <div className="px-5 pb-5" style={{ borderTop: `1px solid ${color}10` }}>
          <div className="pt-4">
            <SectionHeader icon="✦" label="Key Ideas" color={color} />
            {takeaways ? (
              <KeyTakeaways takeaways={takeaways} color={color} />
            ) : status === 'ready' ? (
              <SectionSkeleton height={108} />
            ) : null}
          </div>
        </div>
      )}

      {/* VIDEOS */}
      {!compact && status === 'ready' && (
        <div className="px-5 pb-5" style={{ borderTop: `1px solid ${color}10` }}>
          <div className="pt-4">
            <SectionHeader
              icon="▶"
              label="Watch"
              color={color}
              right={
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(node.label + ' explained')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-text-muted hover:text-text-primary transition-colors"
                >
                  YouTube ↗
                </a>
              }
            />
            {content ? (
              hasVideos ? (
                <div className="space-y-3">
                  {content.videos.slice(0, 2).map((v, i) => (
                    <VideoPlayer key={v.id} video={v} color={color} index={i} />
                  ))}
                </div>
              ) : (
                <YouTubeCTA query={node.label} color={color} />
              )
            ) : (
              <SectionSkeleton height={160} />
            )}
          </div>
        </div>
      )}

      {/* INTERACTIVE DIAGRAM */}
      {showDiagram && (
        <div style={{ borderTop: `1px solid ${color}10` }}>
          <InteractiveDiagram node={node} userContextObj={userContextObj} autoReveal />
        </div>
      )}

      {/* DOMAIN EMBED (Desmos for math, PhET for science) */}
      {!compact && status === 'ready' && getDomainEmbed(node) && (
        <div className="px-5 pb-5" style={{ borderTop: `1px solid ${color}10` }}>
          <div className="pt-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <SectionHeader icon="⚡" label="Interactive" color={color} />
              <DomainEmbed node={node} color={color} />
            </motion.div>
          </div>
        </div>
      )}

      {/* IMAGES */}
      {!compact && content?.images?.length > 0 && (
        <div className="px-5 pb-5" style={{ borderTop: `1px solid ${color}10` }}>
          <div className="pt-4">
            <SectionHeader icon="🖼" label="Images" color={color} />
            <ImagesStrip images={content.images} color={color} />
          </div>
        </div>
      )}

      {/* QUICK QUIZ */}
      {!compact && status === 'ready' && (
        <div className="px-5 pb-5" style={{ borderTop: `1px solid ${color}10` }}>
          <div className="pt-4">
            <SectionHeader icon="🧠" label="Test Yourself" color={color} />
            {quiz ? (
              <QuickQuiz quiz={quiz} color={color} onComplete={() => {}} />
            ) : (
              <SectionSkeleton height={180} />
            )}
          </div>
        </div>
      )}

      {/* SOURCES accordion */}
      {!compact && status === 'ready' && (
        <div style={{ borderTop: `1px solid ${color}10` }}>
          <button
            onClick={() => setSourcesOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[rgba(42,42,42,0.03)] transition-colors text-left"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.16em]" style={{ color: `${color}99` }}>
              📚 Sources &amp; Further Reading
            </span>
            <motion.span
              animate={{ rotate: sourcesOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-text-muted text-sm"
            >
              ›
            </motion.span>
          </button>

          <AnimatePresence>
            {sourcesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-5">
                  {content?.summary && (
                    <div>
                      <SectionHeader icon="📖" label="Encyclopedia" color={color} />
                      <WikiCard summary={content.summary} color={color} />
                    </div>
                  )}
                  {content?.related?.length > 0 && (
                    <div>
                      <SectionHeader icon="🔗" label="Related Topics" color={color} />
                      <RelatedPills related={content.related} color={color} />
                    </div>
                  )}
                  {content?.papers?.length > 0 && (
                    <div>
                      <SectionHeader icon="📄" label="Research Papers" color={color} />
                      <div className="space-y-2">
                        {content.papers.slice(0, 3).map((p, i) => <PaperCard key={p.id} paper={p} index={i} color={color} />)}
                      </div>
                    </div>
                  )}
                  {content?.lessons?.length > 0 && (
                    <div>
                      <SectionHeader icon="🎓" label="Lessons" color={color} />
                      <div className="space-y-2">
                        {content.lessons.slice(0, 3).map((l, i) => <LessonCard key={l.id} lesson={l} index={i} color={color} />)}
                      </div>
                    </div>
                  )}
                  {!content && (
                    <div className="space-y-2">
                      <SectionSkeleton height={64} />
                      <SectionSkeleton height={64} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* KNOWLEDGE TAG */}
      {showTag && status !== 'loading' && (
        <div className="px-5 pb-4" style={{ borderTop: `1px solid ${color}10` }}>
          <div className="pt-4">
            <p className="mb-2.5 font-body text-xs text-text-muted">How well do you know this?</p>
            <KnowledgeStateTag
              currentState={knowledgeState}
              ageGroup={ageGroup}
              onSelect={(state) => onKnowledgeTag?.(node.id, state)}
            />
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-2 px-5 py-4" style={{ borderTop: `1px solid ${color}18` }}>
        <motion.button
          onClick={onStartTeaching}
          whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(255,107,53,0.35)' }}
          whileTap={{ scale: 0.97 }}
          className={`min-h-[38px] rounded-full bg-spark-ember font-medium text-white transition-colors hover:bg-orange-600 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          💬 Teach me
        </motion.button>

        {onGoDeeper && (
          <motion.button
            onClick={() => onGoDeeper(node)}
            whileHover={{ scale: 1.03, boxShadow: `0 8px 24px ${color}30` }}
            whileTap={{ scale: 0.97 }}
            className={`min-h-[38px] rounded-full font-medium ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
            style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}
          >
            Go deeper →
          </motion.button>
        )}

        {!node.saved && !savedLocal ? (
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { onSave?.(node); setSavedLocal(true); }}
            className={`min-h-[38px] rounded-full bg-[rgba(42,42,42,0.06)] font-medium text-text-secondary transition-colors hover:bg-[rgba(42,42,42,0.1)] ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
          >
            📌 Save
          </motion.button>
        ) : (
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            className={`flex min-h-[38px] items-center rounded-full font-medium ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
            style={{
              background: `linear-gradient(135deg, ${color}18, ${color}0C)`,
              color: '#2D936C',
              border: `1px solid ${color}30`,
              boxShadow: `0 4px 14px ${color}18`,
            }}
          >
            ✓ Saved
          </motion.span>
        )}

        <motion.button
          onClick={async () => {
            await copyThreadUrl(node);
            setShareState('copied');
            setTimeout(() => setShareState('idle'), 1800);
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`min-h-[38px] rounded-full font-medium ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
          style={{ background: 'rgba(91,94,166,0.1)', color: '#5B5EA6' }}
        >
          {shareState === 'copied' ? '✓ Copied' : '↗ Share'}
        </motion.button>
      </div>
    </div>
  );
}

export default function ExplainerCard(props) {
  const { node, knowledgeState, userContextObj } = props;
  const [teachingMode, setTeachingMode] = useState(false);

  const requestKey = useMemo(() => JSON.stringify({
    id: node?.id, label: node?.label, knowledgeState,
    ageGroup: userContextObj?.ageGroup, personality: userContextObj?.personality,
    style: userContextObj?.explorationStyle, interests: userContextObj?.topInterests,
  }), [knowledgeState, node?.id, node?.label, userContextObj]);

  if (teachingMode && node) {
    return (
      <div className="overflow-hidden rounded-card bg-bg-secondary shadow-card">
        <TeachingSession node={node} userContextObj={userContextObj} onExit={() => setTeachingMode(false)} />
      </div>
    );
  }

  return <ExplainerCardInner key={requestKey} {...props} onStartTeaching={() => setTeachingMode(true)} />;
}
