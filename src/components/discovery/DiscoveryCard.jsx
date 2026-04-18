import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
void motion;
import { DOMAIN_COLORS } from '../../utils/domainColors.js';
import { BRANCH_TYPE_STYLES } from '../../utils/constants.js';
import { fetchTopicImages } from '../../services/liveContent.js';

function getBranchCta(kind) {
  switch (kind) {
    case 'paradox':      return 'Enter the contradiction';
    case 'mechanism':   return 'See the hidden machinery';
    case 'experiment':  return 'Run the thought experiment';
    case 'connection':  return 'Take the sideways leap';
    case 'counterfactual': return 'Try the alternate world';
    case 'failure':     return 'Inspect the weak seam';
    case 'craft':       return 'Study the made choice';
    case 'taste':       return 'Feel what makes it sing';
    case 'argument':    return 'Hear the strongest case';
    case 'objection':   return 'Push against the idea';
    case 'question':    return 'Follow the central puzzle';
    default:            return 'Pull this thread';
  }
}

export default function DiscoveryCard({ card, index, onPick, disabled, isPicked = false, isUnchosen = false, isKids = false }) {
  const color = DOMAIN_COLORS[card.domain] || '#FF6B35';
  const branchStyle = BRANCH_TYPE_STYLES[card._kind] || null;
  const cta = getBranchCta(card._kind);
  const [loadedUrl, setLoadedUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const imgLoaded = !!imageSrc && loadedUrl === imageSrc && !imgError;

  useEffect(() => {
    let cancelled = false;
    fetchTopicImages(card.imageQuery || card.text || card.domain, 1)
      .then((images) => { if (!cancelled) setImageSrc(images[0]?.url || null); })
      .catch(() => { if (!cancelled) setImageSrc(null); });
    return () => { cancelled = true; };
  }, [card.imageQuery, card.text, card.domain]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{
        opacity: isUnchosen ? 0.32 : 1,
        y: 0,
        scale: isPicked ? 1.03 : 1,
        filter: isUnchosen ? 'saturate(0.3) brightness(0.9)' : 'saturate(1)',
      }}
      transition={{
        delay: isUnchosen || isPicked ? 0 : index * 0.07,
        duration: isUnchosen || isPicked ? 0.28 : 0.42,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={disabled ? {} : {
        y: -8,
        scale: 1.02,
        boxShadow: `0 28px 60px ${color}35, 0 8px 20px rgba(0,0,0,0.12)`,
      }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={() => !disabled && onPick(card)}
      disabled={disabled}
      className={`
        group relative w-full text-left overflow-hidden rounded-[24px]
        transition-all duration-300
        focus-visible:outline-2 focus-visible:outline-spark-ember
        ${disabled && !isPicked ? 'pointer-events-none' : 'cursor-pointer'}
      `}
      style={{
        background: 'rgba(255,253,248,0.96)',
        border: isPicked ? `1.5px solid ${color}60` : '1.5px solid rgba(255,255,255,0.88)',
        boxShadow: isPicked
          ? `0 0 0 3px ${color}22, 0 24px 56px ${color}28, inset 0 1px 0 rgba(255,255,255,0.95)`
          : '0 16px 40px rgba(72,49,10,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
      aria-label={card.text}
    >
      {/* Picked: color fill */}
      {isPicked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${color}14, ${color}06)` }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 6px 18px ${color}50` }}
          >
            ✓
          </motion.div>
        </motion.div>
      )}

      {/* Hover sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(115deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.50) 50%, rgba(255,255,255,0) 65%)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ height: isKids ? 130 : 148, backgroundColor: `${color}18` }}
      >
        {!imgError && imageSrc && (
          <img
            src={imageSrc}
            alt=""
            aria-hidden="true"
            onLoad={() => { setLoadedUrl(imageSrc); setImgError(false); }}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-all duration-700 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          />
        )}
        {(!imgLoaded || imgError) && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
            {(imgError || !imageSrc) && (
              <motion.span
                className="text-4xl"
                animate={{ scale: [1, 1.1, 1], rotate: [0, -4, 4, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                {card.emoji}
              </motion.span>
            )}
            {!!imageSrc && !imgError && !imgLoaded && (
              <div className="absolute inset-0 animate-pulse" style={{ background: `linear-gradient(90deg, transparent, ${color}18, transparent)` }} />
            )}
          </div>
        )}

        {/* Gradient scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${color}10 0%, transparent 40%, rgba(255,253,248,0.85) 100%)`,
          }}
        />
        {/* Color accent top stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
        />
        {/* Domain pill — over image */}
        {branchStyle && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] backdrop-blur-sm"
              style={{
                background: `${color}CC`,
                color: '#fff',
                boxShadow: `0 4px 12px ${color}44`,
              }}
            >
              <span aria-hidden="true">{branchStyle.emoji}</span>
              {branchStyle.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5">
        {/* Show emoji large only if image failed */}
        {imgError && (
          <div className="text-2xl mb-2 leading-none" aria-hidden="true">{card.emoji}</div>
        )}

        <p className={`font-body font-semibold text-text-primary leading-snug ${isKids ? 'text-base' : 'text-sm'}`}>
          {card.text}
        </p>

        {card._description && (
          <p className="mt-1.5 text-xs leading-relaxed text-text-muted line-clamp-2">
            {card._description}
          </p>
        )}

        <div
          className="mt-3 flex items-center justify-between gap-2 rounded-[12px] px-3 py-2 -mx-0.5"
          style={{ background: `${color}0C`, border: `1px solid ${color}18` }}
        >
          <span className="text-[11px] font-body font-semibold text-text-secondary">
            {cta}
          </span>
          <motion.span
            className="text-[11px] font-mono font-semibold"
            style={{ color }}
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            open →
          </motion.span>
        </div>
      </div>

      {/* Corner domain glow */}
      <div
        className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 100%, ${color}30, transparent 70%)` }}
        aria-hidden="true"
      />
    </motion.button>
  );
}
