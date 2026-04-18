import { useMemo, useEffect, useRef, useState } from 'react';

// Lightweight, self-contained celebratory confetti burst. No dependencies.
// Usage: render conditionally; confetti cleans itself up via CSS animation end.
const COLORS = ['#FF6B35', '#FFA62B', '#FFD166', '#2D936C', '#4A6FA5', '#E74C8B', '#7B2D8B'];

function mulberry32(seed) {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export default function Confetti({ active = false, count = 60, durationMs = 2400 }) {
  const [visible, setVisible] = useState(active);
  const seedRef = useRef(1);

  useEffect(() => {
    if (!active) return undefined;
    seedRef.current = (seedRef.current + 1) | 0 || 1;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timeout);
  }, [active, durationMs]);

  const pieces = useMemo(() => {
    if (!visible) return [];
    const rng = mulberry32(seedRef.current || 1);
    return Array.from({ length: count }, (_, i) => {
      const color = COLORS[i % COLORS.length];
      const left = rng() * 100;
      const cx = (rng() - 0.5) * 160;
      const delay = rng() * 0.4;
      const size = 6 + rng() * 8;
      const rotate = rng() * 360;
      const shape = rng() > 0.5 ? '50%' : '3px';
      return { id: i, color, left, cx, delay, size, rotate, shape };
    });
  }, [visible, count]);

  if (!visible) return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[120]"
      aria-hidden="true"
      style={{ overflow: 'hidden' }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-24px',
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            background: p.color,
            borderRadius: p.shape,
            '--cx': `${p.cx}px`,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall 2s ${p.delay}s cubic-bezier(0.25, 0.8, 0.25, 1) forwards`,
            boxShadow: `0 4px 10px ${p.color}40`,
          }}
        />
      ))}
    </div>
  );
}
