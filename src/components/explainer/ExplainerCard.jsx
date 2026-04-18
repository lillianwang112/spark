import { useState, useEffect, useMemo } from 'react';
import Loader from '../common/Loader.jsx';
import KnowledgeStateTag from '../common/KnowledgeStateTag.jsx';
import Ember from '../ember/Ember.jsx';
import { getImageUrls } from '../../services/images.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import InteractiveDiagram, { shouldShowDiagram } from './InteractiveDiagram.jsx';
import { copyThreadUrl } from '../../utils/threads.js';
import TopicGraph from '../../services/topicGraph.js';

function ImageStrip({ nodeLabel, domain }) {
  const images = useMemo(() => getImageUrls(nodeLabel, domain, 2), [nodeLabel, domain]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loaded, setLoaded] = useState({});

  if (!images.length) return null;

  const img = images[activeIdx];

  return (
    <div className="overflow-hidden">
      <div className="relative overflow-hidden bg-[rgba(42,42,42,0.04)]" style={{ maxHeight: 200 }}>
        <img
          key={img.url}
          src={img.url}
          alt={img.alt}
          onLoad={() => setLoaded((prev) => ({ ...prev, [activeIdx]: true }))}
          onError={() => setLoaded((prev) => ({ ...prev, [activeIdx]: 'error' }))}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded[activeIdx] === true ? 'opacity-100' : 'opacity-0'}`}
          style={{ maxHeight: 200 }}
        />
        {!loaded[activeIdx] && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[rgba(42,42,42,0.04)] via-[rgba(42,42,42,0.08)] to-[rgba(42,42,42,0.04)]" />
        )}
        {images.length > 1 && loaded[activeIdx] === true && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIdx(index)}
                className={`h-1.5 w-1.5 rounded-full transition-all ${index === activeIdx ? 'bg-white' : 'bg-white/50'}`}
                aria-label={`Image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExplainerCardInner({
  node,
  userContextObj,
  knowledgeState,
  onKnowledgeTag,
  onSave,
  onGoDeeper,
  compact,
  showImages,
}) {
  const [text, setText] = useState(null);
  const [status, setStatus] = useState('loading');
  const [showTag, setShowTag] = useState(false);
  const [emberMood, setEmberMood] = useState('thinking');
  const [savedLocal, setSavedLocal] = useState(false);
  const [shareState, setShareState] = useState('idle');

  const color = node?.domain ? DOMAIN_COLORS[node.domain] : '#FF6B35';
  const ageGroup = userContextObj?.ageGroup || 'college';
  const explorerName = userContextObj?.name || 'Explorer';
  const explorationStyle = userContextObj?.explorationStyle || 'balanced';
  const personality = userContextObj?.personality || 'spark';
  const topInterests = useMemo(() => userContextObj?.topInterests || [], [userContextObj?.topInterests]);

  useEffect(() => {
    if (!node) return undefined;

    let cancelled = false;
    let tagTimer = null;
    let moodTimer = null;

    const topicContext = {
      name: explorerName,
      explorationStyle,
      personality,
      topInterests,
      knowledgeStates: {
        [node.id]: knowledgeState || null,
      },
      ageGroup,
    };

    TopicGraph.getExplainer(node, topicContext)
      .then((result) => {
        if (cancelled) return;
        setText(result);
        setStatus('ready');
        setEmberMood('proud');
        tagTimer = setTimeout(() => {
          if (!cancelled) setShowTag(true);
        }, 1000);
        moodTimer = setTimeout(() => {
          if (!cancelled) setEmberMood('attentive');
        }, 2200);
      })
      .catch(() => {
        if (cancelled) return;
        setText(`${node.label} is a fascinating area waiting to be explored. Keep going deeper.`);
        setStatus('error');
        setShowTag(true);
        setEmberMood('sheepish');
      });

    TopicGraph.warmTopic(node, topicContext).catch(() => {});

    return () => {
      cancelled = true;
      if (tagTimer) clearTimeout(tagTimer);
      if (moodTimer) clearTimeout(moodTimer);
    };
  }, [
    ageGroup,
    explorationStyle,
    explorerName,
    knowledgeState,
    node,
    personality,
    topInterests,
  ]);

  if (!node) return null;

  return (
    <div className="overflow-hidden rounded-card bg-bg-secondary shadow-card">
      {showImages && !compact && status !== 'loading' && text && (
        <ImageStrip nodeLabel={node.label} domain={node.domain} />
      )}

      <div
        className="flex items-start justify-between gap-3 px-5 pb-3 pt-4"
        style={{ borderBottom: `2px solid ${color}30` }}
      >
        <div>
          <p className="mb-0.5 text-xs font-mono uppercase tracking-wider text-text-muted">
            {node.domain || 'Topic'}
            {node.path?.length > 1 && (
              <span className="ml-2 font-body normal-case tracking-normal text-text-muted">
                · {node.path.slice(-2, -1)[0]}
              </span>
            )}
          </p>
          <h2 className={`font-display font-semibold leading-tight text-text-primary ${compact ? 'text-lg' : 'text-xl'}`}>
            {node.label}
          </h2>
        </div>
        <Ember
          mood={emberMood}
          size="sm"
          glowIntensity={emberMood === 'thinking' ? 0.8 : 0.5}
          aria-hidden="true"
        />
      </div>

      <div className="px-5 py-4">
        {status === 'loading' ? (
          <Loader message="Ember is thinking..." />
        ) : (
          <div className="space-y-3">
            {status === 'error' && (
              <p className="font-body text-xs uppercase tracking-wider text-text-muted">
                fallback explainer
              </p>
            )}
            {text && (
              <p className={`font-body leading-relaxed text-text-primary ${ageGroup === 'little_explorer' ? 'font-body-kids text-base' : 'text-[15px]'}`}>
                {text}
              </p>
            )}
          </div>
        )}
      </div>

      {!compact && status !== 'loading' && text && shouldShowDiagram(node.domain, ageGroup) && (
        <div style={{ borderTop: `1px solid ${color}10` }}>
          <InteractiveDiagram node={node} userContextObj={userContextObj} />
        </div>
      )}

      {showTag && status !== 'loading' && (
        <div className="px-5 pb-4">
          <p className="mb-2 font-body text-xs text-text-muted">How well do you know this?</p>
          <KnowledgeStateTag
            currentState={knowledgeState}
            ageGroup={ageGroup}
            onSelect={(state) => onKnowledgeTag?.(node.id, state)}
          />
        </div>
      )}

      <div
        className="flex flex-wrap gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${color}20` }}
      >
        <button
          onClick={async () => {
            await copyThreadUrl(node);
            setShareState('copied');
            setTimeout(() => setShareState('idle'), 1800);
          }}
          className={`min-h-[36px] rounded-full bg-[rgba(91,94,166,0.1)] font-medium text-[#5B5EA6] transition-colors hover:bg-[rgba(91,94,166,0.18)] ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
        >
          {shareState === 'copied' ? '✓ Thread copied' : '↗ Share thread'}
        </button>
        {onGoDeeper && (
          <button
            onClick={() => onGoDeeper(node)}
            className={`min-h-[36px] rounded-full bg-[rgba(255,107,53,0.1)] font-medium text-spark-ember transition-colors hover:bg-[rgba(255,107,53,0.2)] ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
          >
            Go deeper →
          </button>
        )}
        {!node.saved && !savedLocal ? (
          <button
            onClick={() => {
              onSave?.(node);
              setSavedLocal(true);
            }}
            className={`min-h-[36px] rounded-full bg-[rgba(42,42,42,0.06)] font-medium text-text-secondary transition-colors hover:bg-[rgba(42,42,42,0.1)] ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
          >
            📌 Save to Tracks
          </button>
        ) : (
          <span
            className={`flex min-h-[36px] items-center rounded-full bg-[rgba(45,147,108,0.1)] font-medium text-[#2D936C] ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
          >
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  );
}

export default function ExplainerCard(props) {
  const { node, knowledgeState, userContextObj } = props;

  const requestKey = useMemo(() => JSON.stringify({
    id: node?.id,
    label: node?.label,
    knowledgeState,
    ageGroup: userContextObj?.ageGroup,
    personality: userContextObj?.personality,
    style: userContextObj?.explorationStyle,
    interests: userContextObj?.topInterests,
  }), [
    knowledgeState,
    node?.id,
    node?.label,
    userContextObj?.ageGroup,
    userContextObj?.explorationStyle,
    userContextObj?.personality,
    userContextObj?.topInterests,
  ]);

  return <ExplainerCardInner key={requestKey} {...props} />;
}
