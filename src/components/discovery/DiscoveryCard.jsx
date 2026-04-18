import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
void motion;
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { BRANCH_TYPE_STYLES } from '../../utils/constants.js';
import { fetchTopicImages } from '../../services/liveContent.js';

function getBranchCta(kind) {
  switch (kind) {
    case 'paradox': return 'Enter the contradiction';
    case 'mechanism': return 'See the hidden machinery';
    case 'experiment': return 'Run the thought experiment';
    case 'connection': return 'Take the sideways leap';
    case 'counterfactual': return 'Try the alternate world';
    case 'failure': return 'Inspect the weak seam';
    case 'craft': return 'Study the made choice';
    case 'taste': return 'Feel what makes it sing';
    case 'argument': return 'Hear the strongest case';
    case 'objection': return 'Push against the idea';
    case 'question': return 'Follow the central puzzle';
    default: return 'Pull this thread';
  }
}

export default function DiscoveryCard({ card, index, onPick, disabled, isKids = false }) {
  const color = DOMAIN_COLORS[card.domain] || '#FF6B35';
  const branchStyle = BRANCH_TYPE_STYLES[card._kind] || null;
  const cta = getBranchCta(card._kind);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const imgUrl = imageSrc;
  const imgLoaded = !!imgUrl && loadedUrl === imgUrl;
  const imgHeight = isKids ? 120 : 100;

  useEffect(() => {
    let cancelled = false;

    fetchTopicImages(card.imageQuery || card.text || card.domain, 1)
      .then((images) => {
        if (cancelled) return;
        setImageSrc(images[0]?.url || null);
      })
      .catch(() => {
        if (!cancelled) setImageSrc(null);
      });

    return () => { cancelled = true; };
  }, [card.imageQuery, card.text, card.domain]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -5, boxShadow: '0 18px 44px rgba(42,42,42,0.16)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => !disabled && onPick(card)}
      disabled={disabled}
      className={`
        group relative w-full text-left overflow-hidden
        rounded-[22px] border border-[rgba(255,255,255,0.82)]
        transition-all duration-200
        focus-visible:outline-2 focus-visible:outline-spark-ember
        ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        bg-[rgba(255,255,255,0.88)] shadow-[0_12px_28px_rgba(72,49,10,0.08)]
      `}
      aria-label={card.text}
    >
      {/* Hover sheen overlay */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(115deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 60%)',
          mixBlendMode: 'overlay',
        }}
      />
      {/* Image section */}
      <div
        className="relative overflow-hidden"
        style={{ height: imgHeight, backgroundColor: `${color}15` }}
      >
        {!imgError && imgUrl && (
          <img
            src={imgUrl}
            alt=""
            aria-hidden="true"
            onLoad={() => { setLoadedUrl(imgUrl); setImgError(false); }}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {/* Loading shimmer or domain color fill */}
        {(!imgLoaded || imgError) && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            {(imgError || !imgUrl) && <span className="text-3xl">{card.emoji}</span>}
            {!!imgUrl && !imgError && !imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
            )}
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${color}08, transparent 50%, rgba(255,253,247,0.6) 100%)`,
          }}
        />

        {/* Color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Content */}
      <div className="p-3">
        {branchStyle && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em]"
              style={{ backgroundColor: `${color}14`, color }}
            >
              <span aria-hidden="true">{branchStyle.emoji}</span>
              {branchStyle.label}
            </span>
            {card._difficulty && (
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-text-muted">
                {card._difficulty}
              </span>
            )}
          </div>
        )}

        {/* Emoji only shown if image hard-failed */}
        {imgError && (
          <div className="text-2xl mb-2 leading-none" aria-hidden="true">{card.emoji}</div>
        )}

        {/* Text */}
        <p className={`font-body font-medium text-text-primary leading-snug ${isKids ? 'text-base font-body-kids' : 'text-sm'}`}>
          {card.text}
        </p>

        {card._description && (
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            {card._description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[rgba(42,42,42,0.06)] pt-2.5">
          <span className="text-[11px] font-body font-semibold text-text-secondary">
            {cta}
          </span>
          <span
            className="text-[11px] font-mono uppercase tracking-[0.12em]"
            style={{ color }}
          >
            open →
          </span>
        </div>
      </div>

      {/* Subtle domain color corner glow */}
      <div
        className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 100%, ${color}25, transparent 70%)`,
        }}
        aria-hidden="true"
      />
    </motion.button>
  );
}
