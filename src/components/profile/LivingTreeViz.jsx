// The Living Tree — centerpiece of the Profile.
// Grows visually with every saved track. Never resets.
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { deriveBranchState, getBranchDisplayColor, BRANCH_STATE_CONFIG } from '../../hooks/useBranchState.js';
import { DOMAIN_COLORS } from '../../utils/domainColors.js';

const W = 340;
const H = 300;
const CX = W / 2;
const TRUNK_BASE = { x: CX, y: H - 28 };
const TRUNK_TIP  = { x: CX, y: H * 0.34 };

// Quadratic bezier point at parameter t
function qBez(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function getBranchOpacity(state) {
  switch (state) {
    case 'flowering': return 1.0;
    case 'healthy':   return 0.95;
    case 'thirsty':   return 0.72;
    case 'wilting':   return 0.45;
    case 'dormant':   return 0.22;
    default:          return 0.9;
  }
}

export default function LivingTreeViz({ tracks = [], className = '' }) {
  // Group tracks by domain
  const byDomain = useMemo(() => {
    const g = {};
    tracks.forEach((t) => {
      const d = t.domain || 'general';
      if (!g[d]) g[d] = [];
      g[d].push(t);
    });
    return g;
  }, [tracks]);

  const domains = Object.keys(byDomain).slice(0, 8);
  const hasData = tracks.length > 0;

  // Compute where each branch starts on the trunk (higher = lower on screen)
  const trunkHeight = TRUNK_BASE.y - TRUNK_TIP.y;

  const branches = useMemo(() => {
    if (domains.length === 0) return [];
    return domains.map((domain, i) => {
      const n = domains.length;

      // Spread angle: symmetrically from -68° to +68° (measured from vertical)
      const halfSpread = Math.min(68, 22 * n);
      const angle = n === 1 ? 0 : -halfSpread + (2 * halfSpread / (n - 1)) * i;
      const rad = (angle * Math.PI) / 180;

      const domTracks = byDomain[domain];
      // Branch length scales with how much the user explored this domain
      const len = 54 + Math.min(domTracks.length * 7, 42);

      // Branch start climbs the trunk: spread evenly between 55% and 90% up
      const frac = n <= 1 ? 0.8 : 0.52 + (0.38 * i) / (n - 1);
      const startY = TRUNK_BASE.y - trunkHeight * frac;
      const startX = TRUNK_TIP.x;

      const tipX = startX + Math.sin(rad) * len;
      const tipY = startY - Math.cos(Math.abs(rad)) * len * 0.78;

      // Control point bows outward
      const cpX = startX + Math.sin(rad) * len * 0.45;
      const cpY = startY - len * 0.28;

      // Determine domain health (worst of all its tracks)
      const stateRank = { dormant: 0, wilting: 1, thirsty: 2, healthy: 3, flowering: 4 };
      const states = domTracks.map((t) => deriveBranchState(t));
      const worstState = states.reduce(
        (w, s) => (stateRank[s] < stateRank[w] ? s : w),
        'flowering',
      );
      const bestState = states.reduce(
        (b, s) => (stateRank[s] > stateRank[b] ? s : b),
        'dormant',
      );

      const rawColor  = DOMAIN_COLORS[domain] || '#FF6B35';
      const lineColor = getBranchDisplayColor(rawColor, worstState);
      const opacity   = getBranchOpacity(worstState);

      return {
        domain, domTracks, angle, rad, len,
        startX, startY, tipX, tipY, cpX, cpY,
        worstState, bestState, rawColor, lineColor, opacity,
        isFlowering: bestState === 'flowering',
      };
    });
  }, [byDomain, domains, trunkHeight]);

  const totalNodes = tracks.length;
  const stageEmoji = totalNodes === 0 ? '🌱' : totalNodes < 5 ? '🌿' : totalNodes < 20 ? '🌳' : '🌲';

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ display: 'block', maxHeight: 300 }}
        aria-label="Your living knowledge tree"
        role="img"
      >
        {/* Ground circle shadow */}
        <ellipse cx={CX} cy={TRUNK_BASE.y + 10} rx={34} ry={7} fill="rgba(42,42,42,0.07)" />

        {/* Root veins */}
        {hasData && [-18, -9, 9, 18].map((dx, i) => (
          <motion.line
            key={i}
            x1={CX} y1={TRUNK_BASE.y}
            x2={CX + dx} y2={TRUNK_BASE.y + 10}
            stroke="#8B6F4E" strokeWidth={1.5} strokeLinecap="round"
            opacity={0.4}
            initial={{ y2: TRUNK_BASE.y, opacity: 0 }}
            animate={{ y2: TRUNK_BASE.y + 10, opacity: 0.4 }}
            transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
          />
        ))}

        {/* Main trunk */}
        {hasData ? (
          <motion.line
            x1={TRUNK_BASE.x} y1={TRUNK_BASE.y}
            x2={TRUNK_TIP.x}  y2={TRUNK_TIP.y}
            stroke="#6B5442"
            strokeWidth={7}
            strokeLinecap="round"
            initial={{ y2: TRUNK_BASE.y }}
            animate={{ y2: TRUNK_TIP.y }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        ) : (
          /* Empty state: tiny sprout */
          <>
            <motion.line
              x1={CX} y1={TRUNK_BASE.y}
              x2={CX} y2={TRUNK_BASE.y - 36}
              stroke="#6B5442" strokeWidth={3} strokeLinecap="round"
              initial={{ y2: TRUNK_BASE.y }} animate={{ y2: TRUNK_BASE.y - 36 }}
              transition={{ duration: 0.7 }}
            />
            <motion.ellipse
              cx={CX - 8} cy={TRUNK_BASE.y - 42} rx={8} ry={5}
              fill="#2D936C" opacity={0.85}
              style={{ rotate: '-30deg', transformOrigin: `${CX - 8}px ${TRUNK_BASE.y - 42}px` }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.85 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            />
            <motion.ellipse
              cx={CX + 8} cy={TRUNK_BASE.y - 48} rx={8} ry={5}
              fill="#2D936C" opacity={0.8}
              style={{ rotate: '30deg', transformOrigin: `${CX + 8}px ${TRUNK_BASE.y - 48}px` }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.8 }}
              transition={{ delay: 0.65, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            />
            <motion.text
              x={CX} y={TRUNK_BASE.y - 62}
              textAnchor="middle" fontSize="8.5"
              fill="rgba(42,42,42,0.38)"
              fontFamily="'Source Sans 3', sans-serif"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              Save topics to grow your tree
            </motion.text>
          </>
        )}

        {/* Domain branches */}
        {branches.map(({
          domain, domTracks, startX, startY, tipX, tipY, cpX, cpY,
          worstState, lineColor, opacity, isFlowering, rawColor,
        }, bi) => {
          const strokeW = BRANCH_STATE_CONFIG[worstState]?.lineWidth ?? 2;

          return (
            <g key={domain}>
              {/* Branch curve */}
              <motion.path
                d={`M${startX},${startY} Q${cpX},${cpY} ${tipX},${tipY}`}
                stroke={lineColor}
                strokeWidth={strokeW + 1}
                fill="none"
                strokeLinecap="round"
                opacity={opacity}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.6 + bi * 0.11, duration: 0.65, ease: 'easeOut' }}
              />

              {/* Track nodes along the branch */}
              {domTracks.slice(0, 6).map((track, ti) => {
                const t = (ti + 1) / (Math.min(domTracks.length, 6) + 1);
                const pt = qBez({ x: startX, y: startY }, { x: cpX, y: cpY }, { x: tipX, y: tipY }, t);
                const tState = deriveBranchState(track);
                const nodeColor = getBranchDisplayColor(rawColor, tState);
                const nr = track.mode === 'mastering' ? 4 : 3;
                const nOpacity = getBranchOpacity(tState);

                return (
                  <g key={track.id}>
                    {/* Glow ring for mastering nodes */}
                    {track.mode === 'mastering' && (
                      <motion.circle
                        cx={pt.x} cy={pt.y} r={nr + 3}
                        fill={nodeColor} opacity={0.2}
                        initial={{ r: 0, opacity: 0 }}
                        animate={{ r: nr + 3, opacity: 0.2 }}
                        transition={{ delay: 0.7 + bi * 0.11 + ti * 0.07 + 0.2 }}
                      />
                    )}
                    <motion.circle
                      cx={pt.x} cy={pt.y} r={nr}
                      fill={nodeColor}
                      opacity={nOpacity}
                      initial={{ r: 0, opacity: 0 }}
                      animate={{ r: nr, opacity: nOpacity }}
                      transition={{
                        delay: 0.7 + bi * 0.11 + ti * 0.07,
                        duration: 0.38,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                    />
                  </g>
                );
              })}

              {/* Tip circle */}
              <motion.circle
                cx={tipX} cy={tipY} r={isFlowering ? 5.5 : 4}
                fill={lineColor}
                opacity={opacity}
                initial={{ r: 0 }}
                animate={{ r: isFlowering ? 5.5 : 4 }}
                transition={{ delay: 0.7 + bi * 0.11 + 0.55, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              />

              {/* Flowering sparkle */}
              {isFlowering && (
                <motion.text
                  x={tipX} y={tipY - 8}
                  textAnchor="middle" fontSize={11}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + bi * 0.11 + 0.8, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  🌸
                </motion.text>
              )}

              {/* Domain label */}
              <motion.text
                x={tipX + (tipX - startX > 0 ? 7 : -7)}
                y={tipY + 1.5}
                textAnchor={tipX - startX > 0 ? 'start' : 'end'}
                fontSize="7.2"
                fill={lineColor}
                fontFamily="'Source Sans 3', sans-serif"
                fontWeight="600"
                opacity={opacity}
                initial={{ opacity: 0 }}
                animate={{ opacity: opacity }}
                transition={{ delay: 0.7 + bi * 0.11 + 0.9 }}
              >
                {domain}
              </motion.text>
            </g>
          );
        })}

        {/* Stage emoji at base */}
        <motion.text
          x={CX} y={TRUNK_BASE.y + 22}
          textAnchor="middle" fontSize="13"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {stageEmoji}
        </motion.text>
      </svg>

      {/* Node count legend bottom-right */}
      {hasData && (
        <motion.p
          className="absolute bottom-0 right-1 text-[10px] font-mono text-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {totalNodes} saved
        </motion.p>
      )}
    </div>
  );
}
