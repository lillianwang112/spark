import { useState } from 'react';
import { motion } from 'framer-motion';
void motion;

export default function VideoPlayer({ video, color = '#FF6B35', index = 0 }) {
  const [playing, setPlaying] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.35 }}
      className="relative overflow-hidden rounded-[18px] bg-[#0f0f0f] cursor-pointer group"
      style={{ aspectRatio: '16/9' }}
    >
      {!playing ? (
        <>
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 pointer-events-none" />

          {/* Play button */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            onClick={() => setPlaying(true)}
          >
            <motion.div
              whileHover={{ scale: 1.14, boxShadow: `0 12px 36px rgba(0,0,0,0.45)` }}
              whileTap={{ scale: 0.94 }}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-sm"
              style={{ background: color }}
            >
              <span className="text-white text-xl ml-1 leading-none">▶</span>
            </motion.div>
          </div>

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute top-2.5 right-2.5 bg-black/75 text-white text-[11px] font-mono px-2 py-0.5 rounded-full backdrop-blur-sm">
              {video.duration}
            </div>
          )}

          {/* Info footer */}
          <div className="absolute bottom-0 left-0 right-0 p-3.5 pointer-events-none">
            <p className="text-white text-[13px] font-semibold leading-snug line-clamp-2 drop-shadow">
              {video.title}
            </p>
            {video.channel && (
              <p className="text-white/60 text-[11px] mt-0.5 font-mono">{video.channel}</p>
            )}
          </div>

          {/* "Watch on YouTube" link */}
          <a
            href={video.watchUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm hover:bg-black/90 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </a>
        </>
      ) : (
        <iframe
          src={`${video.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={video.title}
        />
      )}
    </motion.div>
  );
}
