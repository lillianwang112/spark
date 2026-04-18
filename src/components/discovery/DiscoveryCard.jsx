import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
void motion;
import { DOMAIN_COLORS } from '../../utils/domainColors.js';

// LoremFlickr fallback: keyword-based, no API key, ?lock=N for per-card variety
function loremFlickrUrl(imageQuery, text, domain, width, height, lockIndex) {
  const raw = imageQuery || text?.slice(0, 40) || domain || 'abstract';
  const keywords = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(',');
  return `https://loremflickr.com/${width}/${height}/${keywords || domain}?lock=${lockIndex + 1}`;
}

// Wikipedia Summary API: returns the article's lead image — relevant and free
async function fetchWikiImage(imageQuery, text, domain) {
  const topic = imageQuery || text?.slice(0, 40) || domain;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.thumbnail?.source) return null;
    // Request a 400px-wide version of the thumbnail
    return data.thumbnail.source.replace(/\/\d+px-/, '/400px-');
  } catch {
    return null;
  }
}

export default function DiscoveryCard({ card, index, onPick, disabled, isKids = false }) {
  const color = DOMAIN_COLORS[card.domain] || '#FF6B35';
  const [loadedUrl, setLoadedUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [wikiSrc, setWikiSrc] = useState(null);

  const [w, h] = isKids ? [400, 300] : [400, 250];
  const fallbackUrl = loremFlickrUrl(card.imageQuery, card.text, card.domain, w, h, index);
  const imgUrl = wikiSrc || fallbackUrl;
  const imgLoaded = loadedUrl === imgUrl;
  const imgHeight = isKids ? 120 : 100;

  // Fetch Wikipedia thumbnail in background; swap in if it loads
  useEffect(() => {
    let cancelled = false;
    fetchWikiImage(card.imageQuery, card.text, card.domain).then(src => {
      if (!cancelled && src) setWikiSrc(src);
    });
    return () => { cancelled = true; };
  }, [card.imageQuery, card.text, card.domain]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(42,42,42,0.14)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => !disabled && onPick(card)}
      disabled={disabled}
      className={`
        relative w-full text-left rounded-card overflow-hidden
        transition-all duration-200
        focus-visible:outline-2 focus-visible:outline-spark-ember
        ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        bg-bg-secondary shadow-card
      `}
      aria-label={card.text}
    >
      {/* Image section */}
      <div
        className="relative overflow-hidden"
        style={{ height: imgHeight, backgroundColor: `${color}15` }}
      >
        {!imgError && (
          <img
            src={imgUrl}
            alt=""
            aria-hidden="true"
            onLoad={() => { setLoadedUrl(imgUrl); setImgError(false); }}
            onError={() => {
              if (imgUrl === wikiSrc) {
                // Wiki image failed — clear it so we fall back to LoremFlickr
                setWikiSrc(null);
              } else {
                setImgError(true);
              }
            }}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {/* Loading shimmer or domain color fill */}
        {(!imgLoaded || imgError) && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            {imgError && <span className="text-3xl">{card.emoji}</span>}
            {!imgError && !imgLoaded && (
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
        {/* Emoji only shown if image hard-failed */}
        {imgError && (
          <div className="text-2xl mb-2 leading-none" aria-hidden="true">{card.emoji}</div>
        )}

        {/* Text */}
        <p className={`font-body font-medium text-text-primary leading-snug ${isKids ? 'text-base font-body-kids' : 'text-sm'}`}>
          {card.text}
        </p>
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
